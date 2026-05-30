/**
 * Lightweight LLM Proxy Server for chatbotagent
 *
 * Provides the /api/chatbot/* endpoints that the frontend expects.
 * Proxies chat requests to DeepSeek API (or any OpenAI-compatible LLM).
 *
 * Start:  npx tsx server/index.ts
 * Port:   8001 (matches Vite proxy config in vite.config.ts)
 */

import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { chatCompletion, streamChatCompletion, isConfigured, type LLMMessage } from './llmClient';

const PORT = parseInt(process.env.PORT || '8001', 10);

// ── Types (mirrors frontend agentChatService.ts) ──

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  patientContext?: Record<string, unknown>;
  availableTools?: string[];
  systemPrompt?: string;
}

interface ToolCall {
  toolId: string;
  reason: string;
}

interface ChatResponseData {
  type: 'text' | 'tool_call' | 'mixed';
  content: string;
  toolCall: ToolCall | null;
}

// ── Tool detection regex ──

const TOOL_CALL_RE = /\[TOOL:\s*(\w+)\]\s*(.+)?/i;

function detectToolCall(text: string): ToolCall | null {
  const match = text.match(TOOL_CALL_RE);
  if (!match) return null;
  return { toolId: match[1], reason: (match[2] || '').trim() };
}

// ── System prompt for pediatric spine assistant ──

const DEFAULT_SYSTEM_PROMPT = `你是"小柱"，一位温柔、专业的儿童脊柱康复AI助手。用温暖、阳光、通俗易懂的语言与家长沟通。

沟通规范：
- 语言温暖亲切，避免机器人腔
- 禁用称呼："患者"、"病人"、"畸形"、"残疾"
- 推荐称呼孩子："孩子"、"小朋友"、"宝贝"
- 重点内容用口语化表达

行为约束：
1. 不做医学诊断，只用"筛查风险"等前置词汇
2. 有背痛症状立刻建议就医（MRI检查），禁止推荐拉伸/按摩
3. 多用"早发现早干预"等正向语言
4. 没有数据时如实说明`;

// ── HTTP request body parsing ──

function parseBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(json);
}

// ── HTTP Server ──

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    // Health check
    if (req.method === 'GET' && url.pathname === '/api/chatbot/health') {
      sendJson(res, 200, { llm: isConfigured() });
      return;
    }

    // Non-streaming chat
    if (req.method === 'POST' && url.pathname === '/api/chatbot/chat') {
      const body = await parseBody<ChatRequest>(req);

      if (!isConfigured()) {
        sendJson(res, 503, { error: 'LLM not configured' });
        return;
      }

      const messages: LLMMessage[] = [];

      // Use client-provided system prompt or default
      const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      messages.push({ role: 'system', content: systemPrompt });

      // Append conversation history
      for (const msg of body.messages) {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }

      try {
        const result = await chatCompletion(messages);
        const toolCall = detectToolCall(result.content);

        const response: ChatResponseData = {
          type: toolCall ? 'tool_call' : 'text',
          content: result.content,
          toolCall,
        };

        sendJson(res, 200, response);
      } catch (err) {
        console.error('[chat] LLM error:', err);
        sendJson(res, 500, { error: 'LLM request failed' });
      }
      return;
    }

    // 404
    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[http] Error:', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

// ── WebSocket Server ──

const wss = new WebSocketServer({ server, path: '/api/chatbot/ws/chat' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[ws] Client connected');

  ws.on('message', async (raw) => {
    try {
      const body: ChatRequest = JSON.parse(raw.toString());

      if (!isConfigured()) {
        ws.send(JSON.stringify({ type: 'error', content: 'LLM not configured' }));
        ws.close();
        return;
      }

      const messages: LLMMessage[] = [];
      const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      messages.push({ role: 'system', content: systemPrompt });

      for (const msg of body.messages) {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }

      let fullContent = '';

      try {
        for await (const token of streamChatCompletion(messages)) {
          fullContent += token;
          ws.send(JSON.stringify({ type: 'token', content: token }));
        }

        const toolCall = detectToolCall(fullContent);
        const result: ChatResponseData = {
          type: toolCall ? 'tool_call' : 'text',
          content: fullContent,
          toolCall,
        };

        ws.send(JSON.stringify({ type: 'done', result }));
      } catch (err) {
        console.error('[ws] Stream error:', err);
        ws.send(JSON.stringify({ type: 'error', content: 'LLM stream failed' }));
      }
    } catch {
      ws.send(JSON.stringify({ type: 'error', content: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('[ws] Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('[ws] Error:', err);
  });
});

// ── Start ──

server.listen(PORT, () => {
  console.log(`\n🦕 小柱 LLM Proxy Server`);
  console.log(`   HTTP:      http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/api/chatbot/ws/chat`);
  console.log(`   LLM:       ${isConfigured() ? '✅ Configured' : '❌ Not configured (set DEEPSEEK_API_KEY)'}\n`);
});

/**
 * 小柱 后端服务 (XiaoZhu Backend Server)
 *
 * 提供：
 *   LLM Proxy:  WS   /api/chatbot/ws/chat         (流式对话，前端唯一对话通道)
 *   Integration APIs — 康复师↔家长数据通道:
 *     Family:    POST /api/integration/family/login
 *     Assessment:GET  /api/integration/assessment/summary/:patientId
 *                POST /api/integration/assessment/push
 *                GET  /api/integration/assessment/history/:patientId
 *     Plan:      GET  /api/integration/plan/pending/:patientId
 *                POST /api/integration/plan/push
 *                PATCH /api/integration/plan/:planId/status
 *     Tracking:  POST /api/integration/tracking/submit
 *                GET  /api/integration/tracking/:patientId
 *     Scale:     GET  /api/integration/scale/pending/:patientId
 *                POST /api/integration/scale/push
 *                POST /api/integration/scale/submit
 *                GET  /api/integration/scale/results/:sessionId
 *   Chatbot Support APIs — 前端 Agent 辅助端点:
 *     History:   GET  /api/chatbot/assessment-history/:name
 *     Trend:     GET  /api/chatbot/assessment-trend/:name/:tool
 *     Tool:      POST /api/chatbot/tool/start
 *                POST /api/chatbot/tool/submit
 *     Summary:   POST /api/chatbot/session-summary
 *
 * Start:  npx tsx server/index.ts
 * Port:   8002 (matches Vite proxy in vite.config.ts)
 */

import 'dotenv/config';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { streamChatCompletion, isConfigured, type LLMMessage } from './llmClient';
import { initDB } from './db';
import {
  sendJSON,
  sendError,
  handleCORS,
} from './routes/utils';
// Phase 5: 所有 CRUD 数据路由已迁移到 Rehab Python (:8000)
// Node 仅保留 chatbot 支持路由 + WebSocket LLM 流式对话
import { handleChatbotRoutes } from './routes/chatbot';

const PORT = parseInt(process.env.PORT || '8002', 10);

// ── Tool detection regex ──

const TOOL_CALL_RE = /\[TOOL:\s*(\w+)\]\s*(.+)?/i;

function detectToolCall(text: string): { toolId: string; reason: string } | null {
  const match = text.match(TOOL_CALL_RE);
  if (!match) return null;
  return { toolId: match[1], reason: (match[2] || '').trim() };
}

// ── Default system prompt ──

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

// ── HTTP Server ──

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (handleCORS(req, res)) return;

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    // ── Health check ──
    if (req.method === 'GET' && pathname === '/api/chatbot/health') {
      sendJSON(res, 200, { llm: isConfigured() });
      return;
    }

    // ── Chatbot support routes (assessment history, trends, tool sessions, summaries) ──
    // Phase 5: 所有 /api/integration/* CRUD 路由已迁移到 Rehab Python (:8000)
    // chatbot 路由内部通过 HTTP 调用 Python 获取数据

    if (await handleChatbotRoutes(req, res)) return;

    // ── 404 ──
    sendError(res, 404, `Not found: ${req.method} ${pathname}`);
  } catch (err) {
    console.error('[http] Error:', err);
    sendError(res, 500, 'Internal server error');
  }
});

// ── WebSocket Server ──

const wss = new WebSocketServer({ server, path: '/api/chatbot/ws/chat' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[ws] Client connected');

  ws.on('message', async (raw) => {
    try {
      const body: {
        messages: Array<{ role: string; content: string }>;
        patientContext?: Record<string, unknown>;
        availableTools?: string[];
        systemPrompt?: string;
      } = JSON.parse(raw.toString());

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
        ws.send(JSON.stringify({
          type: 'done',
          result: {
            type: toolCall ? 'tool_call' : 'text',
            content: fullContent,
            toolCall,
          },
        }));
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

// Initialize data directory
initDB();

server.listen(PORT, () => {
  console.log(`\n🦕 小柱 Backend Server (LLM + Chatbot Support)`);
  console.log(`   HTTP:       http://localhost:${PORT}`);
  console.log(`   WebSocket:  ws://localhost:${PORT}/api/chatbot/ws/chat`);
  console.log(`   LLM:        ${isConfigured() ? '✅ Configured' : '❌ Not configured (set DEEPSEEK_API_KEY)'}`);
  console.log(`   APIs:       6 chatbot support endpoints (CRUD migrated to Python :8000)\n`);
});

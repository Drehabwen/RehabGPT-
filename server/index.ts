/**
 * 小柱 后端服务 (XiaoZhu Backend Server)
 *
 * 提供：
 *   LLM Proxy:  WS   /api/chatbot/ws/chat         (流式自由对话)
 *               POST /api/chatbot/chat            (非流式建议、抽取等轻量调用)
 *   Integration APIs: /api/integration/* 由 Rehab Python 后端提供
 *                     Node 仅在 chatbot support 路由内按需读取
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
import { streamChatCompletion, isConfigured } from './llmClient';
import { buildLLMMessageList, DEFAULT_CHAT_SYSTEM_PROMPT, detectToolCall } from './chatMessages';
import { REHAB_API_BASE, SERVER_PORT } from './config';
import { initDB } from './db';
import {
  sendJSON,
  sendError,
  handleCORS,
} from './routes/utils';
// Phase 5: 所有 CRUD 数据路由已迁移到 Rehab Python (:8000)
// Node 仅保留 chatbot 支持路由 + WebSocket LLM 流式对话
import { handleChatbotRoutes } from './routes/chatbot';

const PORT = SERVER_PORT;

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

      const messages = buildLLMMessageList(
        body.messages,
        body.systemPrompt || DEFAULT_CHAT_SYSTEM_PROMPT,
      );

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
  console.log(`   Rehab API:  ${REHAB_API_BASE}`);
  console.log(`   APIs:       chatbot support endpoints (CRUD migrated to Python)\n`);
});

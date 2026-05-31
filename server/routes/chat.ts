/**
 * server/routes/chat.ts — 患者历史路由
 *
 * GET /api/integration/patient/history?name=xxx — 获取患者历史摘要
 *
 * 注：LLM 对话端点在 index.ts 中直接处理（/api/chatbot/chat + WebSocket）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseBody, sendJSON, sendError } from './utils';
import { generateSessionSummary } from '../llmClient';
import type { ChatMessage, PatientHistoryItem } from '../types';

export async function handleChatRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // GET /api/integration/patient/history?name=xxx
  if (pathname === '/api/integration/patient/history' && req.method === 'GET') {
    const patientName = url.searchParams.get('name') || '';
    // 简化实现：返回空历史（后续可关联实际追踪/评估数据）
    const history: PatientHistoryItem[] = [];
    sendJSON(res, 200, history);
    return true;
  }

  // POST /api/integration/session/summarize — 会话摘要生成
  if (pathname === '/api/integration/session/summarize' && req.method === 'POST') {
    try {
      const body = await parseBody<{
        messages: ChatMessage[];
        patientName: string;
      }>(req);

      if (!body.messages || body.messages.length === 0) {
        sendJSON(res, 200, { summary: null });
        return true;
      }

      const result = await generateSessionSummary(body.messages, body.patientName || '孩子');
      sendJSON(res, 200, result || { summary: null });
      return true;
    } catch (err) {
      console.error('[Session] Summarize error:', err);
      sendError(res, 500, '摘要生成失败');
      return true;
    }
  }

  return false;
}

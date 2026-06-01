/**
 * server/routes/chatbot.ts — LLM 对话辅助端点
 *
 * 补全前端 agentChatService.ts 所调用的剩余端点：
 * - GET  /api/chatbot/assessment-history/:name   → 患者评估历史
 * - GET  /api/chatbot/assessment-trend/:name/:tool → 评估趋势
 * - POST /api/chatbot/tool/start                  → 工具会话开始
 * - POST /api/chatbot/tool/submit                 → 工具结果提交
 * - POST /api/chatbot/session-summary             → 对话摘要生成
 *
 * 注：LLM 对话主端点和 WebSocket 在 index.ts 中直接处理。
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { nanoid } from 'nanoid';
import { parseBody, sendJSON, sendError, matchPath } from './utils';
import { chatCompletion, generateSessionSummary, isConfigured, type LLMMessage } from '../llmClient';
import {
  buildLLMMessageList,
  DEFAULT_CHAT_SYSTEM_PROMPT,
  detectToolCall,
  type IncomingChatMessage,
} from '../chatMessages';
import { REHAB_API_BASE } from '../config';
// Phase 5: 不再从本地 JSON DB 读取，改为内部 HTTP 调用 Rehab Python (:8000)
// assessmentsDB 已移除 — 数据统一在 Python SQLite

// ── 工具会话存储（内存，重启丢失） ──

interface ToolSession {
  sessionId: string;
  toolId: string;
  patientName: string;
  patientAge: number | null;
  startedAt: string;
  config: Record<string, unknown>;
}

const toolSessions = new Map<string, ToolSession>();

function rehabApiUrl(path: string): string {
  return `${REHAB_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

// ── 路由处理 ──

export async function handleChatbotRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // POST /api/chatbot/chat
  if (pathname === '/api/chatbot/chat' && req.method === 'POST') {
    try {
      if (!isConfigured()) {
        sendError(res, 503, 'LLM not configured');
        return true;
      }

      const body = await parseBody<{
        messages?: IncomingChatMessage[];
        systemPrompt?: string;
      }>(req);

      const messages = buildLLMMessageList(
        body.messages,
        body.systemPrompt || DEFAULT_CHAT_SYSTEM_PROMPT,
      );

      if (!messages.some((msg) => msg.role !== 'system')) {
        sendError(res, 400, 'messages are required');
        return true;
      }

      const result = await chatCompletion(messages);
      const toolCall = detectToolCall(result.content);

      sendJSON(res, 200, {
        type: toolCall ? 'tool_call' : 'text',
        content: result.content,
        toolCall,
      });
    } catch (err) {
      console.error('[Chatbot] Chat completion error:', err);
      sendError(res, 500, 'LLM chat failed');
    }
    return true;
  }

  // GET /api/chatbot/assessment-history/:name
  // Phase 5: 内部 HTTP 调用 Rehab Python 获取数据
  const historyMatch = matchPath('api/chatbot/assessment-history/:name', pathname);
  if (historyMatch && req.method === 'GET') {
    const name = decodeURIComponent(historyMatch.name);
    try {
      const pyResp = await fetch(
        rehabApiUrl(`/api/integration/assessment/search?name=${encodeURIComponent(name)}`),
      );
      if (!pyResp.ok) {
        sendJSON(res, 200, { assessments: [] });
        return true;
      }
      const history = await pyResp.json() as any[];
      const assessments = history.map((a: any) => ({
        id: a.summary_id,
        sessionId: a.session_id,
        toolId: 'risk_assessment',
        status: 'completed',
        startedAt: a.created_at,
        completedAt: a.created_at,
        summary: a.summary_text,
        patientName: a.patient_name,
        patientAge: null,
      }));
      sendJSON(res, 200, { assessments });
    } catch (err) {
      console.error('[Chatbot] assessment-history fetch error:', err);
      sendJSON(res, 200, { assessments: [] });
    }
    return true;
  }

  // GET /api/chatbot/assessment-trend/:name/:tool
  // Phase 5: 内部 HTTP 调用 Rehab Python 获取数据
  const trendMatch = matchPath('api/chatbot/assessment-trend/:name/:tool', pathname);
  if (trendMatch && req.method === 'GET') {
    const name = decodeURIComponent(trendMatch.name);
    try {
      const pyResp = await fetch(
        rehabApiUrl(`/api/integration/assessment/search?name=${encodeURIComponent(name)}`),
      );
      if (!pyResp.ok) {
        sendJSON(res, 200, { patientName: name, toolId: trendMatch.tool, dataPoints: [] });
        return true;
      }
      const history = await pyResp.json() as any[];
      history.sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      sendJSON(res, 200, {
        patientName: name,
        toolId: trendMatch.tool,
        dataPoints: history.map((a: any) => ({
          date: (a.created_at || '').split('T')[0],
          riskLevel: a.risk_level,
          riskLabel: a.risk_label,
          summary: (a.summary_text || '').slice(0, 100),
        })),
      });
    } catch (err) {
      console.error('[Chatbot] assessment-trend fetch error:', err);
      sendJSON(res, 200, { patientName: name, toolId: trendMatch.tool, dataPoints: [] });
    }
    return true;
  }

  // POST /api/chatbot/tool/start
  if (pathname === '/api/chatbot/tool/start' && req.method === 'POST') {
    try {
      const body = await parseBody<{
        toolId: string;
        patientName: string;
        patientAge?: number | null;
      }>(req);

      const session: ToolSession = {
        sessionId: nanoid(12),
        toolId: body.toolId || 'unknown',
        patientName: body.patientName || '',
        patientAge: body.patientAge ?? null,
        startedAt: new Date().toISOString(),
        config: {},
      };

      toolSessions.set(session.sessionId, session);

      sendJSON(res, 200, {
        sessionId: session.sessionId,
        toolId: session.toolId,
        patientName: session.patientName,
        startedAt: session.startedAt,
        config: session.config,
      });
      return true;
    } catch (err) {
      console.error('[Chatbot] Tool start error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // POST /api/chatbot/tool/submit
  if (pathname === '/api/chatbot/tool/submit' && req.method === 'POST') {
    try {
      const body = await parseBody<{
        sessionId: string;
        toolId: string;
        patientName: string;
        results?: Record<string, unknown>;
        answers?: Array<Record<string, unknown>>;
      }>(req);

      const session = toolSessions.get(body.sessionId);
      if (session) {
        session.config = { ...session.config, results: body.results, answers: body.answers };
      }

      console.log(`[Chatbot] Tool ${body.toolId} submitted for session ${body.sessionId}`);

      sendJSON(res, 200, {
        success: true,
        sessionId: body.sessionId,
      });
      return true;
    } catch (err) {
      console.error('[Chatbot] Tool submit error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // POST /api/chatbot/session-summary
  if (pathname === '/api/chatbot/session-summary' && req.method === 'POST') {
    try {
      const body = await parseBody<{
        messages: LLMMessage[];
        patientName: string;
      }>(req);

      if (!body.messages || body.messages.length === 0) {
        sendJSON(res, 200, { summary: null, source: 'empty' });
        return true;
      }

      const result = await generateSessionSummary(body.messages, body.patientName || '孩子');

      if (result && result.summary) {
        sendJSON(res, 200, {
          summary: result.summary,
          source: 'llm',
        });
      } else {
        sendJSON(res, 200, { summary: null, source: 'degraded' });
      }
      return true;
    } catch (err) {
      console.error('[Chatbot] Session summary error:', err);
      // 静默降级，前端已有 fallback
      sendJSON(res, 200, { summary: null, source: 'error' });
      return true;
    }
  }

  return false;
}

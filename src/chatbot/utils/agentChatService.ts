/**
 * Agent Chat Service — LLM 对话 + Tool Calling + WebSocket 流式传输 + 评估数据持久化
 *
 * 调用后端 API（端口 8003），后端不可达时返回 null 触发规则引擎降级。
 */
import type { AgentToolId } from '../store/useAgentStore';

// ── API 配置 ──
const API_BASE = 'http://localhost:8003';
const WS_BASE = 'ws://localhost:8003';
const CHAT_TIMEOUT = 15000; // 15 秒（对话需要更快响应）
const API_TIMEOUT = 30000; // 30 秒（工具/数据操作）
const HEALTH_TIMEOUT = 5000; // 5 秒

// ── 请求/响应类型 ──

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export interface PatientContext {
  name: string;
  age: number | null;
  hasHistory: boolean;
  hasDueReminder: boolean;
  riskLevel: string | null;
  lastAssessmentSummary: string | null;
}

export interface ChatRequest {
  messages: ChatMessage[];
  patientContext: PatientContext;
  availableTools?: AgentToolId[];
}

export interface ToolCall {
  toolId: string;
  reason: string;
}

export interface ChatResponse {
  type: 'text' | 'tool_call' | 'mixed';
  content: string;
  toolCall: ToolCall | null;
}

// ── Assessment types ──

export interface AssessmentSession {
  id: string;
  toolId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  summary: string | null;
  patientName?: string;
  patientAge?: number;
}

export interface ToolStartResponse {
  sessionId: string;
  toolId: string;
  patientName: string;
  startedAt: string;
  config: Record<string, unknown>;
}

export interface ScaleAnswer {
  questionIndex: number;
  questionText: string;
  score: number;
  note?: string;
}

export interface ToolSubmitResponse {
  sessionId: string;
  status: string;
  completedAt?: string;
  averageScore?: number;
  level?: string;
  summary?: string;
  totalScore?: number;
  maxScore?: number;
}

export interface TrendData {
  toolId: string;
  count: number;
  trend?: string;
  first?: { date: string; summary: string };
  last?: { date: string; summary: string };
  sessions?: Array<{ id: string; date: string; summary: string }>;
}

export interface SessionSummary {
  patientName: string;
  summary: string;
  source: string;
}

// ── 连续失败计数器 ──
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export function resetFailureCount(): void {
  consecutiveFailures = 0;
}

export function shouldFallback(): boolean {
  return consecutiveFailures >= MAX_CONSECUTIVE_FAILURES;
}

// ── LLM 可用性检测 ──

export async function checkLLMAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    return data.llm === true;
  } catch {
    return false;
  }
}

// ── 对话（HTTP POST） ──

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      consecutiveFailures++;
      console.warn(`[AgentChat] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    consecutiveFailures = 0;

    return {
      type: data.type || 'text',
      content: data.content || '',
      toolCall: data.toolCall || null,
    };
  } catch (err) {
    consecutiveFailures++;
    console.warn('[AgentChat] LLM API call failed:', err);
    return null;
  }
}

// ── 流式对话（WebSocket） ──

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (result: ChatResponse) => void;
  onError: (error: string) => void;
}

export function sendChatMessageStream(
  req: ChatRequest,
  callbacks: StreamCallbacks,
): { close: () => void } {
  const ws = new WebSocket(`${WS_BASE}/api/chatbot/ws/chat`);

  let closed = false;
  const close = () => {
    if (!closed) {
      closed = true;
      ws.close();
    }
  };

  ws.onopen = () => {
    ws.send(JSON.stringify({
      messages: req.messages,
      patientContext: req.patientContext,
      availableTools: req.availableTools || [],
    }));
  };

  ws.onmessage = (event) => {
    if (closed) return;
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'token':
          callbacks.onToken(data.content);
          break;
        case 'done':
          resetFailureCount();
          callbacks.onDone(data.result as ChatResponse);
          close();
          break;
        case 'error':
          consecutiveFailures++;
          callbacks.onError(data.content);
          close();
          break;
      }
    } catch {
      // ignore parse errors
    }
  };

  ws.onerror = () => {
    consecutiveFailures++;
    if (!closed) {
      callbacks.onError('WebSocket connection failed');
      close();
    }
  };

  ws.onclose = () => {
    closed = true;
  };

  return { close };
}

// ── 患者评估历史 ──

export async function getPatientHistory(
  patientName: string,
): Promise<AssessmentSession[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const encoded = encodeURIComponent(patientName);
    const response = await fetch(
      `${API_BASE}/api/chatbot/assessment-history/${encoded}`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    return (data.assessments || []).map((a: Record<string, unknown>) => ({
      id: a.id || a.sessionId,
      toolId: a.toolId || a.tool_id,
      status: a.status,
      startedAt: a.startedAt || a.started_at,
      completedAt: a.completedAt || a.completed_at || null,
      summary: a.summary || null,
      patientName: a.patientName || a.patient_name,
      patientAge: a.patientAge || a.patient_age,
    }));
  } catch (err) {
    console.warn('[AgentChat] getPatientHistory failed:', err);
    return [];
  }
}

// ── 评估趋势对比 ──

export async function getAssessmentTrend(
  patientName: string,
  toolId: string,
): Promise<TrendData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const encodedName = encodeURIComponent(patientName);
    const encodedTool = encodeURIComponent(toolId);
    const response = await fetch(
      `${API_BASE}/api/chatbot/assessment-trend/${encodedName}/${encodedTool}`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[AgentChat] getAssessmentTrend failed:', err);
    return null;
  }
}

// ── 工具会话控制 ──

export async function startToolSession(
  toolId: string,
  patientName: string,
  patientAge?: number | null,
): Promise<ToolStartResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/tool/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId,
        patientName,
        patientAge: patientAge ?? null,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    return {
      sessionId: data.sessionId || data.session_id,
      toolId: data.toolId || data.tool_id,
      patientName: data.patientName || data.patient_name,
      startedAt: data.startedAt || data.started_at,
      config: data.config || {},
    };
  } catch (err) {
    console.warn('[AgentChat] startToolSession failed:', err);
    return null;
  }
}

export async function submitToolResults(
  sessionId: string,
  toolId: string,
  patientName: string,
  results?: Record<string, unknown>,
  answers?: ScaleAnswer[],
): Promise<ToolSubmitResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/tool/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        toolId,
        patientName,
        results: results || {},
        answers: answers || [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[AgentChat] submitToolResults failed:', err);
    return null;
  }
}

// ── 对话小结生成 ──

export async function getSessionSummary(
  messages: ChatMessage[],
  patientName: string,
): Promise<SessionSummary | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE}/api/chatbot/session-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, patientName }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[AgentChat] getSessionSummary failed:', err);
    return null;
  }
}

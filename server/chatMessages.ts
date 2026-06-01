import type { LLMMessage } from './llmClient';

export const DEFAULT_CHAT_SYSTEM_PROMPT = `你是“小柱”，一位温和、专业的儿童脊柱与姿态康复助手。

沟通规范：
- 面向家长沟通，语言清楚、克制、容易理解。
- 称呼使用“孩子”“小朋友”，避免使用“患者”“病人”等标签。
- 不做医学诊断，只解释筛查风险、康复执行和复查提醒。
- 出现明显疼痛、神经症状、快速加重或其他红旗信息时，建议及时联系康复师或就医。
- 没有数据时如实说明，不编造评估、处方或量表结论。`;

export interface IncomingChatMessage {
  role?: string;
  content?: unknown;
}

export interface ToolCall {
  toolId: string;
  reason: string;
}

const TOOL_CALL_RE = /\[TOOL:\s*(\w+)\]\s*(.+)?/i;

export function detectToolCall(text: string): ToolCall | null {
  const match = text.match(TOOL_CALL_RE);
  if (!match) return null;
  return { toolId: match[1], reason: (match[2] || '').trim() };
}

export function buildLLMMessageList(
  incomingMessages: IncomingChatMessage[] | undefined,
  systemPrompt: string,
): LLMMessage[] {
  const source = Array.isArray(incomingMessages) ? incomingMessages : [];
  const normalized = source
    .map((msg) => ({
      role: typeof msg.role === 'string' ? msg.role : 'user',
      content: typeof msg.content === 'string' ? msg.content.trim() : '',
    }))
    .filter((msg) => msg.content.length > 0);

  const hasSystemMessage = normalized.some((msg) => msg.role === 'system');
  const messages: LLMMessage[] = hasSystemMessage
    ? []
    : [{ role: 'system', content: systemPrompt }];

  for (const msg of normalized) {
    if (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    } else if (msg.role === 'tool') {
      messages.push({ role: 'user', content: `[tool]\n${msg.content}` });
    }
  }

  return messages;
}

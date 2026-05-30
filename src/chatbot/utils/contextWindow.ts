/**
 * 上下文窗口管理 — 智能历史消息截断
 *
 * 策略：
 * 1. 标记消息重要性（关键决策 > 医学结论 > 普通对话）
 * 2. 按 token 预算截断，而非消息条数
 * 3. 保留高优先级消息，丢弃低优先级消息
 */

import { countTokens, getHistoryBudget } from './tokenCounter';
import type { ChatMessage } from '../types';

export interface MessageWithPriority extends ChatMessage {
  priority: number; // 0-100
  isKeyDecision?: boolean;
  tokenCount?: number;
}

/**
 * 评估消息重要性
 */
export function assessMessagePriority(msg: ChatMessage): number {
  let priority = 50; // 基础分

  const text = msg.text.toLowerCase();

  // 关键决策点 +30
  if (text.includes('风险') || text.includes('评估') || text.includes('结果')) {
    priority += 30;
  }

  // 医学建议 +25
  if (text.includes('建议') || text.includes('就医') || text.includes('mri') || text.includes('检查')) {
    priority += 25;
  }

  // 工具调用 +20
  if (msg.toolCall) priority += 20;

  // 量表推送 +15
  if (msg.scalePayload) priority += 15;

  // 用户问题（需要保留上下文）+10
  if (msg.role === 'user') priority += 10;

  // 近期消息自然有更高权重（在截断时体现）

  return Math.min(priority, 100);
}

/**
 * 智能截断历史消息
 *
 * @param messages 消息列表（按时间排序）
 * @param budgetTokens 可用 token 预算
 * @returns 截断后的消息列表
 */
export function truncateHistory(
  messages: ChatMessage[],
  budgetTokens: number,
): ChatMessage[] {
  if (messages.length === 0) return [];

  // 1. 为每条消息计算优先级和 token 数
  const withMeta: MessageWithPriority[] = messages.map((msg) => ({
    ...msg,
    priority: assessMessagePriority(msg),
    tokenCount: countTokens(msg.text) + 4, // +4 for message overhead
  }));

  // 2. 分离高优先级消息（必须保留）
  const highPriority = withMeta.filter((m) => m.priority >= 80);
  const highPriorityTokens = highPriority.reduce((sum, m) => sum + (m.tokenCount || 0), 0);

  // 3. 剩余预算给普通消息
  const remainingBudget = budgetTokens - highPriorityTokens;

  if (remainingBudget <= 0) {
    // 高优先级消息就超预算了，只保留最重要的几条
    highPriority.sort((a, b) => b.priority - a.priority);
    let used = 0;
    const selected: MessageWithPriority[] = [];
    for (const msg of highPriority) {
      if (used + (msg.tokenCount || 0) <= budgetTokens) {
        selected.push(msg);
        used += msg.tokenCount || 0;
      }
    }
    return selected.sort((a, b) => a.timestamp - b.timestamp);
  }

  // 4. 从后往前累积普通消息（保留最近的）
  const normalMessages = withMeta.filter((m) => m.priority < 80);
  const selectedNormal: MessageWithPriority[] = [];
  let usedTokens = 0;

  for (let i = normalMessages.length - 1; i >= 0; i--) {
    const msg = normalMessages[i];
    const msgTokens = msg.tokenCount || 0;

    if (usedTokens + msgTokens <= remainingBudget) {
      selectedNormal.unshift(msg); // 保持时间顺序
      usedTokens += msgTokens;
    } else {
      break;
    }
  }

  // 5. 合并并排序
  const result = [...highPriority, ...selectedNormal];
  result.sort((a, b) => a.timestamp - b.timestamp);

  return result;
}

/**
 * 构建发送给 LLM 的消息列表
 */
export function buildLLMMessages(
  systemPrompt: string,
  historyMessages: ChatMessage[],
  userMessage: string,
): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }> {
  // 1. 计算系统提示词 token
  const systemTokens = countTokens(systemPrompt);

  // 2. 计算可用历史预算
  const historyBudget = getHistoryBudget(systemTokens);

  // 3. 截断历史消息
  const truncatedHistory = truncateHistory(historyMessages, historyBudget);

  // 4. 组装最终消息列表
  const messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of truncatedHistory) {
    messages.push({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/**
 * 获取截断统计信息（用于调试）
 */
export function getTruncationStats(
  original: ChatMessage[],
  truncated: ChatMessage[],
): {
  originalCount: number;
  truncatedCount: number;
  droppedCount: number;
  originalTokens: number;
  truncatedTokens: number;
} {
  const originalTokens = original.reduce((sum, m) => sum + countTokens(m.text) + 4, 0);
  const truncatedTokens = truncated.reduce((sum, m) => sum + countTokens(m.text) + 4, 0);

  return {
    originalCount: original.length,
    truncatedCount: truncated.length,
    droppedCount: original.length - truncated.length,
    originalTokens,
    truncatedTokens,
  };
}

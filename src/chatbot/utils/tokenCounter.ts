/**
 * Token 计数与上下文预算管理
 *
 * 使用简单估算（无需引入 tiktoken 依赖）：
 * - 中文字符 ≈ 2 tokens
 * - 英文/数字 ≈ 0.75 tokens
 * - 标点/空格 ≈ 0.5 tokens
 */

export function countTokens(text: string): number {
  if (!text) return 0;

  let tokens = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);

    // CJK 统一表意文字（中日韩）
    if (code >= 0x4e00 && code <= 0x9fff) {
      tokens += 2;
    }
    // 中文标点
    else if (code >= 0x3000 && code <= 0x303f) {
      tokens += 1;
    }
    // ASCII 字母数字
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || (code >= 0x30 && code <= 0x39)) {
      tokens += 0.75;
    }
    // 其他（标点、空格等）
    else {
      tokens += 0.5;
    }
  }

  return Math.ceil(tokens);
}

/**
 * 计算消息数组的 token 数
 * OpenAI 格式开销：每条消息约 4 tokens
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
): number {
  let total = 0;
  for (const msg of messages) {
    total += 4; // 消息格式开销
    total += countTokens(msg.content);
    total += countTokens(msg.role);
  }
  total += 2; // 对话整体开销
  return Math.ceil(total);
}

// ── 上下文预算配置 ──
export const CONTEXT_BUDGET = {
  // DeepSeek-V3 总窗口 64K
  TOTAL: 64000,

  // 预留响应长度
  MAX_RESPONSE: 2048,

  // 安全余量（防止估算误差）
  SAFETY_MARGIN: 1024,

  // 系统提示词上限（精简后的目标）
  SYSTEM_PROMPT_MAX: 1500,

  // 历史消息上限
  HISTORY_MAX: 8000,

  // 压缩摘要上限
  SUMMARY_MAX: 512,
} as const;

/**
 * 计算可用于历史消息的 token 预算
 */
export function getHistoryBudget(systemPromptTokens: number): number {
  const available =
    CONTEXT_BUDGET.TOTAL -
    systemPromptTokens -
    CONTEXT_BUDGET.MAX_RESPONSE -
    CONTEXT_BUDGET.SAFETY_MARGIN;

  return Math.min(available, CONTEXT_BUDGET.HISTORY_MAX);
}

/**
 * 检查系统提示词是否超出预算
 */
export function isSystemPromptOverBudget(tokens: number): boolean {
  return tokens > CONTEXT_BUDGET.SYSTEM_PROMPT_MAX;
}

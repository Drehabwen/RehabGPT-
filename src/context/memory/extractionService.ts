/**
 * extractionService — 对话后要点提取服务
 *
 * 每次有意义的对话后，异步调轻量 LLM 提取结构化要点。
 * 不阻塞对话回复，失败静默降级。
 *
 * 调用链：
 * agentLLMSlice.sendFreeTextStream → 回复家长 → scheduleExtraction（异步）
 *   → extractionService.extract → useChildContextStore.applyExtractionResult
 */

import type { ChildContext, ExtractionResult } from '../model/types';
import { useChildContextStore } from '../store/ChildContextStore';

// ── 提取 System Prompt ──

const EXTRACTION_SYSTEM_PROMPT = `你是一个信息提取器。你的任务是从家长和AI助手的对话中提取结构化信息。

请严格按以下 JSON 格式输出，不要输出任何其他内容，不要使用 markdown 代码块：
{
  "newTopics": ["话题1", "话题2"],
  "answeredPending": [],
  "newPending": [],
  "parentSentiment": "neutral",
  "painMentioned": false,
  "painDetails": null,
  "exerciseMentioned": false,
  "exerciseDetails": null,
  "shouldFlagTherapist": false,
  "flagReason": null
}

字段说明：
- newTopics：本轮涉及的新话题（1-3个，简短短语，不超过10字），如"书包重量"、"坐姿矫正"。无关话题不填。
- answeredPending：从待解答列表中看，哪些问题本轮被明确解答了
- newPending：家长问了但AI没有完全解答清楚的新问题
- parentSentiment：家长情绪。可选值：neutral / concerned / positive / anxious
- painMentioned：家长是否明确说孩子有疼痛
- painDetails：如有疼痛，格式：{"location":"疼痛部位","level":疼痛分值0-10,"isNew":是否新出现}
- exerciseMentioned：家长是否提及训练执行情况
- exerciseDetails：如有训练提及，格式：{"completed":是否完成,"difficulty":"easy/normal/hard或null","skippedReason":"跳过原因或null"}
- shouldFlagTherapist：仅当以下情况时填true：1)疼痛程度>=6且是新出现的 2)孩子严重抗拒训练 3)出现红旗症状
- flagReason：标记原因（shouldFlagTherapist为true时必填）`;

// ── 构建提取 prompt ──

function buildExtractionPrompt(
  userMessage: string,
  assistantReply: string,
  ctx: ChildContext,
): string {
  const pending = ctx.memory.pendingQuestions
    .map((q) => q.question)
    .join('；') || '无';

  return `现有上下文：
- 孩子：${ctx.identity.patientName || '未知'}，${ctx.identity.age || '?'}岁
- 评估结论：${ctx.assessment?.riskLabel || '暂无'}
- 训练处方：${ctx.treatment?.title || '暂无'}
- 待解答问题：${pending}

本轮对话：
家长：${userMessage}
助手：${assistantReply.slice(0, 500)}

请提取结构化信息：`;
}

// ── JSON 解析（容错） ──

function safeJsonParse(text: string): ExtractionResult | null {
  try {
    return JSON.parse(text) as ExtractionResult;
  } catch {
    // 尝试提取 {} 包裹的部分
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as ExtractionResult;
    } catch {
      return null;
    }
  }
}

// ── 失败计数与退避 ──

let consecutiveExtractionFailures = 0;
const MAX_FAILURES = 5;

function resetFailureCount(): void {
  consecutiveExtractionFailures = 0;
}

function incrementFailureCount(): void {
  consecutiveExtractionFailures++;
}

export function getExtractionSkipThreshold(): number {
  if (consecutiveExtractionFailures >= MAX_FAILURES) return 3; // 每3轮提取一次
  return 1; // 正常每轮提取
}

// ── 主提取函数 ──

/**
 * 异步提取对话要点（不阻塞主流程）。
 *
 * @param userMessage 家长输入
 * @param assistantReply AI 回复
 * @param ctx 当前 ChildContext
 * @returns ExtractionResult 或 null（失败时）
 */
export async function extractConversationPoints(
  userMessage: string,
  assistantReply: string,
  ctx: ChildContext,
): Promise<ExtractionResult | null> {
  try {
    const extractionPrompt = buildExtractionPrompt(userMessage, assistantReply, ctx);

    const apiBase = import.meta.env.VITE_API_BASE || '';
    const resp = await fetch(`${apiBase}/api/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: extractionPrompt },
        ],
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      }),
    });

    if (!resp.ok) {
      incrementFailureCount();
      console.warn(`[Extraction] HTTP ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const content: string = data.content || '';

    if (!content) {
      incrementFailureCount();
      return null;
    }

    const result = safeJsonParse(content);
    if (result) {
      resetFailureCount();
      return result;
    }

    incrementFailureCount();
    console.warn('[Extraction] JSON parse failed:', content.slice(0, 100));
    return null;
  } catch (err) {
    incrementFailureCount();
    console.warn('[Extraction] Fetch failed:', err);
    return null;
  }
}

// ── 调度器 ──

let extractionRound = 0;

/**
 * 异步调度一次提取。与 shouldExtract 配合使用：
 * 1. shouldExtract(userMsg, reply) → true 才调用
 * 2. 内部检查退避阈值
 * 3. 成功后回写到 ChildContextStore
 */
export function scheduleExtraction(
  userMessage: string,
  assistantReply: string,
  ctx: ChildContext,
): void {
  extractionRound++;

  const skipThreshold = getExtractionSkipThreshold();
  if (extractionRound % skipThreshold !== 0) {
    return; // 退避：跳过本轮
  }

  // 异步执行，不阻塞
  extractConversationPoints(userMessage, assistantReply, ctx)
    .then((result) => {
      if (result) {
        useChildContextStore.getState().applyExtractionResult(result);
      }
    })
    .catch((err) => {
      console.warn('[Extraction] Schedule failed:', err);
    });
}

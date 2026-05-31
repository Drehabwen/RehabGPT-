/**
 * updateRules — 纯函数：状态推导 + 标记计算 + 要点提取合并
 *
 * 全部是同步纯函数，不依赖任何外部状态或网络。
 */

import type { ChildContext, RehabStage, ExtractionResult } from '../model/types';

// ── RehabStage 状态机推导 ──

/**
 * 根据 ChildContext 的字段综合判断当前处于哪个康复阶段。
 *
 * 推导顺序（从具体到宽泛）：
 * 1. 无 patientId → unbound
 * 2. 无评估 → waiting_assessment
 * 3. 无处方 → assessed
 * 4. 处方过期 + 完成率高 → awaiting_review
 * 5. 标记 needsReassessment + 完成率高 → awaiting_review
 * 6. 完成率高 + 处方过期 → completed（简化：需康复师手动标记）
 * 7. 默认 → in_training
 */
export function deriveStage(ctx: ChildContext): RehabStage {
  if (!ctx.identity.patientId) return 'unbound';
  if (!ctx.assessment) return 'waiting_assessment';
  if (!ctx.treatment) return 'assessed';

  // 处方已过期
  const isExpired = ctx.treatment.expiresAt
    ? new Date(ctx.treatment.expiresAt) < new Date()
    : false;

  // 简化完成判断：处方过期 + 高完成率 = 完成
  if (isExpired && ctx.progress.complianceRate >= 90) {
    return 'completed';
  }

  if (isExpired && ctx.progress.complianceRate >= 80) {
    return 'awaiting_review';
  }

  if (ctx.flags.needsReassessment && ctx.progress.complianceRate >= 80) {
    return 'awaiting_review';
  }

  return 'in_training';
}

// ── 动态标记计算 ──

/**
 * 重新计算所有 flags。
 * 纯规则计算，不调 LLM。
 *
 * 调用时机：
 * - 每次上下文组装前
 * - API 数据更新后（评估/处方刷新）
 * - 打卡数据更新后
 */
export function recalculateFlags(ctx: ChildContext): ChildContext['flags'] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. 是否需要复评：距上次评估 > 90 天 或 超过康复师建议的复评日期
  let needsReassessment = false;
  if (ctx.assessment) {
    const assessedDate = new Date(ctx.assessment.assessedAt);
    const daysSinceAssessment = (now.getTime() - assessedDate.getTime()) / 86400000;
    if (daysSinceAssessment > 90) {
      needsReassessment = true;
    }
    if (ctx.assessment.reassessDueAt && new Date(ctx.assessment.reassessDueAt) <= now) {
      needsReassessment = true;
    }
  }

  // 2. 是否有未读处方：有处方 + 还没有交互记录（简化判断）
  const hasUnreadPlan = ctx.treatment !== null && ctx.memory.totalInteractions === 0;

  // 3. 连续打卡是否可能中断：昨日已打卡 且 今日未打卡
  let streakAtRisk = false;
  if (ctx.progress.streakDays > 0 && ctx.progress.lastCheckinDate) {
    const lastDate = new Date(ctx.progress.lastCheckinDate);
    const lastDateStr = lastDate.toISOString().split('T')[0];
    if (lastDateStr !== todayStr) {
      // 昨天打卡了但今天没打
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDateStr === yesterdayStr) {
        streakAtRisk = true;
      }
    }
  }

  // 4. 疼痛趋势：从 progress.painTrend 派生
  const painTrendUp = ctx.progress.painTrend === 'worsening';

  // 5. 依从性警告：完成率 < 50% 且 处方已开始 > 7 天
  let complianceWarning = false;
  if (ctx.treatment) {
    const planStartDate = new Date(ctx.treatment.createdAt);
    const daysSincePlanStart = (now.getTime() - planStartDate.getTime()) / 86400000;
    if (daysSincePlanStart > 7 && ctx.progress.complianceRate < 50) {
      complianceWarning = true;
    }
  }

  // 6. 是否需要通知康复师：疼痛加剧 + 依从性低 + 家长焦虑
  const shouldNotifyTherapist =
    (painTrendUp && ctx.progress.avgPainLevel >= 5) ||
    (complianceWarning && ctx.memory.parentSentiment === 'anxious');

  return {
    needsReassessment,
    hasUnreadPlan,
    streakAtRisk,
    painTrendUp,
    complianceWarning,
    shouldNotifyTherapist,
  };
}

// ── 要点提取结果合并 ──

/**
 * 将 extractionService 返回的 ExtractionResult 合并到 ChildContext。
 * 返回需要更新的字段（partial ChildContext），由调用方写入 store。
 *
 * 规则：
 * - newTopics：去重合并到 keyTopics，保留最近 5 个
 * - answeredPending：从 pendingQuestions 中移除
 * - newPending：追加到 pendingQuestions，最多 5 个
 * - parentSentiment：非 neutral 时覆盖
 * - painMentioned / exerciseMentioned：仅标记，不直接修改 progress
 * - shouldFlagTherapist：覆盖 flags.shouldNotifyTherapist
 */
export function applyExtraction(
  ctx: ChildContext,
  result: ExtractionResult,
): Partial<ChildContext> {
  const now = new Date().toISOString();
  const patches: Partial<ChildContext> = {};

  // ── 1. 合并新话题 ──
  const existingTopicNames = new Set(ctx.memory.keyTopics.map((t) => t.topic));
  const mergedTopics = [...ctx.memory.keyTopics];

  for (const topic of result.newTopics) {
    if (!topic || topic.trim().length === 0) continue;
    if (existingTopicNames.has(topic)) {
      const idx = mergedTopics.findIndex((t) => t.topic === topic);
      if (idx >= 0) {
        mergedTopics[idx] = {
          ...mergedTopics[idx],
          mentionCount: mergedTopics[idx].mentionCount + 1,
        };
      }
    } else {
      mergedTopics.push({
        topic,
        firstMentionedAt: now,
        mentionCount: 1,
      });
    }
  }

  // 只保留最近 5 个，按提及次数降序
  const sortedTopics = mergedTopics
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 5);

  // ── 2. 清理已解答的问题 ──
  const answeredSet = new Set(result.answeredPending);
  let pendingQuestions = ctx.memory.pendingQuestions.filter(
    (q) => !answeredSet.has(q.question),
  );

  // ── 3. 追加新 pending 问题 ──
  if (result.newPending.length > 0) {
    const existingQuestions = new Set(pendingQuestions.map((q) => q.question));
    const newEntries = result.newPending
      .filter((q) => q && q.trim().length > 0 && !existingQuestions.has(q))
      .map((question) => ({ question, askedAt: now }));
    pendingQuestions = [...pendingQuestions, ...newEntries].slice(-5);
  }

  // ── 4. 更新情绪 ──
  const parentSentiment =
    result.parentSentiment !== 'neutral'
      ? result.parentSentiment
      : ctx.memory.parentSentiment;

  patches.memory = {
    ...ctx.memory,
    keyTopics: sortedTopics,
    pendingQuestions,
    parentSentiment,
    parentConcerns: ctx.memory.parentConcerns, // keep existing
    lastInteractionAt: now,
    totalInteractions: ctx.memory.totalInteractions + 1,
  };

  // ── 5. 标记康复师通知 ──
  if (result.shouldFlagTherapist) {
    patches.flags = {
      ...ctx.flags,
      shouldNotifyTherapist: true,
    };
  }

  return patches;
}

// ── 跨日记忆清理 ──

/**
 * 检测跨日，清理过期话题，重置每日相关状态。
 *
 * 保留：
 * - pendingQuestions（未解答的问题跨日有效）
 * - assessment / treatment（API 数据，不清理）
 *
 * 清理：
 * - 7 天前的话题
 */
export function consolidateMemoryForNewDay(ctx: ChildContext): Partial<ChildContext> {
  const lastDate = ctx.memory.lastInteractionAt?.split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  if (!lastDate || lastDate === today) {
    return {}; // 同日，无需清理
  }

  const sevenDaysAgo = Date.now() - 7 * 86400000;

  return {
    memory: {
      ...ctx.memory,
      keyTopics: ctx.memory.keyTopics.filter(
        (t) => new Date(t.firstMentionedAt).getTime() > sevenDaysAgo,
      ),
      lastInteractionAt: today,
    },
  };
}

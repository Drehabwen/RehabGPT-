import type { ChildContext } from '../model/types';
import { classifyIntent } from '../memory/intentRouter';
import { buildDynamicSystemPrompt, buildUserMessage } from './injectionEngine';
import { createContextSnapshot, type ContextAssembly, type ContextSnapshot } from './contextSnapshot';

function buildStructuredTaskBlock(snapshot: ContextSnapshot): string {
  const lines: string[] = [];

  if (snapshot.tasks.pendingScales.length > 0) {
    const scales = snapshot.tasks.pendingScales
      .map((task) => `${task.scaleId}（任务 ${task.taskId}）`)
      .join('、');
    lines.push(`待完成量表：${scales}`);
  }

  if (snapshot.tasks.unreadPlan) {
    lines.push('康复师训练处方待家长查看，请优先提醒查看并按处方执行。');
  }

  if (snapshot.tasks.dueReview) {
    lines.push('当前需要关注复评安排。');
  }

  if (lines.length === 0) return '';
  return `【当前结构化任务】\n${lines.join('\n')}`;
}

function appendStructuredContext(systemPrompt: string, snapshot: ContextSnapshot): string {
  const blocks = [systemPrompt];
  const taskBlock = buildStructuredTaskBlock(snapshot);
  if (taskBlock) blocks.push(taskBlock);

  if (snapshot.safety.redFlags.length > 0) {
    blocks.push(`【安全提醒】\n${snapshot.safety.redFlags.join('；')}。回复末尾提醒家长联系康复师。`);
  }

  return blocks.join('\n\n');
}

export function assembleFreeChatContext(text: string, ctx: ChildContext): ContextAssembly {
  const intent = classifyIntent(text);
  const snapshot = createContextSnapshot(ctx);
  const systemPrompt = appendStructuredContext(
    buildDynamicSystemPrompt(intent.primary, ctx),
    snapshot,
  );

  return {
    intent: intent.primary,
    snapshot,
    systemPrompt,
    userMessage: buildUserMessage(text, intent.primary),
  };
}

export function buildDailyAdviceSystemPrompt(snapshot: ContextSnapshot): string {
  const identityParts = [snapshot.identity.displayName];
  if (snapshot.identity.age) identityParts.push(`${snapshot.identity.age}岁`);
  if (snapshot.identity.genderLabel) identityParts.push(snapshot.identity.genderLabel);

  const parts: string[] = [
    '你是小柱，一位温暖专业的儿童脊柱健康陪伴教练。你的语气亲切、鼓励、像家人。',
    `孩子信息：${identityParts.join('，')}`,
  ];

  const assessment = snapshot.clinical.assessment;
  if (assessment) {
    parts.push(`最近筛查：${assessment.riskLabel}`);
    if (assessment.concerns.length > 0) {
      parts.push(`关注点：${assessment.concerns.join('、')}`);
    }
    if (assessment.recommendations.length > 0) {
      parts.push(`康复师建议：${assessment.recommendations.slice(0, 3).join('；')}`);
    }
  } else {
    parts.push('最近筛查：尚未完成康复师评估。不要自行判断风险等级。');
  }

  const plan = snapshot.clinical.treatmentPlan;
  if (plan) {
    parts.push(`当前训练处方：${plan.title}`);
    if (plan.keyActions.length > 0) {
      parts.push(`今日可提醒的处方动作：${plan.keyActions.slice(0, 3).map((a) => a.name).join('、')}`);
    }
  }

  if (snapshot.tracking.completedDays > 0 || snapshot.tracking.alerts.length > 0) {
    const lines = [
      `训练完成率 ${snapshot.tracking.weeklyCompletion}%`,
      `连续打卡 ${snapshot.tracking.streakDays} 天`,
    ];
    if (snapshot.tracking.avgPainLevel > 0) {
      lines.push(`平均疼痛 ${snapshot.tracking.avgPainLevel}/10，趋势 ${snapshot.tracking.painTrend}`);
    }
    if (snapshot.tracking.alerts.length > 0) {
      lines.push(`预警：${snapshot.tracking.alerts.join('；')}`);
    }
    parts.push(`近期追踪数据：\n${lines.join('\n')}`);
  }

  const taskBlock = buildStructuredTaskBlock(snapshot);
  if (taskBlock) parts.push(taskBlock);

  parts.push(
    '请根据以上信息，生成今天的个性化建议。用以下格式回复（严格遵循）：',
    '【建议】',
    '用1-2句话给出温暖、具体的今日行动建议',
    '【小贴士】',
    '- 小贴士1（具体可执行）',
    '- 小贴士2（具体可执行）',
    '- 小贴士3（具体可执行）',
    '要求：建议要针对孩子的具体情况，不要泛泛而谈。每条小贴士不超过20字。不修改康复师处方。',
  );

  return parts.join('\n');
}

export function assembleDailyAdviceContext(ctx: ChildContext): ContextAssembly {
  const snapshot = createContextSnapshot(ctx);
  return {
    snapshot,
    systemPrompt: buildDailyAdviceSystemPrompt(snapshot),
  };
}

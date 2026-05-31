/**
 * injectionEngine — 动态上下文注入引擎
 *
 * 根据意图类型从 ChildContext 中选取对应字段，
 * 组装精简的 system prompt。
 *
 * Token 预算目标（总计 ≤ 600 token）：
 * - chat:        ~260 token
 * - training:    ~520 token
 * - assessment:  ~460 token
 * - medical:     ~570 token
 * - feedback:    ~410 token
 */

import type { IntentType, ChildContext, RehabStage } from '../model/types';
import { buildPersonaPrompt } from '../../chatbot/prompts/corePersona';
import { buildClinicalPrompt } from '../../chatbot/prompts/clinicalCore';

// ── 阶段指引（根据 RehabStage 调整语气和职责）──

function buildStageHint(stage: RehabStage, intent: IntentType): string {
  const hints: Record<RehabStage, string> = {
    unbound:
      '【当前阶段】该用户尚未绑定康复师。如果用户询问评估或训练相关内容，请引导其先联系康复师获取家庭码绑定。',
    waiting_assessment:
      '【当前阶段】该用户已绑定康复师，但康复师尚未完成首次评估。请勿自行给出任何诊断或训练建议。可以建议家长耐心等待，或联系康复师了解进度。',
    assessed:
      '【当前阶段】康复师已完成评估，训练处方待推送。可以解释评估结论，但不要自行制定训练计划。',
    in_training:
      '【当前阶段】孩子正在执行康复师制定的训练计划。你的角色是执行教练：鼓励坚持、解答动作疑问、记录反馈。不要擅自修改训练内容。若家长反馈训练困难或疼痛，记录并建议联系康复师。',
    awaiting_review:
      '【当前阶段】训练周期已结束，等待康复师复评。提醒家长联系康复师安排复评。根据执行数据给予正向反馈，肯定家长的坚持。',
    completed:
      '【当前阶段】康复计划已完成。祝贺家长和孩子的坚持。如有后续问题，建议联系康复师进行跟踪。',
  };
  return hints[stage] || hints.unbound;
}

// ── 身份块（~50 token）──

function buildIdentityBlock(ctx: ChildContext): string {
  const { identity } = ctx;
  if (!identity.patientId) return '';
  const ageStr = identity.age ? `${identity.age}岁` : '';
  return `服务对象：${identity.patientName}${ageStr ? '，' + ageStr : ''}${identity.gender || ''}。`;
}

// ── 处方块（~150 token）──

function buildTreatmentBlock(ctx: ChildContext): string {
  const t = ctx.treatment;
  if (!t) return '';

  const actions = t.keyActions
    .map((a) => `  - ${a.name}：${a.sets}${a.note ? `（${a.note}）` : ''}`)
    .join('\n');

  return `【康复师训练处方】
处方：${t.title}
康复师：${t.therapistName || '未知'}
训练内容：
${actions}
周期：${t.durationWeeks} 周${t.expiresAt ? `（至 ${t.expiresAt}）` : ''}

重要：以上内容由康复师制定，你只能在此基础上解答动作要领和执行建议，不得增减训练内容。`;
}

// ── 进度块（~100 token）──

function buildProgressBlock(ctx: ChildContext): string {
  const p = ctx.progress;
  const f = ctx.flags;

  const lines: string[] = ['【训练执行情况】'];

  if (p.totalPlanDays > 0) {
    lines.push(`完成率：${p.complianceRate}%（${p.completedDays}/${p.totalPlanDays}天）`);
  }
  if (p.streakDays > 0) {
    lines.push(`连续打卡：${p.streakDays} 天`);
  }
  if (p.lastCheckinDate) {
    lines.push(`最近打卡：${p.lastCheckinDate}`);
  }
  if (p.avgPainLevel > 0) {
    lines.push(`近7天平均疼痛：${p.avgPainLevel}/10，趋势：${p.painTrend === 'improving' ? '改善中' : p.painTrend === 'worsening' ? '加重中' : '稳定'}`);
  }

  // 动态标记
  if (f.streakAtRisk) {
    lines.push('⚠️ 今日尚未打卡，连续记录可能中断。请温和提醒。');
  }
  if (f.complianceWarning) {
    lines.push('⚠️ 训练完成率偏低（<50%）。请了解家长遇到的困难。');
  }
  if (f.painTrendUp) {
    lines.push('⚠️ 近期疼痛呈上升趋势。建议家长向康复师反馈。');
  }
  if (f.shouldNotifyTherapist) {
    lines.push('🚩 系统建议康复师关注此案例。请在回复末尾提醒家长联系康复师。');
  }

  return lines.join('\n');
}

// ── 评估块（~150 token）──

function buildAssessmentBlock(ctx: ChildContext): string {
  const a = ctx.assessment;
  if (!a) return '';

  const lines: string[] = ['【康复师评估结论】'];
  lines.push(`风险等级：${a.riskLabel}`);
  if (a.concerns.length > 0) {
    lines.push(`评估要点：${a.concerns.join('、')}`);
  }
  if (a.recommendations.length > 0) {
    lines.push(`康复师建议：${a.recommendations.slice(0, 3).join('；')}`);
  }
  if (a.summaryText) {
    const summary = a.summaryText.length > 200
      ? a.summaryText.slice(0, 200) + '...'
      : a.summaryText;
    lines.push(`摘要：${summary}`);
  }
  lines.push(`评估日期：${a.assessedAt?.split('T')[0] || '未知'}`);

  return lines.join('\n');
}

// ── 记忆块（~80 token）──

function buildMemoryBlock(ctx: ChildContext): string {
  const m = ctx.memory;
  const lines: string[] = ['【近期对话要点】'];

  if (m.keyTopics.length > 0) {
    const topics = m.keyTopics
      .slice(0, 3)
      .map((t) => t.topic)
      .join('、');
    lines.push(`家长关心：${topics}`);
  }
  if (m.parentConcerns.length > 0) {
    lines.push(`家长担忧：${m.parentConcerns.slice(0, 2).join('；')}`);
  }
  if (m.pendingQuestions.length > 0) {
    const pending = m.pendingQuestions
      .slice(0, 2)
      .map((q) => q.question)
      .join('；');
    lines.push(`待解答：${pending}`);
  }
  if (m.parentSentiment === 'anxious' || m.parentSentiment === 'concerned') {
    lines.push('家长当前情绪偏焦虑，请以安抚和共情为主。');
  }

  return lines.join('\n');
}

// ── 无评估时的提示（~40 token）──

const NO_ASSESSMENT_HINT =
  '该孩子尚未完成康复师评估。请不要自行做出任何医学判断。如家长询问评估结果，请告知等待康复师完成评估。';

// ── 安全红线（~80 token）──

const SAFETY_GUARDRAILS = `【安全红线】
- 不做医学诊断，只说"筛查风险"或"康复师评估结论"
- 孩子背痛→建议联系康复师，禁止推荐拉伸/按摩
- 没有数据时如实说明，不编造信息`;

// ── 输出格式约束（~30 token）──

const FORMAT_CONSTRAINTS =
  '格式要求：温暖口语，短段落，**加粗**重点。使用"孩子"或"宝贝"称呼。';

// ── 主组装函数 ──

interface PromptBlock {
  name: string;
  content: string;
  priority: number; // 1=必须, 2=重要, 3=可选
}

/**
 * 按意图从 ChildContext 中动态选取字段，组装 system prompt。
 *
 * @param intent 意图类型
 * @param ctx 当前 ChildContext
 * @returns 组装好的 system prompt 字符串（≤ 600 token）
 */
export function buildDynamicSystemPrompt(
  intent: IntentType,
  ctx: ChildContext,
): string {
  const blocks: PromptBlock[] = [];

  // ── 永远注入：人设（~150 token，priority 1）──
  blocks.push({
    name: 'persona',
    content: buildPersonaPrompt(),
    priority: 1,
  });

  // ── 永远注入：身份（~50 token，priority 1）──
  const identity = buildIdentityBlock(ctx);
  if (identity) {
    blocks.push({ name: 'identity', content: identity, priority: 1 });
  }

  // ── 阶段指引（~60 token，priority 1）──
  blocks.push({
    name: 'stage_hint',
    content: buildStageHint(ctx.stage, intent),
    priority: 1,
  });

  // ── 按意图注入特定块 ──
  switch (intent) {
    case 'training': {
      // 处方内容
      if (ctx.treatment) {
        blocks.push({
          name: 'treatment_plan',
          content: buildTreatmentBlock(ctx),
          priority: 2,
        });
      } else {
        blocks.push({
          name: 'no_treatment',
          content: '该孩子暂无训练处方，请引导家长耐心等待康复师制定计划。',
          priority: 2,
        });
      }
      // 执行进度
      if (ctx.progress.totalPlanDays > 0 || ctx.progress.streakDays > 0) {
        blocks.push({
          name: 'progress',
          content: buildProgressBlock(ctx),
          priority: 2,
        });
      }
      break;
    }

    case 'assessment': {
      if (ctx.assessment) {
        blocks.push({
          name: 'assessment_data',
          content: buildAssessmentBlock(ctx),
          priority: 2,
        });
      } else {
        blocks.push({
          name: 'no_assessment',
          content: NO_ASSESSMENT_HINT,
          priority: 2,
        });
      }
      break;
    }

    case 'medical': {
      // 临床知识（按需加载）
      blocks.push({
        name: 'clinical_knowledge',
        content: buildClinicalPrompt('medical'),
        priority: 2,
      });
      // 安全红线
      blocks.push({
        name: 'safety_guardrails',
        content: SAFETY_GUARDRAILS,
        priority: 1,
      });
      // 评估数据（如有，提供上下文）
      if (ctx.assessment) {
        const a = ctx.assessment;
        blocks.push({
          name: 'assessment_context',
          content: `该孩子康复师评估：${a.riskLabel}。${a.summaryText ? a.summaryText.slice(0, 150) : ''}`,
          priority: 3,
        });
      }
      break;
    }

    case 'feedback': {
      // 对话记忆
      if (ctx.memory.keyTopics.length > 0 || ctx.memory.pendingQuestions.length > 0) {
        blocks.push({
          name: 'conversation_memory',
          content: buildMemoryBlock(ctx),
          priority: 2,
        });
      }
      // 进度数据（评估反馈合理性）
      if (ctx.progress.totalPlanDays > 0) {
        blocks.push({
          name: 'progress',
          content: buildProgressBlock(ctx),
          priority: 3,
        });
      }
      break;
    }

    case 'chat': {
      // 闲聊：仅注入轻量记忆（为自然过渡铺垫）
      if (ctx.memory.keyTopics.length > 0) {
        const topics = ctx.memory.keyTopics
          .slice(0, 3)
          .map((t) => t.topic)
          .join('、');
        blocks.push({
          name: 'light_memory',
          content: `家长最近关心的话题：${topics}。`,
          priority: 3,
        });
      }
      break;
    }
  }

  // ── 永远注入：格式约束（~30 token，priority 2）──
  blocks.push({
    name: 'format',
    content: FORMAT_CONSTRAINTS,
    priority: 2,
  });

  // ── 按优先级 + token 预算截断 ──
  return assembleWithBudget(blocks, 600);
}

// ── Token 预算控制 ──

/**
 * 简单 token 估算（中文：~1.5 字符/token，英文：~4 字符/token）
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  // 中文字符 ~1 token，英文 ~0.25 token/char
  let tokens = 0;
  for (const char of text) {
    if (/[一-鿿㐀-䶿]/.test(char)) {
      tokens += 1.2; // 中文字符
    } else if (/\s/.test(char)) {
      tokens += 0.25; // 空格
    } else {
      tokens += 0.3; // 英文/标点
    }
  }
  return Math.ceil(tokens);
}

function assembleWithBudget(blocks: PromptBlock[], budgetTokens: number): string {
  // 按优先级排序
  const sorted = [...blocks].sort((a, b) => a.priority - b.priority);
  const selected: PromptBlock[] = [];
  let usedTokens = 0;

  for (const block of sorted) {
    const t = estimateTokens(block.content);
    if (usedTokens + t <= budgetTokens) {
      selected.push(block);
      usedTokens += t;
    } else {
      // 尝试截断内容
      if (block.priority <= 2) {
        const remaining = budgetTokens - usedTokens;
        if (remaining > 30) {
          // 粗略截断：按字符比例
          const ratio = remaining / Math.max(t, 1);
          const truncatedLen = Math.floor(block.content.length * ratio);
          const truncated = block.content.slice(0, truncatedLen) + '...';
          selected.push({ ...block, content: truncated });
          usedTokens += estimateTokens(truncated);
        }
      }
      break;
    }
  }

  // for debugging
  // console.log(`[injectionEngine] Intent: blocks=${selected.map(b => b.name).join(',')}, tokens=~${usedTokens}`);

  return selected.map((b) => b.content).join('\n\n');
}

// ── 构建用户消息包装 ──

/**
 * 构建用户消息（简洁包装，减少 token 浪费）。
 */
export function buildUserMessage(text: string, intent: IntentType): string {
  const parts: string[] = [];
  parts.push(`家长："${text}"`);

  // 意图提示（帮助 LLM 理解上下文）
  if (intent !== 'chat') {
    const intentHints: Record<string, string> = {
      training: '(询问训练相关)',
      assessment: '(询问评估相关)',
      medical: '(健康咨询)',
      feedback: '(反馈情况)',
    };
    if (intentHints[intent]) {
      parts.push(intentHints[intent]);
    }
  }

  return parts.join('');
}

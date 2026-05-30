/**
 * 自适应系统提示词构建器 — Token 感知 + 阶段按需加载
 *
 * 核心改进：
 * 1. 从 ~8000 tokens 精简到 ~600-1200 tokens
 * 2. 按对话阶段只加载必要的知识模块
 * 3. 患者信息用紧凑格式
 * 4. 移除 phaseWorkflows（流程由代码控制，不塞进 prompt）
 */

import type { RiskResult, AdamsAutoResult, Answers } from '../types';
import { buildPersonaPrompt } from './corePersona';
import { buildClinicalPrompt } from './clinicalCore';

export type ConversationPhase =
  | 'greeting'
  | 'screening'
  | 'adams_test'
  | 'result_review'
  | 'report_chat'
  | 'rehab_guidance'
  | 'followup'
  | 'free_chat';

export interface LLMContext {
  patientName: string;
  patientAge: number | null;
  patientGender?: string;
  phase: ConversationPhase;
  stepIndex: number;
  totalSteps: number;
  currentQuestionKey?: string;
  answers?: Answers;
  riskResult?: RiskResult | null;
  adamsResult?: AdamsAutoResult | null;
  hasHistory: boolean;
  hasDueReminder: boolean;
  lastAssessmentSummary?: string | null;
  availableTools: string[];
  currentDate: string;
  pendingScale?: {
    taskId: string;
    sessionId: string;
    scaleId: 'SRS-22' | 'ODI' | 'VAS';
  } | null;
}

/**
 * 构建极简患者上下文 (~80-150 tokens)
 */
function buildPatientContext(ctx: LLMContext): string {
  const parts: string[] = [];

  // 核心信息一行搞定
  const ageInfo = ctx.patientAge ? `${ctx.patientAge}岁${ctx.patientAge >= 10 && ctx.patientAge <= 16 ? '(高危)' : ''}` : '';
  const genderInfo = ctx.patientGender ? `${ctx.patientGender}${ctx.patientGender === '女' ? '(风险↑)' : ''}` : '';
  parts.push(`患者：${ctx.patientName}${ageInfo ? '，' + ageInfo : ''}${genderInfo ? '，' + genderInfo : ''}`);

  // 关键答案（只保留影响决策的）
  const answers = ctx.answers || {};
  const keyFacts: string[] = [];

  if (answers.family_scoliosis === '有') keyFacts.push('家族史+');
  if (answers.growth_spurt === '长得挺快') keyFacts.push('生长快+');
  if (answers.back_pain && answers.back_pain !== '从不疼') {
    keyFacts.push(`背痛${answers.pain_level ? ':' + answers.pain_level + '/10' : ''}`);
  }

  if (keyFacts.length > 0) {
    parts.push(`关键：${keyFacts.join('，')}`);
  }

  // 风险结果（如有）
  if (ctx.riskResult) {
    parts.push(`风险：${ctx.riskResult.levelLabel}(${ctx.riskResult.total}/160)`);
  }

  // 待填量表（如有）
  if (ctx.pendingScale) {
    parts.push(`待填：${ctx.pendingScale.scaleId}`);
  }

  // 历史摘要（截断到100字）
  if (ctx.lastAssessmentSummary) {
    const summary = ctx.lastAssessmentSummary.slice(0, 100);
    parts.push(`历史：${summary}${ctx.lastAssessmentSummary.length > 100 ? '...' : ''}`);
  }

  return parts.join('\n');
}

/**
 * 构建阶段指引 (~30-50 tokens)
 */
function buildPhaseHint(ctx: LLMContext): string {
  const hints: Record<string, string> = {
    greeting: '初次问候，简短温暖',
    screening: `筛查中(${ctx.stepIndex}/${ctx.totalSteps})，引导回答`,
    adams_test: '指导Adams弯腰测试',
    result_review: '解读结果，安抚+明确建议',
    report_chat: '分析历史数据',
    rehab_guidance: '推荐居家训练',
    followup: '设置复查提醒',
    free_chat: '自由答疑',
  };

  return `阶段：${hints[ctx.phase] || '自由对话'}`;
}

/**
 * 构建工具说明 (~20-50 tokens)
 */
function buildToolsHint(tools: string[]): string {
  if (tools.length === 0) return '';
  const toolMap: Record<string, string> = {
    vision3: '3D姿态',
    comparison: '历史对比',
    rom: '关节活动度',
    scales: '量表',
    adams_camera: 'Adams摄像头',
    psych: '心理评定',
  };
  return `工具：${tools.map((t) => toolMap[t] || t).join('/')}`;
}

/**
 * 构建格式要求 (~30 tokens)
 */
function buildFormatHint(ctx: LLMContext): string {
  const base = '格式：温暖口语，短段落，**加粗**重点';

  const extras: Record<string, string> = {
    result_review: '，先共情再解释',
    screening: '，清晰呈现选项',
  };

  return base + (extras[ctx.phase] || '');
}

/**
 * 主构建函数：自适应系统提示词
 *
 * 预估 token 消耗：
 * - greeting/free_chat: ~500 tokens
 * - screening/adams_test: ~700 tokens
 * - result_review: ~600 tokens
 * - rehab_guidance: ~800 tokens
 */
export function buildAdaptiveSystemPrompt(ctx: LLMContext): string {
  const sections: string[] = [];

  // 1. 人设 (~150 tokens)
  sections.push(buildPersonaPrompt());

  // 2. 患者上下文 (~80-150 tokens)
  sections.push(buildPatientContext(ctx));

  // 3. 阶段指引 (~30-50 tokens)
  sections.push(buildPhaseHint(ctx));

  // 4. 临床知识（按阶段按需加载，~100-300 tokens）
  sections.push(buildClinicalPrompt(ctx.phase));

  // 5. 工具说明 (~20-50 tokens)
  const toolsHint = buildToolsHint(ctx.availableTools);
  if (toolsHint) sections.push(toolsHint);

  // 6. 格式要求 (~30 tokens)
  sections.push(buildFormatHint(ctx));

  return sections.join('\n\n');
}

/**
 * 构建用户消息包装
 */
export function buildUserMessage(text: string, ctx: LLMContext): string {
  const parts: string[] = [];

  // 简洁包装，减少 token
  parts.push(`家长："${text}"`);

  if (ctx.phase === 'screening' && ctx.currentQuestionKey) {
    parts.push(`(收集：${ctx.currentQuestionKey})`);
  }

  if (ctx.pendingScale) {
    parts.push(`(量表：${ctx.pendingScale.scaleId})`);
  }

  return parts.join('');
}

export { buildAdaptiveSystemPrompt as buildSystemPrompt };

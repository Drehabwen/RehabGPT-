import type { RiskResult, AdamsAutoResult, Answers } from '../types';
import { PEDIATRIC_PERSONA } from './persona';

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

export function buildSystemPrompt(ctx: LLMContext): string {
  const sections: string[] = [];

  sections.push(buildPersonaSection());

  sections.push(buildPatientPortraitSection(ctx));

  sections.push(buildDynamicPhaseSection(ctx));

  sections.push(buildClinicalKnowledgeSection(ctx));

  if (ctx.availableTools.length > 0) {
    sections.push(buildToolsSection(ctx.availableTools));
  }

  sections.push(buildConstraintsSection(ctx));

  sections.push(buildOutputFormatSection(ctx));

  return sections.join('\n\n');
}

function buildPersonaSection(): string {
  const p = PEDIATRIC_PERSONA;
  return `【角色设定】
你是"${p.name}"，一位温柔、专业的儿童脊柱康复AI助手。用温暖、阳光、通俗易懂的语言与家长沟通，做有温度的"小脊梁守护者"。

【沟通规范】
- 主调：${p.tone.base}
- 禁用称呼：${p.terminologyGuide.forbidden.map(f => `"${f}"`).join(', ')}
- 推荐称呼孩子：${p.terminologyGuide.recommended.patient.map(r => `"${r}"`).join(', ')}
- 比喻：脊柱比作"${p.analogies.spine}"，侧弯解释为"${p.analogies.scoliosis}"`;
}

function buildPatientPortraitSection(ctx: LLMContext): string {
  const parts: string[] = ['【患者信息】'];

  parts.push(`- 姓名：${ctx.patientName}`);
  if (ctx.patientAge) {
    parts.push(`- 年龄：${ctx.patientAge}岁${ctx.patientAge >= 10 && ctx.patientAge <= 16 ? '（⚠️ 高危年龄段）' : ''}`);
  }
  if (ctx.patientGender) {
    parts.push(`- 性别：${ctx.patientGender}${ctx.patientGender === '女' ? '（⚠️ 女孩风险更高）' : ''}`);
  }

  const answers = ctx.answers || {};
  if (answers.growth_spurt || answers.growthSpurt) {
    parts.push(`- 生长：${answers.growth_spurt || answers.growthSpurt}${String(answers.growth_spurt || answers.growthSpurt).includes('快') ? '（🚨 快速生长期）' : ''}`);
  }
  if (answers.family_scoliosis || answers.familyScoliosis) {
    parts.push(`- 家族史：${answers.family_scoliosis || answers.familyScoliosis}`);
  }
  if (answers.back_pain || answers.backPain) {
    parts.push(`- 背痛：${answers.back_pain || answers.backPain}`);
    if (answers.pain_level || answers.painLevel) {
      parts.push(`- 疼痛评分：${answers.pain_level || answers.painLevel}/10`);
    }
  }

  if (ctx.hasHistory) {
    parts.push('- 有历史记录');
    if (ctx.lastAssessmentSummary) {
      parts.push(`- 历史摘要：${ctx.lastAssessmentSummary}`);
    }
  }
  if (ctx.hasDueReminder) {
    parts.push('- ⏰ 需复查');
  }

  if (ctx.pendingScale) {
    parts.push(`- 🚨 待填量表：${ctx.pendingScale.scaleId}（任务ID: ${ctx.pendingScale.taskId}）`);
  }

  if (ctx.riskResult) {
    parts.push('');
    parts.push('【风险评估】');
    parts.push(`- 风险等级：${ctx.riskResult.levelLabel}（${ctx.riskResult.total}/160分）`);
    parts.push(`- 紧急度：${ctx.riskResult.urgency}`);
  }

  return parts.join('\n');
}

function buildClinicalKnowledgeSection(ctx: LLMContext): string {
  return `【临床知识库】
1. 体态红线：高低肩、蝴蝶骨突出、腰线不对称
2. Adams测试：弯腰90°观察背部隆起（剃刀背）
3. Cobb角分级：<20°轻度（居家康复）、20-40°中度（支具）、>40°重度（手术评估）
4. ⚠️ AIS无痛原则：青少年侧弯通常无痛！如有疼痛/夜间痛醒，必须建议MRI检查！`;
}

function buildDynamicPhaseSection(ctx: LLMContext): string {
  const phaseMap: Record<string, string> = {
    greeting: '初次问候，建立信任',
    screening: '引导完成筛查问卷',
    adams_test: '指导Adams弯腰测试',
    result_review: '解读筛查结果，安抚情绪',
    report_chat: '讨论历史报告',
    rehab_guidance: '提供康复训练指导',
    followup: '随访提醒与预约',
    free_chat: '自由对话，解答疑问',
  };

  return `【当前阶段】${ctx.phase.toUpperCase()}: ${phaseMap[ctx.phase] || '自由对话'}
${ctx.phase === 'screening' && ctx.totalSteps > 0 ? `进度：${Math.round((ctx.stepIndex / ctx.totalSteps) * 100)}%` : ''}`;
}

function buildToolsSection(tools: string[]): string {
  const toolDescriptions: Record<string, string> = {
    vision3: '3D姿态采集',
    comparison: '历史对比',
    rom: '关节活动度检测',
    scales: '临床量表',
    adams_camera: 'Adams摄像头测试',
    psych: '心理评定',
  };

  const parts = ['【可用工具】'];
  for (const tool of tools) {
    parts.push(`- ${tool}：${toolDescriptions[tool] || tool}`);
  }
  parts.push('工具调用格式：[TOOL: tool_id] 推荐理由');

  return parts.join('\n');
}

function buildConstraintsSection(ctx: LLMContext): string {
  return `【行为约束】
1. 不做医学诊断：只用"筛查风险"等前置词汇，强调最终诊断需医生确认
2. 背痛警示：有疼痛症状立刻建议MRI，禁止推荐拉伸/按摩
3. 防负罪感：多用"早发现早干预"等正向语言支撑家长
4. 诚实原则：没有数据时如实说明，建议使用相关工具检测
5. 优先量表：有待填量表时优先引导完成`;
}

function buildOutputFormatSection(ctx: LLMContext): string {
  let extra = '';
  if (ctx.pendingScale) {
    extra = '\n5. 引导家长点击卡片完成量表填写';
  } else if (ctx.phase === 'screening' || ctx.phase === 'adams_test') {
    extra = '\n5. 清晰呈现选项，耐心引导';
  } else if (ctx.phase === 'result_review') {
    extra = '\n5. 先共情平复心情，再解释结果，最后给明确指导';
  }

  return `【格式要求】
1. 语言温暖亲切，避免机器人腔
2. 重点内容用**加粗**突出
3. 分段简短清晰（3-4行内）
4. 结尾用温和追问引导继续交流${extra}`;
}

export function buildUserMessage(
  text: string,
  ctx: LLMContext,
): string {
  const parts: string[] = [];
  parts.push(`【家长提问】:"${text}"`);

  if (ctx.phase === 'screening' && ctx.currentQuestionKey) {
    parts.push(`（当前收集：${ctx.currentQuestionKey}）`);
  }

  if (ctx.pendingScale) {
    parts.push(`（待填量表：${ctx.pendingScale.scaleId}）`);
  }

  return parts.join('');
}

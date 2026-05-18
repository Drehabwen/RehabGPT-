/**
 * AI Agent 多分支对话流程定义（家长端）
 *
 * 面向人群：家长（为孩子做脊柱健康筛查和居家管理）
 *
 * 分支结构：
 *   main      → 欢迎 + 主菜单（4 个分支入口）
 *   reassess  → 给孩子做检查（约 12 步）
 *   report    → 查看检查结果（动态）
 *   rehab     → 居家训练建议（规则引擎）
 *   followup  → 复查提醒（localStorage）
 */
import type { FlowStep, ChoiceOption } from '../types';
import { QUESTIONS, OPTIONS } from './questions';

// ── 分支 ID ──
export type BranchId = 'main' | 'reassess' | 'report' | 'rehab' | 'followup';

// ── 主菜单选项（家长友好文案） ──
export const MAIN_MENU_OPTIONS: ChoiceOption[] = [
  { label: '🩺 给孩子做检查', value: 'reassess' },
  { label: '📊 查看检查结果', value: 'report' },
  { label: '🏋️ 居家训练建议', value: 'rehab' },
  { label: '📅 复查提醒', value: 'followup' },
];

// ── 数据解读子选项 ──
export const REPORT_SUB_OPTIONS: ChoiceOption[] = [
  { label: '体态评估结果', value: 'posture' },
  { label: '关节活动度', value: 'rom' },
  { label: '量表评估结果', value: 'scales' },
  { label: '筛查记录', value: 'screening' },
  { label: '综合解读', value: 'overview' },
];

// ── 确认选项 ──
export const CONFIRM_OPTIONS: ChoiceOption[] = [
  { label: '好的', value: 'yes' },
  { label: '不用了', value: 'no' },
];

// ── 主菜单步骤 ──
export const MAIN_MENU_STEP: FlowStep = {
  id: 'main_menu',
  type: 'user_choice',
  botMessages: ['您想了解或做些什么？'],
  questionKey: 'main_choice',
  options: MAIN_MENU_OPTIONS,
};

// ── 返回主菜单步骤 ──
export const BACK_TO_MENU_STEP: FlowStep = {
  id: 'back_to_menu',
  type: 'user_choice',
  botMessages: ['还有什么我能帮您的吗？'],
  questionKey: 'main_choice',
  options: MAIN_MENU_OPTIONS,
};

// ===================================================================
// Branch: main — 欢迎 + 上下文加载
// ===================================================================
export const MAIN_FLOW: FlowStep[] = [
  {
    id: 'welcome',
    type: 'bot_message',
    botMessages: [
      // 由 Agent 动态填充 — 包含孩子姓名、上次评估摘要、到期提醒
      '__WELCOME_PLACEHOLDER__',
    ],
    options: [{ label: '开始', value: 'start' }],
  },
  MAIN_MENU_STEP,
];

// ===================================================================
// Branch: reassess — 给孩子做检查（约 12 步）
// ===================================================================
export const REASSESS_FLOW: FlowStep[] = [
  // Step R1: 上下文确认
  {
    id: 'reassess_context',
    type: 'bot_message',
    botMessages: [
      '好的，我们来给孩子做一次脊柱健康检查 📋',
      '有些信息之前已经记录过了，不会重复问您。',
      '准备好了吗？',
    ],
    options: [{ label: '开始检查', value: 'start' }],
  },

  // Step R2: 生长速度
  {
    id: 'growth_spurt',
    type: 'user_choice',
    botMessages: QUESTIONS.growth_spurt,
    questionKey: 'growth_spurt',
    options: OPTIONS.growth_spurt,
  },

  // Step R3: 家族史
  {
    id: 'family_scoliosis',
    type: 'user_choice',
    botMessages: QUESTIONS.family_scoliosis,
    questionKey: 'family_scoliosis',
    options: OPTIONS.family_scoliosis,
  },

  // Step R4: 背痛频率（家长视角）
  {
    id: 'back_pain',
    type: 'user_choice',
    botMessages: [
      '最近几个月，孩子有没有说过背部疼或者酸？',
      '（有些孩子不太会主动说，可以回忆一下孩子有没有频繁揉背、不愿意背书包等情况）',
    ],
    questionKey: 'back_pain',
    options: OPTIONS.back_pain,
  },

  // Step R5: 疼痛程度（条件：有疼痛）
  {
    id: 'pain_level',
    type: 'user_slider',
    botMessages: QUESTIONS.pain_level,
    questionKey: 'pain_level',
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
    sliderLabels: [
      { value: 0, label: '不疼' },
      { value: 5, label: '中等' },
      { value: 10, label: '很疼' },
    ],
    skipCondition: (answers) => answers.back_pain === '从不疼',
  },

  // Step R6: 肩膀对称
  {
    id: 'posture_shoulders',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_shoulders,
    questionKey: 'posture_shoulders',
    options: OPTIONS.posture,
  },

  // Step R7: 肩胛对称
  {
    id: 'posture_scapula',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_scapula,
    questionKey: 'posture_scapula',
    options: OPTIONS.posture_scapula,
  },

  // Step R8: 腰部对称
  {
    id: 'posture_waist',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_waist,
    questionKey: 'posture_waist',
    options: OPTIONS.posture_waist,
  },

  // Step R9: Adam's 测试介绍
  {
    id: 'adams_intro',
    type: 'bot_message',
    botMessages: QUESTIONS.adams_intro,
    options: OPTIONS.adams_ready,
  },

  // Step R10: Adam's 测试方式
  {
    id: 'adams_method',
    type: 'user_choice',
    botMessages: QUESTIONS.adams_method,
    questionKey: 'adams_method',
    options: OPTIONS.adams_method,
  },

  // Step R11: 摄像头（条件：选择摄像头）
  {
    id: 'adams_camera',
    type: 'camera',
    botMessages: QUESTIONS.adams_camera,
    skipCondition: (answers) => answers.adams_method !== '用摄像头拍',
  },

  // Step R12: 结果展示
  {
    id: 'results',
    type: 'result',
    botMessages: [
      '检查完成了！',
      '下面是孩子的评估结果：',
    ],
    options: OPTIONS.result_ack,
  },
];

// ===================================================================
// Branch: report — 查看检查结果（动态）
// ===================================================================
export const REPORT_FLOW: FlowStep[] = [
  {
    id: 'report_intro',
    type: 'bot_message',
    botMessages: [
      '让我帮您看看孩子的评估数据 📊',
      '__REPORT_SUMMARY_PLACEHOLDER__',
    ],
    options: [{ label: '好的', value: 'ok' }],
  },
  {
    id: 'report_select',
    type: 'user_choice',
    botMessages: ['您想了解哪方面的结果？'],
    questionKey: 'report_type',
    options: REPORT_SUB_OPTIONS,
  },
  {
    id: 'report_interpretation',
    type: 'bot_message',
    botMessages: [
      '__INTERPRETATION_PLACEHOLDER__',
    ],
    options: [
      { label: '还有别的问题', value: 'more' },
      { label: '返回主菜单', value: 'main' },
    ],
  },
];

// ===================================================================
// Branch: rehab — 居家训练建议（规则引擎）
// ===================================================================
export const REHAB_FLOW: FlowStep[] = [
  {
    id: 'rehab_intro',
    type: 'bot_message',
    botMessages: [
      '根据评估结果，我来给孩子一些居家训练建议 🏋️',
      '__REHAB_PLAN_PLACEHOLDER__',
    ],
    options: [
      { label: '了解更多', value: 'more_detail' },
      { label: '返回主菜单', value: 'main' },
    ],
  },
  {
    id: 'rehab_detail',
    type: 'bot_message',
    botMessages: [
      '居家训练最重要的是**坚持**和**动作做对**。',
      '建议每天陪孩子练 15-20 分钟，按顺序完成上面的训练。',
      '如果某个动作孩子喊疼，请马上停下来。',
      '训练贵在坚持，您陪着一起做效果更好哦 💪',
    ],
    options: [
      { label: '返回主菜单', value: 'main' },
    ],
  },
];

// ===================================================================
// Branch: followup — 复查提醒（localStorage）
// ===================================================================
export const FOLLOWUP_FLOW: FlowStep[] = [
  {
    id: 'followup_intro',
    type: 'bot_message',
    botMessages: [
      '__FOLLOWUP_SUGGESTION_PLACEHOLDER__',
    ],
    options: [
      { label: '设置提醒', value: 'set_reminder' },
      { label: '暂不需要', value: 'skip' },
    ],
  },
  {
    id: 'followup_confirm',
    type: 'bot_message',
    botMessages: [
      '已设置复查提醒 ✅',
      '到时候我会提醒您带孩子来复查。',
      '定期复查对孩子的脊柱健康很重要！',
    ],
    options: [
      { label: '返回主菜单', value: 'main' },
    ],
  },
  {
    id: 'followup_skip',
    type: 'bot_message',
    botMessages: [
      '好的，之后随时可以设置提醒。',
      '建议至少每 6 个月带孩子复查一次哦。',
    ],
    options: [
      { label: '返回主菜单', value: 'main' },
    ],
  },
];

// ===================================================================
// 分支映射
// ===================================================================
export const BRANCH_FLOWS: Record<BranchId, FlowStep[]> = {
  main: MAIN_FLOW,
  reassess: REASSESS_FLOW,
  report: REPORT_FLOW,
  rehab: REHAB_FLOW,
  followup: FOLLOWUP_FLOW,
};

/** 获取分支的第一步 */
export function getBranchFirstStep(branch: BranchId): FlowStep {
  return BRANCH_FLOWS[branch][0];
}

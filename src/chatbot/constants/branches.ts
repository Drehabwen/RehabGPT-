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
export type BranchId = 'main' | 'report' | 'rehab' | 'followup';

// ── 主菜单选项（家长友好文案） ──
export const MAIN_MENU_OPTIONS: ChoiceOption[] = [
  { label: '📊 查看评估结果', value: 'report' },
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
  report: REPORT_FLOW,
  rehab: REHAB_FLOW,
  followup: FOLLOWUP_FLOW,
};

/** 获取分支的第一步 */
export function getBranchFirstStep(branch: BranchId): FlowStep {
  return BRANCH_FLOWS[branch][0];
}

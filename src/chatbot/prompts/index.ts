/**
 * 统一系统提示词管理（精简版）
 *
 * 改进：
 * - 使用 Token 感知的自适应提示词构建
 * - 按对话阶段按需加载知识模块
 * - 系统提示词从 ~8000 tokens 精简到 ~600-1200 tokens
 */

// ── Agent 角色定义（统一语气） ──
export const AGENT_PERSONA = {
  name: '小柱',
  role: '儿童脊柱健康小助手',
  targetAudience: '家长（为孩子做脊柱健康筛查和居家管理）',
  tone: '温暖、专业、易懂、不制造焦虑',
  languageStyle: {
    useEmoji: true,
    useMarkdown: true,
    avoidMedicalJargon: true,
    parentFriendly: true,
  },
  constraints: [
    '不做医学诊断，只提供筛查参考',
    '风险提示要温和，不吓唬家长',
    '所有建议需强调"建议咨询专业医生"',
    '使用"孩子"而非"患者"',
  ],
} as const;

// ── 动态消息构建器 ──
export interface MessageContext {
  patientName: string;
  patientAge?: number | null;
  hasHistory?: boolean;
  hasDueReminder?: boolean;
  lastAssessmentSummary?: string | null;
  riskLevel?: string | null;
}

export function buildWelcomeMessage(ctx: MessageContext): string[] {
  const { patientName, hasHistory, hasDueReminder } = ctx;
  const childName = patientName.replace(/^患者\s*/, '');

  const messages: string[] = [
    `你好！我是 ${AGENT_PERSONA.name} 🧒，${AGENT_PERSONA.role}`,
    `我来帮您关注 ${childName} 的脊柱健康。`,
  ];

  if (hasHistory) {
    messages[1] += ` 之前有过检查记录，可以帮您对比变化趋势。`;
  }
  if (hasDueReminder) {
    messages.push(`⏰ 提醒：该带孩子来复查了哦！`);
  }

  return messages;
}

// ── 导出新的精简提示词系统 ──
export * from './riskMessages';
export * from './adaptiveSystemPrompt';
export * from './corePersona';
export * from './clinicalCore';

// ── 兼容导出（旧接口映射到新实现） ──
export { buildAdaptiveSystemPrompt as buildSystemPrompt } from './adaptiveSystemPrompt';
export { buildUserMessage } from './adaptiveSystemPrompt';
export type { LLMContext, ConversationPhase } from './adaptiveSystemPrompt';

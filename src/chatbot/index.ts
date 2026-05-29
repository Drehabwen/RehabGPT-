export { ChatbotAgent } from './ChatbotAgent';
export { ChatbotAgent as default } from './ChatbotAgent';
export { useChatbotStore } from './store/useChatbotStore';
export { useAgentStore } from './store/useAgentStore';

// ── 统一提示词管理 ──
export {
  AGENT_PERSONA,
  buildWelcomeMessage,
  buildReassessIntro,
  buildReportIntro,
  buildRehabIntro,
  buildFollowupIntro,
  buildCompletionMessage,
  buildAdamsResultMessage,
  QUESTION_TEMPLATES,
  OPTION_TEMPLATES,
  // 动态系统提示词（新）
  buildSystemPrompt,
  buildUserMessage,
} from './prompts';
export type { MessageContext, LLMContext, ConversationPhase } from './prompts';

// ── 统一 UI 组件库 ──
export {
  THEME,
  COMMON_STYLES,
  GlassCard,
  Button,
  LoadingSpinner,
  StatusBadge,
  GLOBAL_ANIMATIONS,
  mergeStyles,
  getRiskColor,
} from './ui';
export type { GlassCardProps, ButtonProps, StatusBadgeProps } from './ui';

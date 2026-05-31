/**
 * Agent Store Types & Constants
 *
 * 纯类型定义和常量，无运行时逻辑，所有 slice 和外部文件共享。
 */
import type { ChatMessage, Answers, RiskResult } from '../types';
import type { BranchId } from '../constants/branches';
import type { BRANCH_FLOWS } from '../constants/branches';

// ── 工具 ID（与 AssessmentTool 对齐） ──
export type AgentToolId = 'vision3' | 'comparison' | 'rom' | 'scales' | 'psych';

// ── Agent 视图状态 ──
export type AgentView = 'chat' | 'tool' | 'result';

// ── 延迟配置（模拟自然对话节奏） ──
export const BOT_TYPING_DELAYS = {
  normal: 600,
  short: 300,
  long: 900,
};

// ── 工具名称映射 ──
export const TOOL_NAMES: Record<AgentToolId, string> = {
  vision3: '体态评估',
  comparison: '对比变化',
  rom: '关节活动度',
  scales: '功能评估',
  psych: '心理筛查',
};

// ── Store 完整状态接口 ──
export interface AgentState {
  // Conversation
  branch: BranchId;
  stepIndex: number;
  messages: ChatMessage[];
  answers: Answers;
  isBotTyping: boolean;
  view: AgentView;

  // Patient context
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  hasHistory: boolean;
  lastAssessmentSummary: string | null;

  // Tool orchestration
  activeTool: AgentToolId | null;
  suggestedTools: AgentToolId[];
  toolResults: Record<string, unknown>;

  // Results
  riskResult: RiskResult | null;

  // Follow-up
  hasDueReminder: boolean;

  // LLM integration
  llmAvailable: boolean;
  llmProcessing: boolean;

  // Actions — Lifecycle
  initWithPatient: (id: string, name: string, age?: number | null) => void;
  resetAgent: () => void;

  // Actions — Conversation
  selectBranch: (branch: BranchId) => Promise<void>;
  advanceStep: (answer?: string | number) => Promise<void>;
  setAnswer: (key: string, value: string | number | boolean) => void;
  addMessage: (role: 'bot' | 'user', text: string, imageUrl?: string) => void;
  setBotTyping: (v: boolean) => void;

  // Actions — LLM conversation
  checkLLMStatus: () => Promise<boolean>;
  resetLLMStatus: () => void;
  sendFreeTextStream: (text: string) => Promise<void>;
  executeToolFromLLM: (toolId: string, reason?: string) => void;

  // Actions — Branch helpers
  goToMainMenu: () => Promise<void>;

  // Actions — Tool orchestration
  invokeTool: (tool: AgentToolId) => void;
  dismissTool: () => void;
  suggestTools: (tools: AgentToolId[]) => void;

  // Actions — Results
  calculateAndShowResult: () => void;

  // Actions — Report interpretation
  interpretReport: (dataType: string, data?: Record<string, unknown>) => Promise<string>;

  // Actions — Rehab guidance
  getRehabPlan: (findings?: Record<string, unknown>) => string;

  // Actions — Follow-up
  setFollowupReminder: (riskLevel: string) => void;
  checkDueReminders: () => void;

  // Getters
  getCurrentStep: () => (typeof BRANCH_FLOWS)[BranchId][number] | undefined;
  getTotalSteps: () => number;
}

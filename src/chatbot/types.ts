// ── Chatbot 回答选项 ──
export interface ChoiceOption {
  label: string;
  value: string;
}

// ── 聊天消息 ──
export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: number;
  imageUrl?: string;
  /** LLM tool_call 数据，用于渲染内嵌确认卡片 */
  toolCall?: { toolId: string; reason: string };
}

// ── 流程步骤类型 ──
export type FlowStepType =
  | 'bot_message'
  | 'user_text'
  | 'user_choice'
  | 'user_number'
  | 'user_slider'
  | 'camera'
  | 'result'
  | 'auto';

// ── 流程步骤定义 ──
export interface FlowStep {
  id: string;
  type: FlowStepType;
  botMessages: string[];
  questionKey?: string;
  options?: ChoiceOption[];
  inputPlaceholder?: string;
  numberMin?: number;
  numberMax?: number;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  sliderLabels?: { value: number; label: string }[];
  imageUrl?: string;
  skipCondition?: (answers: Record<string, string | number | boolean>) => boolean;
}

// ── 用户答案 ──
export type Answers = Record<string, string | number | boolean>;

// ── 风险等级 ──
export type RiskLevel = 'low' | 'mild' | 'moderate' | 'high';

// ── 风险因子分解 ──
export interface RiskFactorBreakdown {
  familyHistory: number;
  backPain: number;
  painSeverity: number;
  postureAsymmetry: number;
  growthRisk: number;
  adams: number;
}

// ── 风险评分结果 ──
export interface RiskResult {
  total: number;
  level: RiskLevel;
  levelLabel: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  urgency: 'routine' | 'semi-urgent' | 'urgent';
  recommendation: string;
  factors: RiskFactorBreakdown;
}

// ── 摄像头视图状态 ──
export type ChatbotView = 'chat' | 'adams_camera' | 'result';

// ── Adam's 自动分析结果 ──
export interface AdamsAutoResult {
  shoulderAsymmetry: number;
  hipAsymmetry: number;
  asymmetryRatio: number;
  ribHumpDetected: boolean;
  confidence: 'high' | 'medium' | 'low';
  recommendation: 'symmetrical' | 'mild_asymmetry' | 'significant_hump';
}

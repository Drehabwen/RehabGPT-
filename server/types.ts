/**
 * server/types.ts — 后端共享类型定义
 *
 * 与前端 src/api/scaleApi.ts、src/pages/hooks/* 的类型保持对齐
 */

// ── 家庭码绑定 ──

export interface FamilyLink {
  family_code: string;
  patient_id: string;
  display_name: string;
  sex: 'male' | 'female' | '';
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: string;
}

export interface FamilyLoginResponse {
  patient_id: string;
  display_name: string;
  sex: string;
  age: number | null;
  height_cm: number | null;
  session_id: string;
}

// ── 评估摘要 ──

export interface AssessmentSummary {
  summary_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  risk_level: string;   // none | low | medium | high
  risk_label: string;
  summary_text: string;
  concerns: string[];
  recommendations: string[];
  created_at: string;
}

// ── 训练处方 ──

export interface TreatmentPlan {
  plan_id: string;
  patient_id: string;
  patient_name: string | null;
  therapist_name: string | null;
  plan_content: string;   // Markdown 格式
  status: string;          // pending | acknowledged | in_progress | completed
  created_at: string;
  updated_at: string | null;
}

// ── 日常追踪 ──

export interface TrackingSubmitPayload {
  patient_id: string;
  patient_name: string | null;
  tracking_date: string;          // ISO date YYYY-MM-DD
  exercises_completed: Array<{
    name: string;
    duration: number;
    completed: boolean;
  }>;
  total_duration_min: number;
  symptoms: {
    pain_level: number;           // 0-10
    pain_location: string;
    abnormal_symptoms: string[];
    mood: number;                 // 1-5
  };
  notes: string;
}

export interface DailyTrackingRecord extends TrackingSubmitPayload {
  id: string;
  submitted_at: string;           // ISO timestamp
}

// ── 量表系统 ──

export interface ScaleTask {
  task_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  scale_id: string;               // SRS-22 | ODI | VAS | HOME_WEEKLY_FEEDBACK_V1
  status: 'pending' | 'completed';
  scale_data: ScaleData | null;
  created_at: string;
  submitted_at: string | null;
}

export interface PendingScale {
  task_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  scale_id: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface ScaleAnswer {
  questionId: string | number;
  questionText: string;
  category?: string;
  score?: number;
  answerText: string;
}

export interface StandardScaleData {
  scaleId: string;
  scaleName: string;
  filledBy: string;
  totalScore?: number;
  maxScore?: number;
  percentageScore?: number;
  dimensions?: Record<string, number>;
  answers: ScaleAnswer[];
  aiInterpretation?: string;
  createdAt?: number;
}

export interface CustomScaleData {
  scaleId: string;
  scaleName: string;
  filledBy: string;
  answers: {
    questionId: string;
    questionText: string;
    answerText: string;
  }[];
  createdAt?: number;
}

export type ScaleData = StandardScaleData | CustomScaleData;

export interface ScaleSubmitPayload {
  task_id: string;
  session_id: string;
  patient_id?: string;
  scale_data: ScaleData;
}

export interface ScaleResult {
  task_id: string;
  patient_id: string;
  session_id: string;
  scale_id: string;
  status: 'pending' | 'completed';
  scale_data: ScaleData | null;
  created_at: string;
  submitted_at: string | null;
}

export interface ScalePushPayload {
  patient_id: string;
  scale_id: string;
  session_id?: string;
}

// ── LLM 对话 ──

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  patientContext?: {
    name: string;
    age: number | null;
    hasHistory: boolean;
    hasDueReminder: boolean;
    riskLevel: string | null;
    lastAssessmentSummary: string | null;
  };
  availableTools?: string[];
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  toolCall?: {
    toolId: string;
    reason: string;
  };
}

// ── 患者历史 ──

export interface PatientHistoryItem {
  id: string;
  patient_name: string;
  summary: string;
  date: string;
}

// ── API 统一响应 ──

export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
}

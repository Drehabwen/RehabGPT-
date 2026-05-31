/**
 * src/services/types.ts — 统一 API 类型定义
 *
 * 与 server/types.ts 对齐，作为前端所有 API 调用的共享类型源。
 * 所有 use* hooks、store slices、组件中重复定义的类型在此统一维护。
 */

// ── 家庭码绑定 ──

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
  risk_level: string;       // none | low | medium | high
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
  plan_content: string;     // Markdown 格式
  status: string;            // pending | acknowledged | in_progress | completed
  created_at: string;
  updated_at: string | null;
}

// ── 日常追踪 ──

export interface TrackingSubmitPayload {
  patient_id: string;
  patient_name: string | null;
  tracking_date: string;
  exercises_completed: Array<{
    name: string;
    duration: number;
    completed: boolean;
  }>;
  total_duration_min: number;
  symptoms: {
    pain_level: number;
    pain_location: string;
    abnormal_symptoms: string[];
    mood: number;
  };
  notes: string;
}

// ── 量表系统 ──

export interface PendingScale {
  task_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  scale_id: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface ScaleSubmitPayload<T = unknown> {
  task_id: string;
  session_id: string;
  patient_id?: string;
  scale_data: T;
}

export interface ScaleSubmitResponse {
  status: string;
}

// ── API 统一响应 ──

export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
}

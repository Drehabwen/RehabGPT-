/**
 * 脊柱侧弯早筛 — 类型定义
 *
 * 筛查记录代表从学校/社区/医院等外部来源汇入的早筛数据，
 * 在康复师复核评估前以独立队列存在。
 */

// ── 筛查状态 ──
export type ScreeningStatus = 'pending' | 'reviewing' | 'triaged' | 'archived';

// ── 筛查方式 ──
export type ScreeningMethod =
  | 'adams'
  | 'scoliometer'
  | 'posture-photo'
  | 'xray'
  | '3d-scan'
  | 'manual';

// ── 分流紧急度 ──
export type ReferralUrgency = 'routine' | 'semi-urgent' | 'urgent';

// ── Adam 前屈测试 ──
export interface ScreeningAdamTest {
  result: 'negative' | 'positive_suspect' | 'positive_significant';
  trunkRotation?: 'none' | 'mild' | 'moderate' | 'severe';
}

// ── 躯干旋转角 (ATR) ──
export interface ScreeningATR {
  thoracicDegrees?: number;
  lumbarDegrees?: number;
}

// ── 筛查问卷 ──
export interface ScreeningQuestionnaire {
  familyScoliosis?: boolean;
  backPain?: boolean;
  painLevel?: number;
  growthSpurt?: string;
  postureShoulders?: string;
  postureScapula?: string;
  postureWaist?: string;
  adamsMethod?: string;
  adamsSelfResult?: string;
  riskScore?: number;
  riskLevel?: string;
}

// ── 筛查照片 ──
export interface ScreeningPhotos {
  frontView?: string;
  sideView?: string;
  backView?: string;
  forwardBendView?: string;
}

// ── X 光测量 ──
export interface ScreeningXRay {
  cobbAngleThoracic?: number;
  cobbAngleLumbar?: number;
  risserGrade?: number;
}

// ── 筛查数据载荷 ──
export interface ScreeningData {
  method?: ScreeningMethod;
  dateTime?: string;
  adamTest?: ScreeningAdamTest;
  atr?: ScreeningATR;
  photos?: ScreeningPhotos;
  questionnaire?: ScreeningQuestionnaire;
  xray?: ScreeningXRay;
}

// ── 筛查记录 ──
export interface ScreeningRecord {
  id: string;
  source: string;
  sourceSystem?: string;
  organizationId?: string;
  screenerName?: string;
  createdAt: number;

  // 受检者
  subjectName: string;
  subjectGender?: 'M' | 'F';
  subjectBirthDate?: string;
  subjectExternalId?: string;
  subjectGrade?: string;
  subjectClass?: string;

  // 筛查数据
  screeningData: ScreeningData;

  // 状态与分流
  status: ScreeningStatus;
  referralRecommended: boolean;
  referralUrgency?: ReferralUrgency;
  notes?: string;

  // 关联（复核评估后回写）
  linkedPatientId?: string;
  linkedSessionId?: string;
}

// ── 批量导入结果 ──
export interface ScreeningBatchError {
  row: number;
  reason: string;
}

export interface ScreeningBatchResponse {
  successCount: number;
  errorCount: number;
  total: number;
  records: ScreeningRecord[];
  errors: ScreeningBatchError[];
}

// ── 筛查列表响应 ──
export interface ScreeningListResponse {
  records: ScreeningRecord[];
  total: number;
  statusCounts: Record<string, number>;
}

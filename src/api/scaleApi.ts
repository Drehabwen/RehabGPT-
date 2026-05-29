const API_BASE = '/api/integration';

// ── 类型定义 ──

/** 量表任务（待填写） */
export interface PendingScale {
  task_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  scale_id: string;
  status: 'pending' | 'completed';
  created_at: string;
}

/** 量表答案项 */
export interface ScaleAnswer {
  questionId: string | number;
  questionText: string;
  category?: string;
  score?: number;
  answerText: string;
}

/** 标准化量表数据（如 SRS-22） */
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

/** 自定义反馈表数据（如居家周反馈） */
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

/** 提交量表请求 */
export interface ScaleSubmitPayload {
  task_id: string;
  session_id: string;
  scale_data: ScaleData;
}

/** 量表结果（已提交） */
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

// ── API 函数 ──

/**
 * 获取患者的待填量表列表
 * GET /api/integration/scale/pending/{patient_id}
 */
export async function getPendingScales(patientId: string): Promise<PendingScale[]> {
  const res = await fetch(`${API_BASE}/scale/pending/${encodeURIComponent(patientId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * 提交量表
 * POST /api/integration/scale/submit
 */
export async function submitScale(payload: ScaleSubmitPayload): Promise<{ status: string; task_id: string }> {
  const res = await fetch(`${API_BASE}/scale/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * 获取量表结果（用于查看已提交的量表）
 * GET /api/integration/scale/results/{session_id}
 */
export async function getScaleResults(sessionId: string): Promise<ScaleResult[]> {
  const res = await fetch(`${API_BASE}/scale/results/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── 量表定义 ──

/** 支持的量表定义 */
export interface ScaleDefinition {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'custom';
  estimatedMinutes: number;
  questions: ScaleQuestion[];
}

export interface ScaleQuestion {
  id: string;
  text: string;
  category?: string;
  type: 'rating' | 'choice' | 'text' | 'multiline';
  options?: { value: number | string; label: string }[];
  min?: number;
  max?: number;
  required?: boolean;
}

/** SRS-22 量表定义 */
export const SRS22_SCALE: ScaleDefinition = {
  id: 'SRS-22',
  name: 'SRS-22 脊柱侧弯生活质量问卷',
  description: '评估脊柱侧弯对患者生活质量的影响，包含功能活动、疼痛、自我形象、心理健康、满意度五个维度',
  type: 'standard',
  estimatedMinutes: 5,
  questions: [
    // 功能活动 (Function/Activity)
    { id: 'f1', text: '您在进行日常活动（如走路、上下楼梯）时是否感到受限？', category: 'functionActive', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常受限'},{value:2,label:'比较受限'},{value:3,label:'一般'},{value:4,label:'轻度受限'},{value:5,label:'不受限'}], required: true },
    { id: 'f2', text: '您在弯腰或提重物时是否感到困难？', category: 'functionActive', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常困难'},{value:2,label:'比较困难'},{value:3,label:'一般'},{value:4,label:'轻度困难'},{value:5,label:'不困难'}], required: true },
    { id: 'f3', text: '您在长时间站立或坐着时是否感到不适？', category: 'functionActive', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常不适'},{value:2,label:'比较不适'},{value:3,label:'一般'},{value:4,label:'轻度不适'},{value:5,label:'无不适'}], required: true },
    { id: 'f4', text: '您的身体状况是否影响了您的工作或学习？', category: 'functionActive', type: 'rating', min: 1, max: 5, options: [{value:1,label:'严重影响'},{value:2,label:'较大影响'},{value:3,label:'一般'},{value:4,label:'轻度影响'},{value:5,label:'无影响'}], required: true },
    // 疼痛 (Pain)
    { id: 'p1', text: '您在过去一周是否经历过背部疼痛？', category: 'pain', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常频繁'},{value:2,label:'经常'},{value:3,label:'有时'},{value:4,label:'很少'},{value:5,label:'无疼痛'}], required: true },
    { id: 'p2', text: '您的疼痛程度如何？', category: 'pain', type: 'rating', min: 1, max: 5, options: [{value:1,label:'剧烈疼痛'},{value:2,label:'中度疼痛'},{value:3,label:'轻度疼痛'},{value:4,label:'轻微疼痛'},{value:5,label:'无疼痛'}], required: true },
    // 自我形象 (Self-Image)
    { id: 's1', text: '您对自己身体外观的满意度如何？', category: 'selfImage', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常不满意'},{value:2,label:'不满意'},{value:3,label:'一般'},{value:4,label:'满意'},{value:5,label:'非常满意'}], required: true },
    { id: 's2', text: '您是否因为脊柱侧弯而感到自卑或回避社交？', category: 'selfImage', type: 'rating', min: 1, max: 5, options: [{value:1,label:'总是'},{value:2,label:'经常'},{value:3,label:'有时'},{value:4,label:'很少'},{value:5,label:'从不'}], required: true },
    // 心理健康 (Mental Health)
    { id: 'm1', text: '您是否感到焦虑或担心自己的病情？', category: 'mentalHealth', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常焦虑'},{value:2,label:'比较焦虑'},{value:3,label:'一般'},{value:4,label:'轻度焦虑'},{value:5,label:'不焦虑'}], required: true },
    { id: 'm2', text: '您对未来的康复是否充满信心？', category: 'mentalHealth', type: 'rating', min: 1, max: 5, options: [{value:1,label:'完全没有'},{value:2,label:'不太有'},{value:3,label:'一般'},{value:4,label:'比较有'},{value:5,label:'非常有'}], required: true },
    // 满意度 (Satisfaction)
    { id: 'sat1', text: '您对目前接受的康复治疗效果是否满意？', category: 'satisfaction', type: 'rating', min: 1, max: 5, options: [{value:1,label:'非常不满意'},{value:2,label:'不满意'},{value:3,label:'一般'},{value:4,label:'满意'},{value:5,label:'非常满意'}], required: true },
    { id: 'sat2', text: '您是否愿意向其他患者推荐当前的治疗方案？', category: 'satisfaction', type: 'rating', min: 1, max: 5, options: [{value:1,label:'完全不愿意'},{value:2,label:'不太愿意'},{value:3,label:'一般'},{value:4,label:'比较愿意'},{value:5,label:'非常愿意'}], required: true },
  ],
};

/** 居家康复周反馈表定义 */
export const HOME_WEEKLY_FEEDBACK_SCALE: ScaleDefinition = {
  id: 'HOME_WEEKLY_FEEDBACK_V1',
  name: '居家康复训练周反馈表',
  description: '记录本周康复训练执行情况，帮助康复师调整方案',
  type: 'custom',
  estimatedMinutes: 3,
  questions: [
    { id: 'training_freq', text: '本周训练频次', category: 'training', type: 'multiline', required: true },
    { id: 'pain_status', text: '是否有异常疼痛或不适？', category: 'pain', type: 'text', required: true },
    { id: 'difficulties', text: '训练过程中遇到什么困难？', category: 'difficulty', type: 'multiline', required: false },
    { id: 'improvements', text: '本周有哪些改善或进步？', category: 'improvement', type: 'multiline', required: false },
    { id: 'questions', text: '您有什么问题想咨询康复师？', category: 'question', type: 'multiline', required: false },
  ],
};

/** 量表定义映射 */
export const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  'SRS-22': SRS22_SCALE,
  'HOME_WEEKLY_FEEDBACK_V1': HOME_WEEKLY_FEEDBACK_SCALE,
};

/**
 * 根据 scale_id 获取量表定义
 */
export function getScaleDefinition(scaleId: string): ScaleDefinition | undefined {
  return SCALE_DEFINITIONS[scaleId];
}

/**
 * 计算 SRS-22 量表得分
 */
export function calculateSRS22Score(answers: Record<string, number>): {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  dimensions: Record<string, number>;
} {
  const dimensionMap: Record<string, string[]> = {
    functionActive: ['f1', 'f2', 'f3', 'f4'],
    pain: ['p1', 'p2'],
    selfImage: ['s1', 's2'],
    mentalHealth: ['m1', 'm2'],
    satisfaction: ['sat1', 'sat2'],
  };

  const dimensions: Record<string, number> = {};
  let totalScore = 0;
  let totalQuestions = 0;

  for (const [dim, qids] of Object.entries(dimensionMap)) {
    let dimScore = 0;
    let dimCount = 0;
    for (const qid of qids) {
      if (answers[qid] !== undefined) {
        dimScore += answers[qid];
        dimCount++;
      }
    }
    dimensions[dim] = dimCount > 0 ? parseFloat((dimScore / dimCount).toFixed(2)) : 0;
    totalScore += dimScore;
    totalQuestions += dimCount;
  }

  const maxScore = totalQuestions * 5;
  const percentageScore = maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(2)) : 0;

  return { totalScore, maxScore, percentageScore, dimensions };
}

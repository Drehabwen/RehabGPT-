/**
 * 上下文工程类型定义 — 小柱结构化上下文模型
 *
 * 替代原有 lastAssessmentSummary（自由文本）为程序可读的结构化字段。
 * 核心设计：
 * 1. 6 层字段：身份 / 评估 / 处方 / 进度 / 记忆 / 标记
 * 2. 每个字段标注来源、更新时机、过期策略
 * 3. RehabStage 状态机派生自字段组合
 */

// ── 意图分类 ──

export type IntentType =
  | 'chat'        // 问候、闲聊、感谢、告别
  | 'training'    // 询问训练内容、打卡确认、动作要领
  | 'assessment'  // 询问评估结果、风险等级、康复师意见
  | 'medical'     // 健康咨询、症状描述、红旗警告
  | 'feedback';   // 家长主动反馈（孩子说疼、训练有困难等）

export interface IntentResult {
  primary: IntentType;
  secondary: IntentType[];
  confidence: number;           // 0-1
  matchedKeywords: string[];    // 命中的关键词（调试用）
  needsLLMClassification: boolean;
}

// ── 康复状态机 ──

/**
 * stage 是派生字段，不由任何单一 API 设置。
 *
 * unbound → waiting_assessment → assessed → in_training → awaiting_review → completed
 */
export type RehabStage =
  | 'unbound'              // 未绑定康复师
  | 'waiting_assessment'   // 已绑定，等待康复师首次评估
  | 'assessed'             // 已评估，等待训练处方
  | 'in_training'          // 处方执行中
  | 'awaiting_review'      // 处方周期结束，等待复评
  | 'completed';           // 康复计划结束

// ── 要点提取器输出 ──

export interface ExtractionResult {
  newTopics: string[];
  answeredPending: string[];
  newPending: string[];
  parentSentiment: 'neutral' | 'concerned' | 'positive' | 'anxious';
  painMentioned: boolean;
  painDetails: {
    location: string;
    level: number | null;
    isNew: boolean;
  } | null;
  exerciseMentioned: boolean;
  exerciseDetails: {
    completed: boolean;
    difficulty: 'easy' | 'normal' | 'hard' | null;
    skippedReason: string | null;
  } | null;
  shouldFlagTherapist: boolean;
  flagReason: string | null;
}

// ── ChildContext 结构化模型 ──

export interface ChildContext {
  /** 第一层：身份快照 — 来源：LoginPage 绑定，仅在登录/切换孩子时更新 */
  identity: {
    patientId: string;
    patientName: string;
    age: number;
    gender: '男' | '女' | '';
  };

  /** 第二层：康复师评估 — 来源：GET /api/integration/assessment/summary */
  assessment: {
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    riskLabel: string;
    summaryText: string;
    concerns: string[];
    recommendations: string[];
    assessedAt: string;
    reassessDueAt: string | null;
  } | null;

  /** 第三层：训练处方 — 来源：GET /api/integration/plan/pending */
  treatment: {
    planId: string;
    therapistName: string;
    title: string;
    summaryText: string;
    keyActions: Array<{
      name: string;
      sets: string;
      note: string;
    }>;
    durationWeeks: number;
    createdAt: string;
    expiresAt: string | null;
  } | null;

  /** 第四层：执行进度 — 来源：打卡数据，每次打卡后实时计算 */
  progress: {
    totalPlanDays: number;
    completedDays: number;
    complianceRate: number;       // 0-100
    streakDays: number;
    maxStreakDays: number;
    lastCheckinDate: string | null;
    avgPainLevel: number;
    painTrend: 'stable' | 'improving' | 'worsening';
    recentMood: string[];
  };

  /** 第五层：对话记忆 — 来源：要点提取器回写，异步更新 */
  memory: {
    keyTopics: Array<{
      topic: string;
      firstMentionedAt: string;
      mentionCount: number;
    }>;
    parentConcerns: string[];
    pendingQuestions: Array<{
      question: string;
      askedAt: string;
    }>;
    parentSentiment: 'neutral' | 'concerned' | 'positive' | 'anxious';
    lastInteractionAt: string;
    totalInteractions: number;
  };

  /** 第六层：动态标记 — 来源：纯规则计算（不调 LLM），每次上下文组装前更新 */
  flags: {
    needsReassessment: boolean;
    hasUnreadPlan: boolean;
    streakAtRisk: boolean;
    painTrendUp: boolean;
    complianceWarning: boolean;
    shouldNotifyTherapist: boolean;
  };

  /** 第七层：派生状态 — 由 deriveStage() 根据以上字段计算 */
  stage: RehabStage;
}

// ── 默认值 ──

export const DEFAULT_CHILD_CONTEXT: ChildContext = {
  identity: { patientId: '', patientName: '', age: 0, gender: '' },
  assessment: null,
  treatment: null,
  progress: {
    totalPlanDays: 0,
    completedDays: 0,
    complianceRate: 0,
    streakDays: 0,
    maxStreakDays: 0,
    lastCheckinDate: null,
    avgPainLevel: 0,
    painTrend: 'stable',
    recentMood: [],
  },
  memory: {
    keyTopics: [],
    parentConcerns: [],
    pendingQuestions: [],
    parentSentiment: 'neutral',
    lastInteractionAt: '',
    totalInteractions: 0,
  },
  flags: {
    needsReassessment: false,
    hasUnreadPlan: false,
    streakAtRisk: false,
    painTrendUp: false,
    complianceWarning: false,
    shouldNotifyTherapist: false,
  },
  stage: 'unbound',
};

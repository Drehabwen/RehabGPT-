/**
 * 患者日常追踪系统 - 数据类型定义
 * 
 * 用于筛查后的日常监测、康复追踪、向康复师汇报
 */

// ── 疼痛记录 ──
export interface PainRecord {
  id: string;
  date: string; // ISO date
  hasPain: boolean;
  level: number; // 0-10
  location: string[]; // 颈部/上背/下背/腰部/臀部/腿部
  description?: string;
  trigger?: string; // 久坐/运动/睡觉/不明
}

// ── 康复训练记录 ──
export interface ExerciseRecord {
  id: string;
  date: string;
  completed: boolean;
  exercises: string[]; // 猫式伸展/小燕飞/臀桥/蚌式开合/单杠/游泳
  duration: number; // 分钟
  difficulty?: number; // 1-5
  notes?: string;
}

// ── 支具佩戴记录 ──
export interface BraceRecord {
  id: string;
  date: string;
  worn: boolean;
  hours: number;
  comfort: number; // 1-5
  skinIssue?: string; // 无/轻微发红/破皮/疼痛
  adjustment?: string;
}

// ── 每日追踪 ──
export interface DailyTracking {
  id: string;
  patientId: string;
  date: string;
  pain: PainRecord;
  exercise: ExerciseRecord;
  brace: BraceRecord;
  abnormalSymptoms: string[]; // 麻木/刺痛/呼吸困难/无力/其他
  abnormalNotes?: string;
  mood: number; // 1-5
  sleep: number; // 1-5
  createdAt: number;
}

// ── 每周追踪 ──
export interface WeeklyTracking {
  id: string;
  patientId: string;
  weekStart: string;
  weekEnd: string;
  overallChange: 'much_better' | 'better' | 'same' | 'worse' | 'much_worse';
  exerciseAdherence: number; // 0-100%
  braceAdherence: number; // 0-100%
  activityLimitations: string[]; // 跑步/弯腰/久坐/提重物/睡眠/其他
  concerns: string;
  goals: string;
  createdAt: number;
}

// ── 追踪汇总（用于图表和报告）─
export interface TrackingSummary {
  patientId: string;
  patientName: string;
  period: {
    start: string;
    end: string;
  };
  painTrend: {
    dates: string[];
    levels: number[];
  };
  exerciseTrend: {
    dates: string[];
    completed: boolean[];
    durations: number[];
  };
  braceTrend: {
    dates: string[];
    hours: number[];
  };
  adherence: {
    exercise: number; // 百分比
    brace: number; // 百分比
  };
  abnormalCount: number;
  alerts: TrackingAlert[];
}

// ── 追踪预警 ──
export interface TrackingAlert {
  id: string;
  type: 'pain_increase' | 'exercise_missed' | 'brace_missed' | 'skin_issue' | 'abnormal_symptom' | 'mood_low';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: string;
  resolved: boolean;
}

// ── 康复师报告 ──
export interface TherapistReport {
  id: string;
  patientId: string;
  patientName: string;
  period: {
    start: string;
    end: string;
  };
  summary: string;
  painAnalysis: string;
  exerciseAnalysis: string;
  braceAnalysis: string;
  alerts: TrackingAlert[];
  recommendations: string[];
  nextCheckDate: string;
  generatedAt: number;
}

// ── 表单选项 ──
export const PAIN_LOCATIONS = [
  '颈部',
  '上背部',
  '下背部',
  '腰部',
  '臀部',
  '腿部',
  '其他',
] as const;

export const PAIN_TRIGGERS = [
  '久坐',
  '运动后',
  '睡觉醒来',
  '弯腰后',
  '不明原因',
  '其他',
] as const;

export const EXERCISE_TYPES = [
  '猫式伸展',
  '小燕飞',
  '臀桥',
  '蚌式开合',
  '单杠悬吊',
  '游泳',
  '核心训练',
  '其他',
] as const;

export const ABNORMAL_SYMPTOMS = [
  '手脚麻木',
  '刺痛感',
  '呼吸困难',
  '肢体无力',
  '行走困难',
  '大小便异常',
  '其他',
] as const;

export const ACTIVITY_LIMITATIONS = [
  '跑步',
  '弯腰',
  '久坐',
  '提重物',
  '睡眠',
  '上学/工作',
  '其他',
] as const;

export const SKIN_ISSUES = [
  '无',
  '轻微发红',
  '明显压痕',
  '破皮',
  '疼痛',
  '其他',
] as const;

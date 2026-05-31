/**
 * server/db.ts — JSON 文件数据库层
 *
 * 简单、零依赖的持久化方案，后续可替换为 SQLite / PostgreSQL。
 * 所有写操作自动保存到 server/data/*.json。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { nanoid } from 'nanoid';
import type {
  FamilyLink,
  AssessmentSummary,
  TreatmentPlan,
  DailyTrackingRecord,
  ScaleTask,
} from './types';

// ── 数据文件路径 ──

const DATA_DIR = path.resolve(import.meta.dirname, 'data');

function resolvePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

// ── 通用 JSON 读写 ──

function readJSON<T>(filename: string, fallback: T): T {
  const filePath = resolvePath(filename);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`[DB] Failed to read ${filename}:`, err);
  }
  return fallback;
}

function writeJSON<T>(filename: string, data: T): void {
  const filePath = resolvePath(filename);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[DB] Failed to write ${filename}:`, err);
  }
}

// ── 各表读写 ──

// ── family_links ──

function loadFamilyLinks(): FamilyLink[] {
  return readJSON<FamilyLink[]>('family_links.json', []);
}

function saveFamilyLinks(links: FamilyLink[]): void {
  writeJSON('family_links.json', links);
}

export const familyLinksDB = {
  getAll: loadFamilyLinks,

  /** 通过家庭码查找绑定记录 */
  findByCode: (code: string): FamilyLink | undefined => {
    return loadFamilyLinks().find(
      (l) => l.family_code.toUpperCase() === code.toUpperCase(),
    );
  },

  /** 通过 patient_id 查找绑定记录 */
  findByPatientId: (patientId: string): FamilyLink | undefined => {
    return loadFamilyLinks().find((l) => l.patient_id === patientId);
  },

  /** 创建或更新绑定记录 */
  upsert: (link: Omit<FamilyLink, 'created_at'> & { created_at?: string }): FamilyLink => {
    const links = loadFamilyLinks();
    const idx = links.findIndex((l) => l.family_code === link.family_code || l.patient_id === link.patient_id);
    const now = new Date().toISOString();

    const record: FamilyLink = {
      ...link,
      created_at: link.created_at || now,
    };

    if (idx >= 0) {
      links[idx] = { ...links[idx], ...record };
    } else {
      links.push(record);
    }

    saveFamilyLinks(links);
    return record;
  },

  /** 插入种子数据（不覆盖已有数据） */
  seed: (seedData: FamilyLink[]): void => {
    const existing = loadFamilyLinks();
    if (existing.length > 0) return; // 已有数据，跳过
    saveFamilyLinks(seedData);
    console.log(`[DB] Seeded ${seedData.length} family_links`);
  },
};

// ── assessment_summaries ──

function loadAssessments(): AssessmentSummary[] {
  return readJSON<AssessmentSummary[]>('assessment_summaries.json', []);
}

function saveAssessments(data: AssessmentSummary[]): void {
  writeJSON('assessment_summaries.json', data);
}

export const assessmentsDB = {
  getAll: loadAssessments,

  /** 获取患者的最新评估摘要 */
  getLatestByPatient: (patientId: string): AssessmentSummary | null => {
    const items = loadAssessments()
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items[0] || null;
  },

  /** 推送新的评估摘要 */
  push: (data: Omit<AssessmentSummary, 'summary_id' | 'created_at'>): AssessmentSummary => {
    const record: AssessmentSummary = {
      ...data,
      summary_id: nanoid(12),
      created_at: new Date().toISOString(),
    };
    const items = loadAssessments();
    items.push(record);
    saveAssessments(items);
    return record;
  },

  seed: (seedData: AssessmentSummary[]): void => {
    const existing = loadAssessments();
    if (existing.length > 0) return;
    saveAssessments(seedData);
    console.log(`[DB] Seeded ${seedData.length} assessment_summaries`);
  },
};

// ── treatment_plans ──

function loadPlans(): TreatmentPlan[] {
  return readJSON<TreatmentPlan[]>('treatment_plans.json', []);
}

function savePlans(data: TreatmentPlan[]): void {
  writeJSON('treatment_plans.json', data);
}

export const plansDB = {
  getAll: loadPlans,

  /** 获取患者的所有处方，按创建时间倒序 */
  getByPatient: (patientId: string): TreatmentPlan[] => {
    return loadPlans()
      .filter((p) => p.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /** 获取患者最新处方 */
  getLatestByPatient: (patientId: string): TreatmentPlan | null => {
    const plans = loadPlans()
      .filter((p) => p.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return plans[0] || null;
  },

  /** 推送新处方 */
  push: (data: Omit<TreatmentPlan, 'plan_id' | 'created_at' | 'updated_at'>): TreatmentPlan => {
    const record: TreatmentPlan = {
      ...data,
      plan_id: nanoid(12),
      status: data.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    const items = loadPlans();
    items.push(record);
    savePlans(items);
    return record;
  },

  /** 更新处方状态 */
  updateStatus: (planId: string, status: string): TreatmentPlan | null => {
    const items = loadPlans();
    const idx = items.findIndex((p) => p.plan_id === planId);
    if (idx < 0) return null;
    items[idx] = {
      ...items[idx],
      status,
      updated_at: new Date().toISOString(),
    };
    savePlans(items);
    return items[idx];
  },

  seed: (seedData: TreatmentPlan[]): void => {
    const existing = loadPlans();
    if (existing.length > 0) return;
    savePlans(seedData);
    console.log(`[DB] Seeded ${seedData.length} treatment_plans`);
  },
};

// ── daily_tracking ──

function loadTracking(): DailyTrackingRecord[] {
  return readJSON<DailyTrackingRecord[]>('daily_tracking.json', []);
}

function saveTracking(data: DailyTrackingRecord[]): void {
  writeJSON('daily_tracking.json', data);
}

export const trackingDB = {
  getAll: loadTracking,

  /** 获取患者的打卡记录 */
  getByPatient: (patientId: string): DailyTrackingRecord[] => {
    return loadTracking()
      .filter((t) => t.patient_id === patientId)
      .sort((a, b) => new Date(b.tracking_date).getTime() - new Date(a.tracking_date).getTime());
  },

  /** 获取患者某天的记录 */
  getByDate: (patientId: string, date: string): DailyTrackingRecord | undefined => {
    return loadTracking().find(
      (t) => t.patient_id === patientId && t.tracking_date === date,
    );
  },

  /** 获取某时间范围内的记录 */
  getByDateRange: (patientId: string, startDate: string, endDate: string): DailyTrackingRecord[] => {
    return loadTracking().filter(
      (t) => t.patient_id === patientId && t.tracking_date >= startDate && t.tracking_date <= endDate,
    );
  },

  /** 提交打卡记录 */
  submit: (data: Omit<DailyTrackingRecord, 'id' | 'submitted_at'>): DailyTrackingRecord => {
    const record: DailyTrackingRecord = {
      ...data,
      id: nanoid(12),
      submitted_at: new Date().toISOString(),
    };
    const items = loadTracking();

    // 同一天已有记录则更新
    const idx = items.findIndex(
      (t) => t.patient_id === data.patient_id && t.tracking_date === data.tracking_date,
    );
    if (idx >= 0) {
      items[idx] = record;
    } else {
      items.push(record);
    }

    saveTracking(items);
    return record;
  },

  seed: (seedData: DailyTrackingRecord[]): void => {
    const existing = loadTracking();
    if (existing.length > 0) return;
    saveTracking(seedData);
    console.log(`[DB] Seeded ${seedData.length} daily_tracking`);
  },
};

// ── scale_tasks ──

function loadScaleTasks(): ScaleTask[] {
  return readJSON<ScaleTask[]>('scale_tasks.json', []);
}

function saveScaleTasks(data: ScaleTask[]): void {
  writeJSON('scale_tasks.json', data);
}

export const scaleTasksDB = {
  getAll: loadScaleTasks,

  /** 获取患者的待处理量表 */
  getPendingByPatient: (patientId: string): ScaleTask[] => {
    return loadScaleTasks().filter(
      (t) => t.patient_id === patientId && t.status === 'pending',
    );
  },

  /** 获取会话的量表结果 */
  getBySession: (sessionId: string): ScaleTask[] => {
    return loadScaleTasks().filter((t) => t.session_id === sessionId);
  },

  /** 获取单个任务 */
  getByTaskId: (taskId: string): ScaleTask | undefined => {
    return loadScaleTasks().find((t) => t.task_id === taskId);
  },

  /** 推送量表任务 */
  push: (data: Omit<ScaleTask, 'task_id' | 'status' | 'scale_data' | 'created_at' | 'submitted_at'>): ScaleTask => {
    const record: ScaleTask = {
      ...data,
      task_id: nanoid(12),
      status: 'pending',
      scale_data: null,
      created_at: new Date().toISOString(),
      submitted_at: null,
    };
    const items = loadScaleTasks();
    items.push(record);
    saveScaleTasks(items);
    return record;
  },

  /** 提交量表结果 */
  submit: (taskId: string, scaleData: ScaleTask['scale_data']): ScaleTask | null => {
    const items = loadScaleTasks();
    const idx = items.findIndex((t) => t.task_id === taskId);
    if (idx < 0) return null;
    items[idx] = {
      ...items[idx],
      status: 'completed',
      scale_data: scaleData,
      submitted_at: new Date().toISOString(),
    };
    saveScaleTasks(items);
    return items[idx];
  },

  seed: (seedData: ScaleTask[]): void => {
    const existing = loadScaleTasks();
    if (existing.length > 0) return;
    saveScaleTasks(seedData);
    console.log(`[DB] Seeded ${seedData.length} scale_tasks`);
  },
};

// ── 统一初始化 ──

/** 初始化所有表（确保数据目录和文件存在） */
export function initDB(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of [
    'family_links.json',
    'assessment_summaries.json',
    'treatment_plans.json',
    'daily_tracking.json',
    'scale_tasks.json',
  ]) {
    const p = resolvePath(file);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, '[]', 'utf-8');
    }
  }
  console.log('[DB] Initialized at', DATA_DIR);
}

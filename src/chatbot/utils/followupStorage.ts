/**
 * 随访提醒 — localStorage 读写工具
 *
 * 设计师：提醒仅存在于浏览器本地，不涉及后端/推送通知。
 * Agent 启动时检查是否有过期提醒，显示在欢迎消息中。
 */

const STORAGE_KEY = 'scoliosis_followup_reminders';

export interface FollowupReminder {
  /** 患者 ID */
  patientId: string;
  /** 患者姓名 */
  patientName: string;
  /** 建议复查日期 (ISO 8601) */
  nextCheckDate: string;
  /** 上次评估风险等级 */
  riskLevel: string;
  /** 补充说明 */
  notes: string;
  /** 提醒创建时间 (ISO 8601) */
  createdAt: string;
}

export interface FollowupStore {
  [patientId: string]: FollowupReminder;
}

/** 读取所有随访提醒 */
export function getFollowupReminders(): FollowupStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FollowupStore;
  } catch {
    return {};
  }
}

/** 保存/更新单个患者的随访提醒 */
export function setFollowupReminder(reminder: FollowupReminder): void {
  const store = getFollowupReminders();
  store[reminder.patientId] = {
    ...reminder,
    createdAt: reminder.createdAt || new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('[FollowupStorage] localStorage write failed:', e);
  }
}

/** 删除单个患者的随访提醒 */
export function removeFollowupReminder(patientId: string): void {
  const store = getFollowupReminders();
  delete store[patientId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('[FollowupStorage] localStorage write failed:', e);
  }
}

/** 获取所有已过期的提醒（nextCheckDate <= 今天） */
export function getDueReminders(): FollowupReminder[] {
  const store = getFollowupReminders();
  const now = new Date();
  return Object.values(store).filter((r) => new Date(r.nextCheckDate) <= now);
}

/** 获取即将到期的提醒（nextCheckDate 在接下来 30 天内） */
export function getUpcomingReminders(): FollowupReminder[] {
  const store = getFollowupReminders();
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return Object.values(store).filter((r) => {
    const d = new Date(r.nextCheckDate);
    return d > now && d <= thirtyDaysLater;
  });
}

/** 根据风险等级计算建议复查间隔（月数） */
export function getFollowupInterval(riskLevel: string): number {
  switch (riskLevel) {
    case '高风险':
      return 1; // 1 个月
    case '中度风险':
      return 3; // 3 个月
    case '轻度关注':
      return 6; // 6 个月
    case '低风险':
      return 12; // 12 个月
    default:
      return 6;
  }
}

/** 生成建议复查日期 */
export function getNextCheckDate(riskLevel: string): string {
  const months = getFollowupInterval(riskLevel);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

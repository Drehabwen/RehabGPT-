/**
 * 患者日常追踪状态管理
 * 
 * 管理每日/每周追踪数据、趋势分析、预警生成
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  DailyTracking,
  WeeklyTracking,
  TrackingAlert,
  TrackingSummary,
  TherapistReport,
  PainRecord,
  ExerciseRecord,
  BraceRecord,
} from '../types';

// ── Store 状态 ──

interface TrackingState {
  // 当前患者
  patientId: string | null;
  patientName: string | null;

  // 追踪数据
  dailyRecords: DailyTracking[];
  weeklyRecords: WeeklyTracking[];
  alerts: TrackingAlert[];

  // UI 状态
  isSubmitting: boolean;
  lastSubmitted: string | null; // ISO date

  // Actions
  setPatient: (id: string, name: string) => void;
  submitDaily: (data: Omit<DailyTracking, 'id' | 'patientId' | 'createdAt'>) => void;
  submitWeekly: (data: Omit<WeeklyTracking, 'id' | 'patientId' | 'createdAt'>) => void;
  resolveAlert: (alertId: string) => void;
  getTodayRecord: () => DailyTracking | undefined;
  getThisWeekRecord: () => WeeklyTracking | undefined;
  getSummary: (days?: number) => TrackingSummary;
  getAlerts: (unresolvedOnly?: boolean) => TrackingAlert[];
  clearData: () => void;
}

// ── 辅助函数 ──

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart(date: string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

function generateAlerts(record: DailyTracking): TrackingAlert[] {
  const alerts: TrackingAlert[] = [];

  // 疼痛预警
  if (record.pain.hasPain && record.pain.level >= 7) {
    alerts.push({
      id: nanoid(8),
      type: 'pain_increase',
      severity: 'high',
      message: `今日疼痛程度较高（${record.pain.level}/10），建议联系康复师`,
      date: record.date,
      resolved: false,
    });
  }

  // 训练缺失预警
  if (!record.exercise.completed) {
    alerts.push({
      id: nanoid(8),
      type: 'exercise_missed',
      severity: 'medium',
      message: '今日未完成康复训练',
      date: record.date,
      resolved: false,
    });
  }

  // 支具佩戴预警
  if (record.brace.worn && record.brace.hours < 12) {
    alerts.push({
      id: nanoid(8),
      type: 'brace_missed',
      severity: 'medium',
      message: `今日支具佩戴时间不足（${record.brace.hours}小时，建议16小时）`,
      date: record.date,
      resolved: false,
    });
  }

  // 皮肤问题预警
  if (record.brace.skinIssue && record.brace.skinIssue !== '无') {
    alerts.push({
      id: nanoid(8),
      type: 'skin_issue',
      severity: record.brace.skinIssue === '破皮' ? 'high' : 'medium',
      message: `支具相关皮肤问题：${record.brace.skinIssue}`,
      date: record.date,
      resolved: false,
    });
  }

  // 异常症状预警
  if (record.abnormalSymptoms.length > 0) {
    alerts.push({
      id: nanoid(8),
      type: 'abnormal_symptom',
      severity: 'high',
      message: `出现异常症状：${record.abnormalSymptoms.join('、')}`,
      date: record.date,
      resolved: false,
    });
  }

  // 情绪预警
  if (record.mood <= 2) {
    alerts.push({
      id: nanoid(8),
      type: 'mood_low',
      severity: 'low',
      message: '今日情绪状态较低，建议关注心理状态',
      date: record.date,
      resolved: false,
    });
  }

  return alerts;
}

// ── Store 实现 ──

export const useTrackingStore = create<TrackingState>()(
  persist(
    (set, get) => ({
      // 初始状态
      patientId: null,
      patientName: null,
      dailyRecords: [],
      weeklyRecords: [],
      alerts: [],
      isSubmitting: false,
      lastSubmitted: null,

      // 设置患者
      setPatient: (id, name) => {
        set({ patientId: id, patientName: name });
      },

      // 提交每日追踪
      submitDaily: (data) => {
        const state = get();
        if (!state.patientId) return;

        const record: DailyTracking = {
          ...data,
          id: nanoid(8),
          patientId: state.patientId,
          createdAt: Date.now(),
        };

        // 生成预警
        const newAlerts = generateAlerts(record);

        set((s) => ({
          dailyRecords: [...s.dailyRecords, record],
          alerts: [...s.alerts, ...newAlerts],
          lastSubmitted: data.date,
          isSubmitting: false,
        }));
      },

      // 提交每周追踪
      submitWeekly: (data) => {
        const state = get();
        if (!state.patientId) return;

        const record: WeeklyTracking = {
          ...data,
          id: nanoid(8),
          patientId: state.patientId,
          createdAt: Date.now(),
        };

        set((s) => ({
          weeklyRecords: [...s.weeklyRecords, record],
          lastSubmitted: data.weekStart,
          isSubmitting: false,
        }));
      },

      // 解决预警
      resolveAlert: (alertId) => {
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === alertId ? { ...a, resolved: true } : a
          ),
        }));
      },

      // 获取今日记录
      getTodayRecord: () => {
        const today = getToday();
        return get().dailyRecords.find((r) => r.date === today);
      },

      // 获取本周记录
      getThisWeekRecord: () => {
        const weekStart = getWeekStart(getToday());
        return get().weeklyRecords.find((r) => r.weekStart === weekStart);
      },

      // 获取汇总数据
      getSummary: (days = 7) => {
        const state = get();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const records = state.dailyRecords.filter(
          (r) => new Date(r.date) >= startDate && new Date(r.date) <= endDate
        );

        const dates = records.map((r) => r.date);
        const painLevels = records.map((r) => (r.pain.hasPain ? r.pain.level : 0));
        const exerciseCompleted = records.map((r) => r.exercise.completed);
        const exerciseDurations = records.map((r) => r.exercise.duration);
        const braceHours = records.map((r) => (r.brace.worn ? r.brace.hours : 0));

        const exerciseDays = exerciseCompleted.filter(Boolean).length;
        const braceDays = braceHours.filter((h) => h > 0).length;

        return {
          patientId: state.patientId || '',
          patientName: state.patientName || '',
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
          painTrend: { dates, levels: painLevels },
          exerciseTrend: {
            dates,
            completed: exerciseCompleted,
            durations: exerciseDurations,
          },
          braceTrend: { dates, hours: braceHours },
          adherence: {
            exercise: Math.round((exerciseDays / days) * 100),
            brace: Math.round((braceDays / days) * 100),
          },
          abnormalCount: records.filter((r) => r.abnormalSymptoms.length > 0).length,
          alerts: state.alerts.filter((a) => !a.resolved),
        };
      },

      // 获取预警
      getAlerts: (unresolvedOnly = true) => {
        const alerts = get().alerts;
        return unresolvedOnly ? alerts.filter((a) => !a.resolved) : alerts;
      },

      // 清除数据
      clearData: () => {
        set({
          dailyRecords: [],
          weeklyRecords: [],
          alerts: [],
          lastSubmitted: null,
        });
      },
    }),
    {
      name: 'tracking-storage',
      partialize: (state) => ({
        patientId: state.patientId,
        patientName: state.patientName,
        dailyRecords: state.dailyRecords,
        weeklyRecords: state.weeklyRecords,
        alerts: state.alerts,
        lastSubmitted: state.lastSubmitted,
      }),
    }
  )
);

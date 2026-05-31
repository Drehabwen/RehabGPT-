/**
 * ChildContextStore — 结构化上下文 Zustand Store
 *
 * 管理每个孩子的完整上下文快照。
 * 持久化策略：
 * - identity → localStorage（永不过期）
 * - memory → localStorage（跨会话保留）
 * - assessment / treatment / progress / flags → 不持久化（每次从 API 拉取或计算）
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChildContext, ExtractionResult } from '../model/types';
import { DEFAULT_CHILD_CONTEXT } from '../model/types';
import { RISK_LEVEL_MAP } from '../model/risk';
import { deriveStage, recalculateFlags, applyExtraction, consolidateMemoryForNewDay } from '../engine/updateRules';

export { RISK_LEVEL_MAP };

interface ChildContextState {
  context: ChildContext;

  /** 登录后初始化身份，重置其他字段 */
  initialize: (
    patientId: string,
    patientName: string,
    age?: number | null,
    genderOrSex?: string | null,
    sessionId?: string | null,
  ) => void;

  /** 从 API 同步评估摘要 */
  setAssessment: (data: {
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    riskLabel: string;
    summaryText: string;
    concerns: string[];
    recommendations: string[];
    assessedAt: string;
    reassessDueAt?: string | null;
  } | null) => void;

  /** 从 API 同步训练处方 */
  setTreatment: (data: {
    planId: string;
    therapistName: string;
    title: string;
    summaryText: string;
    keyActions: Array<{ name: string; sets: string; note: string }>;
    durationWeeks: number;
    createdAt: string;
    expiresAt?: string | null;
  } | null) => void;

  /** 打卡后更新执行进度 */
  updateProgress: (data: {
    completedDays: number;
    streakDays: number;
    lastCheckinDate: string;
    avgPainLevel: number;
    painTrend: 'stable' | 'improving' | 'worsening';
    recentMood: string[];
    complianceRate: number;
  }) => void;

  /** 对话后异步更新记忆（要点提取器回调） */
  applyExtractionResult: (result: ExtractionResult) => void;

  /** 从后端同步结构化待办任务 */
  setPendingScales: (tasks: ChildContext['tasks']['pendingScales']) => void;

  /** 检测跨日，清理过期记忆 */
  consolidateIfNewDay: () => void;

  /** 强制重新计算 flags 和 stage */
  recalculate: () => void;

  /** 重置（切换孩子或退出登录） */
  reset: () => void;
}

function normalizeSex(genderOrSex?: string | null): {
  gender: '男' | '女' | '';
  sex: 'male' | 'female' | null;
} {
  if (genderOrSex === 'male' || genderOrSex === '男') {
    return { gender: '男', sex: 'male' };
  }
  if (genderOrSex === 'female' || genderOrSex === '女') {
    return { gender: '女', sex: 'female' };
  }
  return { gender: '', sex: null };
}

export const useChildContextStore = create<ChildContextState>()(
  persist(
    (set, get) => ({
      context: { ...DEFAULT_CHILD_CONTEXT },

      initialize: (patientId, patientName, age, genderOrSex, sessionId) => {
        const normalized = normalizeSex(genderOrSex);
        set({
          context: {
            ...DEFAULT_CHILD_CONTEXT,
            identity: {
              patientId,
              patientName,
              age: age ?? 0,
              gender: normalized.gender,
              sex: normalized.sex,
              sessionId: sessionId || null,
              familyBound: true,
            },
            // 保留旧的记忆（如果有，切换回同一孩子时有用）
            memory: get().context.identity.patientId === patientId
              ? get().context.memory
              : DEFAULT_CHILD_CONTEXT.memory,
          },
        });
        get().recalculate();
      },

      setAssessment: (data) => {
        set((s) => {
          const assessment = data
            ? {
                riskLevel: data.riskLevel,
                riskLabel: data.riskLabel,
                summaryText: data.summaryText,
                concerns: data.concerns,
                recommendations: data.recommendations,
                assessedAt: data.assessedAt,
                reassessDueAt: data.reassessDueAt || null,
              }
            : null;
          const ctx = { ...s.context, assessment };
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      setTreatment: (data) => {
        set((s) => {
          const treatment = data
            ? {
                planId: data.planId,
                therapistName: data.therapistName,
                title: data.title,
                summaryText: data.summaryText,
                keyActions: data.keyActions,
                durationWeeks: data.durationWeeks,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt || null,
              }
            : null;
          const ctx = { ...s.context, treatment };
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      updateProgress: (data) => {
        set((s) => {
          const progress = {
            ...s.context.progress,
            ...data,
            maxStreakDays: Math.max(s.context.progress.maxStreakDays, data.streakDays),
          };
          const ctx = { ...s.context, progress };
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      applyExtractionResult: (result) => {
        set((s) => {
          const patches = applyExtraction(s.context, result);
          const ctx = { ...s.context, ...patches } as ChildContext;
          // 合并 flags
          if (patches.flags) {
            ctx.flags = { ...ctx.flags, ...patches.flags };
          }
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      setPendingScales: (tasks) => {
        set((s) => {
          const ctx = {
            ...s.context,
            tasks: {
              ...s.context.tasks,
              pendingScales: tasks,
            },
          };
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      consolidateIfNewDay: () => {
        set((s) => {
          const patches = consolidateMemoryForNewDay(s.context);
          if (Object.keys(patches).length === 0) return s;
          const ctx = { ...s.context, ...patches } as ChildContext;
          const flags = recalculateFlags(ctx);
          const stage = deriveStage({ ...ctx, flags });
          return { context: { ...ctx, flags, stage } };
        });
      },

      recalculate: () => {
        set((s) => {
          const flags = recalculateFlags(s.context);
          const stage = deriveStage({ ...s.context, flags });
          return { context: { ...s.context, flags, stage } };
        });
      },

      reset: () => {
        set({ context: { ...DEFAULT_CHILD_CONTEXT } });
      },
    }),
    {
      name: 'child-context-store',
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ChildContextState> | undefined;
        const persistedContext = persistedState?.context;

        return {
          ...current,
          ...persistedState,
          context: {
            ...DEFAULT_CHILD_CONTEXT,
            ...persistedContext,
            identity: {
              ...DEFAULT_CHILD_CONTEXT.identity,
              ...(persistedContext?.identity || {}),
            },
            memory: {
              ...DEFAULT_CHILD_CONTEXT.memory,
              ...(persistedContext?.memory || {}),
            },
            progress: {
              ...DEFAULT_CHILD_CONTEXT.progress,
              ...(persistedContext?.progress || {}),
            },
            tasks: {
              ...DEFAULT_CHILD_CONTEXT.tasks,
              ...(persistedContext?.tasks || {}),
            },
            flags: {
              ...DEFAULT_CHILD_CONTEXT.flags,
              ...(persistedContext?.flags || {}),
            },
          },
        };
      },
      partialize: (state) => ({
        context: {
          identity: state.context.identity,
          memory: state.context.memory,
          // assessment/treatment/progress/flags 不持久化
        },
      }),
      version: 1,
    },
  ),
);

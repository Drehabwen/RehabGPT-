/**
 * 量表系统状态管理
 *
 * 管理：待填量表列表、量表填写状态、提交状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getPendingScales,
  submitScale,
  getScaleResults,
  type PendingScale,
  type ScaleResult,
  type ScaleSubmitPayload,
  type ScaleData,
} from '../../api/scaleApi';

// ── Store 状态 ──

interface ScaleState {
  // 数据
  pendingScales: PendingScale[];
  completedScales: ScaleResult[];

  // UI 状态
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchPendingScales: (patientId: string) => Promise<void>;
  submitScaleTask: (payload: ScaleSubmitPayload, scaleData: ScaleData) => Promise<void>;
  fetchScaleResults: (sessionId: string) => Promise<void>;
  clearError: () => void;
  clearAll: () => void;
}

// ── Store 实现 ──

export const useScaleStore = create<ScaleState>()(
  persist(
    (set, get) => ({
      // 初始状态
      pendingScales: [],
      completedScales: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      lastFetched: null,

      // 获取待填量表
      fetchPendingScales: async (patientId: string) => {
        set({ isLoading: true, error: null });
        try {
          const scales = await getPendingScales(patientId);
          set({
            pendingScales: scales,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '获取量表失败';
          set({ error: message, isLoading: false });
          console.error('[ScaleStore] fetchPendingScales error:', err);
        }
      },

      // 提交量表
      submitScaleTask: async (payload: ScaleSubmitPayload, scaleData: ScaleData) => {
        set({ isSubmitting: true, error: null });
        try {
          await submitScale(payload);

          // 更新本地状态：从待填列表移除
          set((state) => ({
            pendingScales: state.pendingScales.filter((s) => s.task_id !== payload.task_id),
            isSubmitting: false,
          }));

          // 添加到已完成列表
          const completed: ScaleResult = {
            task_id: payload.task_id,
            patient_id: '',
            session_id: payload.session_id,
            scale_id: scaleData.scaleId,
            status: 'completed',
            scale_data: scaleData,
            created_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
          };

          set((state) => ({
            completedScales: [completed, ...state.completedScales],
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : '提交量表失败';
          set({ error: message, isSubmitting: false });
          console.error('[ScaleStore] submitScaleTask error:', err);
          throw err;
        }
      },

      // 获取量表结果
      fetchScaleResults: async (sessionId: string) => {
        set({ isLoading: true, error: null });
        try {
          const results = await getScaleResults(sessionId);
          set({
            completedScales: results,
            isLoading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '获取量表结果失败';
          set({ error: message, isLoading: false });
          console.error('[ScaleStore] fetchScaleResults error:', err);
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),

      // 清除所有数据
      clearAll: () =>
        set({
          pendingScales: [],
          completedScales: [],
          isLoading: false,
          isSubmitting: false,
          error: null,
          lastFetched: null,
        }),
    }),
    {
      name: 'scale-storage',
      partialize: (state) => ({
        pendingScales: state.pendingScales,
        completedScales: state.completedScales,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

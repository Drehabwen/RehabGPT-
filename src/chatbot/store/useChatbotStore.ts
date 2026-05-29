import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Answers, RiskResult } from '../types';
import { useAgentStore } from './useAgentStore';

/**
 * Chatbot 身份 Store — 患者身份 + 路由守卫
 *
 * 仅负责：患者身份存储、跨页面身份传递、流程重置。
 * 所有对话/AI/工具逻辑已迁移至 useAgentStore。
 */

// ── Store 状态 ──
interface ChatbotState {
  patientId: string;
  patientName: string;
  answers: Answers;
  riskResult: RiskResult | null;

  setPatient: (id: string, name: string) => void;
  resetFlow: () => void;
}

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      // ── 初始状态 ──
      patientId: '',
      patientName: '',
      answers: {},
      riskResult: null,

      // ── 设置患者 ──
      setPatient: (id, name) => {
        set({ patientId: id, patientName: name });
        // Bridge: sync patient identity to agent store
        useAgentStore.getState().initWithPatient(id, name);
      },

      // ── 重置流程 ──
      resetFlow: () => {
        set({
          answers: {},
          riskResult: null,
        });
        useAgentStore.getState().resetAgent();
      },
    }),
    {
      name: 'chatbot-state',
      partialize: (state) => ({
        patientId: state.patientId,
        patientName: state.patientName,
      }),
      version: 1,
    },
  ),
);

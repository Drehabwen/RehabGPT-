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
interface PatientMeta {
  age?: number | null;
  sex?: 'male' | 'female' | string | null;
  sessionId?: string | null;
  answers?: Answers;
}

interface ChatbotState {
  patientId: string;
  patientName: string;
  answers: Answers;
  riskResult: RiskResult | null;

  setPatient: (id: string, name: string, meta?: PatientMeta) => void;
  resetFlow: () => void;
}

function toGenderLabel(sex?: string | null): '男' | '女' | undefined {
  if (sex === 'male' || sex === '男') return '男';
  if (sex === 'female' || sex === '女') return '女';
  return undefined;
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
      setPatient: (id, name, meta) => {
        // 先重置对话引擎核心状态（将 view 重置回 'chat'、清空旧消息与状态锁），规避摄像头残留与账号越界 Bug
        useAgentStore.getState().resetAgent();
        const gender = toGenderLabel(meta?.sex);

        set({
          patientId: id,
          patientName: name,
          answers: {
            ...(meta?.answers || {}),
            ...(meta?.age != null ? { age: meta.age } : {}),
            ...(gender ? { gender } : {}),
            ...(meta?.sessionId ? { screening_session_id: meta.sessionId } : {}),
          },
          riskResult: null,
        });

        // 启动全新的对话生命周期初始化
        useAgentStore.getState().initWithPatient(id, name, meta?.age ?? null, meta?.sex, meta?.sessionId);
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

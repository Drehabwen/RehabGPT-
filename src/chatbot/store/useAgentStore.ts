/**
 * AI Agent Store — 组合入口
 *
 * 按职责拆分：
 * - agentTypes.ts       类型 + 常量
 * - agentCoreSlice.ts   对话引擎 + 生命周期 + 结果计算
 * - agentLLMSlice.ts    LLM 集成 + 自由文本对话
 * - agentToolSlice.ts   工具编排 + 摄像头
 * - agentReportSlice.ts 报告/康复/随访
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentState, AgentToolId, AgentView } from './agentTypes';
import { createAgentCoreSlice } from './agentCoreSlice';
import { createAgentLLMSlice } from './agentLLMSlice';
import { createAgentToolSlice } from './agentToolSlice';
import { createAgentReportSlice } from './agentReportSlice';

// Re-export types for backward compatibility
export type { AgentToolId, AgentView };
export type { AgentState };

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      ...createAgentCoreSlice(set, get),
      ...createAgentLLMSlice(set, get),
      ...createAgentToolSlice(set, get),
      ...createAgentReportSlice(set, get),
    }),
    {
      name: 'chatbot-agent-state',
      partialize: (state) => ({
        patientId: state.patientId,
        patientName: state.patientName,
        patientAge: state.patientAge,
        branch: state.branch,
        stepIndex: state.stepIndex,
        answers: state.answers,
        messages: state.messages,
        riskResult: state.riskResult,
        hasHistory: state.hasHistory,
        hasDueReminder: state.hasDueReminder,
        lastAssessmentSummary: state.lastAssessmentSummary,
        view: state.view,
      }),
      version: 1,
    },
  ),
);

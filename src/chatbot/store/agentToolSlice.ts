/**
 * Agent Tool Slice — 工具编排 + 摄像头
 *
 * 职责：工具调用、会话管理、ToolBridge 结果同步、Adams 摄像头 lifecycle
 */
import { nanoid } from 'nanoid';
import type { AgentState, AgentToolId } from './agentTypes';
import { TOOL_NAMES } from './agentTypes';
import { BRANCH_FLOWS } from '../constants/branches';
import {
  startToolSession,
  submitToolResults,
} from '../utils/agentChatService';

// ── Slice 类型 ──
export interface AgentToolSlice {
  activeTool: AgentToolId | null;
  suggestedTools: AgentToolId[];
  toolResults: Record<string, unknown>;
  adamsAutoResult: AgentState['adamsAutoResult'];

  invokeTool: (tool: AgentToolId) => void;
  dismissTool: () => void;
  suggestTools: (tools: AgentToolId[]) => void;
  openCamera: () => void;
  closeCamera: () => void;
  setAdamsAutoResult: (result: AgentState['adamsAutoResult']) => void;
}

export function createAgentToolSlice(
  set: (partial: Partial<AgentState> | ((s: AgentState) => Partial<AgentState>)) => void,
  get: () => AgentState,
): AgentToolSlice {
  return {
    // ── 初始状态 ──
    activeTool: null,
    suggestedTools: [],
    toolResults: {},
    adamsAutoResult: null,

    // ── 工具调用 ──
    invokeTool: (tool) => {
      const { patientName, patientAge, toolResults } = get();
      const backendToolId = `invoke_${tool}`;

      if (patientName && !toolResults._sessionId) {
        startToolSession(backendToolId, patientName, patientAge).then((session) => {
          if (session) {
            set((s) => ({
              toolResults: { ...s.toolResults, _sessionId: session.sessionId, _toolId: backendToolId },
            }));
          }
        });
      }

      // adams_camera 走摄像头视图
      if (tool === 'adams_camera') {
        get().openCamera();
        return;
      }
      const toolName = TOOL_NAMES[tool] || tool;
      set((s) => ({
        activeTool: tool,
        view: 'tool',
        messages: [
          ...s.messages,
          {
            id: nanoid(8),
            role: 'bot',
            text: `正在为你打开${toolName}工具...`,
            timestamp: Date.now(),
          },
        ],
      }));
    },

    dismissTool: () => {
      const { activeTool, patientName, toolResults } = get();
      const sessionId = toolResults._sessionId as string | undefined;
      const backendToolId = (toolResults._toolId as string) || (activeTool ? `invoke_${activeTool}` : '');

      // ToolBridge: sync tool results to backend
      if (sessionId && activeTool && patientName) {
        (async () => {
          try {
            if (activeTool === 'psych') {
              const psychAnswers = toolResults._psychAnswers as Array<{questionIndex: number; questionText: string; score: number}> | undefined;
              if (psychAnswers && psychAnswers.length > 0) {
                await submitToolResults(sessionId, backendToolId, patientName, {}, psychAnswers);
                console.log('[ToolBridge] Synced psych to backend:', sessionId);
              }
            }
          } catch (err) {
            console.warn('[ToolBridge] Sync failed for', activeTool, err);
          }
        })();
      }

      set({ activeTool: null, view: 'chat' });
    },

    suggestTools: (tools) => set({ suggestedTools: tools }),

    // ── Camera ──
    openCamera: () => set({ view: 'adams_camera' }),

    closeCamera: () => {
      const state = get();
      const flow = BRANCH_FLOWS[state.branch];
      const currentStep = flow?.[state.stepIndex];

      // ToolBridge: sync AdamsCamera result
      if (state.adamsAutoResult && state.patientName) {
        const sessionId = state.toolResults._sessionId as string | undefined;
        const backendToolId = (state.toolResults._toolId as string) || 'invoke_adams_camera';
        if (sessionId) {
          const result = state.adamsAutoResult;
          submitToolResults(sessionId, backendToolId, state.patientName, {
            recommendation: result.recommendation,
            shoulderAsymmetry: result.shoulderAsymmetry,
            hipAsymmetry: result.hipAsymmetry,
            asymmetryRatio: result.asymmetryRatio,
            ribHumpDetected: result.ribHumpDetected,
            confidence: result.confidence,
            summary: `Adam's test: ${result.recommendation}`,
          }).then(() => {
            console.log('[ToolBridge] Synced adams_camera to backend:', sessionId);
          }).catch((err) => {
            console.warn('[ToolBridge] Adams sync failed:', err);
          });
        }
      }

      set({ view: 'chat' });
      // Camera dismissed without result — auto-skip
      if (currentStep?.type === 'camera' && !state.adamsAutoResult) {
        setTimeout(() => {
          get().advanceStep('已跳过摄像头检测');
        }, 300);
      }
    },

    setAdamsAutoResult: (result) => {
      set({ adamsAutoResult: result });
      const answerValue =
        result.recommendation === 'significant_hump'
          ? '明显隆起'
          : result.recommendation === 'mild_asymmetry'
            ? '轻微不对称'
            : '对称无隆起';
      set((s) => ({
        answers: { ...s.answers, adams_result: answerValue },
      }));
      setTimeout(() => get().closeCamera(), 500);
      setTimeout(() => get().advanceStep(answerValue), 800);
    },
  };
}

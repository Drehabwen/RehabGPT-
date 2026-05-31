/**
 * Agent Tool Slice — 工具编排
 *
 * 职责：工具调用、会话管理、ToolBridge 结果同步
 */
import { nanoid } from 'nanoid';
import type { AgentState, AgentToolId } from './agentTypes';
import { TOOL_NAMES } from './agentTypes';
import {
  startToolSession,
  submitToolResults,
} from '../utils/agentChatService';

// ── Slice 类型 ──
export interface AgentToolSlice {
  activeTool: AgentToolId | null;
  suggestedTools: AgentToolId[];
  toolResults: Record<string, unknown>;

  invokeTool: (tool: AgentToolId) => void;
  dismissTool: () => void;
  suggestTools: (tools: AgentToolId[]) => void;
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
        }).catch((err) => {
          console.warn('[AgentStore] Tool session start failed:', err);
        });
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
  };
}

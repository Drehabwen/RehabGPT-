/**
 * Agent LLM Slice — LLM 集成 + 自由文本对话
 *
 * 改进点：
 * 1. 使用结构化上下文模型 + 意图路由 + 动态注入（~200-570 tokens）
 * 2. Token 感知的历史消息截断
 * 3. 对话后异步要点提取（闭环回写 ChildContext）
 */
import { nanoid } from 'nanoid';
import type { ChatMessage } from '../types';
import type { AgentState, AgentToolId } from './agentTypes';
import {
  sendChatMessageStream,
  checkLLMAvailable,
  shouldFallback,
  resetFailureCount,
  getSessionSummary,
  startToolSession,
  type PatientContext,
} from '../utils/agentChatService';
// 旧提示词系统（保留兼容，逐步迁移）
import {
  buildAdaptiveSystemPrompt,
  buildUserMessage as buildAdaptiveUserMessage,
  type LLMContext,
  type ConversationPhase,
} from '../prompts/adaptiveSystemPrompt';
// 新上下文工程
import {
  classifyIntent,
  shouldExtract,
  scheduleExtraction,
  buildDynamicSystemPrompt,
  buildUserMessage as buildContextUserMessage,
} from '../../context';
import { useChildContextStore } from '../../context/ChildContextStore';
import { countTokens } from '../utils/tokenCounter';
import { buildLLMMessages, getTruncationStats } from '../utils/contextWindow';
import { responseCache } from '../utils/responseCache';
import { BRANCH_FLOWS } from '../constants/branches';

// ── 根据当前状态推断对话阶段 ──
function inferConversationPhase(state: AgentState): ConversationPhase {
  const { branch, view, riskResult, activeTool } = state;

  if (view === 'result' && riskResult) return 'result_review';

  switch (branch) {
    case 'main':
      return state.stepIndex === 0 ? 'greeting' : 'free_chat';
    case 'reassess':
      return 'screening';
    case 'report':
      return 'report_chat';
    case 'rehab':
      return 'rehab_guidance';
    case 'followup':
      return 'followup';
    default:
      return 'free_chat';
  }
}

// ── 构建 LLM 完整上下文 ──
function buildLLMContext(state: AgentState): LLMContext {
  const phase = inferConversationPhase(state);
  const currentFlow = BRANCH_FLOWS[state.branch] || [];
  const currentStep = currentFlow[state.stepIndex];

  const pendingScaleMsg = state.messages.find((m) => m.scalePayload);
  const pendingScale = pendingScaleMsg ? pendingScaleMsg.scalePayload : null;

  return {
    patientName: state.patientName || '孩子',
    patientAge: state.patientAge,
    patientGender: state.answers.gender as string | undefined,
    phase,
    stepIndex: state.stepIndex,
    totalSteps: currentFlow.length,
    currentQuestionKey: currentStep?.questionKey,
    answers: state.answers,
    riskResult: state.riskResult,
    adamsResult: state.adamsAutoResult,
    hasHistory: state.hasHistory,
    hasDueReminder: state.hasDueReminder,
    lastAssessmentSummary: state.lastAssessmentSummary,
    availableTools: state.suggestedTools,
    currentDate: new Date().toISOString().split('T')[0],
    pendingScale,
  };
}

/**
 * 每日会话收敛与记忆压缩
 */
async function consolidateSessionIfNewDay(
  messages: ChatMessage[],
  patientName: string,
  lastAssessmentSummary: string | null,
  set: (partial: Partial<AgentState>) => void,
): Promise<{ cleared: boolean; newSummary: string | null }> {
  if (messages.length === 0) return { cleared: false, newSummary: lastAssessmentSummary };

  const lastMsg = messages[messages.length - 1];
  const lastDateStr = new Date(lastMsg.timestamp).toDateString();
  const todayDateStr = new Date().toDateString();

  if (lastDateStr !== todayDateStr) {
    console.log("[AgentStore] New day detected. Consolidating yesterday's session...");
    // Phase B: 触发 ChildContext 跨日记忆清理
    try {
      useChildContextStore.getState().consolidateIfNewDay();
    } catch (err) {
      console.warn('[AgentStore] ChildContext consolidate failed:', err);
    }
    try {
      const apiMessages = messages.map((m) => ({
        role: (m.role === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.text,
      }));

      const summaryResult = await getSessionSummary(apiMessages, patientName);
      if (summaryResult && summaryResult.summary) {
        const formattedDate = new Date(lastMsg.timestamp).toISOString().split('T')[0];
        const newSummaryBlock = `[${formattedDate}] 居家总结: ${summaryResult.summary}`;

        // 限制摘要长度，防止无限增长
        const maxSummaryLength = 500;
        let updatedSummary = lastAssessmentSummary
          ? `${lastAssessmentSummary}\n${newSummaryBlock}`
          : newSummaryBlock;

        if (updatedSummary.length > maxSummaryLength) {
          // 保留最近的摘要
          const lines = updatedSummary.split('\n');
          updatedSummary = lines.slice(-3).join('\n'); // 只保留最近3条
        }

        set({
          messages: [],
          lastAssessmentSummary: updatedSummary,
          hasHistory: true,
        });

        console.log('[AgentStore] Consolidate complete. Saved daily memory block.');
        return { cleared: true, newSummary: updatedSummary };
      }
    } catch (err) {
      console.warn('[AgentStore] Consolidate session failed:', err);
    }
  }
  return { cleared: false, newSummary: lastAssessmentSummary };
}

// ── Slice 类型 ──
export interface AgentLLMSlice {
  checkLLMStatus: () => Promise<boolean>;
  resetLLMStatus: () => void;
  sendFreeTextStream: (text: string) => Promise<void>;
  executeToolFromLLM: (toolId: string, reason?: string) => void;
}

export function createAgentLLMSlice(
  set: (partial: Partial<AgentState> | ((s: AgentState) => Partial<AgentState>)) => void,
  get: () => AgentState,
): AgentLLMSlice {
  return {
    // ── LLM 状态检测 ──
    checkLLMStatus: async () => {
      const available = await checkLLMAvailable();
      set({ llmAvailable: available });
      return available;
    },

    resetLLMStatus: () => {
      resetFailureCount();
      set({ llmAvailable: true, llmProcessing: false });
      console.log('[AgentStore] LLM status reset');
    },

    // ── 发送自由文本到 LLM（WebSocket 流式） ──
    sendFreeTextStream: async (text) => {
      await consolidateSessionIfNewDay(
        get().messages,
        get().patientName,
        get().lastAssessmentSummary,
        set,
      );

      const state = get();
      const { patientName, patientAge, hasDueReminder } = state;

      if (shouldFallback()) {
        set({ llmAvailable: false });
      }

      if (!state.llmAvailable) {
        get().advanceStep(text);
        return;
      }

      // 本地缓存命中 — 即时响应
      const cachedResponse = responseCache.get(text);
      if (cachedResponse) {
        const botMsgId = nanoid(8);
        const userMsg: ChatMessage = {
          id: nanoid(8),
          role: 'user',
          text,
          timestamp: Date.now(),
        };
        set((s) => ({
          llmProcessing: false,
          messages: [
            ...s.messages,
            userMsg,
            { id: botMsgId, role: 'bot', text: cachedResponse, timestamp: Date.now() },
          ],
        }));
        return;
      }

      const botMsgId = nanoid(8);
      const userMsg: ChatMessage = {
        id: nanoid(8),
        role: 'user',
        text,
        timestamp: Date.now(),
      };
      set((s) => ({
        llmProcessing: true,
        messages: [
          ...s.messages,
          userMsg,
          { id: botMsgId, role: 'bot', text: '', timestamp: Date.now() },
        ],
      }));

      // Phase B: 新上下文工程 — 意图路由 + 动态注入
      const childCtx = useChildContextStore.getState().context;
      const intent = classifyIntent(text);
      const systemPrompt = buildDynamicSystemPrompt(intent.primary, childCtx);
      const userMessage = buildContextUserMessage(text, intent.primary);

      // Token 感知的消息构建
      const llmMessages = buildLLMMessages(
        systemPrompt,
        state.messages,
        userMessage,
      );

      // 调试：记录 token 使用情况和截断统计
      const systemTokens = countTokens(systemPrompt);
      const stats = getTruncationStats(state.messages, llmMessages.slice(1, -1) as unknown as ChatMessage[]);
      console.log(`[LLM] Intent: ${intent.primary}(${Math.round(intent.confidence * 100)}%) | System: ${systemTokens}t | History: ${stats.originalCount}→${stats.truncatedCount} msgs`);

      const patientContext: PatientContext = {
        name: patientName || '孩子',
        age: patientAge,
        hasHistory: state.hasHistory,
        hasDueReminder,
        riskLevel: state.riskResult?.level ?? null,
        lastAssessmentSummary: state.lastAssessmentSummary,
      };

      // 捕获回复文本用于提取
      let streamedReplyText = '';

      sendChatMessageStream(
        {
          messages: llmMessages,
          patientContext,
          availableTools: state.suggestedTools as AgentToolId[],
          systemPrompt,
        },
        {
          onToken: (token) => {
            streamedReplyText += token;
            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === botMsgId ? { ...m, text: m.text + token } : m,
              ),
            }));
          },
          onDone: (result) => {
            resetFailureCount();
            const finalText = result.content || streamedReplyText;
            if (result.content) {
              responseCache.set(text, result.content);
            }
            set((s) => ({
              llmProcessing: false,
              messages: s.messages.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      text: finalText,
                      ...(result.toolCall ? { toolCall: result.toolCall } : {}),
                    }
                  : m,
              ),
            }));

            // Phase C: 异步要点提取（不阻塞对话）
            if (shouldExtract(text, finalText)) {
              scheduleExtraction(text, finalText, childCtx);
            }
          },
          onError: (error) => {
            console.warn('[AgentStore] Stream error:', error);
            set((s) => ({
              llmProcessing: false,
              messages: s.messages.map((m) =>
                m.id === botMsgId
                  ? { ...m, text: '小柱暂时无法连接，让我用另一种方式帮您。' }
                  : m,
              ),
            }));
            if (shouldFallback()) {
              set({ llmAvailable: false });
              get().advanceStep(text);
            }
          },
        },
      );
    },

    // ── 执行 LLM 请求的工具调用 ──
    executeToolFromLLM: (toolId, _reason) => {
      void _reason;
      const cleanId = toolId.replace(/^invoke_/, '');

      if (['vision3', 'rom', 'scales', 'comparison'].includes(cleanId)) {
        get().invokeTool(cleanId as AgentToolId);
      } else if (cleanId === 'psych') {
        get().invokeTool('psych');
      } else {
        console.warn('[AgentStore] Unknown LLM tool call:', toolId);
      }
    },
  };
}

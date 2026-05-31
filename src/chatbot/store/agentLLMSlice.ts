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
  type PatientContext,
} from '../utils/agentChatService';
// 新上下文工程
import {
  shouldExtract,
  scheduleExtraction,
  assembleFreeChatContext,
  useChildContextStore,
} from '../../context';
import { countTokens } from '../utils/tokenCounter';
import { buildLLMMessages, getTruncationStats } from '../utils/contextWindow';
import { responseCache } from '../utils/responseCache';

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
      const { patientName, hasDueReminder } = state;

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
      const assembledContext = assembleFreeChatContext(text, childCtx);
      const systemPrompt = assembledContext.systemPrompt;
      const userMessage = assembledContext.userMessage || text;

      // Token 感知的消息构建
      const llmMessages = buildLLMMessages(
        systemPrompt,
        state.messages,
        userMessage,
      );

      // 调试：记录 token 使用情况和截断统计
      const systemTokens = countTokens(systemPrompt);
      const stats = getTruncationStats(state.messages, llmMessages.slice(1, -1) as unknown as ChatMessage[]);
      console.log(`[LLM] Intent: ${assembledContext.intent || 'chat'} | System: ${systemTokens}t | History: ${stats.originalCount}→${stats.truncatedCount} msgs`);

      const patientContext: PatientContext = {
        name: assembledContext.snapshot.identity.displayName,
        age: assembledContext.snapshot.identity.age,
        hasHistory: state.hasHistory,
        hasDueReminder,
        riskLevel: assembledContext.snapshot.clinical.assessment?.riskLevel ?? null,
        lastAssessmentSummary:
          assembledContext.snapshot.clinical.assessment?.summaryText ?? state.lastAssessmentSummary,
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

/**
 * Agent Core Slice — 对话引擎 + 生命周期 + 分支路由 + 结果计算
 *
 * 职责：初始化患者、对话步骤推进、分支选择、消息管理、风险评分
 */
import { nanoid } from 'nanoid';
import type { ChatMessage, Answers } from '../types';
import type { BranchId } from '../constants/branches';
import { BRANCH_FLOWS, MAIN_MENU_STEP } from '../constants/branches';
import { calculateRiskScore } from '../utils/riskCalculator';
import {
  getFollowupReminders,
} from '../utils/followupStorage';
import { buildWelcomeMessage } from '../prompts';
import {
  getPatientHistory,
} from '../utils/agentChatService';
import type { AgentState, AgentToolId } from './agentTypes';
import { BOT_TYPING_DELAYS } from './agentTypes';

// ── 共享工具函数 ──

export function appendBotMessages(
  state: AgentState,
  messages: string[],
  imageUrl?: string,
): ChatMessage[] {
  return [
    ...state.messages,
    ...messages.map((text) => ({
      id: nanoid(8),
      role: 'bot' as const,
      text,
      timestamp: Date.now(),
      ...(imageUrl ? { imageUrl } : {}),
    })),
  ];
}

function shouldSkipStep(
  step: { skipCondition?: (answers: Answers) => boolean },
  answers: Answers,
): boolean {
  if (step.skipCondition) return step.skipCondition(answers);
  return false;
}

function findNextStepIndex(
  flow: typeof BRANCH_FLOWS[BranchId],
  currentIndex: number,
  answers: Answers,
): number {
  let next = currentIndex + 1;
  while (next < flow.length) {
    if (!shouldSkipStep(flow[next], answers)) return next;
    next++;
  }
  return next;
}

// ── 欢迎消息（兼容包装） ──
function buildWelcomeMessageCompat(
  patientName: string,
  hasHistory: boolean,
  hasDueReminder: boolean,
): string[] {
  return buildWelcomeMessage({ patientName, hasHistory, hasDueReminder });
}

// ── Slice 类型（本文件提供的 state + actions） ──
export interface AgentCoreSlice {
  branch: BranchId;
  stepIndex: number;
  messages: ChatMessage[];
  answers: Answers;
  isBotTyping: boolean;
  view: AgentState['view'];
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  hasHistory: boolean;
  lastAssessmentSummary: string | null;
  hasDueReminder: boolean;
  riskResult: AgentState['riskResult'];
  llmAvailable: boolean;
  llmProcessing: boolean;

  getCurrentStep: () => ReturnType<AgentState['getCurrentStep']>;
  getTotalSteps: () => number;
  initWithPatient: (id: string, name: string, age?: number | null) => void;
  resetAgent: () => void;
  selectBranch: (branch: BranchId) => Promise<void>;
  advanceStep: (answer?: string | number) => Promise<void>;
  setAnswer: (key: string, value: string | number | boolean) => void;
  addMessage: (role: 'bot' | 'user', text: string, imageUrl?: string) => void;
  setBotTyping: (v: boolean) => void;
  goToMainMenu: () => Promise<void>;
  calculateAndShowResult: () => void;
}

export function createAgentCoreSlice(
  set: (partial: Partial<AgentState> | ((s: AgentState) => Partial<AgentState>)) => void,
  get: () => AgentState,
): AgentCoreSlice {
  return {
    // ── 初始状态 ──
    branch: 'main',
    stepIndex: 0,
    messages: [],
    answers: {},
    isBotTyping: false,
    view: 'chat',
    patientId: null,
    patientName: '',
    patientAge: null,
    hasHistory: false,
    lastAssessmentSummary: null,
    hasDueReminder: false,
    riskResult: null,
    llmAvailable: false,
    llmProcessing: false,

    // ── Getters ──
    getCurrentStep: () => {
      const { branch, stepIndex } = get();
      return BRANCH_FLOWS[branch]?.[stepIndex];
    },
    getTotalSteps: () => {
      const { branch } = get();
      return BRANCH_FLOWS[branch]?.length ?? 0;
    },

    // ── Patient init ──
    initWithPatient: async (id, name, age) => {
      const current = get();

      // If already initialized with same patient (rehydrated from localStorage), skip re-init
      if (current.patientId === id && current.messages.length > 0) {
        get().checkDueReminders();
        get().checkLLMStatus();
        return;
      }

      const reminders = getFollowupReminders();
      const hasDueReminder = !!reminders[id] && new Date(reminders[id].nextCheckDate) <= new Date();

      set({
        patientId: id,
        patientName: name,
        patientAge: age ?? null,
        hasDueReminder,
        hasHistory: false,
        lastAssessmentSummary: null,
        branch: 'main',
        stepIndex: 0,
        answers: {},
        messages: [],
        isBotTyping: true,
        activeTool: null,
        suggestedTools: [],
        riskResult: null,
        view: 'chat',
        llmAvailable: false,
        llmProcessing: false,
      });

      // Check LLM availability (non-blocking)
      get().checkLLMStatus().then((available) => {
        if (available) {
          console.log('[AgentStore] LLM connected successfully');
        } else {
          console.warn('[AgentStore] LLM not available, using rule engine fallback');
        }
      });

      // Load patient history from backend (non-blocking)
      let hasHistory = false;
      let lastAssessmentSummary: string | null = null;
      try {
        const historyItems = await getPatientHistory(name);
        hasHistory = historyItems.length > 0;
        if (hasHistory && historyItems[0]?.summary) {
          lastAssessmentSummary = historyItems[0].summary;
        }
        set({ hasHistory, lastAssessmentSummary });
      } catch {
        // history fetch failed — continue without history
      }

      // Check pending scales from integration backend
      let pendingScaleMessage: ChatMessage | null = null;
      try {
        const apiBase = import.meta.env.VITE_API_BASE || '';
        const res = await fetch(`${apiBase}/api/integration/scale/pending/${id}`);
        if (res.ok) {
          const scales = await res.json();
          if (scales && scales.length > 0) {
            const latestScale = scales[0];
            pendingScaleMessage = {
              id: nanoid(8),
              role: 'bot' as const,
              text: `您的康复师为您下发了日常量表评定，点击下方卡片即可开始完成评估哦！`,
              timestamp: Date.now() + 100,
              scalePayload: {
                taskId: latestScale.task_id,
                sessionId: latestScale.session_id,
                scaleId: latestScale.scale_id as 'SRS-22' | 'ODI' | 'VAS',
              }
            };
          }
        }
      } catch (err) {
        console.error('[initWithPatient] Failed to fetch pending scales:', err);
      }

      // Send welcome after delay
      setTimeout(() => {
        const state = get();
        const welcomeTexts = buildWelcomeMessageCompat(name, state.hasHistory, state.hasDueReminder);
        const initialMessages: ChatMessage[] = welcomeTexts.map((text) => ({
          id: nanoid(8),
          role: 'bot' as const,
          text,
          timestamp: Date.now(),
        }));

        if (pendingScaleMessage) {
          initialMessages.push(pendingScaleMessage);
        }

        set({
          isBotTyping: false,
          messages: initialMessages,
        });
      }, BOT_TYPING_DELAYS.normal);
    },

    resetAgent: () => {
      set({
        branch: 'main',
        stepIndex: 0,
        answers: {},
        messages: [],
        isBotTyping: false,
        view: 'chat',
        activeTool: null,
        suggestedTools: [],
        toolResults: {},
        riskResult: null,
        hasHistory: false,
        lastAssessmentSummary: null,
        llmAvailable: false,
        llmProcessing: false,
      });
    },

    // ── Branch selection ──
    selectBranch: async (branch) => {
      const { patientName } = get();
      const flow = BRANCH_FLOWS[branch];
      if (!flow || flow.length === 0) return;

      set({
        branch,
        stepIndex: 0,
        isBotTyping: true,
        view: 'chat',
      });

      const firstStep = flow[0];
      const botMsgs = firstStep.botMessages.map((m) =>
        m.replace('__WELCOME_PLACEHOLDER__', patientName || '用户'),
      );

      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
      set((s) => ({
        isBotTyping: false,
        messages: appendBotMessages(s, botMsgs, firstStep.imageUrl),
      }));
    },

    // ── Advance step ──
    advanceStep: async (answer) => {
      const state = get();
      const flow = BRANCH_FLOWS[state.branch];
      const currentStep = flow?.[state.stepIndex];
      if (!currentStep) return;

      // Record answer
      if (answer !== undefined && answer !== null && currentStep.questionKey) {
        set((s) => ({
          answers: { ...s.answers, [currentStep.questionKey!]: answer },
        }));
      }

      // Add user message
      if (currentStep.type !== 'bot_message' && currentStep.type !== 'auto') {
        const option = currentStep.options?.find((o) => o.value === answer);
        const userText = option?.label ?? String(answer ?? '');
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: nanoid(8),
              role: 'user',
              text: userText,
              timestamp: Date.now(),
            },
          ],
        }));
      }

      // Check for branch routing from main menu
      if (currentStep.id === 'main_menu' && answer) {
        const branchMap: Record<string, BranchId> = {
          report: 'report',
          rehab: 'rehab',
          followup: 'followup',
        };
        const targetBranch = branchMap[String(answer)];
        if (targetBranch) {
          get().selectBranch(targetBranch);
          return;
        }
      }

      // Follow-up routing
      if (currentStep.id === 'followup_intro') {
        if (answer !== 'set_reminder') {
          const nextIndex = state.stepIndex + 2;
          if (nextIndex < flow.length) {
            const skipStep = flow[nextIndex];
            set({ stepIndex: nextIndex });
            await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.short));
            set((s) => ({
              isBotTyping: false,
              messages: appendBotMessages(s, skipStep.botMessages),
            }));
            return;
          }
        }
      }

      // Find next step
      const updatedAnswers = {
        ...state.answers,
        ...(currentStep.questionKey ? { [currentStep.questionKey]: answer } : {}),
      };
      const nextIndex = findNextStepIndex(flow, state.stepIndex, updatedAnswers);

      // End of branch
      if (nextIndex >= flow.length) {
        set({ stepIndex: 0 });
        await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
        set({ branch: 'main', stepIndex: 0 });
        set({ isBotTyping: true });
        await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.short));
        set((s) => ({
          isBotTyping: false,
          messages: appendBotMessages(s, MAIN_MENU_STEP.botMessages),
        }));
        return;
      }

      const nextStep = flow[nextIndex];

      // Result step
      if (nextStep.type === 'result') {
        set({ stepIndex: nextIndex });
        set({ isBotTyping: true });
        await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
        set((s) => ({
          isBotTyping: false,
          messages: appendBotMessages(s, nextStep.botMessages),
        }));
        get().calculateAndShowResult();
        return;
      }

      // Normal step
      set({ stepIndex: nextIndex });
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
      set({ isBotTyping: true });
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
      set((s) => ({
        isBotTyping: false,
        messages: appendBotMessages(s, nextStep.botMessages, nextStep.imageUrl),
      }));
    },

    // ── Simple actions ──
    setAnswer: (key, value) => {
      set((s) => ({ answers: { ...s.answers, [key]: value } }));
    },

    addMessage: (role, text, imageUrl) => {
      set((s) => ({
        messages: [
          ...s.messages,
          { id: nanoid(8), role, text, timestamp: Date.now(), ...(imageUrl ? { imageUrl } : {}) },
        ],
      }));
    },

    setBotTyping: (v) => set({ isBotTyping: v }),

    // ── Main menu ──
    goToMainMenu: async () => {
      set({ branch: 'main', stepIndex: 1, isBotTyping: true, view: 'chat' });
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.short));
      set((s) => ({
        isBotTyping: false,
        messages: appendBotMessages(s, MAIN_MENU_STEP.botMessages),
      }));
    },

    // ── Risk result ──
    calculateAndShowResult: () => {
      const { answers } = get();
      const riskResult = calculateRiskScore(answers);
      set({ riskResult, view: 'result' });
    },
  };
}

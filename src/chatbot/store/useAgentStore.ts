/**
 * AI Agent Store — 多分支对话引擎 + 工具编排
 *
 * 核心职责：
 * 1. 分支路由 (main/reassess/report/rehab/followup)
 * 2. 患者上下文管理
 * 3. 工具编排 (activeTool)
 * 4. localStorage 随访管理
 * 5. LLM/规则引擎调用
 */
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ChatMessage, Answers, RiskResult, AdamsAutoResult } from '../types';
import type { BranchId } from '../constants/branches';
import { BRANCH_FLOWS, MAIN_MENU_STEP } from '../constants/branches';
import { calculateRiskScore } from '../utils/riskCalculator';
import { interpretAssessmentData } from '../utils/reportInterpreter';
import { generateRehabPlan, extractFindingsFromAssessments } from '../utils/rehabGuidance';
import {
  sendChatMessage,
  sendChatMessageStream,
  checkLLMAvailable,
  shouldFallback,
  resetFailureCount,
  getPatientHistory,
  startToolSession,
  submitToolResults,
  getSessionSummary,
  type PatientContext,
  type ChatMessage as AgentChatMessage,
} from '../utils/agentChatService';
import {
  getFollowupReminders,
  setFollowupReminder,
  getNextCheckDate,
} from '../utils/followupStorage';
// Standalone chatbot: no NexusHub stores available.
// ToolBridge sync (scale/vision3/ROM results → backend) is a workbench-only feature.
// In standalone mode, tool invocations are skipped or handled by the parent app.

// ── 工具类型（与 NexusHub AssessmentTool 对齐） ──
export type AgentToolId = 'vision3' | 'comparison' | 'rom' | 'scales' | 'adams_camera' | 'psych';

// ── Agent 视图状态 ──
export type AgentView = 'chat' | 'adams_camera' | 'tool' | 'result';

// ── 延迟配置 ──
const BOT_TYPING_DELAYS = {
  normal: 600,
  short: 300,
  long: 900,
};

// ── 工具名称映射 ──
const TOOL_NAMES: Record<AgentToolId, string> = {
  vision3: '体态评估',
  comparison: '对比变化',
  rom: '关节活动度',
  scales: '功能评估',
  adams_camera: 'Adam前屈测试',
  psych: '心理筛查',
};

// ── Store 状态 ──
interface AgentState {
  // Conversation
  branch: BranchId;
  stepIndex: number;
  messages: ChatMessage[];
  answers: Answers;
  isBotTyping: boolean;
  view: AgentView;

  // Patient context
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  hasHistory: boolean;
  lastAssessmentSummary: string | null;

  // Tool orchestration
  activeTool: AgentToolId | null;
  suggestedTools: AgentToolId[];
  toolResults: Record<string, unknown>;

  // Results
  riskResult: RiskResult | null;
  adamsAutoResult: AdamsAutoResult | null;

  // Follow-up
  hasDueReminder: boolean;

  // LLM integration
  llmAvailable: boolean;
  llmProcessing: boolean;

  // Actions — Lifecycle
  initWithPatient: (id: string, name: string, age?: number | null) => void;
  resetAgent: () => void;

  // Actions — Conversation
  selectBranch: (branch: BranchId) => Promise<void>;
  advanceStep: (answer?: string | number) => Promise<void>;
  setAnswer: (key: string, value: string | number | boolean) => void;
  addMessage: (role: 'bot' | 'user', text: string, imageUrl?: string) => void;
  setBotTyping: (v: boolean) => void;

  // Actions — LLM conversation
  checkLLMStatus: () => Promise<void>;
  sendFreeText: (text: string) => Promise<void>;
  sendFreeTextStream: (text: string) => Promise<void>;
  executeToolFromLLM: (toolId: string, reason?: string) => void;

  // Actions — Branch helpers
  goToMainMenu: () => Promise<void>;

  // Actions — Tool orchestration
  invokeTool: (tool: AgentToolId) => void;
  dismissTool: () => void;
  suggestTools: (tools: AgentToolId[]) => void;

  // Actions — Camera
  openCamera: () => void;
  closeCamera: () => void;
  setAdamsAutoResult: (result: AdamsAutoResult) => void;

  // Actions — Results
  calculateAndShowResult: () => void;

  // Actions — Report interpretation
  interpretReport: (dataType: string, data?: Record<string, unknown>) => Promise<string>;

  // Actions — Rehab guidance
  getRehabPlan: (findings?: Record<string, unknown>) => string;

  // Actions — Follow-up
  setFollowupReminder: (riskLevel: string) => void;
  checkDueReminders: () => void;

  // Getters
  getCurrentStep: () => (typeof BRANCH_FLOWS)[BranchId][number] | undefined;
  getTotalSteps: () => number;
}

// ── 工具函数 ──
function appendBotMessages(
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
  step: { skipCondition?: (answers: Record<string, string | number | boolean>) => boolean },
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

// ── 欢迎消息构建 ──
function buildWelcomeMessage(
  patientName: string,
  hasHistory: boolean,
  hasDueReminder: boolean,
): string {
  // Strip clinical prefix for parent-facing display
  const childName = patientName.replace(/^患者\s*/, '');
  let msg = `你好！我是小柱 🧒，来帮您关注孩子的脊柱健康。\n\n`;
  msg += `我来帮您关注 ${childName} 的脊柱健康。`;
  if (hasHistory) {
    msg += ` 之前有过检查记录，可以帮您对比变化趋势。`;
  }
  if (hasDueReminder) {
    msg += `\n\n⏰ 提醒：该带孩子来复查了哦！`;
  }
  return msg;
}

// ===================================================================
// Store
// ===================================================================
export const useAgentStore = create<AgentState>((set, get) => ({
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
  activeTool: null,
  suggestedTools: [],
  toolResults: {},
  riskResult: null,
  adamsAutoResult: null,
  hasDueReminder: false,
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
    // Check due reminders
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
    get().checkLLMStatus();

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

    // Send welcome after delay
    setTimeout(() => {
      const state = get();
      const welcomeText = buildWelcomeMessage(name, state.hasHistory, state.hasDueReminder);
      set({
        isBotTyping: false,
        messages: [
          {
            id: nanoid(8),
            role: 'bot',
            text: welcomeText,
            timestamp: Date.now(),
          },
        ],
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
      adamsAutoResult: null,
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

    // Type delay
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
        reassess: 'reassess',
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

    // Report sub-options
    if (currentStep.id === 'report_select' && answer && answer !== 'overview') {
      // Will be handled by interpretReport action
    }

    // Follow-up routing
    if (currentStep.id === 'followup_intro') {
      if (answer === 'set_reminder') {
        // Will be handled by setFollowupReminder
      } else {
        // Skip to followup_skip
        const nextIndex = state.stepIndex + 2; // skip confirm, go to skip
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
      // Auto return to main menu
      set({ stepIndex: 0 });
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
      set({ branch: 'main', stepIndex: 0 });
      set((s) => ({ isBotTyping: true }));
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.short));
      set((s) => ({
        isBotTyping: false,
        messages: appendBotMessages(s, MAIN_MENU_STEP.botMessages),
      }));
      return;
    }

    const nextStep = flow[nextIndex];

    // Camera step
    if (nextStep.type === 'camera') {
      set({ stepIndex: nextIndex, isBotTyping: false });
      setTimeout(() => get().openCamera(), 400);
      return;
    }

    // Result step
    if (nextStep.type === 'result') {
      set({ stepIndex: nextIndex });
      await new Promise((r) => setTimeout(r, BOT_TYPING_DELAYS.normal));
      set((s) => ({ isBotTyping: true }));
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
    set((s) => ({ isBotTyping: true }));
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

  // ── Tool orchestration ──
  invokeTool: (tool) => {
    const { patientName, patientAge, toolResults } = get();
    const backendToolId = `invoke_${tool}`;

    // Auto-start backend session if not already started by executeToolFromLLM
    if (patientName && !toolResults._sessionId) {
      startToolSession(backendToolId, patientName, patientAge).then((session) => {
        if (session) {
          set((s) => ({
            toolResults: { ...s.toolResults, _sessionId: session.sessionId, _toolId: backendToolId },
          }));
        }
      });
    }

    // adams_camera 走摄像头视图，不走 tool 视图
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
    const { activeTool, patientName, toolResults, adamsAutoResult, patientAge } = get();
    const sessionId = toolResults._sessionId as string | undefined;
    const backendToolId = (toolResults._toolId as string) || (activeTool ? `invoke_${activeTool}` : '');

    // ── ToolBridge: sync tool results to chatbot backend ──
    // Standalone mode: scales/vision3/ROM stores are workbench-only.
    // Only psych results (stored locally in toolResults) are synced.
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
          // scales / vision3 / rom / adams_camera — NexusHub stores not available in standalone
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

    // ── ToolBridge: sync AdamsCamera result to chatbot backend ──
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
    // Camera dismissed without result (error / manual fallback): auto-skip
    if (currentStep?.type === 'camera' && !state.adamsAutoResult) {
      setTimeout(() => {
        get().advanceStep('已跳过摄像头检测');
      }, 300);
    }
  },

  setAdamsAutoResult: (result) => {
    set({ adamsAutoResult: result });
    const recommendation = result.recommendation;
    // Map to string for answers
    const answerValue =
      recommendation === 'significant_hump'
        ? '明显隆起'
        : recommendation === 'mild_asymmetry'
          ? '轻微不对称'
          : '对称无隆起';
    set((s) => ({
      answers: { ...s.answers, adams_result: answerValue },
    }));
    // Auto advance
    setTimeout(() => get().closeCamera(), 500);
    setTimeout(() => get().advanceStep(answerValue), 800);
  },

  // ── Risk result ──
  calculateAndShowResult: () => {
    const { answers } = get();
    const riskResult = calculateRiskScore(answers);
    set({ riskResult, view: 'result' });
  },

  // ── Report interpretation ──
  interpretReport: async (dataType, data) => {
    const { patientName, patientAge } = get();
    const result = await interpretAssessmentData(
      patientName || '用户',
      patientAge,
      dataType as 'posture' | 'rom' | 'scales' | 'screening' | 'overview',
      data || {},
    );
    return result.interpretation;
  },

  // ── Rehab guidance ──
  getRehabPlan: (assessmentData) => {
    const findings = extractFindingsFromAssessments(
      (assessmentData as Record<string, unknown>)?.posture as Record<string, unknown>,
      (assessmentData as Record<string, unknown>)?.rom as Record<string, unknown>,
      (assessmentData as Record<string, unknown>)?.screening as Record<string, unknown>,
    );
    const plan = generateRehabPlan(findings);
    const text = `${plan.summary}\n\n${plan.suggestions
      .map(
        (s, i) =>
          `**${i + 1}. ${s.title}**\n${s.description}\n频率: ${s.frequency}`,
      )
      .join('\n\n')}\n\n**日常注意：**\n${plan.dailyTips
      .map((t) => `• ${t}`)
      .join('\n')}\n\n${plan.warning}`;
    return text;
  },

  // ── Follow-up ──
  setFollowupReminder: (riskLevel) => {
    const { patientId, patientName } = get();
    if (!patientId) return;
    const nextDate = getNextCheckDate(riskLevel);
    setFollowupReminder({
      patientId,
      patientName,
      nextCheckDate: nextDate,
      riskLevel,
      notes: `建议${patientName}在${nextDate}前后完成下一次复测`,
      createdAt: new Date().toISOString(),
    });
  },

  checkDueReminders: () => {
    const { patientId } = get();
    if (!patientId) return;
    const reminders = getFollowupReminders();
    const hasDue = !!reminders[patientId] && new Date(reminders[patientId].nextCheckDate) <= new Date();
    set({ hasDueReminder: hasDue });
  },

  // ── LLM 状态检测 ──
  checkLLMStatus: async () => {
    const available = await checkLLMAvailable();
    set({ llmAvailable: available });
  },

  // ── 发送自由文本到 LLM ──
  sendFreeText: async (text) => {
    const state = get();
    const { patientName, patientAge, patientId, hasDueReminder, messages } = state;

    // 如果 LLM 已被标记不可用，直接回退
    if (shouldFallback()) {
      set({ llmAvailable: false });
    }

    if (!state.llmAvailable) {
      // 回退到规则引擎：把文本当作选项值尝试匹配
      get().advanceStep(text);
      return;
    }

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      llmProcessing: true,
    }));

    // 构建患者上下文（使用真实的历史评估数据）
    const patientContext: PatientContext = {
      name: patientName || '孩子',
      age: patientAge,
      hasHistory: state.hasHistory,
      hasDueReminder,
      riskLevel: state.riskResult?.level ?? null,
      lastAssessmentSummary: state.lastAssessmentSummary,
    };

    // 转换消息历史（最近 20 条）
    const recentMessages = messages.slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }));
    recentMessages.push({ role: 'user', content: text });

    try {
      const response = await sendChatMessage({
        messages: recentMessages,
        patientContext,
        availableTools: state.suggestedTools,
      });

      if (!response || shouldFallback()) {
        // LLM 不可达 → 回退
        if (shouldFallback()) set({ llmAvailable: false });
        set((s) => ({
          llmProcessing: false,
          messages: [
            ...s.messages,
            {
              id: nanoid(8),
              role: 'bot',
              text: '小柱暂时无法连接，让我用另一种方式帮您。',
              timestamp: Date.now(),
            },
          ],
        }));
        // 切回规则引擎
        get().advanceStep(text);
        return;
      }

      resetFailureCount();

      // 添加 LLM 回复
      set((s) => ({
        llmProcessing: false,
        messages: [
          ...s.messages,
          {
            id: nanoid(8),
            role: 'bot',
            text: response.content,
            timestamp: Date.now(),
            // 如果有 tool_call，附带在消息上供 UI 渲染 ToolConfirmCard
            ...(response.toolCall
              ? { toolCall: response.toolCall }
              : {}),
          },
        ],
      }));
    } catch {
      set({ llmProcessing: false });
      get().advanceStep(text);
    }
  },

  // ── 发送自由文本到 LLM（WebSocket 流式） ──
  sendFreeTextStream: async (text) => {
    const state = get();
    const { patientName, patientAge, hasDueReminder, messages } = state;

    if (shouldFallback()) {
      set({ llmAvailable: false });
    }

    if (!state.llmAvailable) {
      get().advanceStep(text);
      return;
    }

    // 添加用户消息
    const botMsgId = nanoid(8);
    const userMsg: ChatMessage = {
      id: nanoid(8),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    set((s) => ({
      llmProcessing: true,
      // 添加用户消息 + 空的 bot 消息占位，后续流式填充
      messages: [
        ...s.messages,
        userMsg,
        {
          id: botMsgId,
          role: 'bot',
          text: '',
          timestamp: Date.now(),
        },
      ],
    }));

    const patientContext: PatientContext = {
      name: patientName || '孩子',
      age: patientAge,
      hasHistory: state.hasHistory,
      hasDueReminder,
      riskLevel: state.riskResult?.level ?? null,
      lastAssessmentSummary: state.lastAssessmentSummary,
    };

    const recentMessages = messages.slice(-20).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }));
    recentMessages.push({ role: 'user', content: text });

    const stream = sendChatMessageStream(
      {
        messages: recentMessages,
        patientContext,
        availableTools: state.suggestedTools as AgentToolId[],
      },
      {
        onToken: (token) => {
          // 流式追加 token 到当前 bot 消息
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === botMsgId ? { ...m, text: m.text + token } : m,
            ),
          }));
        },
        onDone: (result) => {
          resetFailureCount();
          set((s) => ({
            llmProcessing: false,
            messages: s.messages.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: result.content || m.text,
                    ...(result.toolCall ? { toolCall: result.toolCall } : {}),
                  }
                : m,
            ),
          }));
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

    // 存储 stream 引用以便取消（简化版：不实现取消）
  },

  // ── 执行 LLM 请求的工具调用 ──
  executeToolFromLLM: (toolId, reason) => {
    // 去掉可能的 invoke_ 前缀
    const cleanId = toolId.replace(/^invoke_/, '');

    // Route to fullscreen tool — invokeTool/openCamera will auto-start backend session
    if (['vision3', 'rom', 'scales', 'comparison'].includes(cleanId)) {
      get().invokeTool(cleanId as AgentToolId);
    } else if (cleanId === 'adams_camera') {
      // For adams_camera: start backend session then open camera
      const { patientName, patientAge, toolResults } = get();
      const backendToolId = 'invoke_adams_camera';
      if (patientName && !toolResults._sessionId) {
        startToolSession(backendToolId, patientName, patientAge).then((session) => {
          if (session) {
            set((s) => ({
              toolResults: { ...s.toolResults, _sessionId: session.sessionId, _toolId: backendToolId },
            }));
          }
        });
      }
      get().openCamera();
    } else if (cleanId === 'psych') {
      get().invokeTool('psych');
    } else {
      console.warn('[AgentStore] Unknown LLM tool call:', toolId);
    }
  },
}));

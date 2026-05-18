import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ChatMessage, Answers, RiskResult, ChatbotView } from '../types';
import { CHATBOT_FLOW } from '../constants/flow';
import { QUESTIONS } from '../constants/questions';
import { calculateRiskScore } from '../utils/riskCalculator';

// ── 延迟配置（模拟自然对话节奏） ──
const BOT_TYPING_DELAYS = {
  normal: 500,
  short: 300,
  long: 800,
};

// ── Store 状态 ──
interface ChatbotState {
  // Core state
  patientId: string;
  patientName: string;
  stepIndex: number;
  answers: Answers;
  messages: ChatMessage[];
  isBotTyping: boolean;
  isCameraActive: boolean;
  isComplete: boolean;
  view: ChatbotView;
  riskResult: RiskResult | null;

  // Actions
  setPatient: (id: string, name: string) => void;
  startFlow: () => void;
  advanceStep: (answer?: string | number) => Promise<void>;
  setAnswer: (key: string, value: string | number | boolean) => void;
  addMessage: (role: 'bot' | 'user', text: string, imageUrl?: string) => void;
  setBotTyping: (v: boolean) => void;
  openCamera: () => void;
  closeCamera: () => void;
  calculateAndShowResult: () => void;
  setAdamsAutoResult: (result: 'significant_hump' | 'mild_asymmetry' | 'symmetrical') => void;
  resetFlow: () => void;
  getCurrentStep: () => (typeof CHATBOT_FLOW)[number] | undefined;
  getTotalSteps: () => number;
}

// ── 工具函数：添加 bot 消息 ──
function appendBotMessages(
  state: ChatbotState,
  messages: string[],
  imageUrl?: string,
): ChatMessage[] {
  const newMessages = messages.map((text) => ({
    id: nanoid(8),
    role: 'bot' as const,
    text,
    timestamp: Date.now(),
    ...(imageUrl ? { imageUrl } : {}),
  }));
  return [...state.messages, ...newMessages];
}

// ── 工具函数：判断步骤是否应跳过 ──
function shouldSkipStep(
  step: (typeof CHATBOT_FLOW)[number],
  answers: Answers,
): boolean {
  if (step.skipCondition) {
    return step.skipCondition(answers);
  }
  return false;
}

// ── 工具函数：找到下一步（跳过被跳过的步骤） ──
function findNextStepIndex(
  currentIndex: number,
  answers: Answers,
): number {
  let nextIndex = currentIndex + 1;
  while (nextIndex < CHATBOT_FLOW.length) {
    const step = CHATBOT_FLOW[nextIndex];
    if (!shouldSkipStep(step, answers)) {
      return nextIndex;
    }
    nextIndex++;
  }
  return nextIndex; // 可能等于 length（所有步骤完成）
}

/**
 * 自我早筛 Chatbot 状态管理
 *
 * 驱动 18 步对话流程，管理消息历史、用户答案、风险评分。
 * 支持条件跳过（青春期生长、疼痛程度、摄像头回退）。
 */
export const useChatbotStore = create<ChatbotState>((set, get) => ({
  // ── 初始状态 ──
  patientId: '',
  patientName: '',
  stepIndex: 0,
  answers: {},
  messages: [],
  isBotTyping: false,
  isCameraActive: false,
  isComplete: false,
  view: 'chat',
  riskResult: null,

  // ── 设置患者 ──
  setPatient: (id, name) => set({ patientId: id, patientName: name }),

  // ── 获取当前步骤 ──
  getCurrentStep: () => {
    const { stepIndex } = get();
    return CHATBOT_FLOW[stepIndex];
  },

  // ── 获取总步骤数 ──
  getTotalSteps: () => CHATBOT_FLOW.length,

  // ── 添加消息 ──
  addMessage: (role, text, imageUrl) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: nanoid(8),
          role,
          text,
          timestamp: Date.now(),
          ...(imageUrl ? { imageUrl } : {}),
        },
      ],
    }));
  },

  // ── 设置 bot 打字状态 ──
  setBotTyping: (v) => set({ isBotTyping: v }),

  // ── 设置答案 ──
  setAnswer: (key, value) => {
    set((state) => ({
      answers: { ...state.answers, [key]: value },
    }));
  },

  // ── 开启摄像头 ──
  openCamera: () => set({ view: 'adams_camera', isCameraActive: true }),

  // ── 关闭摄像头 ──
  closeCamera: () => set({ view: 'chat', isCameraActive: false }),

  // ── 计算并显示结果 ──
  calculateAndShowResult: () => {
    const { answers } = get();
    const riskResult = calculateRiskScore(answers);
    const doneMessages = QUESTIONS.done(riskResult.levelLabel);

    set((state) => ({
      riskResult,
      view: 'result',
      messages: [
        ...state.messages,
        ...doneMessages.map((text) => ({
          id: nanoid(8),
          role: 'bot' as const,
          text,
          timestamp: Date.now(),
        })),
      ],
    }));
  },

  // ── 设置 Adam's 自动检测结果 ──
  setAdamsAutoResult: (result) => {
    set((state) => ({
      answers: { ...state.answers, adams_result: result },
    }));
  },

  // ── 开始流程 ──
  startFlow: () => {
    const firstStep = CHATBOT_FLOW[0];
    set({
      stepIndex: 0,
      answers: {},
      messages: [],
      isBotTyping: false,
      isCameraActive: false,
      isComplete: false,
      view: 'chat',
      riskResult: null,
    });

    // 延迟发送第一条 bot 消息
    setTimeout(() => {
      set({
        isBotTyping: true,
      });
      setTimeout(() => {
        set((state) => ({
          isBotTyping: false,
          messages: appendBotMessages(state, firstStep.botMessages, firstStep.imageUrl),
        }));
      }, BOT_TYPING_DELAYS.normal);
    }, 200);
  },

  // ── 推进步骤 ──
  advanceStep: async (answer) => {
    const state = get();
    const currentStep = CHATBOT_FLOW[state.stepIndex];
    if (!currentStep) return;

    // 1. 记录用户回答
    if (answer !== undefined && answer !== null && currentStep.questionKey) {
      set((s) => ({
        answers: { ...s.answers, [currentStep.questionKey!]: answer },
      }));
    }

    // 2. 添加用户消息
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

    // 3. 找到下一步
    const nextIndex = findNextStepIndex(state.stepIndex, {
      ...state.answers,
      ...(currentStep.questionKey ? { [currentStep.questionKey]: answer } : {}),
    });

    // 4. 检查是否完成
    if (nextIndex >= CHATBOT_FLOW.length) {
      set({ isComplete: true });
      return;
    }

    const nextStep = CHATBOT_FLOW[nextIndex];

    // 5. 处理摄像头步骤
    if (nextStep.type === 'camera') {
      set({ stepIndex: nextIndex, isBotTyping: false });
      // 短暂延迟后打开摄像头
      setTimeout(() => {
        get().openCamera();
      }, 400);
      return;
    }

    // 6. 处理 auto 步骤（Adam's 结果已由摄像头自动填入）
    if (nextStep.type === 'auto') {
      const updatedAnswers = get().answers;
      const adamsResult = updatedAnswers.adams_result as string | undefined;

      // 构建结果消息
      let resultMessages: string[];
      if (adamsResult === 'significant_hump') {
        resultMessages = QUESTIONS.adams_result_detected('significant_hump');
      } else if (adamsResult === 'mild_asymmetry') {
        resultMessages = QUESTIONS.adams_result_detected('mild_asymmetry');
      } else {
        // 如果摄像头模式但没有自动结果（回退），或人工模式，需要人工选择
        // 这里先跳过，去下一步
        resultMessages = ['好的，已记录。'];
      }

      set({ stepIndex: nextIndex });

      // Bot 打字 → 显示结果
      setTimeout(() => {
        set({ isBotTyping: true });
        setTimeout(() => {
          set((s) => ({
            isBotTyping: false,
            messages: appendBotMessages(s, resultMessages),
          }));
        }, BOT_TYPING_DELAYS.short);
      }, BOT_TYPING_DELAYS.normal);

      // 继续推进到 results 步骤
      setTimeout(() => {
        const currentState = get();
        const afterAutoIndex = findNextStepIndex(currentState.stepIndex, currentState.answers);
        if (afterAutoIndex < CHATBOT_FLOW.length) {
          const afterAutoStep = CHATBOT_FLOW[afterAutoIndex];
          if (afterAutoStep.type === 'result') {
            set({ stepIndex: afterAutoIndex });
            // 延迟展示结果
            setTimeout(() => {
              set({ isBotTyping: true });
              setTimeout(() => {
                set((s) => ({
                  isBotTyping: false,
                  messages: appendBotMessages(s, afterAutoStep.botMessages),
                }));
                get().calculateAndShowResult();
              }, BOT_TYPING_DELAYS.normal);
            }, BOT_TYPING_DELAYS.long);
          }
        }
      }, BOT_TYPING_DELAYS.long + 200);

      return;
    }

    // 7. 处理 result 步骤
    if (nextStep.type === 'result') {
      set({ stepIndex: nextIndex });
      setTimeout(() => {
        set({ isBotTyping: true });
        setTimeout(() => {
          set((s) => ({
            isBotTyping: false,
            messages: appendBotMessages(s, nextStep.botMessages),
          }));
          get().calculateAndShowResult();
        }, BOT_TYPING_DELAYS.normal);
      }, BOT_TYPING_DELAYS.normal);
      return;
    }

    // 8. 常规步骤：bot 打字 → 显示消息
    set({ stepIndex: nextIndex });
    setTimeout(() => {
      set({ isBotTyping: true });
      setTimeout(() => {
        set((s) => ({
          isBotTyping: false,
          messages: appendBotMessages(s, nextStep.botMessages, nextStep.imageUrl),
        }));
      }, BOT_TYPING_DELAYS.normal);
    }, BOT_TYPING_DELAYS.normal);
  },

  // ── 重置流程 ──
  resetFlow: () => {
    set({
      stepIndex: 0,
      answers: {},
      messages: [],
      isBotTyping: false,
      isCameraActive: false,
      isComplete: false,
      view: 'chat',
      riskResult: null,
    });
    get().startFlow();
  },
}));

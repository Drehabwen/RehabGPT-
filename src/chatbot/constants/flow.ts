import type { FlowStep } from '../types';
import { QUESTIONS, OPTIONS } from './questions';

/**
 * 自我早筛 Chatbot 对话流程（18 步）
 *
 * 步骤类型：
 *   bot_message  — 纯 bot 消息 + 按钮（继续/确认）
 *   user_text    — 文本输入（姓名）
 *   user_choice  — 选项按钮
 *   user_number  — 数字输入（年龄）
 *   user_slider  — 滑块（VAS 疼痛评分）
 *   camera       — 摄像头覆盖层
 *   result       — 结果展示
 *   auto         — 自动步骤（Adam's 检测结果自动填入）
 */
export const CHATBOT_FLOW: FlowStep[] = [
  // ── Step 1: 欢迎 ──
  {
    id: 'greeting',
    type: 'bot_message',
    botMessages: QUESTIONS.greeting,
    options: OPTIONS.start,
  },

  // ── Step 2: 姓名 ──
  {
    id: 'name',
    type: 'user_text',
    botMessages: QUESTIONS.name,
    questionKey: 'name',
    inputPlaceholder: '请输入你的名字或昵称',
  },

  // ── Step 3: 性别 ──
  {
    id: 'gender',
    type: 'user_choice',
    botMessages: QUESTIONS.gender,
    questionKey: 'gender',
    options: OPTIONS.gender,
  },

  // ── Step 4: 年龄 ──
  {
    id: 'age',
    type: 'user_number',
    botMessages: QUESTIONS.age,
    questionKey: 'age',
    inputPlaceholder: '请输入年龄',
    numberMin: 3,
    numberMax: 99,
  },

  // ── Step 5: 生长速度（条件：10-18 岁） ──
  {
    id: 'growth_spurt',
    type: 'user_choice',
    botMessages: QUESTIONS.growth_spurt,
    questionKey: 'growth_spurt',
    options: OPTIONS.growth_spurt,
    skipCondition: (answers) => {
      const age = Number(answers.age);
      return age < 10 || age > 18;
    },
  },

  // ── Step 6: 家族史 ──
  {
    id: 'family_scoliosis',
    type: 'user_choice',
    botMessages: QUESTIONS.family_scoliosis,
    questionKey: 'family_scoliosis',
    options: OPTIONS.family_scoliosis,
  },

  // ── Step 7: 背痛频率 ──
  {
    id: 'back_pain',
    type: 'user_choice',
    botMessages: QUESTIONS.back_pain,
    questionKey: 'back_pain',
    options: OPTIONS.back_pain,
  },

  // ── Step 8: 疼痛程度（条件：有疼痛） ──
  {
    id: 'pain_level',
    type: 'user_slider',
    botMessages: QUESTIONS.pain_level,
    questionKey: 'pain_level',
    sliderMin: 0,
    sliderMax: 10,
    sliderStep: 1,
    sliderLabels: [
      { value: 0, label: '不疼' },
      { value: 5, label: '中等' },
      { value: 10, label: '极疼' },
    ],
    skipCondition: (answers) => answers.back_pain === '从不疼',
  },

  // ── Step 9: 肩膀对称 ──
  {
    id: 'posture_shoulders',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_shoulders,
    questionKey: 'posture_shoulders',
    options: OPTIONS.posture,
  },

  // ── Step 10: 肩胛对称 ──
  {
    id: 'posture_scapula',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_scapula,
    questionKey: 'posture_scapula',
    options: OPTIONS.posture_scapula,
  },

  // ── Step 11: 腰部对称 ──
  {
    id: 'posture_waist',
    type: 'user_choice',
    botMessages: QUESTIONS.posture_waist,
    questionKey: 'posture_waist',
    options: OPTIONS.posture_waist,
  },

  // ── Step 12: Adam's 测试介绍 ──
  {
    id: 'adams_intro',
    type: 'bot_message',
    botMessages: QUESTIONS.adams_intro,
    options: OPTIONS.adams_ready,
  },

  // ── Step 13: Adam's 测试方式选择 ──
  {
    id: 'adams_method',
    type: 'user_choice',
    botMessages: QUESTIONS.adams_method,
    questionKey: 'adams_method',
    options: OPTIONS.adams_method,
  },

  // ── Step 14: 摄像头采集（条件：选择摄像头） ──
  {
    id: 'adams_camera',
    type: 'camera',
    botMessages: QUESTIONS.adams_camera,
    skipCondition: (answers) => answers.adams_method !== '用摄像头拍',
  },

  // ── Step 15: Adam's 结果（自动 or 人工） ──
  {
    id: 'adams_result',
    type: 'auto',
    botMessages: ['分析中...'],
    questionKey: 'adams_result',
    // 不用摄像头时，人工选择
  },

  // ── Step 16: 结果展示 ──
  {
    id: 'results',
    type: 'result',
    botMessages: QUESTIONS.results,
    options: OPTIONS.result_ack,
  },

  // ── Step 17: 保存确认 ──
  {
    id: 'confirmation',
    type: 'user_choice',
    botMessages: QUESTIONS.confirmation,
    questionKey: 'save_result',
    options: OPTIONS.confirmation,
  },

  // ── Step 18: 完成 ──
  {
    id: 'done',
    type: 'bot_message',
    botMessages: ['筛查完成！'],
    options: OPTIONS.done,
  },
];

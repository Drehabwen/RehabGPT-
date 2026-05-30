/**
 * 对话系统全面压力测试套件
 *
 * 测试范围：
 * 1. 规则引擎对话流程（chatbot + agent 双模式）
 * 2. 风险评分计算边界
 * 3. 系统提示词生成性能
 * 4. 分支路由逻辑
 * 5. 状态转换一致性
 * 6. 边界条件与异常输入
 */

import { describe, it, expect, bench } from 'vitest';
import { CHATBOT_FLOW } from '../constants/flow';
import { BRANCH_FLOWS, type BranchId } from '../constants/branches';
import { calculateRiskScore } from '../utils/riskCalculator';
import { buildSystemPrompt, buildUserMessage, type LLMContext } from '../prompts/adaptiveSystemPrompt';
import { buildWelcomeMessage } from '../prompts';
import type { Answers, RiskResult } from '../types';

// =============================================================================
// 测试数据生成器
// =============================================================================

function generateRandomAnswer(key: string, stepType: string): string | number {
  switch (stepType) {
    case 'user_text':
      return `测试用户_${Math.random().toString(36).substring(2, 8)}`;
    case 'user_number':
      return Math.floor(Math.random() * 90) + 3;
    case 'user_slider':
      return Math.floor(Math.random() * 11);
    case 'user_choice': {
      const choices: Record<string, string[]> = {
        gender: ['男', '女'],
        growth_spurt: ['长得挺快', '一般', '基本没长'],
        family_scoliosis: ['有', '没有', '不确定'],
        back_pain: ['经常疼', '偶尔会疼', '从不疼'],
        posture_shoulders: ['一样高', '右肩高', '左肩高', '看不出来'],
        posture_scapula: ['对称', '一侧更突出', '看不出来'],
        posture_waist: ['对称', '一侧更深', '看不出来'],
        adams_method: ['用摄像头拍', '家人在旁边帮我', '先跳过'],
        adams_result: ['明显隆起', '轻微不对称', '对称无隆起'],
        save_result: ['保存结果', '不用了'],
      };
      const options = choices[key] || ['选项A', '选项B', '选项C'];
      return options[Math.floor(Math.random() * options.length)];
    }
    default:
      return 'ok';
  }
}

function generateCompleteAnswers(override: Partial<Answers> = {}): Answers {
  return {
    name: '测试孩子',
    gender: '女',
    age: 13,
    growth_spurt: '长得挺快',
    family_scoliosis: '有',
    back_pain: '经常疼',
    pain_level: 8,
    posture_shoulders: '右肩高',
    posture_scapula: '一侧更突出',
    posture_waist: '一侧更深',
    adams_method: '用摄像头拍',
    adams_result: '明显隆起',
    ...override,
  };
}

function generateLowRiskAnswers(): Answers {
  return {
    name: '测试孩子',
    gender: '男',
    age: 8,
    growth_spurt: '基本没长',
    family_scoliosis: '没有',
    back_pain: '从不疼',
    posture_shoulders: '一样高',
    posture_scapula: '对称',
    posture_waist: '对称',
    adams_method: '先跳过',
    adams_result: '对称无隆起',
  };
}

// =============================================================================
// 1. 风险评分计算压力测试
// =============================================================================

describe('RiskCalculator Stress Tests', () => {
  it('应正确计算最高风险评分（所有高危因子）', () => {
    const answers = generateCompleteAnswers();
    const result = calculateRiskScore(answers);

    expect(result.total).toBeGreaterThan(100);
    expect(result.level).toBe('high');
    expect(result.levelLabel).toBe('高风险');
    expect(result.color).toBe('red');
    expect(result.urgency).toBe('urgent');
  });

  it('应正确计算最低风险评分（所有低危因子）', () => {
    const answers = generateLowRiskAnswers();
    const result = calculateRiskScore(answers);

    expect(result.total).toBeLessThanOrEqual(20);
    expect(result.level).toBe('low');
    expect(result.levelLabel).toBe('低风险');
    expect(result.color).toBe('green');
  });

  it('应正确处理边界年龄（10岁和18岁）', () => {
    const age10 = calculateRiskScore({
      ...generateCompleteAnswers(),
      age: 10,
    });
    const age18 = calculateRiskScore({
      ...generateCompleteAnswers(),
      age: 18,
    });

    expect(age10.factors.growthRisk).toBeGreaterThanOrEqual(15);
    expect(age18.factors.growthRisk).toBeGreaterThanOrEqual(10);
  });

  it('应正确处理缺失答案（默认回退）', () => {
    const emptyAnswers: Answers = {};
    const result = calculateRiskScore(emptyAnswers);

    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.level).toBeDefined();
    expect(result.factors).toBeDefined();
  });

  it('应正确处理疼痛跳过（从不疼时pain_level应为0）', () => {
    const answers = generateCompleteAnswers({
      back_pain: '从不疼',
      pain_level: 9,
    });
    const result = calculateRiskScore(answers);

    expect(result.factors.backPain).toBe(0);
    expect(result.factors.painSeverity).toBe(0);
  });

  it('应正确评分各种Adams结果', () => {
    const significant = calculateRiskScore({
      ...generateCompleteAnswers(),
      adams_result: '明显隆起',
    });
    const mild = calculateRiskScore({
      ...generateCompleteAnswers(),
      adams_result: '轻微不对称',
    });
    const normal = calculateRiskScore({
      ...generateCompleteAnswers(),
      adams_result: '对称无隆起',
    });
    const skipped = calculateRiskScore({
      ...generateCompleteAnswers(),
      adams_result: 'skipped',
    });

    expect(significant.factors.adams).toBe(30);
    expect(mild.factors.adams).toBe(15);
    expect(normal.factors.adams).toBe(0);
    expect(skipped.factors.adams).toBe(10);
  });

  it('应正确评分体态不对称组合', () => {
    const twoAsymmetries = calculateRiskScore({
      posture_shoulders: '右肩高',
      posture_scapula: '一侧更突出',
      posture_waist: '对称',
    });
    const oneAsymmetry = calculateRiskScore({
      posture_shoulders: '一样高',
      posture_scapula: '一侧更突出',
      posture_waist: '对称',
    });
    const none = calculateRiskScore({
      posture_shoulders: '一样高',
      posture_scapula: '对称',
      posture_waist: '对称',
    });

    expect(twoAsymmetries.factors.postureAsymmetry).toBe(25);
    expect(oneAsymmetry.factors.postureAsymmetry).toBe(10);
    expect(none.factors.postureAsymmetry).toBe(0);
  });

  it('应生成正确的风险等级边界值', () => {
    const lowBoundary = calculateRiskScore({
      ...generateLowRiskAnswers(),
      age: 20,
      growth_spurt: '基本没长',
      family_scoliosis: '没有',
      back_pain: '从不疼',
      adams_result: '对称无隆起',
    });

    expect(lowBoundary.total).toBeLessThanOrEqual(20);
    expect(lowBoundary.level).toBe('low');
  });
});

// =============================================================================
// 2. 对话流程完整性测试
// =============================================================================

describe('Chatbot Flow Completeness Tests', () => {
  it('CHATBOT_FLOW 应包含所有必需的步骤ID', () => {
    const requiredIds = [
      'greeting', 'name', 'gender', 'age', 'growth_spurt',
      'family_scoliosis', 'back_pain', 'pain_level',
      'posture_shoulders', 'posture_scapula', 'posture_waist',
      'adams_intro', 'adams_method', 'adams_camera',
      'adams_result', 'results', 'confirmation', 'done',
    ];

    const flowIds = CHATBOT_FLOW.map((s) => s.id);
    for (const id of requiredIds) {
      expect(flowIds).toContain(id);
    }
  });

  it('每个步骤应有正确的类型定义', () => {
    const validTypes = [
      'bot_message', 'user_text', 'user_choice', 'user_number',
      'user_slider', 'camera', 'result', 'auto',
    ];

    for (const step of CHATBOT_FLOW) {
      expect(validTypes).toContain(step.type);
    }
  });

  it('user_choice 步骤应有选项', () => {
    for (const step of CHATBOT_FLOW) {
      if (step.type === 'user_choice') {
        expect(step.options).toBeDefined();
        expect(step.options!.length).toBeGreaterThan(0);
      }
    }
  });

  it('questionKey 在需要记录的步骤中应存在', () => {
    for (const step of CHATBOT_FLOW) {
      if (['user_text', 'user_choice', 'user_number', 'user_slider'].includes(step.type)) {
        expect(step.questionKey).toBeDefined();
        expect(step.questionKey).not.toBe('');
      }
    }
  });

  it('条件跳过逻辑应正确配置', () => {
    const growthStep = CHATBOT_FLOW.find((s) => s.id === 'growth_spurt');
    expect(growthStep?.skipCondition).toBeDefined();
    expect(growthStep?.skipCondition?.({ age: 8 })).toBe(true);
    expect(growthStep?.skipCondition?.({ age: 12 })).toBe(false);

    const painStep = CHATBOT_FLOW.find((s) => s.id === 'pain_level');
    expect(painStep?.skipCondition?.({ back_pain: '从不疼' })).toBe(true);
    expect(painStep?.skipCondition?.({ back_pain: '经常疼' })).toBe(false);

    const cameraStep = CHATBOT_FLOW.find((s) => s.id === 'adams_camera');
    expect(cameraStep?.skipCondition?.({ adams_method: '先跳过' })).toBe(true);
    expect(cameraStep?.skipCondition?.({ adams_method: '用摄像头拍' })).toBe(false);
  });
});

// =============================================================================
// 3. Agent 分支流程测试
// =============================================================================

describe('Agent Branch Flow Tests', () => {
  const branches: BranchId[] = ['main', 'reassess', 'report', 'rehab', 'followup'];

  it('所有分支应定义流程', () => {
    for (const branch of branches) {
      const flow = BRANCH_FLOWS[branch];
      expect(flow).toBeDefined();
      expect(flow.length).toBeGreaterThan(0);
    }
  });

  it('main 分支应以欢迎消息开始', () => {
    const mainFlow = BRANCH_FLOWS.main;
    expect(mainFlow[0].id).toBe('welcome');
    expect(mainFlow[0].type).toBe('bot_message');
  });

  it('reassess 分支应包含核心筛查步骤', () => {
    const reassessIds = BRANCH_FLOWS.reassess.map((s) => s.id);
    expect(reassessIds).toContain('growth_spurt');
    expect(reassessIds).toContain('family_scoliosis');
    expect(reassessIds).toContain('posture_shoulders');
    expect(reassessIds).toContain('results');
  });

  it('report 分支应有数据解读子选项', () => {
    const reportFlow = BRANCH_FLOWS.report;
    const selectStep = reportFlow.find((s) => s.id === 'report_select');
    expect(selectStep).toBeDefined();
    expect(selectStep?.options?.length).toBeGreaterThanOrEqual(4);
  });

  it('rehab 分支应包含训练建议', () => {
    const rehabFlow = BRANCH_FLOWS.rehab;
    expect(rehabFlow.some((s) => s.botMessages.some((m) => m.includes('训练')))).toBe(true);
  });

  it('followup 分支应有提醒设置选项', () => {
    const followupFlow = BRANCH_FLOWS.followup;
    const introStep = followupFlow.find((s) => s.id === 'followup_intro');
    expect(introStep?.options?.some((o) => o.value === 'set_reminder')).toBe(true);
  });
});

// =============================================================================
// 4. 系统提示词压力测试
// =============================================================================

describe('System Prompt Stress Tests', () => {
  const baseContext: LLMContext = {
    patientName: '小明',
    patientAge: 8,
    patientGender: '男',
    phase: 'greeting',
    stepIndex: 0,
    totalSteps: 5,
    hasHistory: false,
    hasDueReminder: false,
    availableTools: ['vision3', 'adams_camera'],
    currentDate: '2026-05-29',
    pendingScale: null,
  };

  it('应生成包含所有核心部分的系统提示词', () => {
    const prompt = buildSystemPrompt(baseContext);

    expect(prompt.length).toBeGreaterThan(1000);
    expect(prompt).toContain('小柱');
    expect(prompt).toContain('角色设定');
    expect(prompt).toContain('临床肖像');
    expect(prompt).toContain('知识库');
    expect(prompt).toContain('安全红线');
  });

  it('应针对高危患者生成增强警告', () => {
    const highRiskContext: LLMContext = {
      ...baseContext,
      patientAge: 13,
      patientGender: '女',
      answers: {
        growth_spurt: '长得挺快',
        family_scoliosis: '有',
      },
    };

    const prompt = buildSystemPrompt(highRiskContext);
    expect(prompt).toContain('高危高发年龄段');
    expect(prompt).toContain('女孩侧弯进展风险');
    expect(prompt).toContain('遗传发病率');
  });

  it('应针对疼痛症状生成MRI警告', () => {
    const painContext: LLMContext = {
      ...baseContext,
      answers: {
        back_pain: '经常疼',
        pain_level: 9,
      },
    };

    const prompt = buildSystemPrompt(painContext);
    expect(prompt).toContain('MRI');
    expect(prompt).toContain('背痛警示线');
  });

  it('应正确处理待填量表上下文', () => {
    const scaleContext: LLMContext = {
      ...baseContext,
      pendingScale: {
        taskId: 'task-test',
        sessionId: 'session-test',
        scaleId: 'SRS-22',
      },
    };

    const prompt = buildSystemPrompt(scaleContext);
    expect(prompt).toContain('SRS-22');
    expect(prompt).toContain('待填量表');
    expect(prompt).toContain('量表下发辅导指令');
  });

  it('应包含风险结果解读', () => {
    const resultContext: LLMContext = {
      ...baseContext,
      phase: 'result_review',
      riskResult: calculateRiskScore(generateCompleteAnswers()),
    };

    const prompt = buildSystemPrompt(resultContext);
    expect(prompt).toContain('风险等级');
    expect(prompt).toContain('综合评分');
  });

  it('应包含摄像头分析结果', () => {
    const cameraContext: LLMContext = {
      ...baseContext,
      adamsResult: {
        shoulderAsymmetry: 0.15,
        hipAsymmetry: 0.08,
        asymmetryRatio: 0.23,
        ribHumpDetected: true,
        confidence: 'high',
        recommendation: 'significant_hump',
      },
    };

    const prompt = buildSystemPrompt(cameraContext);
    expect(prompt).toContain('摄像头');
    expect(prompt).toContain('剃刀背');
  });

  it('buildUserMessage 应正确包装用户输入', () => {
    const msg = buildUserMessage('孩子背有点疼', baseContext);
    expect(msg).toContain('家长发来的话');
    expect(msg).toContain('孩子背有点疼');
  });
});

// =============================================================================
// 5. 欢迎消息测试
// =============================================================================

describe('Welcome Message Tests', () => {
  it('应生成基础欢迎消息', () => {
    const msgs = buildWelcomeMessage({
      patientName: '小红',
      hasHistory: false,
      hasDueReminder: false,
    });

    expect(msgs.length).toBeGreaterThanOrEqual(2);
    expect(msgs[0]).toContain('小柱');
    expect(msgs[1]).toContain('小红');
  });

  it('有历史记录时应提及', () => {
    const msgs = buildWelcomeMessage({
      patientName: '小明',
      hasHistory: true,
      hasDueReminder: false,
    });

    expect(msgs.some((m) => m.includes('历史') || m.includes('记录'))).toBe(true);
  });

  it('有到期提醒时应显示提醒', () => {
    const msgs = buildWelcomeMessage({
      patientName: '小明',
      hasHistory: false,
      hasDueReminder: true,
    });

    expect(msgs.some((m) => m.includes('复查'))).toBe(true);
  });
});

// =============================================================================
// 6. 边界条件与异常输入测试
// =============================================================================

describe('Edge Case & Invalid Input Tests', () => {
  it('应处理极端年龄值', () => {
    const age3 = calculateRiskScore({ age: 3 });
    const age99 = calculateRiskScore({ age: 99 });
    const ageNegative = calculateRiskScore({ age: -5 });

    expect(age3.total).toBeDefined();
    expect(age99.total).toBeDefined();
    expect(ageNegative.total).toBeDefined();
  });

  it('应处理非数字年龄', () => {
    const result = calculateRiskScore({ age: '不是数字' as any });
    expect(result.total).toBeDefined();
    expect(result.factors.growthRisk).toBe(5);
  });

  it('应处理空字符串答案', () => {
    const result = calculateRiskScore({
      family_scoliosis: '',
      back_pain: '',
      adams_result: '',
    });

    expect(result.total).toBeDefined();
    expect(result.level).toBeDefined();
  });

  it('应处理null和undefined值', () => {
    const result = calculateRiskScore({
      family_scoliosis: null as any,
      back_pain: undefined,
      adams_result: null as any,
    });

    expect(result.total).toBeDefined();
  });

  it('应处理超大疼痛值', () => {
    const result = calculateRiskScore({ pain_level: 999 });
    expect(result.factors.painSeverity).toBe(25);
  });

  it('应处理负疼痛值', () => {
    const result = calculateRiskScore({ pain_level: -5 });
    expect(result.factors.painSeverity).toBe(0);
  });
});

// =============================================================================
// 7. 性能基准测试
// =============================================================================

describe('Performance Benchmarks', () => {
  bench('风险评分计算 - 1000次', () => {
    for (let i = 0; i < 1000; i++) {
      calculateRiskScore(generateCompleteAnswers());
    }
  });

  bench('系统提示词生成 - 100次', () => {
    const ctx: LLMContext = {
      patientName: '测试',
      patientAge: 12,
      patientGender: '女',
      phase: 'screening',
      stepIndex: 3,
      totalSteps: 12,
      hasHistory: true,
      hasDueReminder: true,
      availableTools: ['vision3', 'rom', 'scales', 'adams_camera', 'psych'],
      currentDate: '2026-05-29',
      answers: generateCompleteAnswers(),
      riskResult: calculateRiskScore(generateCompleteAnswers()),
      pendingScale: {
        taskId: 'task-1',
        sessionId: 'session-1',
        scaleId: 'SRS-22',
      },
    };

    for (let i = 0; i < 100; i++) {
      buildSystemPrompt(ctx);
    }
  });

  bench('欢迎消息生成 - 10000次', () => {
    for (let i = 0; i < 10000; i++) {
      buildWelcomeMessage({
        patientName: `用户${i}`,
        hasHistory: i % 2 === 0,
        hasDueReminder: i % 3 === 0,
      });
    }
  });
});

// =============================================================================
// 8. 对话模拟器（完整流程遍历）
// =============================================================================

describe('Conversation Simulator', () => {
  it('应能模拟完整的chatbot筛查流程', () => {
    const answers: Answers = {};
    const messages: string[] = [];

    for (let i = 0; i < CHATBOT_FLOW.length; i++) {
      const step = CHATBOT_FLOW[i];

      // 记录bot消息
      messages.push(...step.botMessages);

      // 跳过条件检查
      if (step.skipCondition?.(answers)) {
        continue;
      }

      // 生成用户回答
      if (step.questionKey) {
        const answer = generateRandomAnswer(step.questionKey, step.type);
        answers[step.questionKey] = answer;
        messages.push(`用户: ${answer}`);
      }

      // 特殊步骤处理
      if (step.type === 'camera') {
        answers.adams_result = 'mild_asymmetry';
      }

      if (step.type === 'result') {
        const result = calculateRiskScore(answers);
        expect(result).toBeDefined();
        expect(result.level).toBeDefined();
      }
    }

    expect(messages.length).toBeGreaterThan(CHATBOT_FLOW.length);
    expect(Object.keys(answers).length).toBeGreaterThanOrEqual(5);
  });

  it('应能模拟Agent多分支切换', () => {
    const branchHistory: BranchId[] = ['main'];
    const answers: Answers = {};

    // 模拟主菜单选择
    const targetBranch: BranchId = 'reassess';
    branchHistory.push(targetBranch);

    const flow = BRANCH_FLOWS[targetBranch];
    expect(flow).toBeDefined();

    // 模拟reassess流程
    for (const step of flow) {
      if (step.skipCondition?.(answers)) continue;

      if (step.questionKey && step.type !== 'bot_message' && step.type !== 'auto') {
        const answer = generateRandomAnswer(step.questionKey, step.type);
        answers[step.questionKey] = answer;
      }
    }

    expect(branchHistory).toContain('main');
    expect(branchHistory).toContain('reassess');
  });
});

// =============================================================================
// 9. 并发一致性测试
// =============================================================================

describe('Concurrent Consistency Tests', () => {
  it('风险评分应在并发调用下保持一致', () => {
    const answers = generateCompleteAnswers();
    const results: RiskResult[] = [];

    // 模拟100次并发计算
    for (let i = 0; i < 100; i++) {
      results.push(calculateRiskScore(answers));
    }

    const first = results[0];
    for (const result of results) {
      expect(result.total).toBe(first.total);
      expect(result.level).toBe(first.level);
      expect(result.factors.familyHistory).toBe(first.factors.familyHistory);
    }
  });

  it('系统提示词应在相同输入下保持一致', () => {
    const ctx: LLMContext = {
      patientName: '一致性测试',
      patientAge: 10,
      patientGender: '男',
      phase: 'greeting',
      stepIndex: 0,
      totalSteps: 5,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: ['vision3'],
      currentDate: '2026-05-29',
      pendingScale: null,
    };

    const prompts: string[] = [];
    for (let i = 0; i < 50; i++) {
      prompts.push(buildSystemPrompt(ctx));
    }

    const first = prompts[0];
    for (const prompt of prompts) {
      expect(prompt).toBe(first);
    }
  });
});

// =============================================================================
// 10. 内存与大数据量测试
// =============================================================================

describe('Large Data Volume Tests', () => {
  it('应能处理大量历史消息上下文', () => {
    const ctx: LLMContext = {
      patientName: '大数据测试',
      patientAge: 12,
      patientGender: '女',
      phase: 'report_chat',
      stepIndex: 0,
      totalSteps: 5,
      hasHistory: true,
      hasDueReminder: false,
      availableTools: ['vision3', 'comparison', 'rom', 'scales', 'adams_camera', 'psych'],
      currentDate: '2026-05-29',
      lastAssessmentSummary: '历史评估: '.repeat(1000),
    };

    const prompt = buildSystemPrompt(ctx);
    expect(prompt.length).toBeGreaterThan(10000);
    expect(prompt).toContain('历史评估');
  });

  it('应能处理大量答案数据', () => {
    const manyAnswers: Answers = {};
    for (let i = 0; i < 100; i++) {
      manyAnswers[`custom_answer_${i}`] = `value_${i}`;
    }

    const result = calculateRiskScore(manyAnswers);
    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

console.log('对话系统压力测试套件加载完成');

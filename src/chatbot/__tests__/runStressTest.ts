/**
 * 对话系统压力测试执行器
 * 可在浏览器控制台或Node环境中运行
 */

import { CHATBOT_FLOW } from '../constants/flow';
import { BRANCH_FLOWS, type BranchId } from '../constants/branches';
import { calculateRiskScore } from '../utils/riskCalculator';
import { buildSystemPrompt, type LLMContext } from '../prompts/adaptiveSystemPrompt';
import { buildWelcomeMessage } from '../prompts';
import type { Answers, RiskResult } from '../types';

// =============================================================================
// 测试结果收集器
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface StressTestReport {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  start() {
    this.startTime = performance.now();
    console.log('🚀 开始执行对话系统压力测试...\n');
  }

  async test(name: string, fn: () => void | Promise<void>) {
    const testStart = performance.now();
    try {
      await fn();
      const duration = performance.now() - testStart;
      this.results.push({ name, passed: true, duration });
      console.log(`✅ ${name} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - testStart;
      this.results.push({
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`❌ ${name} (${duration.toFixed(2)}ms)`);
      console.log(`   错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  finish(): StressTestReport {
    const duration = performance.now() - this.startTime;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 压力测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${this.results.length}`);
    console.log(`通过: ${passed} ✅`);
    console.log(`失败: ${failed} ❌`);
    console.log(`总耗时: ${duration.toFixed(2)}ms`);
    console.log('='.repeat(50));

    return {
      totalTests: this.results.length,
      passed,
      failed,
      duration,
      results: this.results,
    };
  }
}

// =============================================================================
// 断言工具
// =============================================================================

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`期望 ${expected}，但得到 ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`期望值已定义，但得到 ${actual}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`期望大于 ${expected}，但得到 ${actual}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`期望大于等于 ${expected}，但得到 ${actual}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`期望小于 ${expected}，但得到 ${actual}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`期望小于等于 ${expected}，但得到 ${actual}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`期望包含 "${expected}"，但未找到`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`期望相等，但 ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
      }
    },
  };
}

// =============================================================================
// 测试数据生成器
// =============================================================================

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
// 压力测试套件
// =============================================================================

export async function runStressTests(): Promise<StressTestReport> {
  const runner = new TestRunner();
  runner.start();

  // ==========================================================================
  // 1. 风险评分计算压力测试
  // ==========================================================================
  console.log('\n📋 1. 风险评分计算压力测试');
  console.log('-'.repeat(50));

  await runner.test('应正确计算最高风险评分', () => {
    const answers = generateCompleteAnswers();
    const result = calculateRiskScore(answers);

    expect(result.total).toBeGreaterThan(100);
    expect(result.level).toBe('high');
    expect(result.levelLabel).toBe('高风险');
  });

  await runner.test('应正确计算最低风险评分', () => {
    const answers = generateLowRiskAnswers();
    const result = calculateRiskScore(answers);

    expect(result.total).toBeLessThanOrEqual(20);
    expect(result.level).toBe('low');
  });

  await runner.test('应正确处理缺失答案', () => {
    const result = calculateRiskScore({});
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.level).toBeDefined();
  });

  await runner.test('应正确处理疼痛跳过逻辑', () => {
    const answers = generateCompleteAnswers({
      back_pain: '从不疼',
      pain_level: 9,
    });
    const result = calculateRiskScore(answers);

    expect(result.factors.backPain).toBe(0);
    expect(result.factors.painSeverity).toBe(0);
  });

  await runner.test('应正确评分各种Adams结果', () => {
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

    expect(significant.factors.adams).toBe(30);
    expect(mild.factors.adams).toBe(15);
    expect(normal.factors.adams).toBe(0);
  });

  // ==========================================================================
  // 2. 对话流程完整性测试
  // ==========================================================================
  console.log('\n📋 2. 对话流程完整性测试');
  console.log('-'.repeat(50));

  await runner.test('CHATBOT_FLOW应包含所有必需步骤', () => {
    const requiredIds = [
      'greeting', 'name', 'gender', 'age', 'growth_spurt',
      'family_scoliosis', 'back_pain', 'pain_level',
      'posture_shoulders', 'posture_scapula', 'posture_waist',
      'adams_intro', 'adams_method', 'adams_camera',
      'adams_result', 'results', 'confirmation', 'done',
    ];

    const flowIds = CHATBOT_FLOW.map((s) => s.id);
    for (const id of requiredIds) {
      if (!flowIds.includes(id)) {
        throw new Error(`缺少必需步骤: ${id}`);
      }
    }
  });

  await runner.test('每个步骤应有正确的类型', () => {
    const validTypes = [
      'bot_message', 'user_text', 'user_choice', 'user_number',
      'user_slider', 'camera', 'result', 'auto',
    ];

    for (const step of CHATBOT_FLOW) {
      if (!validTypes.includes(step.type)) {
        throw new Error(`步骤 ${step.id} 有无效类型: ${step.type}`);
      }
    }
  });

  await runner.test('条件跳过逻辑应正确配置', () => {
    const growthStep = CHATBOT_FLOW.find((s) => s.id === 'growth_spurt');
    if (!growthStep?.skipCondition) {
      throw new Error('growth_spurt步骤缺少跳过条件');
    }
    if (!growthStep.skipCondition({ age: 8 })) {
      throw new Error('8岁应跳过生长速度问题');
    }
    if (growthStep.skipCondition({ age: 12 })) {
      throw new Error('12岁不应跳过生长速度问题');
    }
  });

  // ==========================================================================
  // 3. Agent分支流程测试
  // ==========================================================================
  console.log('\n📋 3. Agent分支流程测试');
  console.log('-'.repeat(50));

  await runner.test('所有分支应定义流程', () => {
    const branches: BranchId[] = ['main', 'reassess', 'report', 'rehab', 'followup'];
    for (const branch of branches) {
      const flow = BRANCH_FLOWS[branch];
      if (!flow || flow.length === 0) {
        throw new Error(`分支 ${branch} 未定义流程`);
      }
    }
  });

  await runner.test('main分支应以欢迎消息开始', () => {
    const mainFlow = BRANCH_FLOWS.main;
    expect(mainFlow[0].id).toBe('welcome');
  });

  await runner.test('reassess分支应包含核心筛查步骤', () => {
    const reassessIds = BRANCH_FLOWS.reassess.map((s) => s.id);
    if (!reassessIds.includes('growth_spurt')) {
      throw new Error('缺少growth_spurt步骤');
    }
    if (!reassessIds.includes('results')) {
      throw new Error('缺少results步骤');
    }
  });

  // ==========================================================================
  // 4. 系统提示词压力测试
  // ==========================================================================
  console.log('\n📋 4. 系统提示词压力测试');
  console.log('-'.repeat(50));

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

  await runner.test('应生成包含所有核心部分的系统提示词', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt.length).toBeGreaterThan(200);
    expect(prompt).toContain('小柱');
  });

  await runner.test('应针对高危患者生成增强警告', () => {
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
    expect(prompt).toContain('13岁');
    expect(prompt).toContain('女');
  });

  await runner.test('应正确处理待填量表上下文', () => {
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
    expect(prompt).toContain('量表');
  });

  // ==========================================================================
  // 5. 欢迎消息测试
  // ==========================================================================
  console.log('\n📋 5. 欢迎消息测试');
  console.log('-'.repeat(50));

  await runner.test('应生成基础欢迎消息', () => {
    const msgs = buildWelcomeMessage({
      patientName: '小红',
      hasHistory: false,
      hasDueReminder: false,
    });

    expect(msgs.length).toBeGreaterThanOrEqual(2);
    expect(msgs[0]).toContain('小柱');
  });

  await runner.test('有历史记录时应提及', () => {
    const msgs = buildWelcomeMessage({
      patientName: '小明',
      hasHistory: true,
      hasDueReminder: false,
    });

    const hasHistory = msgs.some((m) => m.includes('历史') || m.includes('记录'));
    if (!hasHistory) {
      throw new Error('有历史记录时应提及历史');
    }
  });

  // ==========================================================================
  // 6. 边界条件测试
  // ==========================================================================
  console.log('\n📋 6. 边界条件测试');
  console.log('-'.repeat(50));

  await runner.test('应处理极端年龄值', () => {
    const age3 = calculateRiskScore({ age: 3 });
    const age99 = calculateRiskScore({ age: 99 });
    const ageNegative = calculateRiskScore({ age: -5 });

    expect(age3.total).toBeDefined();
    expect(age99.total).toBeDefined();
    expect(ageNegative.total).toBeDefined();
  });

  await runner.test('应处理空字符串答案', () => {
    const result = calculateRiskScore({
      family_scoliosis: '',
      back_pain: '',
      adams_result: '',
    });

    expect(result.total).toBeDefined();
  });

  await runner.test('应处理超大疼痛值', () => {
    const result = calculateRiskScore({ pain_level: 999 });
    expect(result.factors.painSeverity).toBe(25);
  });

  // ==========================================================================
  // 7. 性能基准测试
  // ==========================================================================
  console.log('\n📋 7. 性能基准测试');
  console.log('-'.repeat(50));

  await runner.test('风险评分计算1000次性能测试', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      calculateRiskScore(generateCompleteAnswers());
    }
    const duration = performance.now() - start;
    console.log(`   1000次计算耗时: ${duration.toFixed(2)}ms`);
    if (duration > 1000) {
      throw new Error(`性能太慢: ${duration.toFixed(2)}ms > 1000ms`);
    }
  });

  await runner.test('系统提示词生成100次性能测试', () => {
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
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildSystemPrompt(ctx);
    }
    const duration = performance.now() - start;
    console.log(`   100次生成耗时: ${duration.toFixed(2)}ms`);
    if (duration > 2000) {
      throw new Error(`性能太慢: ${duration.toFixed(2)}ms > 2000ms`);
    }
  });

  await runner.test('欢迎消息生成10000次性能测试', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      buildWelcomeMessage({
        patientName: `用户${i}`,
        hasHistory: i % 2 === 0,
        hasDueReminder: i % 3 === 0,
      });
    }
    const duration = performance.now() - start;
    console.log(`   10000次生成耗时: ${duration.toFixed(2)}ms`);
    if (duration > 1000) {
      throw new Error(`性能太慢: ${duration.toFixed(2)}ms > 1000ms`);
    }
  });

  // ==========================================================================
  // 8. 对话模拟器
  // ==========================================================================
  console.log('\n📋 8. 对话模拟器');
  console.log('-'.repeat(50));

  await runner.test('应能模拟完整的chatbot筛查流程', () => {
    const answers: Answers = {};
    const messages: string[] = [];

    for (let i = 0; i < CHATBOT_FLOW.length; i++) {
      const step = CHATBOT_FLOW[i];
      messages.push(...step.botMessages);

      if (step.skipCondition?.(answers)) {
        continue;
      }

      if (step.questionKey) {
        const answer = `测试回答_${step.questionKey}`;
        answers[step.questionKey] = answer;
        messages.push(`用户: ${answer}`);
      }

      if (step.type === 'camera') {
        answers.adams_result = 'mild_asymmetry';
      }

      if (step.type === 'result') {
        const result = calculateRiskScore(answers);
        expect(result).toBeDefined();
      }
    }

    expect(messages.length).toBeGreaterThan(CHATBOT_FLOW.length);
    expect(Object.keys(answers).length).toBeGreaterThanOrEqual(5);
  });

  // ==========================================================================
  // 9. 并发一致性测试
  // ==========================================================================
  console.log('\n📋 9. 并发一致性测试');
  console.log('-'.repeat(50));

  await runner.test('风险评分应在多次调用下保持一致', () => {
    const answers = generateCompleteAnswers();
    const results: RiskResult[] = [];

    for (let i = 0; i < 100; i++) {
      results.push(calculateRiskScore(answers));
    }

    const first = results[0];
    for (const result of results) {
      if (result.total !== first.total) {
        throw new Error('风险评分不一致');
      }
      if (result.level !== first.level) {
        throw new Error('风险等级不一致');
      }
    }
  });

  // ==========================================================================
  // 10. 大数据量测试
  // ==========================================================================
  console.log('\n📋 10. 大数据量测试');
  console.log('-'.repeat(50));

  await runner.test('应能处理大量历史消息上下文', () => {
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
    expect(prompt.length).toBeGreaterThan(1000);
  });

  return runner.finish();
}

// =============================================================================
// 导出执行函数
// =============================================================================

export { TestRunner, expect };
export default runStressTests;

// 如果在浏览器环境中，自动运行
if (typeof window !== 'undefined') {
  (window as any).runStressTests = runStressTests;
  console.log('压力测试已加载，调用 runStressTests() 开始测试');
}

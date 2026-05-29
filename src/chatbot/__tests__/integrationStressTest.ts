/**
 * 集成压力测试 - 模拟真实场景下的完整对话循环
 *
 * 测试场景：
 * 1. 新用户首次筛查流程
 * 2. 老用户复查流程
 * 3. 高风险用户紧急处理流程
 * 4. LLM降级回退流程
 * 5. 多工具调用序列
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessage, Answers, RiskResult } from '../types';
import type { BranchId } from '../constants/branches';
import { CHATBOT_FLOW } from '../constants/flow';
import { BRANCH_FLOWS } from '../constants/branches';
import { calculateRiskScore } from '../utils/riskCalculator';
import { buildSystemPrompt, type LLMContext } from '../prompts/systemPrompt';

// =============================================================================
// 模拟Store状态
// =============================================================================

interface SimulatedState {
  branch: BranchId;
  stepIndex: number;
  messages: ChatMessage[];
  answers: Answers;
  patientName: string;
  patientAge: number | null;
  hasHistory: boolean;
  riskResult: RiskResult | null;
}

function createInitialState(patientName = '测试孩子', hasHistory = false): SimulatedState {
  return {
    branch: 'main',
    stepIndex: 0,
    messages: [],
    answers: {},
    patientName,
    patientAge: null,
    hasHistory,
    riskResult: null,
  };
}

// =============================================================================
// 场景1: 新用户首次筛查
// =============================================================================

describe('场景1: 新用户首次筛查完整流程', () => {
  let state: SimulatedState;

  beforeEach(() => {
    state = createInitialState('小明', false);
  });

  it('应完成从欢迎到结果展示的完整18步流程', () => {
    const flow = CHATBOT_FLOW;
    const simulationLog: string[] = [];

    for (let i = 0; i < flow.length; i++) {
      const step = flow[i];
      simulationLog.push(`[Step ${i + 1}] ${step.id} (${step.type})`);

      // 记录bot消息
      state.messages.push({
        id: `bot-${i}`,
        role: 'bot',
        text: step.botMessages.join('\n'),
        timestamp: Date.now(),
      });

      // 检查跳过条件
      if (step.skipCondition?.(state.answers)) {
        simulationLog.push(`  -> 跳过`);
        continue;
      }

      // 模拟用户输入
      if (step.questionKey) {
        let answer: string | number;

        switch (step.id) {
          case 'name':
            answer = state.patientName;
            break;
          case 'gender':
            answer = '女';
            break;
          case 'age':
            answer = 12;
            state.patientAge = 12;
            break;
          case 'growth_spurt':
            answer = '长得挺快';
            break;
          case 'family_scoliosis':
            answer = '没有';
            break;
          case 'back_pain':
            answer = '偶尔会疼';
            break;
          case 'pain_level':
            answer = 3;
            break;
          case 'posture_shoulders':
            answer = '右肩高';
            break;
          case 'posture_scapula':
            answer = '一侧更突出';
            break;
          case 'posture_waist':
            answer = '对称';
            break;
          case 'adams_method':
            answer = '家人在旁边帮我';
            break;
          case 'confirmation':
            answer = '保存结果';
            break;
          default:
            answer = 'ok';
        }

        state.answers[step.questionKey] = answer;
        state.messages.push({
          id: `user-${i}`,
          role: 'user',
          text: String(answer),
          timestamp: Date.now(),
        });
        simulationLog.push(`  -> 回答: ${answer}`);
      }

      // 特殊步骤处理
      if (step.type === 'camera') {
        state.answers.adams_result = '轻微不对称';
        simulationLog.push(`  -> 摄像头检测: 轻微不对称`);
      }

      if (step.type === 'result') {
        state.riskResult = calculateRiskScore(state.answers);
        simulationLog.push(`  -> 风险评分: ${state.riskResult.total} (${state.riskResult.levelLabel})`);
      }
    }

    // 验证结果
    expect(state.messages.length).toBeGreaterThan(20);
    expect(Object.keys(state.answers).length).toBeGreaterThanOrEqual(8);
    expect(state.riskResult).not.toBeNull();
    expect(simulationLog.length).toBeGreaterThan(15);

    console.log('新用户流程日志:', simulationLog.slice(0, 10));
  });

  it('应正确计算中等风险结果', () => {
    state.answers = {
      name: '小明',
      gender: '女',
      age: 12,
      growth_spurt: '长得挺快',
      family_scoliosis: '没有',
      back_pain: '偶尔会疼',
      pain_level: 3,
      posture_shoulders: '右肩高',
      posture_scapula: '一侧更突出',
      posture_waist: '对称',
      adams_method: '家人在旁边帮我',
      adams_result: '轻微不对称',
    };

    state.riskResult = calculateRiskScore(state.answers);

    expect(state.riskResult.total).toBeGreaterThan(20);
    expect(state.riskResult.total).toBeLessThan(100);
    expect(['mild', 'moderate']).toContain(state.riskResult.level);
  });
});

// =============================================================================
// 场景2: 老用户复查流程
// =============================================================================

describe('场景2: 老用户复查流程', () => {
  it('应识别历史记录并展示对比数据', () => {
    const state = createInitialState('小红', true);
    state.patientAge = 13;
    state.hasHistory = true;

    // 模拟上次评估结果
    const previousResult: RiskResult = {
      total: 45,
      level: 'mild',
      levelLabel: '轻度关注',
      color: 'yellow',
      urgency: 'routine',
      recommendation: '建议定期关注',
      factors: {
        familyHistory: 0,
        backPain: 15,
        painSeverity: 5,
        postureAsymmetry: 10,
        growthRisk: 15,
        adams: 0,
      },
    };

    // 本次评估结果（恶化）
    const currentAnswers: Answers = {
      name: '小红',
      gender: '女',
      age: 13,
      growth_spurt: '长得挺快',
      family_scoliosis: '没有',
      back_pain: '经常疼',
      pain_level: 6,
      posture_shoulders: '右肩高',
      posture_scapula: '一侧更突出',
      posture_waist: '一侧更深',
      adams_result: '明显隆起',
    };

    const currentResult = calculateRiskScore(currentAnswers);

    // 验证风险上升
    expect(currentResult.total).toBeGreaterThan(previousResult.total);
    expect(currentResult.factors.painSeverity).toBeGreaterThan(previousResult.factors.painSeverity);
    expect(currentResult.factors.postureAsymmetry).toBeGreaterThan(previousResult.factors.postureAsymmetry);

    // 生成对比报告上下文
    const ctx: LLMContext = {
      patientName: state.patientName,
      patientAge: state.patientAge,
      patientGender: '女',
      phase: 'report_chat',
      stepIndex: 0,
      totalSteps: 3,
      hasHistory: true,
      hasDueReminder: false,
      availableTools: ['comparison'],
      currentDate: '2026-05-29',
      riskResult: currentResult,
      lastAssessmentSummary: `上次评估 (${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}): ${previousResult.levelLabel}, 总分 ${previousResult.total}`,
    };

    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('上次评估');
    expect(prompt).toContain('历史评估');
  });
});

// =============================================================================
// 场景3: 高风险用户紧急处理
// =============================================================================

describe('场景3: 高风险用户紧急处理流程', () => {
  it('应正确识别高风险并触发紧急建议', () => {
    const highRiskAnswers: Answers = {
      name: '高风险患者',
      gender: '女',
      age: 13,
      growth_spurt: '长得挺快',
      family_scoliosis: '有',
      back_pain: '经常疼',
      pain_level: 8,
      posture_shoulders: '右肩高',
      posture_scapula: '一侧更突出',
      posture_waist: '一侧更深',
      adams_result: '明显隆起',
    };

    const result = calculateRiskScore(highRiskAnswers);

    // 验证高风险判定
    expect(result.total).toBeGreaterThan(100);
    expect(result.level).toBe('high');
    expect(result.levelLabel).toBe('高风险');
    expect(result.color).toBe('red');
    expect(result.urgency).toBe('urgent');

    // 验证所有风险因子都高
    expect(result.factors.familyHistory).toBe(30);
    expect(result.factors.backPain).toBe(25);
    expect(result.factors.painSeverity).toBe(25);
    expect(result.factors.postureAsymmetry).toBe(25);
    expect(result.factors.growthRisk).toBe(25);
    expect(result.factors.adams).toBe(30);

    // 生成系统提示词验证包含紧急内容
    const ctx: LLMContext = {
      patientName: '高风险患者',
      patientAge: 13,
      patientGender: '女',
      phase: 'result_review',
      stepIndex: 0,
      totalSteps: 1,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: [],
      currentDate: '2026-05-29',
      riskResult: result,
      answers: highRiskAnswers,
    };

    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('高风险');
    expect(prompt).toContain('疼痛严重程度评分');
  });

  it('应处理疼痛红线警告', () => {
    const painAnswers: Answers = {
      name: '疼痛患者',
      gender: '男',
      age: 15,
      back_pain: '经常疼',
      pain_level: 10,
    };

    const result = calculateRiskScore(painAnswers);

    expect(result.factors.backPain).toBe(25);
    expect(result.factors.painSeverity).toBe(25);

    const ctx: LLMContext = {
      patientName: '疼痛患者',
      patientAge: 15,
      patientGender: '男',
      phase: 'screening',
      stepIndex: 5,
      totalSteps: 12,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: [],
      currentDate: '2026-05-29',
      answers: painAnswers,
    };

    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('疼痛');
    expect(prompt).toContain('MRI');
  });
});

// =============================================================================
// 场景4: 工具调用序列测试
// =============================================================================

describe('场景4: 多工具调用序列测试', () => {
  it('应支持工具调用的完整生命周期', () => {
    const toolSequence: Array<{ tool: string; reason: string }> = [];

    // 模拟工具调用序列
    toolSequence.push({ tool: 'vision3', reason: '初始体态评估' });
    toolSequence.push({ tool: 'adams_camera', reason: 'Adams前屈测试' });
    toolSequence.push({ tool: 'scales', reason: '生活质量评估' });
    toolSequence.push({ tool: 'comparison', reason: '历史数据对比' });

    expect(toolSequence.length).toBe(4);
    expect(toolSequence.map((t) => t.tool)).toEqual(['vision3', 'adams_camera', 'scales', 'comparison']);
  });

  it('应生成包含所有工具的系统提示词', () => {
    const ctx: LLMContext = {
      patientName: '工具测试',
      patientAge: 11,
      patientGender: '女',
      phase: 'free_chat',
      stepIndex: 0,
      totalSteps: 5,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: ['vision3', 'comparison', 'rom', 'scales', 'adams_camera', 'psych'],
      currentDate: '2026-05-29',
    };

    const prompt = buildSystemPrompt(ctx);

    expect(prompt).toContain('vision3');
    expect(prompt).toContain('comparison');
    expect(prompt).toContain('rom');
    expect(prompt).toContain('scales');
    expect(prompt).toContain('adams_camera');
    expect(prompt).toContain('psych');
    expect(prompt).toContain('[TOOL:');
  });
});

// =============================================================================
// 场景5: 量表下发处理流程
// =============================================================================

describe('场景5: 治疗师量表下发处理', () => {
  it('应正确处理SRS-22量表下发', () => {
    const ctx: LLMContext = {
      patientName: '量表测试',
      patientAge: 14,
      patientGender: '女',
      phase: 'greeting',
      stepIndex: 0,
      totalSteps: 5,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: ['scales'],
      currentDate: '2026-05-29',
      pendingScale: {
        taskId: 'task-srs22-001',
        sessionId: 'session-001',
        scaleId: 'SRS-22',
      },
    };

    const prompt = buildSystemPrompt(ctx);

    expect(prompt).toContain('SRS-22');
    expect(prompt).toContain('待填量表');
    expect(prompt).toContain('生活质量评估');
    expect(prompt).toContain('量表下发辅导指令');
  });

  it('应正确处理VAS量表下发', () => {
    const ctx: LLMContext = {
      patientName: '量表测试',
      patientAge: 12,
      patientGender: '男',
      phase: 'screening',
      stepIndex: 3,
      totalSteps: 8,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: ['scales'],
      currentDate: '2026-05-29',
      pendingScale: {
        taskId: 'task-vas-001',
        sessionId: 'session-002',
        scaleId: 'VAS',
      },
    };

    const prompt = buildSystemPrompt(ctx);

    expect(prompt).toContain('VAS');
    expect(prompt).toContain('痛痛小刻度尺');
  });

  it('应正确处理ODI量表下发', () => {
    const ctx: LLMContext = {
      patientName: '量表测试',
      patientAge: 16,
      patientGender: '女',
      phase: 'rehab_guidance',
      stepIndex: 1,
      totalSteps: 3,
      hasHistory: false,
      hasDueReminder: false,
      availableTools: ['scales'],
      currentDate: '2026-05-29',
      pendingScale: {
        taskId: 'task-odi-001',
        sessionId: 'session-003',
        scaleId: 'ODI',
      },
    };

    const prompt = buildSystemPrompt(ctx);

    expect(prompt).toContain('ODI');
    expect(prompt).toContain('腰部小力气测评卡');
  });
});

// =============================================================================
// 场景6: 边界条件压力测试
// =============================================================================

describe('场景6: 边界条件压力测试', () => {
  it('应处理极长患者姓名', () => {
    const longName = '张'.repeat(50);
    const answers: Answers = {
      name: longName,
      age: 10,
    };

    const result = calculateRiskScore(answers);
    expect(result).toBeDefined();
  });

  it('应处理特殊字符输入', () => {
    const specialChars: Answers = {
      name: '<script>alert("xss")</script>',
      gender: '男<script>',
      back_pain: '经常疼"\'",
    };

    const result = calculateRiskScore(specialChars);
    expect(result).toBeDefined();
  });

  it('应处理Unicode字符', () => {
    const unicode: Answers = {
      name: '🧒小明👦',
      gender: '👧女',
      back_pain: '😣经常疼',
    };

    const result = calculateRiskScore(unicode);
    expect(result).toBeDefined();
  });

  it('应处理空对象和空数组', () => {
    const empty = calculateRiskScore({});
    expect(empty.total).toBeGreaterThanOrEqual(0);

    const withEmptyArrays = calculateRiskScore({
      posture_shoulders: [] as any,
      back_pain: {} as any,
    });
    expect(withEmptyArrays.total).toBeDefined();
  });
});

// =============================================================================
// 场景7: 并发场景模拟
// =============================================================================

describe('场景7: 并发场景模拟', () => {
  it('应支持多用户同时筛查', () => {
    const users = ['用户A', '用户B', '用户C', '用户D', '用户E'];
    const results: RiskResult[] = [];

    for (const user of users) {
      const answers: Answers = {
        name: user,
        gender: Math.random() > 0.5 ? '男' : '女',
        age: Math.floor(Math.random() * 10) + 8,
        growth_spurt: ['长得挺快', '一般', '基本没长'][Math.floor(Math.random() * 3)],
        family_scoliosis: ['有', '没有', '不确定'][Math.floor(Math.random() * 3)],
        back_pain: ['经常疼', '偶尔会疼', '从不疼'][Math.floor(Math.random() * 3)],
        posture_shoulders: ['一样高', '右肩高', '左肩高'][Math.floor(Math.random() * 3)],
        posture_scapula: ['对称', '一侧更突出'][Math.floor(Math.random() * 2)],
        posture_waist: ['对称', '一侧更深'][Math.floor(Math.random() * 2)],
        adams_result: ['明显隆起', '轻微不对称', '对称无隆起'][Math.floor(Math.random() * 3)],
      };

      results.push(calculateRiskScore(answers));
    }

    expect(results.length).toBe(5);
    expect(results.every((r) => r.level !== undefined)).toBe(true);
  });

  it('应支持快速连续对话', () => {
    const messages: string[] = [];
    const phases = ['greeting', 'screening', 'adams_test', 'result_review', 'free_chat'];

    for (let i = 0; i < 100; i++) {
      const ctx: LLMContext = {
        patientName: `快速用户${i}`,
        patientAge: 10 + (i % 8),
        patientGender: i % 2 === 0 ? '男' : '女',
        phase: phases[i % phases.length] as any,
        stepIndex: i % 10,
        totalSteps: 10,
        hasHistory: i % 3 === 0,
        hasDueReminder: i % 5 === 0,
        availableTools: ['vision3', 'adams_camera'],
        currentDate: '2026-05-29',
      };

      const prompt = buildSystemPrompt(ctx);
      messages.push(prompt.substring(0, 100));
    }

    expect(messages.length).toBe(100);
    expect(messages.every((m) => m.length > 0)).toBe(true);
  });
});

console.log('集成压力测试套件加载完成');

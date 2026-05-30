import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, type LLMContext } from '../adaptiveSystemPrompt';

describe('精简版系统提示词构建器', () => {
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

  it('应构建包含核心人设的提示词', () => {
    const prompt = buildSystemPrompt(baseContext);

    // 验证角色名称
    expect(prompt).toContain('小柱');
    expect(prompt).toContain('儿童脊柱健康');

    // 验证核心比喻
    expect(prompt).toContain('小树苗');
  });

  it('应包含安全红线', () => {
    const prompt = buildSystemPrompt(baseContext);

    // 验证禁用词
    expect(prompt).toContain('患者');
    expect(prompt).toContain('不做医学诊断');
  });

  it('应根据阶段加载不同的临床知识', () => {
    // 问候阶段 — 只加载核心知识
    const greetingPrompt = buildSystemPrompt({
      ...baseContext,
      phase: 'greeting',
    });
    expect(greetingPrompt).toContain('临床红线');

    // 筛查阶段 — 加载 Adams 测试知识
    const screeningPrompt = buildSystemPrompt({
      ...baseContext,
      phase: 'screening',
    });
    expect(screeningPrompt).toContain('Adams测试');

    // 康复阶段 — 加载康复知识
    const rehabPrompt = buildSystemPrompt({
      ...baseContext,
      phase: 'rehab_guidance',
    });
    expect(rehabPrompt).toContain('训练');
  });

  it('应包含患者上下文信息', () => {
    const prompt = buildSystemPrompt(baseContext);

    expect(prompt).toContain('小明');
    expect(prompt).toContain('8岁');
  });

  it('应包含高风险患者的警示信息', () => {
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

    // 验证关键风险因素被提及
    expect(prompt).toContain('13岁');
    expect(prompt).toContain('女');
    expect(prompt).toContain('生长快');
    expect(prompt).toContain('家族史');
  });

  it('应包含疼痛红线警告', () => {
    const painContext: LLMContext = {
      ...baseContext,
      answers: {
        back_pain: '经常疼',
        pain_level: 8,
      },
    };

    const prompt = buildSystemPrompt(painContext);

    // 验证疼痛信息被包含
    expect(prompt).toContain('背痛');
  });

  it('应包含待填量表信息', () => {
    const scaleContext: LLMContext = {
      ...baseContext,
      phase: 'report_chat',
      pendingScale: {
        taskId: 'task-abc',
        sessionId: 'session-xyz',
        scaleId: 'SRS-22',
      },
    };

    const prompt = buildSystemPrompt(scaleContext);

    expect(prompt).toContain('SRS-22');
    expect(prompt).toContain('量表');
  });

  it('提示词应控制在合理长度内', () => {
    const prompt = buildSystemPrompt(baseContext);

    // 精简版提示词应控制在 2000 字符以内
    expect(prompt.length).toBeLessThan(2000);
  });
});

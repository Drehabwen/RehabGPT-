import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, type LLMContext } from '../systemPrompt';

describe('Chatbot Pediatric Empathy Prompt Orchestrator', () => {
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

  it('should construct basic role persona and child-friendly analogies', () => {
    const prompt = buildSystemPrompt(baseContext);

    // Verify role name is injected
    expect(prompt).toContain('小柱');
    expect(prompt).toContain('儿童脊柱健康守护者');

    // Verify pediatric metaphors are present
    expect(prompt).toContain('树苗');
    expect(prompt).toContain('小树倾斜角');
  });

  it('should dynamically inject warnings for adolescent girls in fast growth sprint', () => {
    const highRiskContext: LLMContext = {
      ...baseContext,
      patientAge: 13, // High risk adolescent bracket (10-16)
      patientGender: '女', // Girls progression multiplier
      answers: {
        growth_spurt: '身高增长极快',
        family_scoliosis: '有',
      },
    };

    const prompt = buildSystemPrompt(highRiskContext);

    // Verify puberty age-bracket warning is injected
    expect(prompt).toContain('处于脊柱侧弯高危高发年龄段');
    // Verify gender progression warning is injected
    expect(prompt).toContain('女孩侧弯进展风险系数相对男孩更高');
    // Verify fast growth spurt warning multiplier
    expect(prompt).toContain('青春期快速生长期，脊柱风险乘数翻倍');
    // Verify hereditary family history warning multiplier
    expect(prompt).toContain('遗传发病率提高约 3-5 倍');
  });

  it('should enforce severe back pain red-flags and MRI instruction', () => {
    const painContext: LLMContext = {
      ...baseContext,
      answers: {
        back_pain: '活动受限且夜间痛醒',
        pain_level: '8', // Highly critical pain score
      },
    };

    const prompt = buildSystemPrompt(painContext);

    // Verify back pain warnings are triggered
    expect(prompt).toContain('背部疼痛情况');
    expect(prompt).toContain('疼痛严重程度评分');
    expect(prompt).toContain('严防死守：背痛警示线');
    expect(prompt).toContain('去大医院做 MRI');
    expect(prompt).toContain('绝对禁止推荐拉伸、居家小动作');
  });

  it('should dynamically inject therapist scale details when pendingScale is present', () => {
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

    // Verify therapist pending scale context is injected
    expect(prompt).toContain('待填量表');
    expect(prompt).toContain('SRS-22');
    expect(prompt).toContain('量表下发辅导指令');
    expect(prompt).toContain('生活质量评估问卷');
    expect(prompt).toContain('通俗化家长解释');
  });

  it('should exclude prohibited clinical words to enforce empathetic connection', () => {
    const prompt = buildSystemPrompt(baseContext);

    // Verify forbidden words in persona are documented and instructed to be forbidden
    expect(prompt).toContain('绝对不使用');
    
    // Prohibited terms check
    expect(prompt).toContain('"患者"');
    expect(prompt).toContain('"被测者"');
  });
});

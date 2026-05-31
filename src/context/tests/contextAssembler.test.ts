import { describe, expect, it } from 'vitest';
import type { ChildContext } from '../model/types';
import { DEFAULT_CHILD_CONTEXT } from '../model/types';
import { assembleDailyAdviceContext, assembleFreeChatContext } from '../engine/contextAssembler';
import { createContextSnapshot } from '../engine/contextSnapshot';

function createBaseContext(): ChildContext {
  return {
    ...DEFAULT_CHILD_CONTEXT,
    identity: {
      ...DEFAULT_CHILD_CONTEXT.identity,
      patientId: 'patient-001',
      patientName: '小明',
      age: 12,
      gender: '男',
      sex: 'male',
      sessionId: 'screening-session-001',
      familyBound: true,
    },
    progress: { ...DEFAULT_CHILD_CONTEXT.progress },
    memory: { ...DEFAULT_CHILD_CONTEXT.memory },
    tasks: { pendingScales: [] },
    flags: { ...DEFAULT_CHILD_CONTEXT.flags },
  };
}

describe('context assembler', () => {
  it('keeps family-code identity in the snapshot', () => {
    const snapshot = createContextSnapshot(createBaseContext());

    expect(snapshot.identity.patientId).toBe('patient-001');
    expect(snapshot.identity.age).toBe(12);
    expect(snapshot.identity.sex).toBe('male');
    expect(snapshot.identity.sessionId).toBe('screening-session-001');
    expect(snapshot.identity.familyBound).toBe(true);
  });

  it('uses backend assessment in daily advice context', () => {
    const ctx = createBaseContext();
    ctx.assessment = {
      riskLevel: 'medium',
      riskLabel: '中风险',
      summaryText: '康复师评估提示体态不对称，需要持续观察。',
      concerns: ['体态不对称'],
      recommendations: ['按康复师建议完成训练'],
      assessedAt: '2026-05-31T09:00:00.000Z',
      reassessDueAt: null,
    };

    const assembled = assembleDailyAdviceContext(ctx);

    expect(assembled.systemPrompt).toContain('最近筛查：中风险');
    expect(assembled.systemPrompt).toContain('体态不对称');
    expect(assembled.systemPrompt).not.toContain('尚未完成康复师评估');
  });

  it('injects pending scale tasks as structured chat context', () => {
    const ctx = createBaseContext();
    ctx.tasks.pendingScales = [
      {
        taskId: 'task-001',
        sessionId: 'session-001',
        scaleId: 'SRS-22',
      },
    ];

    const assembled = assembleFreeChatContext('今天要做什么？', ctx);

    expect(assembled.systemPrompt).toContain('当前结构化任务');
    expect(assembled.systemPrompt).toContain('SRS-22');
    expect(assembled.systemPrompt).toContain('task-001');
  });
});

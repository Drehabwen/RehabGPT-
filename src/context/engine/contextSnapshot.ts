import type { ChildContext, IntentType } from '../model/types';

export interface ContextSnapshot {
  identity: {
    patientId: string;
    displayName: string;
    age: number | null;
    sex: 'male' | 'female' | null;
    genderLabel: '男' | '女' | '';
    sessionId: string | null;
    familyBound: boolean;
  };
  clinical: {
    assessment: ChildContext['assessment'];
    treatmentPlan: ChildContext['treatment'];
    stage: ChildContext['stage'];
    reportStatus: 'none' | 'pending' | 'ready' | 'reviewed';
  };
  tasks: {
    pendingScales: ChildContext['tasks']['pendingScales'];
    unreadPlan: boolean;
    dueReview: boolean;
  };
  tracking: {
    totalPlanDays: number;
    completedDays: number;
    weeklyCompletion: number;
    streakDays: number;
    painTrend: ChildContext['progress']['painTrend'];
    avgPainLevel: number;
    alerts: string[];
  };
  memory: ChildContext['memory'];
  safety: {
    shouldNotifyTherapist: boolean;
    redFlags: string[];
    forbiddenAdvice: string[];
  };
  meta: {
    updatedAt: string;
    sources: Record<string, 'backend' | 'local' | 'conversation' | 'derived'>;
  };
}

function deriveReportStatus(ctx: ChildContext): ContextSnapshot['clinical']['reportStatus'] {
  if (!ctx.identity.patientId) return 'none';
  if (!ctx.assessment) return 'pending';
  return 'ready';
}

function deriveTrackingAlerts(ctx: ChildContext): string[] {
  const alerts: string[] = [];
  if (ctx.flags.streakAtRisk) alerts.push('今日尚未打卡，连续记录可能中断');
  if (ctx.flags.complianceWarning) alerts.push('训练完成率偏低');
  if (ctx.flags.painTrendUp) alerts.push('近期疼痛趋势上升');
  return alerts;
}

function deriveRedFlags(ctx: ChildContext): string[] {
  const flags: string[] = [];
  if (ctx.flags.painTrendUp && ctx.progress.avgPainLevel >= 5) {
    flags.push('疼痛加重且平均疼痛分较高');
  }
  if (ctx.flags.shouldNotifyTherapist) {
    flags.push('建议康复师关注');
  }
  return flags;
}

export function createContextSnapshot(ctx: ChildContext): ContextSnapshot {
  return {
    identity: {
      patientId: ctx.identity.patientId,
      displayName: ctx.identity.patientName || '孩子',
      age: ctx.identity.age || null,
      sex: ctx.identity.sex,
      genderLabel: ctx.identity.gender,
      sessionId: ctx.identity.sessionId,
      familyBound: ctx.identity.familyBound,
    },
    clinical: {
      assessment: ctx.assessment,
      treatmentPlan: ctx.treatment,
      stage: ctx.stage,
      reportStatus: deriveReportStatus(ctx),
    },
    tasks: {
      pendingScales: ctx.tasks.pendingScales,
      unreadPlan: ctx.flags.hasUnreadPlan,
      dueReview: ctx.flags.needsReassessment || ctx.stage === 'awaiting_review',
    },
    tracking: {
      totalPlanDays: ctx.progress.totalPlanDays,
      completedDays: ctx.progress.completedDays,
      weeklyCompletion: ctx.progress.complianceRate,
      streakDays: ctx.progress.streakDays,
      painTrend: ctx.progress.painTrend,
      avgPainLevel: ctx.progress.avgPainLevel,
      alerts: deriveTrackingAlerts(ctx),
    },
    memory: ctx.memory,
    safety: {
      shouldNotifyTherapist: ctx.flags.shouldNotifyTherapist,
      redFlags: deriveRedFlags(ctx),
      forbiddenAdvice: [
        '不要替代康复师做诊断',
        '不要自行新增或修改康复处方',
        '孩子疼痛加重时不要推荐拉伸或按摩',
      ],
    },
    meta: {
      updatedAt: new Date().toISOString(),
      sources: {
        identity: 'backend',
        assessment: ctx.assessment ? 'backend' : 'local',
        treatmentPlan: ctx.treatment ? 'backend' : 'local',
        tasks: ctx.tasks.pendingScales.length > 0 ? 'backend' : 'local',
        tracking: 'local',
        memory: 'conversation',
        safety: 'derived',
      },
    },
  };
}

export interface ContextAssembly {
  intent?: IntentType;
  snapshot: ContextSnapshot;
  systemPrompt: string;
  userMessage?: string;
}

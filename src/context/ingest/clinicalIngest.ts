import type { ChildContext } from '../model/types';
import { mapRiskLevel } from '../model/risk';

export interface AssessmentSummaryLike {
  risk_level: string;
  risk_label?: string | null;
  summary_text?: string | null;
  concerns?: string[] | null;
  recommendations?: string[] | null;
  created_at: string;
  reassess_due_at?: string | null;
}

export interface TreatmentPlanLike {
  plan_id: string;
  therapist_name?: string | null;
  plan_content: string;
  created_at: string;
  expires_at?: string | null;
}

export function mapAssessmentSummaryToContext(
  data: AssessmentSummaryLike,
): NonNullable<ChildContext['assessment']> {
  return {
    riskLevel: mapRiskLevel(data.risk_level),
    riskLabel: data.risk_label || '评估完成',
    summaryText: data.summary_text || '',
    concerns: data.concerns || [],
    recommendations: data.recommendations || [],
    assessedAt: data.created_at,
    reassessDueAt: data.reassess_due_at || null,
  };
}

export function mapTreatmentPlanToContext(
  plan: TreatmentPlanLike,
): NonNullable<ChildContext['treatment']> {
  const actionMatches = plan.plan_content.match(/[-*]\s*(.+?)(?:\n|$)/g) || [];
  const keyActions = actionMatches.slice(0, 5).map((line) => {
    const cleaned = line.replace(/^[-*]\s*/, '').trim();
    const parts = cleaned.split(/[，,]\s*/);
    return { name: parts[0] || cleaned.slice(0, 30), sets: parts[1] || '', note: parts[2] || '' };
  });
  const firstLine = plan.plan_content.split('\n')[0]?.replace(/^#+\s*/, '') || '康复训练计划';

  return {
    planId: plan.plan_id,
    therapistName: plan.therapist_name || '康复师',
    title: firstLine.slice(0, 40),
    summaryText: plan.plan_content.slice(0, 200),
    keyActions,
    durationWeeks: 4,
    createdAt: plan.created_at,
    expiresAt: plan.expires_at || null,
  };
}

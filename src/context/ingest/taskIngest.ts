import type { ChildContext } from '../model/types';

export interface PendingScaleLike {
  task_id: string;
  session_id: string;
  scale_id: string;
  created_at?: string | null;
  assigned_at?: string | null;
}

function normalizeScaleId(scaleId: string): 'SRS-22' | 'ODI' | 'VAS' {
  if (scaleId === 'ODI' || scaleId === 'VAS') return scaleId;
  return 'SRS-22';
}

export function mapPendingScalesToContext(
  scales: PendingScaleLike[],
): ChildContext['tasks']['pendingScales'] {
  return scales.map((scale) => ({
    taskId: scale.task_id,
    sessionId: scale.session_id,
    scaleId: normalizeScaleId(scale.scale_id),
    assignedAt: scale.assigned_at || scale.created_at || null,
  }));
}

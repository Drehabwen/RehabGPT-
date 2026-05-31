/**
 * assessmentService — 评估摘要
 *
 * GET /api/integration/assessment/summary/{patientId}
 */

import { apiGet, ApiError } from './apiClient';
import type { AssessmentSummary } from './types';

/**
 * 获取康复师推送的最新评估摘要。
 * @returns 评估摘要，404 或患者不存在时返回 null
 */
export async function getLatest(
  patientId: string,
  signal?: AbortSignal,
): Promise<AssessmentSummary | null> {
  try {
    return await apiGet<AssessmentSummary>(
      `/api/integration/assessment/summary/${encodeURIComponent(patientId)}`,
      signal,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

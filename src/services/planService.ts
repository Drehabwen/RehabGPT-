/**
 * planService — 训练处方
 *
 * GET /api/integration/plan/pending/{patientId}
 */

import { apiGet, ApiError } from './apiClient';
import type { TreatmentPlan } from './types';

/**
 * 获取康复师推送的待处理训练处方列表。
 * @returns 处方数组，404 或患者不存在时返回空数组
 */
export async function getPending(
  patientId: string,
  signal?: AbortSignal,
): Promise<TreatmentPlan[]> {
  try {
    return await apiGet<TreatmentPlan[]>(
      `/api/integration/plan/pending/${encodeURIComponent(patientId)}`,
      signal,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return [];
    }
    throw err;
  }
}

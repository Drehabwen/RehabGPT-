/**
 * scaleService — 量表任务
 *
 * GET  /api/integration/scale/pending/{patientId}
 * POST /api/integration/scale/submit
 */

import { apiGet, apiPost } from './apiClient';
import type { PendingScale, ScaleSubmitPayload, ScaleSubmitResponse } from './types';

/**
 * 获取患者待处理的量表任务列表。
 */
export async function getPending(patientId: string): Promise<PendingScale[]> {
  return apiGet<PendingScale[]>(
    `/api/integration/scale/pending/${encodeURIComponent(patientId)}`,
  );
}

/**
 * 提交量表填写结果。
 */
export async function submitScale<T = unknown>(
  payload: ScaleSubmitPayload<T>,
): Promise<ScaleSubmitResponse> {
  return apiPost<ScaleSubmitResponse>('/api/integration/scale/submit', payload);
}

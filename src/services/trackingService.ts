/**
 * trackingService — 打卡数据上传
 *
 * POST /api/integration/tracking/submit
 */

import { apiPost } from './apiClient';
import type { TrackingSubmitPayload } from './types';

/**
 * 提交每日打卡数据到后端。
 * 静默降级：失败时只打印 warning，不抛出异常。
 */
export async function submit(payload: TrackingSubmitPayload): Promise<void> {
  try {
    await apiPost('/api/integration/tracking/submit', payload);
  } catch (err) {
    console.warn('[trackingService] Sync to backend failed (non-blocking):', err);
  }
}

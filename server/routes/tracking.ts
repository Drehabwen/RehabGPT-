/**
 * server/routes/tracking.ts — 每日打卡路由
 *
 * POST /api/integration/tracking/submit                — 家长提交打卡
 * GET  /api/integration/tracking/:patientId             — 获取患者打卡记录
 * GET  /api/integration/tracking/:patientId?from=&to=   — 按日期范围查询
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { trackingDB } from '../db';
import { parseBody, sendJSON, sendError, matchPath } from './utils';
import type { TrackingSubmitPayload } from '../types';

export async function handleTrackingRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // POST /api/integration/tracking/submit
  if (pathname === '/api/integration/tracking/submit' && req.method === 'POST') {
    try {
      const body = await parseBody<TrackingSubmitPayload>(req);

      if (!body.patient_id || !body.tracking_date) {
        sendError(res, 400, '缺少 patient_id 或 tracking_date');
        return true;
      }

      const record = trackingDB.submit(body);
      console.log(`[Tracking] Submitted for patient ${body.patient_id} on ${body.tracking_date}`);
      sendJSON(res, 201, { status: 'ok', id: record.id });
      return true;
    } catch (err) {
      console.error('[Tracking] Submit error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // GET /api/integration/tracking/:patientId
  const trackingMatch = matchPath('api/integration/tracking/:patientId', pathname);
  if (trackingMatch && req.method === 'GET') {
    const { patientId } = trackingMatch;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let records;
    if (from && to) {
      records = trackingDB.getByDateRange(patientId, from, to);
    } else {
      records = trackingDB.getByPatient(patientId);
    }

    sendJSON(res, 200, records);
    return true;
  }

  return false;
}

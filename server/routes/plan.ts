/**
 * server/routes/plan.ts — 训练处方路由
 *
 * GET  /api/integration/plan/pending/:patientId  — 获取患者处方列表
 * POST /api/integration/plan/push                 — 康复师推送处方（供康复师端调用）
 * PATCH /api/integration/plan/:planId/status      — 更新处方状态
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { plansDB } from '../db';
import { parseBody, sendJSON, sendError, matchPath } from './utils';
import type { TreatmentPlan } from '../types';

export async function handlePlanRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // GET /api/integration/plan/pending/:patientId
  const pendingMatch = matchPath('api/integration/plan/pending/:patientId', pathname);
  if (pendingMatch && req.method === 'GET') {
    const { patientId } = pendingMatch;
    const plans = plansDB.getByPatient(patientId);

    if (plans.length === 0) {
      sendJSON(res, 200, []); // 空数组，不是 404
      return true;
    }

    sendJSON(res, 200, plans);
    return true;
  }

  // POST /api/integration/plan/push
  if (pathname === '/api/integration/plan/push' && req.method === 'POST') {
    try {
      const body = await parseBody<Omit<TreatmentPlan, 'plan_id' | 'created_at' | 'updated_at'>>(req);

      if (!body.patient_id || !body.plan_content) {
        sendError(res, 400, '缺少 patient_id 或 plan_content');
        return true;
      }

      const record = plansDB.push(body);
      console.log(`[Plan] Pushed plan for patient ${body.patient_id}`);
      sendJSON(res, 201, record);
      return true;
    } catch (err) {
      console.error('[Plan] Push error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // PATCH /api/integration/plan/:planId/status
  const statusMatch = matchPath('api/integration/plan/:planId/status', pathname);
  if (statusMatch && req.method === 'PATCH') {
    try {
      const { planId } = statusMatch;
      const body = await parseBody<{ status: string }>(req);

      if (!body.status) {
        sendError(res, 400, '缺少 status');
        return true;
      }

      const updated = plansDB.updateStatus(planId, body.status);
      if (!updated) {
        sendError(res, 404, '未找到该处方');
        return true;
      }

      sendJSON(res, 200, updated);
      return true;
    } catch (err) {
      console.error('[Plan] Status update error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  return false;
}

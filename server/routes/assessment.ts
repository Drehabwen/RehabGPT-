/**
 * server/routes/assessment.ts — 评估摘要路由
 *
 * GET  /api/integration/assessment/summary/:patientId  — 获取最新评估摘要
 * POST /api/integration/assessment/push                 — 康复师推送评估（供康复师端调用）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { assessmentsDB } from '../db';
import { parseBody, sendJSON, sendError, matchPath } from './utils';
import type { AssessmentSummary } from '../types';

export async function handleAssessmentRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // GET /api/integration/assessment/summary/:patientId
  const summaryMatch = matchPath('api/integration/assessment/summary/:patientId', pathname);
  if (summaryMatch && req.method === 'GET') {
    const { patientId } = summaryMatch;
    const assessment = assessmentsDB.getLatestByPatient(patientId);

    if (!assessment) {
      // 返回 null 表示无评估（前端用 404 判定空状态）
      sendJSON(res, 404, null);
      return true;
    }

    sendJSON(res, 200, assessment);
    return true;
  }

  // POST /api/integration/assessment/push
  if (pathname === '/api/integration/assessment/push' && req.method === 'POST') {
    try {
      const body = await parseBody<Omit<AssessmentSummary, 'summary_id' | 'created_at'>>(req);

      if (!body.patient_id) {
        sendError(res, 400, '缺少 patient_id');
        return true;
      }

      const record = assessmentsDB.push(body);
      console.log(`[Assessment] Pushed summary for patient ${body.patient_id}`);
      sendJSON(res, 201, record);
      return true;
    } catch (err) {
      console.error('[Assessment] Push error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // GET /api/integration/assessment/history/:patientId
  const historyMatch = matchPath('api/integration/assessment/history/:patientId', pathname);
  if (historyMatch && req.method === 'GET') {
    const { patientId } = historyMatch;
    const all = assessmentsDB.getAll()
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    sendJSON(res, 200, all);
    return true;
  }

  return false;
}

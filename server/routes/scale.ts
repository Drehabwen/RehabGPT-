/**
 * server/routes/scale.ts — 量表评定路由
 *
 * GET  /api/integration/scale/pending/:patientId  — 获取待填量表
 * POST /api/integration/scale/push                 — 康复师下发量表
 * POST /api/integration/scale/submit               — 家长提交量表
 * GET  /api/integration/scale/results/:sessionId   — 获取量表结果
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { nanoid } from 'nanoid';
import { scaleTasksDB } from '../db';
import { parseBody, sendJSON, sendError, matchPath } from './utils';
import type { ScalePushPayload, ScaleSubmitPayload } from '../types';

export async function handleScaleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // GET /api/integration/scale/pending/:patientId
  const pendingMatch = matchPath('api/integration/scale/pending/:patientId', pathname);
  if (pendingMatch && req.method === 'GET') {
    const { patientId } = pendingMatch;
    const tasks = scaleTasksDB.getPendingByPatient(patientId);

    // 返回 PendingScale 格式（不含 scale_data）
    const pending = tasks.map((t) => ({
      task_id: t.task_id,
      patient_id: t.patient_id,
      patient_name: t.patient_name,
      session_id: t.session_id,
      scale_id: t.scale_id,
      status: t.status,
      created_at: t.created_at,
    }));

    sendJSON(res, 200, pending);
    return true;
  }

  // POST /api/integration/scale/push
  if (pathname === '/api/integration/scale/push' && req.method === 'POST') {
    try {
      const body = await parseBody<ScalePushPayload>(req);

      if (!body.patient_id || !body.scale_id) {
        sendError(res, 400, '缺少 patient_id 或 scale_id');
        return true;
      }

      const record = scaleTasksDB.push({
        patient_id: body.patient_id,
        patient_name: null,
        session_id: body.session_id || `scale_session_${nanoid(8)}`,
        scale_id: body.scale_id,
      });

      console.log(`[Scale] Pushed ${body.scale_id} to patient ${body.patient_id}`);
      sendJSON(res, 201, {
        task_id: record.task_id,
        status: 'pending',
      });
      return true;
    } catch (err) {
      console.error('[Scale] Push error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // POST /api/integration/scale/submit
  if (pathname === '/api/integration/scale/submit' && req.method === 'POST') {
    try {
      const body = await parseBody<ScaleSubmitPayload>(req);

      if (!body.task_id || !body.scale_data) {
        sendError(res, 400, '缺少 task_id 或 scale_data');
        return true;
      }

      const task = scaleTasksDB.getByTaskId(body.task_id);
      if (!task) {
        sendError(res, 404, '未找到该量表任务');
        return true;
      }

      if (task.status === 'completed') {
        sendError(res, 409, '该量表已提交');
        return true;
      }

      const updated = scaleTasksDB.submit(body.task_id, body.scale_data);
      if (!updated) {
        sendError(res, 500, '提交失败');
        return true;
      }

      console.log(`[Scale] Submitted ${task.scale_id} for task ${body.task_id}`);
      sendJSON(res, 200, {
        status: 'completed',
        task_id: body.task_id,
      });
      return true;
    } catch (err) {
      console.error('[Scale] Submit error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  // GET /api/integration/scale/results/:sessionId
  const resultsMatch = matchPath('api/integration/scale/results/:sessionId', pathname);
  if (resultsMatch && req.method === 'GET') {
    const { sessionId } = resultsMatch;
    const tasks = scaleTasksDB.getBySession(sessionId);

    const results = tasks.map((t) => ({
      task_id: t.task_id,
      patient_id: t.patient_id,
      session_id: t.session_id,
      scale_id: t.scale_id,
      status: t.status,
      scale_data: t.scale_data,
      created_at: t.created_at,
      submitted_at: t.submitted_at,
    }));

    sendJSON(res, 200, results);
    return true;
  }

  return false;
}

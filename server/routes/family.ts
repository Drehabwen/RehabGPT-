/**
 * server/routes/family.ts — 家庭码绑定路由
 *
 * POST /api/integration/family/login   — 家庭码登录
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { familyLinksDB } from '../db';
import { parseBody, sendJSON, sendError } from './utils';

export async function handleFamilyRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // POST /api/integration/family/login
  if (pathname === '/api/integration/family/login' && req.method === 'POST') {
    try {
      const body = await parseBody<{ family_code: string }>(req);
      const code = (body.family_code || '').trim().toUpperCase();

      if (!code) {
        sendError(res, 400, '请输入家庭码');
        return true;
      }

      const link = familyLinksDB.findByCode(code);

      if (!link) {
        sendError(res, 404, '未找到该家庭码对应的档案，请核对后重试');
        return true;
      }

      sendJSON(res, 200, {
        patient_id: link.patient_id,
        display_name: link.display_name,
        sex: link.sex,
        age: link.age,
        height_cm: link.height_cm,
        session_id: `session_${link.patient_id}_${Date.now()}`,
      });
      return true;
    } catch (err) {
      console.error('[Family] Login error:', err);
      sendError(res, 500, '服务器错误');
      return true;
    }
  }

  return false;
}

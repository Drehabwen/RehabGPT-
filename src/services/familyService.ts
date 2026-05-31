/**
 * familyService — 家庭码绑定
 *
 * POST /api/integration/family/login
 */

import { apiPost, ApiError } from './apiClient';
import type { FamilyLoginResponse } from './types';

/**
 * 通过家庭码查询并绑定患者身份。
 * @returns 患者档案信息；若未找到则抛出 ApiError (status 404)
 */
export async function login(familyCode: string): Promise<FamilyLoginResponse> {
  try {
    return await apiPost<FamilyLoginResponse>('/api/integration/family/login', {
      family_code: familyCode,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Error('未找到该家庭码对应的档案，请核对后重试');
    }
    throw new Error('网络异常或服务器未响应，请重试');
  }
}

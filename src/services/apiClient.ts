/**
 * src/services/apiClient.ts — 统一 fetch 封装
 *
 * 所有 API 调用的唯一出口。集中管理 base URL、错误处理、请求头。
 * 任何需要调用后端 API 的代码都应通过此模块或 service 模块发起请求，
 * 不应直接使用 fetch() 或 import.meta.env.VITE_API_BASE。
 */

const API_BASE: string = import.meta.env.VITE_API_BASE || '';

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * 判断是否为 AbortError（请求被取消），用于在调用方静默忽略。
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * 发起 GET 请求。
 * @param path — 以 / 开头的 API 路径，如 "/api/integration/assessment/summary/123"
 * @param signal — 可选 AbortSignal，用于取消请求
 * @returns 解析后的 JSON 响应体
 * @throws {ApiError} — 非 2xx 响应时抛出，包含 status 和 message
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, { signal });

  if (!resp.ok) {
    throw new ApiError(resp.status, `GET ${path} failed with status ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

/**
 * 发起 POST 请求。
 * @param path — 以 / 开头的 API 路径
 * @param body — 请求体（自动序列化为 JSON）
 * @returns 解析后的 JSON 响应体
 * @throws {ApiError} — 非 2xx 响应时抛出
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new ApiError(resp.status, `POST ${path} failed with status ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

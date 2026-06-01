function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export const SERVER_PORT = Number.parseInt(process.env.PORT || '8002', 10);

export const REHAB_API_BASE = normalizeBaseUrl(
  process.env.REHAB_API_BASE || 'http://localhost:8000',
);


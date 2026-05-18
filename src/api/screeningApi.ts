const API_BASE = '/api/screening';

export interface ScreeningRecord {
  id: string;
  subject_name: string;
  subject_gender?: string;
  subject_birth_date?: string;
  status: string;
  referral_recommended: boolean;
  referral_urgency?: string;
  notes?: string;
  created_at: number;
}

/** 单条录入筛查记录 */
export async function createScreeningRecord(data: Record<string, unknown>): Promise<ScreeningRecord> {
  const res = await fetch(`${API_BASE}/record`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/** 查询筛查队列 */
export async function listScreeningRecords(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  const res = await fetch(`${API_BASE}/records${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

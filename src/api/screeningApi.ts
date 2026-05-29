const API_BASE = '/api/v1';

export interface SubjectResponse {
  subject_id: string;
  display_name: string;
  sex?: string;
  birth_date?: string;
  created_at: string;
}

export interface ScreeningSessionCreateRequest {
  subject_id: string;
  protocols: string[];
}

export interface ScreeningSessionSummary {
  session_id: string;
  subject_id: string;
  subject_display_name: string;
  status: string;
  created_at: string;
}

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

export async function createSubject(data: {
  display_name: string;
  sex?: string;
  birth_date?: string;
}): Promise<SubjectResponse> {
  const res = await fetch(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createScreeningSession(data: ScreeningSessionCreateRequest): Promise<{
  session_id: string;
  subject_id: string;
}> {
  const res = await fetch(`${API_BASE}/screening/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function listScreeningRecords(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ScreeningSessionSummary[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  const res = await fetch(`${API_BASE}/screening/sessions${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getScreeningSession(sessionId: string): Promise<{
  session_id: string;
  subject_id: string;
  subject_display_name: string;
  status: string;
  protocols: string[];
  created_at: string;
}> {
  const res = await fetch(`${API_BASE}/screening/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface CreateScreeningRecordParams {
  subject_name: string;
  subject_gender?: string;
  source?: string;
  screening_data?: Record<string, unknown>;
  referral_recommended: boolean;
  referral_urgency?: string;
  notes?: string;
}

export async function createScreeningRecord(params: CreateScreeningRecordParams): Promise<{
  subject_id: string;
  session_id: string;
}> {
  try {
    const subject = await createSubject({
      display_name: params.subject_name,
      sex: params.subject_gender === 'M' ? 'male' : params.subject_gender === 'F' ? 'female' : undefined,
    });

    const session = await createScreeningSession({
      subject_id: subject.subject_id,
      protocols: ['adams', 'posture'],
    });

    return {
      subject_id: subject.subject_id,
      session_id: session.session_id,
    };
  } catch (error) {
    console.error('[screeningApi] createScreeningRecord failed:', error);
    throw error;
  }
}

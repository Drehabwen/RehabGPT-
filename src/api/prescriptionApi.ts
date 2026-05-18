const API_BASE = '/api';

export interface Prescription {
  id: string;
  patient_id: string;
  session_id?: string;
  title?: string;
  content: string;
  status: string;
  created_by?: string;
  created_at: number;
  updated_at: number;
}

export interface PrescriptionFeedback {
  prescription_id: string;
  patient_id: string;
  feedback_type: 'ack' | 'progress' | 'completed' | 'question';
  content?: string;
  rating?: number;
}

/** 获取患者的所有处方 */
export async function getPatientPrescriptions(patientId: string): Promise<{
  patient_id: string;
  prescriptions: Prescription[];
  total: number;
}> {
  const res = await fetch(`${API_BASE}/patient/${encodeURIComponent(patientId)}/prescriptions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/** 提交处方反馈 */
export async function submitPrescriptionFeedback(feedback: PrescriptionFeedback): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/patient/prescriptions/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

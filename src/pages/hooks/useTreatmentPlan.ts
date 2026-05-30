/**
 * useTreatmentPlan — 拉取康复师推送的训练处方
 *
 * GET /api/integration/plan/pending/{patientId}
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TreatmentPlan {
  plan_id: string;
  patient_id: string;
  patient_name: string | null;
  therapist_name: string | null;
  plan_content: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

interface UseTreatmentPlanResult {
  plans: TreatmentPlan[];
  latestPlan: TreatmentPlan | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTreatmentPlan(patientId: string | null): UseTreatmentPlanResult {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!patientId) {
      setPlans([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const resp = await fetch(`${apiBase}/api/integration/plan/pending/${encodeURIComponent(patientId)}`, {
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 404) {
          setPlans([]);
          return;
        }
        throw new Error(`HTTP ${resp.status}`);
      }

      const data: TreatmentPlan[] = await resp.json();
      setPlans(data);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('[useTreatmentPlan] Fetch failed:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [patientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    plans,
    latestPlan: plans.length > 0 ? plans[0] : null,
    loading,
    error,
    refetch: fetchPlans,
  };
}

/**
 * useTreatmentPlan — 拉取康复师推送的训练处方
 *
 * GET /api/integration/plan/pending/{patientId}
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPending } from '../../services/planService';
import { isAbortError } from '../../services/apiClient';
import type { TreatmentPlan } from '../../services/types';

export type { TreatmentPlan };

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
      const data = await getPending(patientId, controller.signal);
      setPlans(data);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
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

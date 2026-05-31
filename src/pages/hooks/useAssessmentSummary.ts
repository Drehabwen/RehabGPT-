/**
 * useAssessmentSummary — 拉取康复师推送的评估摘要
 *
 * GET /api/integration/assessment/summary/{patientId}
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getLatest } from '../../services/assessmentService';
import { isAbortError } from '../../services/apiClient';
import type { AssessmentSummary } from '../../services/types';

export type { AssessmentSummary };

interface UseAssessmentSummaryResult {
  assessment: AssessmentSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAssessmentSummary(patientId: string | null): UseAssessmentSummaryResult {
  const [assessment, setAssessment] = useState<AssessmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAssessment = useCallback(async () => {
    if (!patientId) {
      setAssessment(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await getLatest(patientId, controller.signal);
      setAssessment(data);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      console.warn('[useAssessmentSummary] Fetch failed:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [patientId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment,
  };
}

/**
 * useAssessmentSummary — 拉取康复师推送的评估摘要
 *
 * GET /api/integration/assessment/summary/{patientId}
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AssessmentSummary {
  summary_id: string;
  patient_id: string;
  patient_name: string | null;
  session_id: string;
  risk_level: string;
  risk_label: string;
  summary_text: string;
  concerns: string[];
  recommendations: string[];
  created_at: string;
}

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
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const resp = await fetch(`${apiBase}/api/integration/assessment/summary/${encodeURIComponent(patientId)}`, {
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 404) {
          setAssessment(null);
          return;
        }
        throw new Error(`HTTP ${resp.status}`);
      }

      const data: AssessmentSummary | null = await resp.json();
      setAssessment(data);  // null means no assessment yet
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
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

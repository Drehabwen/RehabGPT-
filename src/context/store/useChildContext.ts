/**
 * useChildContext — 统一的 ChildContext 读写 Hook
 *
 * 封装 ChildContextStore 的常用操作，提供类型安全的读写接口。
 * 替代当前散布在各处的零散 selector。
 */

import { useCallback } from 'react';
import { useChildContextStore } from './ChildContextStore';
import type { ChildContext, RehabStage } from '../model/types';
import {
  mapAssessmentSummaryToContext,
  mapTreatmentPlanToContext,
  type AssessmentSummaryLike,
  type TreatmentPlanLike,
} from '../ingest/clinicalIngest';

export function useChildContext() {
  const context = useChildContextStore((s) => s.context);
  const initialize = useChildContextStore((s) => s.initialize);
  const setAssessment = useChildContextStore((s) => s.setAssessment);
  const setTreatment = useChildContextStore((s) => s.setTreatment);
  const updateProgress = useChildContextStore((s) => s.updateProgress);
  const applyExtractionResult = useChildContextStore((s) => s.applyExtractionResult);
  const setPendingScales = useChildContextStore((s) => s.setPendingScales);
  const consolidateIfNewDay = useChildContextStore((s) => s.consolidateIfNewDay);
  const recalculate = useChildContextStore((s) => s.recalculate);
  const reset = useChildContextStore((s) => s.reset);

  // 常用派生值
  const stage: RehabStage = context.stage;
  const identity = context.identity;
  const assessment = context.assessment;
  const treatment = context.treatment;
  const progress = context.progress;
  const memory = context.memory;
  const tasks = context.tasks;
  const flags = context.flags;

  // 常用判断
  const isBound = context.stage !== 'unbound';
  const hasAssessment = context.assessment !== null;
  const hasTreatment = context.treatment !== null;
  const isInTraining = context.stage === 'in_training';

  // 初始化（LoginPage 绑定后调用）
  const initFromLogin = useCallback(
    (patientId: string, patientName: string, age?: number | null, gender?: string) => {
      initialize(patientId, patientName, age, gender);
    },
    [initialize],
  );

  // 从 API 评估摘要写入
  const syncAssessmentFromAPI = useCallback(
    (data: AssessmentSummaryLike | null) => {
      if (!data) {
        setAssessment(null);
        return;
      }
      setAssessment(mapAssessmentSummaryToContext(data));
    },
    [setAssessment],
  );

  // 从 API 训练处方写入
  const syncTreatmentFromAPI = useCallback(
    (plan: TreatmentPlanLike | null) => {
      if (!plan) {
        setTreatment(null);
        return;
      }
      setTreatment(mapTreatmentPlanToContext(plan));
    },
    [setTreatment],
  );

  return {
    // 原始上下文
    context,
    // 派生值
    stage,
    identity,
    assessment,
    treatment,
    progress,
    memory,
    tasks,
    flags,
    // 判断
    isBound,
    hasAssessment,
    hasTreatment,
    isInTraining,
    // 操作
    initFromLogin,
    syncAssessmentFromAPI,
    syncTreatmentFromAPI,
    updateProgress,
    applyExtractionResult,
    setPendingScales,
    consolidateIfNewDay,
    recalculate,
    reset,
    // 低级操作（直接暴露 store 方法）
    setAssessment,
    setTreatment,
  };
}

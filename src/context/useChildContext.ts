/**
 * useChildContext — 统一的 ChildContext 读写 Hook
 *
 * 封装 ChildContextStore 的常用操作，提供类型安全的读写接口。
 * 替代当前散布在各处的零散 selector。
 */

import { useCallback } from 'react';
import { useChildContextStore, RISK_LEVEL_MAP } from './ChildContextStore';
import type { ChildContext, RehabStage } from './types';

export function useChildContext() {
  const context = useChildContextStore((s) => s.context);
  const initialize = useChildContextStore((s) => s.initialize);
  const setAssessment = useChildContextStore((s) => s.setAssessment);
  const setTreatment = useChildContextStore((s) => s.setTreatment);
  const updateProgress = useChildContextStore((s) => s.updateProgress);
  const applyExtractionResult = useChildContextStore((s) => s.applyExtractionResult);
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
    (data: {
      risk_level: string;
      risk_label: string;
      summary_text: string;
      concerns: string[];
      recommendations?: string[];
      created_at: string;
    } | null) => {
      if (!data) {
        setAssessment(null);
        return;
      }
      setAssessment({
        riskLevel: RISK_LEVEL_MAP[data.risk_level] || 'none',
        riskLabel: data.risk_label || '评估完成',
        summaryText: data.summary_text || '',
        concerns: data.concerns || [],
        recommendations: data.recommendations || [],
        assessedAt: data.created_at,
      });
    },
    [setAssessment],
  );

  // 从 API 训练处方写入
  const syncTreatmentFromAPI = useCallback(
    (plan: {
      plan_id: string;
      therapist_name: string | null;
      plan_content: string;
      created_at: string;
    } | null) => {
      if (!plan) {
        setTreatment(null);
        return;
      }
      // 从 plan_content 中提取关键动作（简单解析 Markdown）
      const actionMatches = plan.plan_content.match(/[-*]\s*(.+?)(?:\n|$)/g) || [];
      const keyActions = actionMatches.slice(0, 5).map((line) => {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        // 尝试解析 "动作名 x 组数 x 次数" 格式
        const parts = cleaned.split(/[，,]\s*/);
        return {
          name: parts[0] || cleaned.slice(0, 30),
          sets: parts[1] || '',
          note: parts[2] || '',
        };
      });

      // 从 plan_content 提取第一行作为标题
      const firstLine = plan.plan_content.split('\n')[0]?.replace(/^#+\s*/, '') || '康复训练计划';

      setTreatment({
        planId: plan.plan_id,
        therapistName: plan.therapist_name || '康复师',
        title: firstLine.slice(0, 40),
        summaryText: plan.plan_content.slice(0, 200),
        keyActions,
        durationWeeks: 4, // 默认4周，可从 plan_content 解析
        createdAt: plan.created_at,
        expiresAt: null,
      });
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
    consolidateIfNewDay,
    recalculate,
    reset,
    // 低级操作（直接暴露 store 方法）
    setAssessment,
    setTreatment,
  };
}

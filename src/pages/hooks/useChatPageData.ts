/**
 * useChatPageData — ChatPage 数据层
 *
 * 集中管理所有 Zustand selector、派生状态、回调函数，
 * 让 ChatPage 组件只负责 UI 渲染。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../../chatbot/store/useChatbotStore';
import { useAgentStore } from '../../chatbot/store/useAgentStore';
import { useTrackingStore } from '../../tracking/store/useTrackingStore';
import { useAssessmentSummary } from './useAssessmentSummary';
import { useTreatmentPlan } from './useTreatmentPlan';
import {
  assembleDailyAdviceContext,
  mapAssessmentSummaryToContext,
  mapRiskLevel,
  mapTreatmentPlanToContext,
  useChildContextStore,
} from '../../context';

// ── Advice 解析：从 LLM 响应中提取建议和小贴士 ──

function parseAdviceResponse(content: string): { advice: string; tips: string[] } {
  // 匹配 【建议】 ... 【小贴士】 或 【建议】 ... (结尾)
  const adviceMatch = content.match(/【建议】\s*\n?\s*([\s\S]*?)(?:【小贴士】|【提示】|【提醒】|$)/);
  const tipsMatch = content.match(/(?:【小贴士】|【提示】|【提醒】)\s*\n?\s*([\s\S]*)/);

  const advice = adviceMatch ? adviceMatch[1].trim().replace(/^['"「『]|['"」』]$/g, '') : '';
  const tipsRaw = tipsMatch ? tipsMatch[1].trim() : '';

  // 按行 / - / • / 数字序号 分割 tips
  const tips = tipsRaw
    .split(/\n|(?<=\S)\s*[-•·]\s*/)
    .map((t) => t.replace(/^[\d]+[.、)\s]*/, '').replace(/^[-•·\s]+/, '').trim())
    .filter((t) => t.length > 2 && t.length < 60);

  return {
    advice: advice || content.trim().slice(0, 200),
    tips: tips.length > 0 ? tips.slice(0, 3) : [],
  };
}

// ── Hook ──

export function useChatPageData() {
  const navigate = useNavigate();

  // ── 患者身份 ──
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const answers = useChatbotStore((s) => s.answers);
  const patientAge = (answers.age as number) || null;

  // ── Agent 状态 ──
  const sendFreeTextStream = useAgentStore((s) => s.sendFreeTextStream);
  const advanceStep = useAgentStore((s) => s.advanceStep);
  const llmAvailable = useAgentStore((s) => s.llmAvailable);
  const llmProcessing = useAgentStore((s) => s.llmProcessing);
  const riskResult = useAgentStore((s) => s.riskResult);
  const messages = useAgentStore((s) => s.messages);

  // ── Phase 3: 康复师推送数据 ──
  const { assessment, loading: assessmentLoading } = useAssessmentSummary(patientId);
  const { latestPlan, loading: planLoading } = useTreatmentPlan(patientId);

  // Phase D: 同步 API 数据到 ChildContext
  useEffect(() => {
    if (assessment) {
      useChildContextStore.getState().setAssessment(mapAssessmentSummaryToContext(assessment));
    } else if (!assessmentLoading) {
      // API 返回空（无评估）→ 保持 null
      useChildContextStore.getState().setAssessment(null);
    }
  }, [assessment, assessmentLoading]);

  useEffect(() => {
    if (latestPlan) {
      useChildContextStore.getState().setTreatment(mapTreatmentPlanToContext(latestPlan));
    } else if (!planLoading) {
      useChildContextStore.getState().setTreatment(null);
    }
  }, [latestPlan, planLoading]);

  // ── 本周打卡（从 tracking store 获取，useMemo 避免 selector 新引用重渲染） ──
  const dailyRecords = useTrackingStore((s) => s.dailyRecords);
  const getWeekCompletion = useTrackingStore((s) => s.getWeekCompletion);
  const weeklyDays = useMemo(
    () => getWeekCompletion(),
    [dailyRecords, getWeekCompletion],
  );

  // ── 评估结果数据（优先使用康复师推送的评估摘要） ──
  const finalScreeningData = useMemo(() => {
    // Phase 3: 康复师推送的评估摘要优先
    if (assessment) {
      return {
        isEmpty: false as const,
        date: assessment.created_at?.split('T')[0] || '最近',
        riskLevel: mapRiskLevel(assessment.risk_level),
        riskLabel: assessment.risk_label || '评估完成',
        recommendation: assessment.summary_text,
        concerns: assessment.concerns || [],
      };
    }
    // 本地 riskResult 作为过渡
    if (riskResult) {
      const level = riskResult.level;
      return {
        isEmpty: false as const,
        date: '今日',
        riskLevel: (
          level === 'low' ? 'none' :
          level === 'mild' ? 'low' :
          level === 'moderate' ? 'medium' : 'high'
        ) as 'none' | 'low' | 'medium' | 'high',
        riskLabel: riskResult.levelLabel || '评估完成',
        recommendation: riskResult.recommendation,
        concerns: [
          ...(riskResult.factors.postureAsymmetry > 0 ? ['存在体态倾斜不对称'] : []),
          ...(riskResult.factors.adams > 0 ? ['脊柱弯曲度需轻微关注'] : []),
          ...(riskResult.factors.backPain > 0 ? ['主诉背部疼痛/酸胀'] : []),
          ...(riskResult.factors.familyHistory > 0 ? ['侧弯家族史'] : []),
          ...(riskResult.factors.growthRisk > 0 ? ['正值生长发育突增期'] : []),
        ].slice(0, 3),
      };
    }
    return {
      isEmpty: true as const,
      date: '今日',
      riskLevel: 'none' as const,
      riskLabel: '等待康复师评估',
      recommendation: '康复师完成专业评估后，结果将显示在这里。',
      concerns: [] as string[],
    };
  }, [assessment, riskResult]);

  // ── LLM 驱动的小柱建议 ──
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [adviceTips, setAdviceTips] = useState<string[] | null>(null);

  // 用 riskKey 稳定化 riskResult 引用变化
  const riskKey = useMemo(
    () => (riskResult ? `${riskResult.level}-${riskResult.levelLabel}` : 'no-result'),
    [riskResult],
  );

  const abortRef = useRef<AbortController | null>(null);

  const fetchAdvice = useCallback(async () => {
    if (!llmAvailable) return;

    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAdviceLoading(true);

    try {
      const { snapshot, systemPrompt } = assembleDailyAdviceContext(
        useChildContextStore.getState().context,
      );

      const resp = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '请给我今天的个性化建议' }],
          patientContext: {
            name: snapshot.identity.displayName,
            age: snapshot.identity.age,
            hasHistory: false,
            hasDueReminder: false,
            riskLevel: snapshot.clinical.assessment?.riskLevel ?? null,
            lastAssessmentSummary: snapshot.clinical.assessment?.summaryText ?? null,
          },
          systemPrompt,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) return;

      const data = await resp.json();
      const content: string = data.content || '';
      if (!content) return;

      const parsed = parseAdviceResponse(content);
      setAdviceText(parsed.advice);
      if (parsed.tips.length > 0) setAdviceTips(parsed.tips);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('[Advice] LLM advice fetch failed:', err);
      // 静默回退到硬编码 fallback
    } finally {
      if (!controller.signal.aborted) {
        setAdviceLoading(false);
      }
    }
  }, [llmAvailable, patientName, patientAge, answers.gender, riskKey, finalScreeningData.isEmpty, finalScreeningData.concerns, riskResult, latestPlan?.plan_id]);

  // 触发 advice 生成
  useEffect(() => {
    fetchAdvice();
  }, [fetchAdvice]);

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // 派生最终展示值（LLM 成功 → 用 LLM；失败/未加载 → fallback）
  const displayAdvice = useMemo(
    () =>
      adviceText ??
      (!finalScreeningData.isEmpty
        ? `根据评估数据，小柱建议${patientName || '孩子'}每日坚持做10分钟挺拔牵引运动，睡前坚持背部核心肌肉拉伸。`
        : '最近坐姿时间偏长，建议每隔 40-50 分钟起身活动一下，做做拉伸。'),
    [adviceText, finalScreeningData.isEmpty, patientName],
  );

  const displayTips = useMemo(
    () =>
      adviceTips ??
      (!finalScreeningData.isEmpty
        ? ['每40分钟起身拉伸活动', '坐姿保持背部贴紧椅背', '每日坚持5-10分钟姿态调理']
        : ['每40分钟起身活动5分钟', '坐姿保持背部贴紧椅背', '睡前做5分钟脊柱拉伸']),
    [adviceTips, finalScreeningData.isEmpty],
  );

  // ── 动态 placeholder ──
  const dynamicPlaceholder = useMemo(() => {
    if (finalScreeningData.isEmpty) return '对评估报告有疑问？问小柱...';
    return '对今天的建议有疑问？问小柱...';
  }, [finalScreeningData.isEmpty]);

  // ── 导航副作用 ──
  const navigateToResult = useCallback(() => navigate('/result'), [navigate]);
  const navigateToTracking = useCallback(() => navigate('/tracking'), [navigate]);

  // ── 回调 ──
  const handleQuickQuestion = useCallback(
    (question: string) => {
      if (llmAvailable) sendFreeTextStream(question);
      else advanceStep(question);
    },
    [sendFreeTextStream, advanceStep, llmAvailable],
  );

  return {
    // 患者
    patientName,
    patientAge,
    answers,
    // Agent
    llmAvailable,
    llmProcessing,
    messages,
    // 打卡
    weeklyDays,
    // 评估数据
    finalScreeningData,
    assessmentLoading,
    // Phase 3: 康复师推送数据
    treatmentPlan: latestPlan,
    planLoading,
    // 派生
    dynamicPlaceholder,
    // 导航
    navigateToResult,
    navigateToTracking,
    // 小柱建议（LLM 驱动）
    adviceLoading,
    displayAdvice,
    displayTips,
    // 回调
    handleQuickQuestion,
  } as const;
}

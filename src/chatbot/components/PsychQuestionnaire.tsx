/**
 * PsychQuestionnaire — PHQ-4 心理筛查问卷
 *
 * 4 题简短筛查：
 *   1-2 题：焦虑 (GAD-2)
 *   3-4 题：抑郁 (PHQ-2)
 *
 * 每题 0-3 分，总分 0-12。
 * 结果自动存入 useAgentStore.toolResults._psychAnswers，
 * 由 ToolBridge 在 dismissTool 时提交到 chatbot 后端。
 */
import React, { useState, useCallback } from 'react';
import { Heart, AlertTriangle, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

// ── PHQ-4 题目定义 ──
interface PHQ4Question {
  id: string;
  text: string;
  subtitle: string;
}

const PHQ4_QUESTIONS: PHQ4Question[] = [
  {
    id: 'anxiety_1',
    text: '感到紧张、焦虑或烦躁',
    subtitle: '过去两周里，您观察孩子有这种情况吗？',
  },
  {
    id: 'anxiety_2',
    text: '无法停止或控制担忧',
    subtitle: '孩子是否总是为各种事情担心？',
  },
  {
    id: 'depression_1',
    text: '对以前喜欢的事情兴趣减少',
    subtitle: '孩子是否对平时感兴趣的活动失去了兴趣？',
  },
  {
    id: 'depression_2',
    text: '情绪低落、沮丧或绝望',
    subtitle: '孩子是否表现出持续的情绪低落？',
  },
];

const SCORE_OPTIONS = [
  { score: 0, label: '完全没有', emoji: '😊' },
  { score: 1, label: '有几天', emoji: '😐' },
  { score: 2, label: '一半以上', emoji: '😟' },
  { score: 3, label: '几乎每天', emoji: '😢' },
];

// ── 结果解读 ──
function interpretPHQ4(totalScore: number): {
  level: string;
  color: string;
  bgColor: string;
  summary: string;
  suggestion: string;
} {
  if (totalScore <= 2) {
    return {
      level: '良好',
      color: '#10b981', // emerald-500
      bgColor: '#ecfdf5',
      summary: '孩子的情绪状态非常健康，未发现明显的焦虑或抑郁表现。',
      suggestion: '这很棒！继续和孩子保持阳光温馨的家庭沟通，多做户外伸展运动。',
    };
  }
  if (totalScore <= 5) {
    return {
      level: '轻度情绪困扰',
      color: '#eab308', // yellow-500
      bgColor: '#fefce8',
      summary: '孩子近期可能有些轻度的学习或情绪压力，值得关注。',
      suggestion: '建议多抽时间倾听孩子的内心想法，带ta出去踏青运动，排解压力。若持续不见好转可向心理老师咨询。',
    };
  }
  if (totalScore <= 8) {
    return {
      level: '中度焦虑抑郁风险',
      color: '#f97316', // orange-500
      bgColor: '#fff7ed',
      summary: '孩子可能有较明显的焦虑或抑郁情绪，对日常生活可能有一定影响。',
      suggestion: '建议与学校心理老师或者儿科心理医师建立沟通评估，帮助孩子跨过心理低谷，给予充分的家庭支持。',
    };
  }
  return {
    level: '明显情绪危机',
    color: '#ef4444', // red-500
    bgColor: '#fef2f2',
    summary: '情绪困扰比较严重，急需专业的心理健康支持。',
    suggestion: '请务必尽快寻求儿童心理科专家的诊疗，帮助孩子缓解不适。营造安全舒适的倾诉环境，陪ta共同面对。',
  };
}

// ── Component ──
export const PsychQuestionnaire: React.FC = () => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const dismissTool = useAgentStore((s) => s.dismissTool);

  const allScored = PHQ4_QUESTIONS.every((q) => scores[q.id] !== undefined);
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const result = submitted ? interpretPHQ4(totalScore) : null;

  const handleSelectScore = useCallback((questionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [questionId]: score }));
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allScored) return;

    // Store answers in agentStore for ToolBridge sync on dismiss
    const psychAnswers = PHQ4_QUESTIONS.map((q, i) => ({
      questionIndex: i,
      questionText: q.text,
      score: scores[q.id],
    }));

    useAgentStore.setState((s) => ({
      toolResults: { ...s.toolResults, _psychAnswers: psychAnswers },
    }));

    setSubmitted(true);
  }, [scores, allScored]);

  const handleBackToChat = useCallback(() => {
    dismissTool();
  }, [dismissTool]);

  // ── Results view ──
  if (submitted && result) {
    return (
      <div className="flex flex-col h-full bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Score card */}
          <div
            className="rounded-3xl p-5 text-center shadow-sm border border-slate-100 backdrop-blur-sm"
            style={{ backgroundColor: result.bgColor }}
          >
            <CheckCircle2 size={36} style={{ color: result.color }} className="mx-auto mb-2" />
            <p className="text-xs font-bold" style={{ color: result.color }}>
              PHQ-4 情绪评估已完成
            </p>
            <p className="mt-2 text-3xl font-black text-slate-800">
              {totalScore} <span className="text-sm font-bold text-slate-400">/ 12 分</span>
            </p>
            <p
              className="mt-2.5 inline-block rounded-full px-3.5 py-0.5 text-xs font-bold shadow-sm"
              style={{ backgroundColor: 'white', color: result.color }}
            >
              等级评估：{result.level}
            </p>
          </div>

          {/* Detail breakdown */}
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-4.5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1">
              📋 细项指标得分明细
            </h3>
            <div className="space-y-2.5">
              {PHQ4_QUESTIONS.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-650 font-medium truncate mr-2">{q.text}</span>
                  <span className="flex-shrink-0 tabular-nums font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    {scores[q.id]} 分
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-4.5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-750 mb-2 flex items-center gap-1">
              ✨ 评估报告深度解读
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">{result.summary}</p>
            <div className="mt-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/60 p-3.5 flex gap-2">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">{result.suggestion}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0 flex justify-center py-3.5 border-t border-slate-100 bg-white/90 shadow-lg">
          <button
            onClick={handleBackToChat}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            回到智能对话
          </button>
        </div>
      </div>
    );
  }

  // ── Questionnaire view ──
  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4.5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Heart size={16} className="text-emerald-500 fill-emerald-400" />
            <h3 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
              PHQ-4 儿童心理健康评估
            </h3>
          </div>
          <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">
            🩺 脊柱发育常伴随生长痛或体态困扰。这是一份简短的 4 题问卷，请结合过去两周的日常观察，为每道题选择最符合的情况。
          </p>
        </div>

        {/* Questions */}
        {PHQ4_QUESTIONS.map((q, qi) => (
          <div
            key={q.id}
            className="rounded-3xl border border-slate-200/60 bg-white p-4.5 shadow-sm"
          >
            <div className="flex items-start gap-2.5 mb-3.5">
              <span className="flex-shrink-0 flex items-center justify-center w-5.5 h-5.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold">
                {qi + 1}
              </span>
              <div>
                <p className="text-xs font-extrabold text-slate-800 leading-tight">{q.text}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{q.subtitle}</p>
              </div>
            </div>

            {/* Score options */}
            <div className="grid grid-cols-4 gap-1.5">
              {SCORE_OPTIONS.map((opt) => {
                const selected = scores[q.id] === opt.score;
                return (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => handleSelectScore(q.id, opt.score)}
                    className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl text-[10px] transition-all border cursor-pointer ${
                      selected
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 shadow-sm shadow-emerald-100/50 scale-[1.02]'
                        : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100/70 hover:text-slate-700'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{opt.emoji}</span>
                    <span className="font-bold">{opt.label}</span>
                    <span className="text-[9px] opacity-60 font-semibold">{opt.score}分</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom submit bar */}
      <div className="flex-shrink-0 flex justify-center gap-3 py-3.5 px-4 border-t border-slate-100 bg-white/90 shadow-md">
        <button
          onClick={handleBackToChat}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          取消返回
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allScored}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-emerald-100/15 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles size={14} />
          完成，分析情绪健康
        </button>
      </div>
    </div>
  );
};

export default PsychQuestionnaire;

/**
 * PsychQuestionnaire — PHQ-4 心理筛查问卷
 *
 * 4 题简短筛查：
 *   1-2 题：焦虑 (GAD-2)
 *   3-4 题：抑郁 (PHQ-2)
 *
 * 每題 0-3 分，总分 0-12。
 * 结果自动存入 useAgentStore.toolResults._psychAnswers，
 * 由 ToolBridge 在 dismissTool 时提交到 chatbot 后端。
 */
import React, { useState, useCallback } from 'react';
import { Heart, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
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
      level: '正常',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      summary: '孩子的情绪状态良好，未发现明显的焦虑或抑郁表现。',
      suggestion: '继续保持积极沟通和户外活动，定期关注孩子的情绪变化。',
    };
  }
  if (totalScore <= 5) {
    return {
      level: '轻度困扰',
      color: '#ca8a04',
      bgColor: '#fefce8',
      summary: '孩子有一些轻度的情绪或焦虑表现，值得关注。',
      suggestion: '建议多和孩子沟通，了解ta的内心想法。鼓励参加体育活动和社交，如果持续2周以上建议找心理老师聊聊。',
    };
  }
  if (totalScore <= 8) {
    return {
      level: '中度困扰',
      color: '#ea580c',
      bgColor: '#fff7ed',
      summary: '孩子可能有较明显的焦虑或抑郁情绪，需要重视。',
      suggestion: '建议尽快与学校心理老师或儿童心理科医生沟通，评估是否需要专业帮助。同时保持家庭温暖支持。',
    };
  }
  return {
    level: '明显困扰',
    color: '#dc2626',
    bgColor: '#fef2f2',
    summary: '情绪困扰较严重，建议尽快寻求专业心理帮助。',
    suggestion: '请尽快联系学校心理老师或前往儿童心理科评估。家人的理解和支持非常重要，不要让孩子独自面对。',
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
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Score card */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: result.bgColor }}
          >
            <CheckCircle2 size={40} style={{ color: result.color }} className="mx-auto mb-2" />
            <p className="text-sm font-medium" style={{ color: result.color }}>
              PHQ-4 筛查完成
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalScore} <span className="text-base font-normal text-slate-400">/ 12 分</span>
            </p>
            <p
              className="mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-semibold"
              style={{ backgroundColor: `${result.color}18`, color: result.color }}
            >
              {result.level}
            </p>
          </div>

          {/* Detail breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">各题得分</h3>
            <div className="space-y-2">
              {PHQ4_QUESTIONS.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{q.text}</span>
                  <span className="flex-shrink-0 tabular-nums font-medium text-slate-900">
                    {scores[q.id]} 分
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">解读</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 flex gap-2">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">{result.suggestion}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex-shrink-0 flex justify-center py-3 border-t border-slate-100">
          <button
            onClick={handleBackToChat}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            回到对话
          </button>
        </div>
      </div>
    );
  }

  // ── Questionnaire view ──
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} className="text-purple-500" />
            <h3 className="text-sm font-semibold text-purple-800">PHQ-4 心理筛查</h3>
          </div>
          <p className="text-xs text-purple-600/80">
            这是一份简短的 4 题问卷，帮助了解孩子近期的心理状态。
            请根据过去两周的观察，为每道题选择一个最符合的选项。
          </p>
        </div>

        {/* Questions */}
        {PHQ4_QUESTIONS.map((q, qi) => (
          <div
            key={q.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                {qi + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{q.text}</p>
                <p className="text-xs text-slate-400 mt-0.5">{q.subtitle}</p>
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
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs transition-all ${
                      selected
                        ? 'bg-purple-100 border-2 border-purple-400 text-purple-700 shadow-sm'
                        : 'border-2 border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-[10px] opacity-60">{opt.score}分</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom submit bar */}
      <div className="flex-shrink-0 flex justify-center gap-3 py-3 px-4 border-t border-slate-100">
        <button
          onClick={handleBackToChat}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allScored}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Heart size={16} />
          提交筛查
        </button>
      </div>
    </div>
  );
};

export default PsychQuestionnaire;

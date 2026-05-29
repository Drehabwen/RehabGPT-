/**
 * 量表填写组件
 *
 * 根据 scale_id 动态渲染不同量表：
 * - SRS-22: 评分量表（1-5分）
 * - HOME_WEEKLY_FEEDBACK_V1: 开放式反馈表
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Send, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getScaleDefinition,
  calculateSRS22Score,
  type ScaleDefinition,
  type ScaleQuestion,
  type ScaleData,
} from '../../api/scaleApi';
import { useScaleStore } from '../store/useScaleStore';
import type { PendingScale } from '../../api/scaleApi';

interface ScaleFormProps {
  task: PendingScale;
  onComplete: () => void;
  onCancel: () => void;
}

export const ScaleForm: React.FC<ScaleFormProps> = ({ task, onComplete, onCancel }) => {
  const submitScaleTask = useScaleStore((s) => s.submitScaleTask);
  const isSubmitting = useScaleStore((s) => s.isSubmitting);

  const definition = getScaleDefinition(task.scale_id);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  // 如果没有找到量表定义，显示错误
  if (!definition) {
    return (
      <div className="bg-red-50 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800">量表未找到</h3>
        <p className="text-sm text-red-600 mt-1">量表 ID: {task.scale_id}</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-white text-red-600 rounded-xl text-sm font-medium border border-red-200"
        >
          返回
        </button>
      </div>
    );
  }

  // 按 category 分组问题
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, ScaleQuestion[]> = {};
    for (const q of definition.questions) {
      const cat = q.category || '其他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    }
    return groups;
  }, [definition]);

  const categories = Object.keys(groupedQuestions);
  const currentCategory = categories[currentStep];
  const currentQuestions = groupedQuestions[currentCategory] || [];
  const isLastStep = currentStep === categories.length - 1;

  // 检查当前步骤是否已填写
  const isStepComplete = currentQuestions.every((q) => {
    if (!q.required) return true;
    return answers[q.id] !== undefined && answers[q.id] !== '';
  });

  const handleAnswer = (questionId: string, value: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    // 构建 scale_data
    let scaleData: ScaleData;

    if (definition.type === 'standard') {
      // 标准化量表（如 SRS-22）
      const numericAnswers: Record<string, number> = {};
      const scaleAnswers = definition.questions.map((q) => {
        const val = answers[q.id];
        const numVal = typeof val === 'number' ? val : parseInt(val as string) || 0;
        numericAnswers[q.id] = numVal;
        return {
          questionId: q.id,
          questionText: q.text,
          category: q.category,
          score: numVal,
          answerText: q.options?.find((o) => o.value === numVal)?.label || String(val),
        };
      });

      const scoreResult = calculateSRS22Score(numericAnswers);

      scaleData = {
        scaleId: definition.id,
        scaleName: definition.name,
        filledBy: 'parent',
        totalScore: scoreResult.totalScore,
        maxScore: scoreResult.maxScore,
        percentageScore: scoreResult.percentageScore,
        dimensions: scoreResult.dimensions,
        answers: scaleAnswers,
        createdAt: Date.now(),
      };
    } else {
      // 自定义反馈表
      scaleData = {
        scaleId: definition.id,
        scaleName: definition.name,
        filledBy: 'parent',
        answers: definition.questions.map((q) => ({
          questionId: q.id,
          questionText: q.text,
          answerText: String(answers[q.id] || ''),
        })),
        createdAt: Date.now(),
      };
    }

    const payload = {
      task_id: task.task_id,
      session_id: task.session_id,
      scale_data: scaleData,
    };

    await submitScaleTask(payload, scaleData);
    onComplete();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* 头部 */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-sm text-slate-500">
            {currentStep + 1} / {categories.length}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{definition.name}</h2>
        <p className="text-sm text-slate-500 mt-1">{definition.description}</p>
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          预计 {definition.estimatedMinutes} 分钟
        </div>
      </div>

      {/* 进度条 */}
      <div className="flex gap-1 px-6 py-3 bg-white">
        {categories.map((cat, i) => (
          <div
            key={cat}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* 问题区域 */}
      <div className="p-6 space-y-6">
        <h3 className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
          {getCategoryLabel(currentCategory)}
        </h3>

        {currentQuestions.map((question) => (
          <div key={question.id} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              {question.text}
              {question.required && <span className="text-red-400 ml-1">*</span>}
            </label>

            {question.type === 'rating' && question.options && (
              <div className="grid grid-cols-5 gap-2">
                {question.options.map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => handleAnswer(question.id, opt.value as number)}
                    className={`py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      answers[question.id] === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="请输入..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            )}

            {question.type === 'multiline' && (
              <textarea
                value={(answers[question.id] as string) || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="请输入详细内容..."
                rows={4}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一步
        </button>

        {!isLastStep ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!isStepComplete}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isStepComplete}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── 辅助函数 ──

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    functionActive: '功能活动',
    pain: '疼痛',
    selfImage: '自我形象',
    mentalHealth: '心理健康',
    satisfaction: '满意度',
    training: '训练情况',
    difficulty: '困难',
    improvement: '改善',
    question: '问题',
    other: '其他',
  };
  return labels[category] || category;
}

export default ScaleForm;

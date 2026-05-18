import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useChatbotStore } from '@/chatbot/store/useChatbotStore';
import { RiskResult } from '@/chatbot/components/RiskResult';
import { createScreeningRecord } from '@/api/screeningApi';

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const riskResult = useChatbotStore((s) => s.riskResult);
  const answers = useChatbotStore((s) => s.answers);
  const resetFlow = useChatbotStore((s) => s.resetFlow);
  const patientAge = (answers.age as number) || null;

  const handleSave = async () => {
    if (!riskResult) return;
    try {
      await createScreeningRecord({
        subject_name: patientName || '匿名用户',
        subject_gender:
          answers.gender === '男' ? 'M' : answers.gender === '女' ? 'F' : undefined,
        source: 'chatbot-self-screening',
        screening_data: {
          method: 'adams',
          dateTime: new Date().toISOString(),
          questionnaire: {
            familyScoliosis: answers.family_scoliosis === '有',
            backPain: answers.back_pain !== '从不疼',
            painLevel: Number(answers.pain_level) || undefined,
          },
          adamTest: {
            result:
              answers.adams_result === '明显隆起'
                ? 'positive_significant'
                : answers.adams_result === '轻微不对称'
                  ? 'positive_suspect'
                  : 'negative',
          },
        },
        referral_recommended:
          riskResult.level === 'moderate' || riskResult.level === 'high',
        referral_urgency: riskResult.urgency,
        notes: `[家长自助筛查] 风险评分: ${riskResult.total}/160 (${riskResult.levelLabel})`,
      });
      console.log('[ResultPage] Screening saved');
    } catch (err) {
      console.error('[ResultPage] Save failed:', err);
    }
  };

  if (!riskResult) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-4">暂无筛查结果</p>
          <button
            onClick={() => navigate(patientId ? '/chat' : '/')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {patientId ? '返回对话' : '开始筛查'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white/90 border-b border-slate-200/60 backdrop-blur-sm">
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <span className="text-sm font-semibold text-slate-700">筛查报告</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
        {/* Patient info card */}
        <div className="rounded-2xl border border-white/70 bg-white/95 shadow-sm px-5 py-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            孩子脊柱健康报告
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {patientName || '孩子'} ·{' '}
            {patientAge ? `${patientAge} 岁` : '年龄未知'}
          </p>
        </div>

        {/* Risk result */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/94 shadow-sm p-4">
          <RiskResult result={riskResult} />

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <Save size={16} />
              保存检查结果
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-300 bg-white text-slate-600 font-medium text-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              重新筛查
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

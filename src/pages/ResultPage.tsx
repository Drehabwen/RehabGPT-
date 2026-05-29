import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, HeartPulse } from 'lucide-react';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { RiskResult } from '../chatbot/components/RiskResult';
import { AppLayout } from '../chatbot/components/AppLayout';
import { createScreeningRecord } from '../api/screeningApi';

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
      <div className="h-[100dvh] flex items-center justify-center bg-gradient-to-tr from-emerald-50/50 via-teal-50/40 to-slate-100/30">
        <div className="text-center p-6 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-md">
          <p className="text-slate-500 font-bold text-sm mb-4">暂无筛查结果报告</p>
          <button
            onClick={() => navigate(patientId ? '/chat' : '/')}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {patientId ? '返回小柱对话' : '开始智能筛查'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      title="脊柱侧弯筛查报告"
      backPath="/chat"
    >
      {/* Patient info card */}
      <div className="rounded-3xl border border-white/80 bg-white/70 shadow-sm px-5 py-4 mb-4 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">
          {patientName?.slice(-1) || '孩'}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1">
            <HeartPulse size={16} className="text-emerald-600 animate-pulse" />
            儿童脊柱健康报告
          </h2>
          <p className="mt-0.5 text-xs text-slate-450 font-semibold">
            {patientName || '孩子'} ·{' '}
            {patientAge ? `${patientAge} 岁` : '年龄未知'}
          </p>
        </div>
      </div>

      {/* Risk result panel */}
      <div className="rounded-3xl border border-slate-200/50 bg-white/80 shadow-md p-5 backdrop-blur-md">
        <RiskResult result={riskResult} />

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-5">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.98] cursor-pointer"
          >
            <Save size={16} />
            保存结果，安全推送至工作台
          </button>
          <button
            type="button"
            onClick={resetFlow}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-slate-250 bg-white text-slate-650 font-bold text-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <RotateCcw size={16} />
            重新筛查
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ResultPage;

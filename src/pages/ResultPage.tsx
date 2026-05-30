/**
 * ResultPage — 康复师评估报告
 *
 * 数据源从「家长自筛结果」切换为「康复师推送的评估报告」。
 * 过渡期复用 riskResult 展示，后续切换到 GET /api/integration/assessment/summary/{patientId}。
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, MessageCircle } from 'lucide-react';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { useAgentStore } from '../chatbot/store/useAgentStore';
import { RiskResult } from '../chatbot/components/RiskResult';
import { AppLayout } from '../chatbot/components/AppLayout';

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const riskResult = useAgentStore((s) => s.riskResult);
  const answers = useAgentStore((s) => s.answers);
  const patientAge = (answers.age as number) || null;

  if (!riskResult) {
    return (
      <AppLayout title="评估报告" backPath="/chat">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-5">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-2">
            等待康复师完成评估
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs leading-relaxed">
            康复师正在为孩子进行专业评估，完成后报告将自动推送到这里
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle size={16} />
            返回首页咨询小柱
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="评估报告" backPath="/chat">
      {/* Patient info card */}
      <div className="rounded-3xl border border-white/80 bg-white/70 shadow-sm px-5 py-4 mb-4 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">
          {patientName?.slice(-1) || '孩'}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1">
            <HeartPulse size={16} className="text-emerald-600" />
            康复师评估报告
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 font-semibold">
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
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle size={16} />
            返回首页咨询小柱
          </button>
          <button
            type="button"
            onClick={() => navigate('/tracking')}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold text-sm transition-all hover:bg-slate-50 active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <HeartPulse size={16} />
            查看训练打卡
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ResultPage;

/**
 * ChatbotAgent — 小柱（家长端 AI 助手）主界面
 *
 * 视图：chat | adams_camera | result
 * - chat: 对话界面（默认）
 * - adams_camera: Adams 弯腰摄像头检测
 * - result: 风险评估结果
 */
import React, { useCallback } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { AdamsCameraView } from './components/AdamsCameraView';
import { RiskResult } from './components/RiskResult';
import { useChatbotStore } from './store/useChatbotStore';
import { useAgentStore } from './store/useAgentStore';
import { createScreeningRecord } from '@/api/screeningApi';

interface ChatbotAgentProps {
  patientId: string;
  patientName: string;
  patientAge?: number | null;
}

export const ChatbotAgent: React.FC<ChatbotAgentProps> = ({
  patientId,
  patientName,
  patientAge,
}) => {
  const view = useChatbotStore((s) => s.view);
  const riskResult = useChatbotStore((s) => s.riskResult);
  const stepIndex = useChatbotStore((s) => s.stepIndex);
  const answers = useChatbotStore((s) => s.answers);
  const totalSteps = useChatbotStore((s) => s.getTotalSteps());
  const resetFlow = useChatbotStore((s) => s.resetFlow);

  // ── 保存筛查结果到后端 ──
  const handleSaveResult = useCallback(async () => {
    if (!riskResult) return;

    try {
      await createScreeningRecord({
        subject_name: patientName || '匿名用户',
        subject_gender: answers.gender === '男' ? 'M' : answers.gender === '女' ? 'F' : undefined,
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
        referral_recommended: riskResult.level === 'moderate' || riskResult.level === 'high',
        referral_urgency: riskResult.urgency,
        notes: `[家长自助筛查] 风险评分: ${riskResult.total}/160 (${riskResult.levelLabel})`,
      });
      console.log('[ChatbotAgent] Screening saved successfully');
    } catch (err) {
      console.error('[ChatbotAgent] Save failed:', err);
    }
  }, [riskResult, answers, patientName]);

  // ── Adams Camera View ──
  if (view === 'adams_camera') {
    return <AdamsCameraView />;
  }

  // ── Result View ──
  if (view === 'result' && riskResult) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-shrink-0 mx-4 mt-4 px-5 py-4 rounded-2xl border border-white/70 bg-white/90 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">孩子脊柱健康报告</h2>
          <p className="mt-1 text-xs text-slate-400">
            {patientName || '孩子'} · {patientAge ? `${patientAge} 岁` : '年龄未知'}
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto mx-4 mt-3 mb-6 rounded-2xl border border-slate-200/80 bg-white/94 shadow-sm p-4 custom-scrollbar">
          <RiskResult result={riskResult} />
          <div className="flex flex-col gap-2 mt-4">
            <button
              type="button"
              onClick={handleSaveResult}
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
    );
  }

  // ── Default: Chat View ──
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-shrink-0 mx-4 mt-4 px-5 py-3 rounded-2xl border border-white/70 bg-white/90 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          {patientName || '孩子'} 的脊柱健康
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          {patientAge ? `${patientAge} 岁 · ` : ''}
          小柱帮您关注孩子的脊柱健康
        </p>
      </div>
      <div className="flex-1 min-h-0 mx-4 mt-3 mb-4 rounded-2xl border border-slate-200/80 bg-white/94 shadow-sm overflow-hidden flex flex-col">
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatbotAgent;

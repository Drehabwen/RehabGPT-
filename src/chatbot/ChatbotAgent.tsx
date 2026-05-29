/**
 * ChatbotAgent — 小柱（家长端 AI 助手）主界面
 *
 * 视图：chat | adams_camera | result
 * - chat: 对话界面（默认）
 * - adams_camera: Adams 弯腰摄像头检测
 * - result: 风险评估结果
 */
import React, { useCallback, useEffect } from 'react';
import { Save, RotateCcw, HeartPulse } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { AdamsCameraView } from './components/AdamsCameraView';
import { RiskResult } from './components/RiskResult';
import { useChatbotStore } from './store/useChatbotStore';
import { useAgentStore } from './store/useAgentStore';
import { createScreeningRecord } from '../api/screeningApi';
import { GlassCard, Button, StatusBadge } from './ui';

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
  // Read view/riskResult/answers from useAgentStore (single source of truth)
  // avoids camera view desync bug where closeCamera only updated agentStore
  const view = useAgentStore((s) => s.view);
  const riskResult = useAgentStore((s) => s.riskResult);
  const answers = useAgentStore((s) => s.answers);
  const resetFlow = useChatbotStore((s) => s.resetFlow);

  // 初始化 Agent 随随访患者上下文
  useEffect(() => {
    if (patientId && patientName) {
      useAgentStore.getState().initWithPatient(patientId, patientName, patientAge);
    }
  }, [patientId, patientName, patientAge]);

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
      <div className="flex-1 min-h-0 flex flex-col bg-transparent">
        {/* Soft floating glass panel for profile */}
        <GlassCard
          className="flex-shrink-0 mx-4 mt-3 px-5 py-4 flex items-center justify-between"
          style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.8)' }}
        >
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <HeartPulse size={18} className="text-emerald-600 animate-pulse" />
              孩子脊柱健康报告
            </h2>
            <p className="mt-0.5 text-xs text-slate-450 font-medium">
              {patientName || '孩子'} · {patientAge ? `${patientAge} 岁` : '年龄未知'}
            </p>
          </div>
          <StatusBadge status="success">筛查完成</StatusBadge>
        </GlassCard>

        {/* Main report body */}
        <GlassCard
          className="flex-1 min-h-0 overflow-y-auto mx-4 mt-3 mb-4 p-5 custom-scrollbar"
          style={{ borderRadius: '24px', display: 'flex', flexDirection: 'column' }}
        >
          <RiskResult result={riskResult} />

          <div className="flex flex-col gap-2 mt-5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveResult}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(to right, #10b981, #0d9488)',
              }}
            >
              <Save size={16} />
              保存检查结果，同步至工作台
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={resetFlow}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RotateCcw size={16} />
              重新筛查
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ── Default: Chat View ──
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-transparent">
      {/* Top soft card */}
      <GlassCard
        className="flex-shrink-0 mx-4 mt-3 px-5 py-3 flex items-center justify-between"
        style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.8)' }}
      >
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">
            {patientName || '孩子'} 的脊柱健康
          </h2>
          <p className="mt-0.5 text-xs text-slate-450 font-medium">
            {patientAge ? `${patientAge} 岁 · ` : ''}小柱为您与康复师搭建直通桥梁
          </p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shadow-sm shadow-emerald-400" />
      </GlassCard>

      {/* Message Area */}
      <GlassCard
        className="flex-1 min-h-0 mx-4 mt-3 mb-3 overflow-hidden flex flex-col"
        style={{ borderRadius: '24px' }}
      >
        <ChatWindow />
      </GlassCard>
    </div>
  );
};

export default ChatbotAgent;

import React, { useEffect, useState, useCallback } from 'react';
import { FileText, CheckCircle2, Clock, MessageCircle, Send, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { AppLayout } from '../chatbot/components/AppLayout';
import {
  getPatientPrescriptions,
  submitPrescriptionFeedback,
  type Prescription,
} from '../api/prescriptionApi';

const STATUS_LABELS: Record<string, string> = {
  active: '执行中',
  completed: '已完成',
  paused: '已暂停',
  draft: '草稿',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-750 border-emerald-100/50',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100/50',
  paused: 'bg-amber-50 text-amber-700 border-amber-100/50',
  draft: 'bg-slate-50 text-slate-500 border-slate-100/50',
};

const FEEDBACK_OPTIONS = [
  { type: 'ack' as const, label: '收到', icon: CheckCircle2, activeColor: 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' },
  { type: 'progress' as const, label: '执行中', icon: Clock, activeColor: 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' },
  { type: 'completed' as const, label: '完成啦', icon: CheckCircle2, activeColor: 'bg-green-600 text-white border-green-600 hover:bg-green-700' },
  { type: 'question' as const, label: '有疑问', icon: MessageCircle, activeColor: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' },
];

export const PrescriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<Record<string, string>>({});

  // ── 加载处方列表 ──
  const loadPrescriptions = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientPrescriptions(patientId);
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error('[Prescriptions] Load failed:', err);
      setError('加载康复处方失败，请确保后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  // ── 提交反馈 ──
  const handleFeedback = useCallback(
    async (prescriptionId: string, feedbackType: 'ack' | 'progress' | 'completed' | 'question') => {
      if (!patientId) return;
      const text = feedbackText[prescriptionId] || '';
      try {
        setSubmitting(prescriptionId);
        await submitPrescriptionFeedback({
          prescription_id: prescriptionId,
          patient_id: patientId,
          feedback_type: feedbackType,
          content: text || undefined,
        });
        setSubmitMsg((prev) => ({
          ...prev,
          [prescriptionId]: `✨ 已提交反馈：【${FEEDBACK_OPTIONS.find((f) => f.type === feedbackType)?.label}】`,
        }));
        setFeedbackText((prev) => {
          const next = { ...prev };
          delete next[prescriptionId];
          return next;
        });
      } catch (err) {
        console.error('[Prescriptions] Feedback failed:', err);
        setSubmitMsg((prev) => ({
          ...prev,
          [prescriptionId]: '⚠️ 反馈发送失败，请稍后重试',
        }));
      } finally {
        setSubmitting(null);
      }
    },
    [patientId, feedbackText],
  );

  const footer = (
    <div className="flex items-center justify-around px-4 py-2.5 bg-white/90 border-t border-slate-100/80 backdrop-blur-md shadow-lg shadow-slate-100 select-none">
      <button
        onClick={() => navigate('/chat')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-slate-400 hover:text-emerald-700 font-medium transition-all cursor-pointer"
      >
        <MessageCircle size={20} />
        <span className="text-[10px] tracking-wide">智能对话</span>
      </button>
      <button
        onClick={() => navigate('/prescriptions')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-emerald-700 font-bold transition-all cursor-pointer"
      >
        <FileText size={20} className="stroke-[2.5]" />
        <span className="text-[10px] tracking-wide">执行处方</span>
      </button>
      <button
        onClick={() => navigate('/tracking')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-slate-400 hover:text-emerald-700 font-medium transition-all cursor-pointer"
      >
        <Activity size={20} />
        <span className="text-[10px] tracking-wide">日常追踪</span>
      </button>
    </div>
  );

  return (
    <AppLayout
      title={patientName ? `${patientName} 的康复方案` : '康复处方'}
      backPath="/chat"
      footer={footer}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">正在调取康复医师方案...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-5 rounded-3xl bg-red-50/80 backdrop-blur-sm border border-red-100 text-sm text-red-800 shadow-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-extrabold text-red-950">无法拉取康复方案</p>
            <p className="mt-1 text-red-650 text-xs font-medium leading-relaxed">{error}</p>
            <button
              onClick={loadPrescriptions}
              className="mt-3 inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-xs font-bold text-red-800 transition-all active:scale-95"
            >
              点我重新拉取
            </button>
          </div>
        </div>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400/80 gap-3">
          <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center shadow-sm text-slate-350">
            <FileText size={32} strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-650 text-sm">这里目前还是空空的哦</p>
          <p className="text-xs text-slate-450 text-center font-medium leading-relaxed px-6">
            当康复师在工作台为您开具了专属训练指导或评估报告后，这里会自动同步，请密切关注小柱的消息。
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="mb-4 rounded-3xl border border-white/80 bg-white/80 backdrop-blur-md shadow-md hover:shadow-lg transition-all overflow-hidden"
          >
            {/* Prescription Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500 fill-amber-400" />
                  {rx.title || '定制康复执行方案'}
                </h3>
                <p className="mt-1 text-[10px] text-slate-400 font-medium">
                  下发时间: {new Date(rx.created_at * 1000).toLocaleDateString('zh-CN')}
                  {rx.created_by ? ` · 康复师: ${rx.created_by}` : ''}
                </p>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                  STATUS_COLORS[rx.status] || 'bg-slate-100 text-slate-605 border-slate-200'
                }`}
              >
                {STATUS_LABELS[rx.status] || rx.status}
              </span>
            </div>

            {/* Prescription Content */}
            <div className="px-5 py-5">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed font-medium">
                {rx.content}
              </pre>
            </div>

            {/* Feedback Section */}
            <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100/80">
              {submitMsg[rx.id] ? (
                <p className="text-xs text-emerald-600 mb-3 font-bold bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  {submitMsg[rx.id]}
                </p>
              ) : (
                <p className="text-[11px] text-slate-450 font-bold mb-2.5">
                  💪 配合打卡与反馈，能帮助康复师更好地微调方案哦：
                </p>
              )}

              {/* Feedback Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {FEEDBACK_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleFeedback(rx.id, opt.type)}
                      disabled={submitting === rx.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-650 hover:border-emerald-300 hover:text-emerald-750 transition-all disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Icon size={12} className="stroke-[2.5]" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Text Feedback Input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={feedbackText[rx.id] || ''}
                  onChange={(e) =>
                    setFeedbackText((prev) => ({
                      ...prev,
                      [rx.id]: e.target.value,
                    }))
                  }
                  placeholder="遇到困难了？或者有些问题？在此补充留言..."
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 font-medium shadow-inner"
                />
                <button
                  onClick={() => handleFeedback(rx.id, 'question')}
                  disabled={submitting === rx.id || !feedbackText[rx.id]?.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  <Send size={11} />
                  留言
                </button>
              </div>
            </div>
          </div>
        ))}
    </AppLayout>
  );
};

export default PrescriptionsPage;

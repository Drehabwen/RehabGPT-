import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, Clock, MessageCircle, Send, AlertCircle } from 'lucide-react';
import { useChatbotStore } from '@/chatbot/store/useChatbotStore';
import {
  getPatientPrescriptions,
  submitPrescriptionFeedback,
  type Prescription,
} from '@/api/prescriptionApi';

const STATUS_LABELS: Record<string, string> = {
  active: '执行中',
  completed: '已完成',
  paused: '已暂停',
  draft: '草稿',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-500',
};

const FEEDBACK_OPTIONS = [
  { type: 'ack' as const, label: '收到', icon: CheckCircle2, color: 'bg-emerald-500' },
  { type: 'progress' as const, label: '进行中', icon: Clock, color: 'bg-blue-500' },
  { type: 'completed' as const, label: '已完成', icon: CheckCircle2, color: 'bg-green-600' },
  { type: 'question' as const, label: '有疑问', icon: MessageCircle, color: 'bg-amber-500' },
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
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientPrescriptions(patientId);
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error('[Prescriptions] Load failed:', err);
      setError('加载处方失败，请确保后端服务已启动');
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
          [prescriptionId]: `${FEEDBACK_OPTIONS.find((f) => f.type === feedbackType)?.label} — 已提交`,
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
          [prescriptionId]: '提交失败，请重试',
        }));
      } finally {
        setSubmitting(null);
      }
    },
    [patientId, feedbackText],
  );

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
        <span className="text-sm font-semibold text-slate-700">
          {patientName ? `${patientName} 的康复处方` : '康复处方'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-500">加载处方中...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">无法加载处方</p>
              <p className="mt-1 text-red-600 text-xs">{error}</p>
              <button
                onClick={loadPrescriptions}
                className="mt-2 text-xs font-medium text-red-700 underline hover:text-red-800"
              >
                点击重试
              </button>
            </div>
          </div>
        )}

        {!loading && !error && prescriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText size={48} strokeWidth={1.5} />
            <p className="mt-4 text-sm">暂无康复处方</p>
            <p className="mt-1 text-xs">康复师开具的处方会显示在这里</p>
          </div>
        )}

        {!loading &&
          !error &&
          prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="mb-4 rounded-2xl border border-white/70 bg-white/95 shadow-sm overflow-hidden"
            >
              {/* 处方头部 */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {rx.title || '康复处方'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      STATUS_COLORS[rx.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[rx.status] || rx.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {new Date(rx.created_at * 1000).toLocaleDateString('zh-CN')}
                  {rx.created_by ? ` · ${rx.created_by}` : ''}
                </p>
              </div>

              {/* 处方内容 */}
              <div className="px-5 py-4">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {rx.content}
                </pre>
              </div>

              {/* 反馈区 */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
                {submitMsg[rx.id] && (
                  <p className="text-xs text-emerald-600 mb-2 font-medium">
                    {submitMsg[rx.id]}
                  </p>
                )}

                {/* 快捷反馈按钮 */}
                <div className="flex items-center gap-2 mb-2">
                  {FEEDBACK_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => handleFeedback(rx.id, opt.type)}
                        disabled={submitting === rx.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Icon size={13} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* 文字反馈输入 */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feedbackText[rx.id] || ''}
                    onChange={(e) =>
                      setFeedbackText((prev) => ({
                        ...prev,
                        [rx.id]: e.target.value,
                      }))
                    }
                    placeholder="补充说明（可选）..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <button
                    onClick={() => handleFeedback(rx.id, 'question')}
                    disabled={submitting === rx.id || !feedbackText[rx.id]?.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    <Send size={12} />
                    发送
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PrescriptionsPage;

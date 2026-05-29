import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageCircle, Activity, ClipboardList } from 'lucide-react';
import { ChatbotAgent } from '../chatbot/ChatbotAgent';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { AppLayout } from '../chatbot/components/AppLayout';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const answers = useChatbotStore((s) => s.answers);
  const patientAge = (answers.age as number) || null;

  const headerRight = (
    <button
      onClick={() => navigate('/prescriptions')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-750 bg-emerald-50 hover:bg-emerald-100/80 transition-all active:scale-95 cursor-pointer"
    >
      <FileText size={14} />
      康复处方
    </button>
  );

  const footer = (
    <div className="flex items-center justify-around px-4 py-2.5 bg-white/90 border-t border-slate-100/80 backdrop-blur-md shadow-lg shadow-slate-100 select-none">
      <button
        onClick={() => navigate('/chat')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-emerald-700 font-bold transition-all cursor-pointer"
      >
        <MessageCircle size={20} className="stroke-[2.5]" />
        <span className="text-[10px] tracking-wide">智能对话</span>
      </button>
      <button
        onClick={() => navigate('/prescriptions')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-slate-400 hover:text-emerald-700 font-medium transition-all cursor-pointer"
      >
        <FileText size={20} />
        <span className="text-[10px] tracking-wide">执行处方</span>
      </button>
      <button
        onClick={() => navigate('/tracking')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-slate-400 hover:text-emerald-700 font-medium transition-all cursor-pointer"
      >
        <Activity size={20} />
        <span className="text-[10px] tracking-wide">日常追踪</span>
      </button>
      <button
        onClick={() => navigate('/scales')}
        className="flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl text-slate-400 hover:text-emerald-700 font-medium transition-all cursor-pointer"
      >
        <ClipboardList size={20} />
        <span className="text-[10px] tracking-wide">量表中心</span>
      </button>
    </div>
  );

  return (
    <AppLayout
      title="小柱智能助手"
      backPath="/"
      headerRight={headerRight}
      footer={footer}
      disableScroll
    >
      <ChatbotAgent
        patientId={patientId}
        patientName={patientName}
        patientAge={patientAge}
      />
    </AppLayout>
  );
};

export default ChatPage;

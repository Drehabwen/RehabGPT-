import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageCircle, ArrowLeft } from 'lucide-react';
import { ChatbotAgent } from '@/chatbot/ChatbotAgent';
import { useChatbotStore } from '@/chatbot/store/useChatbotStore';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const answers = useChatbotStore((s) => s.answers);
  const patientAge = (answers.age as number) || null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 border-b border-slate-200/60 backdrop-blur-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <span className="text-sm font-semibold text-slate-700">
          小柱
        </span>
        <button
          onClick={() => navigate('/prescriptions')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <FileText size={15} />
          处方
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ChatbotAgent
          patientId={patientId}
          patientName={patientName}
          patientAge={patientAge}
        />
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 flex items-center justify-around px-4 py-2 bg-white/95 border-t border-slate-200/60 backdrop-blur-sm">
        <button
          onClick={() => navigate('/chat')}
          className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg text-blue-600"
        >
          <MessageCircle size={20} />
          <span className="text-[10px] font-medium">对话</span>
        </button>
        <button
          onClick={() => navigate('/prescriptions')}
          className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
        >
          <FileText size={20} />
          <span className="text-[10px] font-medium">处方</span>
        </button>
      </div>
    </div>
  );
};

export default ChatPage;

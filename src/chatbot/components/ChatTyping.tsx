import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, Zap } from 'lucide-react';

interface ChatTypingProps {
  isCached?: boolean;
  startTime?: number;
}

/**
 * 智能思考指示器
 * 让用户明确知道：小柱正在"思考"，不是卡死了
 */
export const ChatTyping: React.FC<ChatTypingProps> = ({ isCached = false, startTime = Date.now() }) => {
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = [
    { icon: Brain, text: '小柱正在理解您的问题...', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]', dotBg: 'bg-[var(--color-primary)]', dotBgOpacity: 'bg-[var(--color-primary)]/20' },
    { icon: Sparkles, text: '正在分析孩子的脊柱健康情况...', color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary-light)]', dotBg: 'bg-[var(--color-secondary)]', dotBgOpacity: 'bg-[var(--color-secondary)]/20' },
    { icon: Clock, text: '生成专业康复建议...', color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-light)]', dotBg: 'bg-[var(--color-warning)]', dotBgOpacity: 'bg-[var(--color-warning)]/20' },
    { icon: Sparkles, text: '马上就好，请稍候...', color: 'text-[var(--color-secondary)]', bg: 'bg-[var(--color-secondary-light)]', dotBg: 'bg-[var(--color-secondary)]', dotBgOpacity: 'bg-[var(--color-secondary)]/20' },
  ];

  useEffect(() => {
    if (isCached) return;

    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(seconds);
      
      // 每2秒切换一个阶段
      const stageIndex = Math.min(Math.floor(seconds / 2), stages.length - 1);
      setStage(stageIndex);
    }, 500);

    return () => clearInterval(timer);
  }, [startTime, isCached]);

  if (isCached) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl chat-bubble-bot max-w-[200px] mb-4 bg-emerald-50 border border-emerald-100">
        <Zap size={16} className="text-emerald-500 animate-pulse" />
        <span className="text-sm text-emerald-600 font-medium">闪电回复中...</span>
      </div>
    );
  }

  const currentStage = stages[stage];
  const Icon = currentStage.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl chat-bubble-bot max-w-[320px] mb-4 ${currentStage.bg} border border-slate-100`}>
      <div className="relative">
        <Icon size={20} className={`${currentStage.color} animate-pulse`} />
        {/* 脉冲光环 */}
        <span className={`absolute inset-0 rounded-full ${currentStage.dotBgOpacity} animate-ping`} />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <span className="text-xs text-slate-600 font-medium">{currentStage.text}</span>
        <div className="flex items-center gap-2">
          {/* 进度条 */}
          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${currentStage.dotBg} rounded-full transition-all duration-500`}
              style={{ 
                width: `${Math.min((elapsed / 6) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-8 text-right">{elapsed}s</span>
        </div>
      </div>
    </div>
  );
};

export default ChatTyping;

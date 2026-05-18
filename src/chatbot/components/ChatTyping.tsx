import React from 'react';

/**
 * 三点头打字指示器
 * 用于表示 bot 正在输入中
 */
export const ChatTyping: React.FC = () => {
  return (
    <div className="flex gap-2 items-center px-4 py-3 rounded-2xl chat-bubble-bot max-w-[100px] mb-4">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default ChatTyping;

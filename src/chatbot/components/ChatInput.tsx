import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';

/**
 * 常驻底部输入栏 — 自由文本为主，适配 LLM 和规则引擎
 *
 * LLM 可用时：通过 WebSocket 流式发送到 sendFreeTextStream
 * LLM 不可用时：发送到 advanceStep（规则引擎）
 */
export const ChatInput: React.FC = () => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const llmAvailable = useAgentStore((s) => s.llmAvailable);
  const llmProcessing = useAgentStore((s) => s.llmProcessing);
  const isBotTyping = useAgentStore((s) => s.isBotTyping);
  const sendFreeTextStream = useAgentStore((s) => s.sendFreeTextStream);
  const advanceStep = useAgentStore((s) => s.advanceStep);

  useEffect(() => {
    if (!isBotTyping && !llmProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBotTyping, llmProcessing]);

  const disabled = isBotTyping || llmProcessing;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    setValue('');

    if (llmAvailable) {
      sendFreeTextStream(trimmed);
    } else {
      advanceStep(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            llmProcessing
              ? '正在思考...'
              : '输入您想了解的内容...'
          }
          disabled={disabled}
          className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-colors disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 h-10 w-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center transition-all hover:bg-[var(--brand-strong)] active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {llmProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
  const resetLLMStatus = useAgentStore((s) => s.resetLLMStatus);
  const checkLLMStatus = useAgentStore((s) => s.checkLLMStatus);

  // Focus only once on initial mount to prevent viewport jumps/jitters during chat flow transitions
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  // 根据状态生成占位符
  const getPlaceholder = () => {
    if (llmProcessing) {
      return '🦕 小柱正在思考中，请稍候...';
    }
    if (isBotTyping) {
      return '小柱正在输入...';
    }
    if (llmAvailable === undefined) {
      return '正在连接智能服务...';
    }
    if (!llmAvailable) {
      return '使用离线模式，请输入您的问题...';
    }
    return '和小柱聊聊孩子的姿态或不适...';
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-light)] bg-[var(--surface)]/90 backdrop-blur-md">
      {/* 状态指示条 */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          {llmAvailable ? (
            <>
              <Wifi size={12} className="text-[var(--color-success)]" />
              <span className="text-[10px] text-[var(--color-success)] font-medium">智能助手已连接</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-[var(--color-warning)]" />
              <span className="text-[10px] text-[var(--color-warning)] font-medium">离线模式</span>
              <button
                onClick={() => checkLLMStatus()}
                className="ml-1 p-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
                title="重新连接"
              >
                <RefreshCw size={10} className="text-[var(--color-warning)]" />
              </button>
            </>
          )}
        </div>
        {llmProcessing && (
          <span className="text-[10px] text-[var(--text-muted)]">预计等待 3-6 秒</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={disabled}
          className="flex-1 h-11 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-[border-color,box-shadow,opacity] duration-200 disabled:opacity-50 font-medium"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-800)] text-[var(--text-inverse)] flex items-center justify-center transition-[opacity,transform,box-shadow] duration-200 hover:opacity-95 hover:shadow-md hover:shadow-[var(--shadow-xs)] active:scale-[0.94] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {llmProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} className="stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;

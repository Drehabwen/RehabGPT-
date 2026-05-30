import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { ToolConfirmCard } from './ToolConfirmCard';
import { useAgentStore } from '../store/useAgentStore';
import { ScaleInteractionCard } from './ScaleInteractionCard';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * 聊天消息气泡
 * - bot: 左侧白色气泡，带小柱专属恐龙头像
 * - user: 右侧 渐变紫蓝气泡
 * - 支持内联图片 + ToolConfirmCard
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const [cardDismissed, setCardDismissed] = useState(false);
  const executeToolFromLLM = useAgentStore((s) => s.executeToolFromLLM);

  const handleConfirm = (toolId: string) => {
    setCardDismissed(true);
    executeToolFromLLM(toolId);
  };

  const showToolCard = isBot && message.toolCall && !cardDismissed;

  return (
    <div
      className={`flex gap-3.5 mb-5 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Bot 头像 — 恐龙小柱 mascot */}
      {isBot && (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center text-lg border border-[var(--color-primary-border)] shadow-sm">
          🦕
        </div>
      )}

      {/* 气泡 + 工具卡片 */}
      <div className={`max-w-[80%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isBot
              ? 'chat-bubble-bot'
              : 'chat-bubble-user'
          }`}
        >
          {message.imageUrl && (
            <div className="mb-2.5 rounded-xl overflow-hidden shadow-inner border border-slate-100">
              <img
                src={message.imageUrl}
                alt="illustration"
                className="w-full max-w-[240px] object-contain"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap break-words font-medium">{message.text}</p>
        </div>

        {/* 康复评估量表卡片 */}
        {isBot && message.scalePayload && (
          <div className="mt-3.5 w-full min-w-[280px] min-w-[280px] sm:min-w-[320px] md:min-w-[360px]">
            <ScaleInteractionCard
              taskId={message.scalePayload.taskId}
              sessionId={message.scalePayload.sessionId}
              scaleId={message.scalePayload.scaleId}
            />
          </div>
        )}

        {/* LLM 工具建议卡片 */}
        {showToolCard && (
          <div className="mt-3 w-full">
            <ToolConfirmCard
              toolId={message.toolCall!.toolId}
              reason={message.toolCall!.reason}
              onConfirm={handleConfirm}
              onDismiss={() => setCardDismissed(true)}
            />
          </div>
        )}
      </div>

      {/* User 头像 */}
      {!isBot && (
        <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-800)] text-[var(--text-inverse)] flex items-center justify-center text-xs font-extrabold shadow-md shadow-[var(--shadow-xs)]">
          家
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

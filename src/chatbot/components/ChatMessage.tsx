import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { ToolConfirmCard } from './ToolConfirmCard';
import { useAgentStore } from '../store/useAgentStore';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * 聊天消息气泡
 * - bot: 左侧白色气泡，带头像
 * - user: 右侧 teal 气泡
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
      className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Bot 头像 */}
      {isBot && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center text-sm">
          🤖
        </div>
      )}

      {/* 气泡 + 工具卡片 */}
      <div className={`max-w-[75%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isBot
              ? 'chat-bubble-bot'
              : 'chat-bubble-user'
          }`}
        >
          {message.imageUrl && (
            <div className="mb-2 rounded-xl overflow-hidden">
              <img
                src={message.imageUrl}
                alt="illustration"
                className="w-full max-w-[240px] object-contain"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>

        {/* LLM 工具建议卡片 */}
        {showToolCard && (
          <ToolConfirmCard
            toolId={message.toolCall!.toolId}
            reason={message.toolCall!.reason}
            onConfirm={handleConfirm}
            onDismiss={() => setCardDismissed(true)}
          />
        )}
      </div>

      {/* User 头像 */}
      {!isBot && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          U
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

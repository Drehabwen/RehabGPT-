import React, { useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatTyping } from './ChatTyping';
import { ChatOptions } from './ChatOptions';
import { ChatInput } from './ChatInput';
import { ChatSlider } from './ChatSlider';
import { useAgentStore } from '../store/useAgentStore';
import { BRANCH_FLOWS } from '../constants/branches';
import { OPTIONS } from '../constants/questions';

/**
 * Agent 聊天窗口 — 自由文本 + 结构化选项混合
 *
 * LLM 可用时：自由文本为主驱动，ChatInput 始终可见
 * LLM 不可用时：规则引擎，ChatInput 降级为规则引擎入口
 *
 * 布局：消息列表（滚动）+ 常驻底部输入栏
 */
export const ChatWindow: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useAgentStore((s) => s.messages);
  const isBotTyping = useAgentStore((s) => s.isBotTyping);
  const stepIndex = useAgentStore((s) => s.stepIndex);
  const branch = useAgentStore((s) => s.branch);
  const answers = useAgentStore((s) => s.answers);
  const llmAvailable = useAgentStore((s) => s.llmAvailable);
  const advanceStep = useAgentStore((s) => s.advanceStep);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping, scrollToBottom]);

  const currentFlow = BRANCH_FLOWS[branch] || [];
  const currentStep = currentFlow[stepIndex];

  const handleChoice = (value: string) => {
    advanceStep(value);
  };

  const handleSliderSubmit = (value: number) => {
    advanceStep(value);
  };

  // ── 规则引擎输入区域（LLM 不可用时显示在消息区末尾） ──
  const renderRuleEngineInput = () => {
    if (!currentStep || isBotTyping || llmAvailable) return null;
    if (currentStep.type === 'camera' || currentStep.type === 'auto' || currentStep.type === 'result') return null;

    switch (currentStep.type) {
      case 'bot_message':
      case 'user_choice':
        return (
          <ChatOptions
            options={currentStep.options || []}
            onSelect={handleChoice}
          />
        );

      case 'user_slider':
        return (
          <ChatSlider
            min={currentStep.sliderMin ?? 0}
            max={currentStep.sliderMax ?? 10}
            step={currentStep.sliderStep ?? 1}
            labels={currentStep.sliderLabels}
            onSubmit={handleSliderSubmit}
          />
        );

      default:
        return null;
    }
  };

  // ── Adam's 人工选择 ──
  const renderAdamsManual = () => {
    if (!currentStep || llmAvailable) return null;
    if (currentStep.id === 'adams_result' && answers.adams_method !== '用摄像头拍' && !isBotTyping) {
      return (
        <ChatOptions
          options={OPTIONS.adams_manual}
          onSelect={handleChoice}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar"
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isBotTyping && <ChatTyping />}

        {/* 规则引擎选项（LLM 不可用时） */}
        {renderAdamsManual()}
        {renderRuleEngineInput()}

        <div ref={bottomRef} />
      </div>

      {/* 常驻底部输入栏 */}
      <ChatInput />
    </div>
  );
};

export default ChatWindow;

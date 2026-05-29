import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatTyping } from './ChatTyping';
import { ChatOptions } from './ChatOptions';
import { ChatInput } from './ChatInput';
import { ChatSlider } from './ChatSlider';
import { useAgentStore } from '../store/useAgentStore';
import { BRANCH_FLOWS } from '../constants/branches';

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
  const llmProcessing = useAgentStore((s) => s.llmProcessing);
  const stepIndex = useAgentStore((s) => s.stepIndex);
  const branch = useAgentStore((s) => s.branch);
  const answers = useAgentStore((s) => s.answers);
  const llmAvailable = useAgentStore((s) => s.llmAvailable);
  const advanceStep = useAgentStore((s) => s.advanceStep);
  
  const [typingStartTime, setTypingStartTime] = useState<number>(Date.now());

  // 当开始打字时记录时间
  useEffect(() => {
    if (isBotTyping || llmProcessing) {
      setTypingStartTime(Date.now());
    }
  }, [isBotTyping, llmProcessing]);

  const isNearBottomRef = useRef(true);

  // 监控滚动位置变化，判断用户是否手动向上滚动了
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const offset = 120;
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < offset;
  };

  // 当新消息插入，或机器人打字状态变更时，触发平滑滚动到最底部，并重置底部锁定状态
  const messagesLength = messages.length;
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
    isNearBottomRef.current = true;
  }, [messagesLength, isBotTyping]);

  // 关键：使用 useLayoutEffect 在 DOM 突变后、浏览器绘制（Paint）之前同步进行位置对齐。
  // 这完美阻止了流式输出（Streaming）时因行数及内容膨胀引发的反复回弹与抖动（“以上一下”）。
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  });

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
          options={[
            { label: '对称，没有隆起', value: '对称无隆起' },
            { label: '有一侧隆起', value: '一侧隆起' },
            { label: '不确定', value: '不确定' },
          ]}
          onSelect={handleChoice}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 消息列表 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 py-4 px-4 custom-scrollbar"
        style={{ overflowAnchor: 'auto' }}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {(isBotTyping || llmProcessing) && <ChatTyping startTime={typingStartTime} />}

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

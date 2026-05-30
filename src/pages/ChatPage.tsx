/**
 * ChatPage — 儿童脊柱健康仪表盘
 *
 * 定位转变：首页不再是聊天页，而是以「今日建议行动」为中心的仪表盘。
 * 小柱作为解释层嵌入每个行动节点，对话降级为底部轻量输入 + 半屏浮层。
 */

import React, { useEffect, useState, useRef } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { ChildProfileHeader } from '../components/assistant/ChildProfileHeader';
import { XiaozhuGreeting } from '../components/assistant/XiaozhuGreeting';
import { TodayActions } from '../components/assistant/TodayActions';
import { LastScreeningResult } from '../components/assistant/LastScreeningResult';
import { WeeklyCheckIn } from '../components/assistant/WeeklyCheckIn';
import { XiaozhuAdvice } from '../components/assistant/XiaozhuAdvice';
import { ChatMessage } from '../chatbot/components/ChatMessage';
import { ChatInput } from '../chatbot/components/ChatInput';
import { ChatTyping } from '../chatbot/components/ChatTyping';
import { AppLayout } from '../chatbot/components/AppLayout';
import { useChatPageData } from './hooks/useChatPageData';
import { useAgentStore } from '../chatbot/store/useAgentStore';

// ── 继续上次对话 — 半屏浮层 ──

const ChatHistoryPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useAgentStore((s) => s.messages);
  const isBotTyping = useAgentStore((s) => s.isBotTyping);
  const llmProcessing = useAgentStore((s) => s.llmProcessing);

  // 滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isBotTyping]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* 面板 */}
      <div className="relative z-10 flex flex-col h-[65vh] bg-[var(--bg-card)] rounded-t-[28px] shadow-[0_-8px_32px_rgba(15,23,42,0.12)] overflow-hidden">
        {/* 面板头 */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-[var(--border-light)] flex items-center justify-between select-none">
          <span className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[var(--color-primary)] inline-block" />
            继续上次对话
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* 消息列表 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          {messages.length === 0 && !isBotTyping && (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] gap-3">
              <span className="text-3xl">🦕</span>
              <p className="text-sm font-bold text-[var(--text-secondary)]">暂无对话记录</p>
              <p className="text-xs text-[var(--text-muted)]">在下方输入问题，小柱随时为你解答</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {(isBotTyping || llmProcessing) && <ChatTyping />}
          <div ref={bottomRef} />
        </div>

        {/* 输入区 — 复用 ChatInput */}
        <ChatInput />
      </div>
    </div>
  );
};

// ── ChatPage 主体 ──

export const ChatPage: React.FC = () => {
  const {
    patientName,
    patientAge,
    answers,
    weeklyDays,
    messages,
    finalScreeningData,
    dynamicPlaceholder,
    llmAvailable,
    llmProcessing,
    adviceLoading,
    displayAdvice,
    displayTips,
    treatmentPlan,
    navigateToResult,
    navigateToTracking,
    handleQuickQuestion,
  } = useChatPageData();

  const [inputValue, setInputValue] = useState('');
  const [showChatPanel, setShowChatPanel] = useState(false);

  const disabled = useAgentStore((s) => s.isBotTyping) || llmProcessing;

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;
    setInputValue('');
    handleQuickQuestion(trimmed);
    // 如果对话浮层未打开，发送后自动打开
    if (!showChatPanel) setShowChatPanel(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 构建仪表盘内容 ──
  const welcomeContent = (
    <div className="space-y-3 pb-1">
      {/* 欢迎语 */}
      <XiaozhuGreeting
        childName={patientName || undefined}
        onQuickQuestionClick={handleQuickQuestion}
      />

      {/* 快捷操作卡片 */}
      <TodayActions
        childName={patientName || undefined}
        treatmentPlan={treatmentPlan}
        onViewTraining={navigateToTracking}
        onRecordChange={navigateToTracking}
      />

      {/* 状态卡片三列 */}
      <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr_0.8fr] gap-2.5">
        <LastScreeningResult
          isEmpty={finalScreeningData.isEmpty}
          screeningDate={finalScreeningData.date}
          riskLevel={finalScreeningData.riskLevel}
          riskLabel={finalScreeningData.riskLabel}
          recommendation={finalScreeningData.recommendation}
          concerns={finalScreeningData.concerns}
          onViewFullReport={navigateToResult}
        />
        <WeeklyCheckIn
          completedDays={weeklyDays.filter((d) => d.completed).length}
          totalDays={7}
          days={weeklyDays}
          onViewFullCalendar={navigateToTracking}
        />
        <XiaozhuAdvice
          childName={patientName || undefined}
          loading={adviceLoading}
          advice={displayAdvice}
          tips={displayTips}
          onViewMoreTips={() => handleQuickQuestion('给我更多脊柱健康小贴士')}
        />
      </div>
    </div>
  );

  return (
    <AppLayout title="🦕 小柱健康" showHeader={false}>
      {/* TopBar */}
      <ChildProfileHeader
        childName={patientName || undefined}
        childAge={patientAge ? `${patientAge}岁` : undefined}
        childGender={(answers.gender as string) || ''}
        onProfileClick={navigateToTracking}
      />

      {/* 仪表盘容器 */}
      <div
        id="xiaozhu-chat-console"
        className="flex flex-col flex-1 mt-3 bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[var(--shadow-card)] rounded-[var(--radius-3xl)] overflow-hidden"
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        {/* 仪表盘头部 */}
        <div className="flex-shrink-0 px-5 py-2.5 border-b border-[var(--border-light)] flex items-center justify-between select-none">
          <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span className="w-1.5 h-4 rounded-full bg-[var(--color-primary)] inline-block" />
            今日建议行动
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping" />
            <span className="text-[11px] font-extrabold text-[var(--color-primary)]">
              在线服务中
            </span>
          </div>
        </div>

        {/* 卡片区 — 可滚动 */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="px-4 pt-3">
            {welcomeContent}
          </div>
        </div>

        {/* 轻量输入区 — 替代 ChatWindow */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-light)] bg-[var(--surface)]/90">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={dynamicPlaceholder}
              disabled={disabled}
              className="flex-1 h-11 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-[border-color,box-shadow,opacity] duration-200 disabled:opacity-50 font-medium"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !inputValue.trim()}
              className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-800)] text-[var(--text-inverse)] flex items-center justify-center transition-[opacity,transform,box-shadow] duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.94] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {llmProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} className="stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* 继续上次对话 入口 */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowChatPanel(true)}
              className="mt-2.5 w-full text-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer py-1"
            >
              💬 继续上次对话 →
            </button>
          )}
        </div>

        {/* ChatHistoryPanel 半屏浮层 */}
        {showChatPanel && (
          <ChatHistoryPanel onClose={() => setShowChatPanel(false)} />
        )}
      </div>
    </AppLayout>
  );
};

export default ChatPage;

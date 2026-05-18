import React from 'react';

interface ChatProgressProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * 步骤进度指示器
 * 显示 "步骤 N / 18" + 细进度条
 */
export const ChatProgress: React.FC<ChatProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  // 实际进度（排除纯 bot_message 步骤）
  const displayStep = currentStep + 1;
  const percentage = (displayStep / totalSteps) * 100;

  return (
    <div className="flex-shrink-0 px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-400 tracking-wide">
          脊柱健康早筛
        </span>
        <span className="text-xs text-slate-400 tabular-nums">
          {displayStep} / {totalSteps}
        </span>
      </div>
      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ChatProgress;

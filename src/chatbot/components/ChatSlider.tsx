import React, { useState } from 'react';

interface SliderLabel {
  value: number;
  label: string;
}

interface ChatSliderProps {
  min?: number;
  max?: number;
  step?: number;
  labels?: SliderLabel[];
  onSubmit: (value: number) => void;
  disabled?: boolean;
}

/**
 * VAS 疼痛评分滑块 (0-10)
 * 带标签标记（不疼 / 中等 / 极疼）
 */
export const ChatSlider: React.FC<ChatSliderProps> = ({
  min = 0,
  max = 10,
  step = 1,
  labels = [],
  onSubmit,
  disabled = false,
}) => {
  const [value, setValue] = useState(Math.round((min + max) / 2));

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4 ml-12 p-4 rounded-2xl chat-bubble-bot">
      {/* 数值显示 */}
      <div className="text-center mb-3">
        <span className="text-3xl font-bold text-blue-600">{value}</span>
        <span className="text-sm text-slate-400 ml-1">/ {max}</span>
      </div>

      {/* 滑块 */}
      <div className="relative mb-3 px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
        />
        {/* 填充轨道 */}
        <div
          className="absolute top-0 left-1 right-1 h-2 rounded-full bg-blue-600/30 pointer-events-none"
          style={{ width: `calc(${percentage}% - 0.5rem)` }}
        />
      </div>

      {/* 标签 */}
      {labels.length > 0 && (
        <div className="flex justify-between text-xs text-slate-400">
          {labels.map((label) => (
            <span key={label.value}>{label.label}</span>
          ))}
        </div>
      )}

      {/* 确认按钮 */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit(value)}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold transition-all hover:bg-blue-600/90 active:scale-95 disabled:opacity-50"
        >
          确认 {value} 分
        </button>
      </div>
    </div>
  );
};

export default ChatSlider;

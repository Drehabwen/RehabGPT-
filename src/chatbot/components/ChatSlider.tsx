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
    <div className="mb-4 ml-12 p-5 rounded-3xl chat-bubble-bot border border-slate-200 shadow-md bg-white">
      {/* 数值显示 */}
      <div className="text-center mb-3">
        <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{value}</span>
        <span className="text-xs text-slate-400 font-bold ml-1.5">/ {max} 分</span>
      </div>

      {/* 滑块 */}
      <div className="relative mb-3.5 px-1 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 rounded-full bg-slate-100 appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
        />
        {/* 填充轨道 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-1.5 right-1.5 h-2 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 pointer-events-none"
          style={{ width: `calc(${percentage}% - 0.5rem)` }}
        />
      </div>

      {/* 标签 */}
      {labels.length > 0 && (
        <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
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
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold transition-all hover:shadow-md hover:shadow-emerald-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          确认该评估为 {value} 分
        </button>
      </div>
    </div>
  );
};

export default ChatSlider;

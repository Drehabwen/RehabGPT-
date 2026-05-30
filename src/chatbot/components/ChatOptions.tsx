import React from 'react';
import type { ChoiceOption } from '../types';

interface ChatOptionsProps {
  options: ChoiceOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/**
 * 选项按钮列表
 * 每个选项渲染为一个可点击按钮，选中后触发 onSelect
 */
export const ChatOptions: React.FC<ChatOptionsProps> = ({
  options,
  onSelect,
  disabled = false,
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 ml-12">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option.value)}
          className="px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ChatOptions;

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
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-all hover:border-blue-600 hover:text-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ChatOptions;

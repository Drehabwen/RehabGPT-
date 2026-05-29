/**
 * 快捷问题区
 *
 * 在输入框上方显示家长常用问题快捷入口。
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card } from '../ui';

interface QuickQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const QUESTIONS = [
  '孩子肩膀一高一低怎么办？',
  '如何拍摄筛查照片？',
  '今天应该做哪些训练？',
  '什么情况需要去医院？',
  '如何查看康复师处方？',
];

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({ onQuestionClick }) => {
  return (
    <Card padding="sm" shadow="sm" className="bg-slate-50/50">
      <div className="flex items-center gap-2 mb-2 px-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-400">家长常问</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick(q)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all duration-200"
          >
            {q}
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickQuestions;

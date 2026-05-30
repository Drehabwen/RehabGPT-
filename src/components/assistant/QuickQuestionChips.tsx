/**
 * QuickQuestionChips — 快捷问题芯片
 *
 * 家长常用问题快捷入口。
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface QuickQuestionChipsProps {
  onQuestionClick: (question: string) => void;
  questions?: string[];
}

const DEFAULT_QUESTIONS = [
  '孩子肩膀一高一低怎么办？',
  '如何拍摄筛查照片？',
  '今天应该做哪些训练？',
  '什么情况需要去医院？',
  '如何查看康复师处方？',
];

export const QuickQuestionChips: React.FC<QuickQuestionChipsProps> = ({
  onQuestionClick,
  questions = DEFAULT_QUESTIONS,
}) => {
  return (
    <Card variant="subtle" padding="sm">
      <div className="flex items-center gap-2 mb-2 px-1">
        <HelpCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[var(--text-muted)]">家长常问</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <Button
            key={i}
            variant="subtle"
            size="sm"
            radius="md"
            onClick={() => onQuestionClick(q)}
          >
            {q}
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickQuestionChips;

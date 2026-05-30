/**
 * XiaozhuGreeting — 小柱欢迎区
 *
 * 家长端全新设计：使用系统内置 UI 组件库 Card 与 Button，完全规避硬编码色值。
 */

import React from 'react';
import { ShieldCheck, Dumbbell } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface XiaozhuGreetingProps {
  childName?: string;
  onQuickQuestionClick?: (question: string) => void;
}

const QUICK_QUESTIONS = [
  { icon: ShieldCheck, text: '什么情况需要去医院？' },
  { icon: Dumbbell, text: '今天应该做哪些训练？' },
];

export const XiaozhuGreeting: React.FC<XiaozhuGreetingProps> = ({
  childName,
  onQuickQuestionClick,
}) => {
  return (
    <Card
      variant="default"
      padding="lg"
      radius="3xl"
      fullWidth
    >
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-tr from-[var(--color-primary)] to-[var(--brand-400)] flex items-center justify-center text-2xl shadow-[var(--shadow-md)] border-2 border-white">
          🦕
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-[var(--text-primary)] tracking-wide">
            你好，我是小柱
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed mt-1.5">
            我会陪你一起关注{childName ? `${childName}的` : '孩子的'}脊柱健康，有问题随时问我。
          </p>
        </div>
      </div>

      {/* 快捷问题 - 完美复用组件库 Button 胶囊标签 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q, i) => {
          const Icon = q.icon;
          return (
            <Button
              key={i}
              variant="secondary"
              size="sm"
              radius="full"
              shadow
              onClick={() => onQuickQuestionClick?.(q.text)}
              icon={<Icon className="w-3.5 h-3.5" />}
            >
              {q.text}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default XiaozhuGreeting;

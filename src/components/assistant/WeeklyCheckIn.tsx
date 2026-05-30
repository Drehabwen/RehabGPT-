/**
 * WeeklyCheckIn — 本周训练打卡
 *
 * 家长端全新设计：精致的日历打卡状态卡片，采用统一组件库 Card，消除多重 padding 边距
 */

import React from 'react';
import { Check } from 'lucide-react';
import { Card } from '../ui/Card';

export interface WeeklyCheckInProps {
  weekLabel?: string;
  completedDays: number;
  totalDays: number;
  days: {
    day: string;
    label: string;
    completed: boolean;
    isToday?: boolean;
  }[];
  onViewFullCalendar?: () => void;
}

export const WeeklyCheckIn: React.FC<WeeklyCheckInProps> = ({
  weekLabel = '本周训练打卡',
  completedDays,
  totalDays,
  days,
  onViewFullCalendar,
}) => {
  return (
    <Card
      variant="default"
      padding="lg"
      radius="3xl"
      fullWidth
    >
      {/* 标题 & 完成度 */}
      <div className="flex items-center justify-between mb-4 select-none">
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <span className="w-1.5 h-4.5 rounded-full bg-[var(--color-primary)] inline-block" />
          {weekLabel}
        </h3>
        <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2.5 py-0.5 rounded-full">
          已完成 {completedDays}/{totalDays} 天
        </span>
      </div>

      {/* 7天打卡圆圈 */}
      <div className="flex items-center justify-between gap-1.5 mt-3 select-none">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] text-[var(--text-secondary)] font-extrabold">{d.label}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                d.completed
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : d.isToday
                  ? 'bg-[var(--color-primary-light)] border border-[var(--color-primary)] text-[var(--color-primary)] font-black'
                  : 'bg-[var(--bg-subtle)] border border-[var(--border-light)] text-[var(--text-secondary)]'
              }`}
            >
              {d.completed ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <span className="text-[11px] font-bold">{d.day}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WeeklyCheckIn;

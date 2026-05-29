/**
 * ChildHealthContextCard — 孩子健康上下文卡片
 *
 * 小柱助手顶部显示的孩子信息。
 */

import React from 'react';
import { User, Calendar, ChevronRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';

export interface ChildHealthContextCardProps {
  name: string;
  age?: number;
  gender?: string;
  concerns?: string[];
  status: 'pending_screening' | 'tracking' | 'needs_review';
  lastAssessment?: string;
  nextStep: string;
  onNextStep?: () => void;
}

const STATUS_CONFIG = {
  pending_screening: { chip: 'pending' as const, label: '待初筛' },
  tracking: { chip: 'stable' as const, label: '追踪中' },
  needs_review: { chip: 'attention' as const, label: '需复核' },
};

export const ChildHealthContextCard: React.FC<ChildHealthContextCardProps> = ({
  name,
  age,
  gender,
  concerns = [],
  status,
  lastAssessment,
  nextStep,
  onNextStep,
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-start gap-4">
        {/* 头像 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--ink-green-100)] to-[var(--teal-100)] flex items-center justify-center border-2 border-[var(--ink-green-200)]">
          <User className="w-6 h-6 text-[var(--color-primary)]" />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[var(--text-lg)] font-[var(--font-bold)] text-[var(--text-primary)]">{name}</h2>
            <span className="text-[var(--text-sm)] text-[var(--text-muted)]">｜儿童脊柱健康随访</span>
            <Chip variant={config.chip} size="sm">{config.label}</Chip>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[var(--text-xs)] text-[var(--text-muted)]">
            {age && <span>{age}岁</span>}
            {gender && <span>{gender}</span>}
            {lastAssessment && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {lastAssessment}
              </span>
            )}
          </div>

          {/* 关注标签 */}
          {concerns.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[var(--text-xs)] text-[var(--text-muted)]">当前关注：</span>
              {concerns.map((c, i) => (
                <span
                  key={i}
                  className="text-[var(--text-xs)] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-light)]"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 下一步 */}
      <button
        onClick={onNextStep}
        className="mt-3 w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--teal-50)] border border-[var(--color-primary-border)] hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <span className="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--color-primary)]">
            下一步：{nextStep}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--color-primary)]" />
      </button>
    </Card>
  );
};

export default ChildHealthContextCard;

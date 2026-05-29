/**
 * Chip 组件
 *
 * 统一支持临床状态：
 * 待评估、评估中、已完成、待补测、数据不完整、可生成、已生成、
 * 需关注、高风险、中风险、低风险、改善、稳定、恶化、未测定
 */

import React from 'react';

export type ChipVariant =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'needs_retest'
  | 'incomplete'
  | 'ready'
  | 'generated'
  | 'attention'
  | 'high_risk'
  | 'medium_risk'
  | 'low_risk'
  | 'improved'
  | 'stable'
  | 'worsened'
  | 'not_measured';

export interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const VARIANT_CONFIG: Record<ChipVariant, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-[var(--status-amber-50)]', text: 'text-[var(--status-amber-700)]', border: 'border-[var(--status-amber-200)]' },
  in_progress: { bg: 'bg-[var(--color-info-light)]', text: 'text-[var(--color-info)]', border: 'border-[var(--teal-200)]' },
  completed: { bg: 'bg-[var(--color-success-light)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success-border)]' },
  needs_retest: { bg: 'bg-[var(--status-amber-50)]', text: 'text-[var(--status-amber-700)]', border: 'border-[var(--status-amber-200)]' },
  incomplete: { bg: 'bg-[var(--status-slate-100)]', text: 'text-[var(--status-slate-600)]', border: 'border-[var(--status-slate-200)]' },
  ready: { bg: 'bg-[var(--color-success-light)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success-border)]' },
  generated: { bg: 'bg-[var(--color-primary-light)]', text: 'text-[var(--color-primary)]', border: 'border-[var(--color-primary-border)]' },
  attention: { bg: 'bg-[var(--status-amber-50)]', text: 'text-[var(--status-amber-700)]', border: 'border-[var(--status-amber-200)]' },
  high_risk: { bg: 'bg-[var(--color-danger-light)]', text: 'text-[var(--color-danger)]', border: 'border-[var(--color-danger-border)]' },
  medium_risk: { bg: 'bg-[var(--status-amber-50)]', text: 'text-[var(--status-amber-700)]', border: 'border-[var(--status-amber-200)]' },
  low_risk: { bg: 'bg-[var(--color-success-light)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success-border)]' },
  improved: { bg: 'bg-[var(--color-success-light)]', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success-border)]' },
  stable: { bg: 'bg-[var(--color-info-light)]', text: 'text-[var(--color-info)]', border: 'border-[var(--teal-200)]' },
  worsened: { bg: 'bg-[var(--color-danger-light)]', text: 'text-[var(--color-danger)]', border: 'border-[var(--color-danger-border)]' },
  not_measured: { bg: 'bg-[var(--status-slate-100)]', text: 'text-[var(--status-slate-500)]', border: 'border-[var(--status-slate-200)]' },
};

export const Chip: React.FC<ChipProps> = ({ children, variant = 'pending', size = 'sm', icon }) => {
  const config = VARIANT_CONFIG[variant];
  const sizeClass = size === 'sm' ? 'text-[var(--text-xs)] px-2 py-0.5' : 'text-[var(--text-sm)] px-2.5 py-1';

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full border
        font-[var(--font-medium)]
        ${config.bg}
        ${config.text}
        ${config.border}
        ${sizeClass}
      `}
    >
      {icon}
      {children}
    </span>
  );
};

export default Chip;

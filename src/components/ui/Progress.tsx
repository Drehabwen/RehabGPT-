/**
 * Progress 组件
 *
 * 用于报告完成度、数据完整度、训练完成度
 */

import React from 'react';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = true,
  label,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]',
  };

  const getVariantFromPercentage = () => {
    if (percentage >= 80) return 'bg-[var(--color-success)]';
    if (percentage >= 50) return 'bg-[var(--color-warning)]';
    return 'bg-[var(--color-danger)]';
  };

  const barColor = variant === 'default' ? getVariantFromPercentage() : variantClasses[variant];

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{label}</span>}
          {showLabel && (
            <span className="text-[var(--text-sm)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full
          ${sizeClasses[size]}
          bg-[var(--border-light)]
          rounded-full
          overflow-hidden
        `}
      >
        <div
          className={`
            h-full
            rounded-full
            transition-all duration-500 ease-out
            ${barColor}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;

/**
 * MetricDelta — 指标变化组件
 *
 * 展示轻量指标和变化值。
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricDeltaProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MetricDelta: React.FC<MetricDeltaProps> = ({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  size = 'md',
}) => {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta !== undefined && delta === 0;

  const sizeConfig = {
    sm: { value: 'text-[var(--text-lg)]', label: 'text-[var(--text-xs)]', delta: 'text-[10px]' },
    md: { value: 'text-[var(--text-2xl)]', label: 'text-[var(--text-sm)]', delta: 'text-[var(--text-xs)]' },
    lg: { value: 'text-3xl', label: 'text-[var(--text-base)]', delta: 'text-[var(--text-sm)]' },
  };

  const s = sizeConfig[size];

  return (
    <div>
      <p className={`${s.label} text-[var(--text-muted)] mb-1`}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`${s.value} font-[var(--font-bold)] text-[var(--text-primary)]`}>
          {value}
        </span>
        {unit && <span className="text-[var(--text-sm)] text-[var(--text-muted)]">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 ${
            isPositive
              ? 'text-[var(--color-success)]'
              : isNegative
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--text-muted)]'
          }`}
        >
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {isNeutral && <Minus className="w-3 h-3" />}
          <span className={`${s.delta} font-[var(--font-medium)]`}>
            {isPositive ? '+' : ''}
            {delta}
            {deltaLabel && ` ${deltaLabel}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricDelta;

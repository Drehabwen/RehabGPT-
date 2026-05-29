/**
 * ClinicalTaskCard — 临床任务卡片
 *
 * 用于首页今日任务、待补测、随访队列。
 */

import React from 'react';
import { Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface ClinicalTaskCardProps {
  taskName: string;
  patientName: string;
  taskType: string;
  priority: 'high' | 'medium' | 'low';
  time: string;
  status: ChipVariant;
  recommendedAction: string;
  onAction: () => void;
}

import type { ChipVariant } from '../ui/Chip';

export const ClinicalTaskCard: React.FC<ClinicalTaskCardProps> = ({
  taskName,
  patientName,
  taskType,
  priority,
  time,
  status,
  recommendedAction,
  onAction,
}) => {
  const priorityConfig = {
    high: { color: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-light)]', label: '高优先级' },
    medium: { color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-light)]', label: '中优先级' },
    low: { color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-subtle)]', label: '低优先级' },
  };

  const p = priorityConfig[priority];

  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 标题行 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {taskName}
            </h3>
            <Chip variant={status} size="sm" />
            <span className={`text-[var(--text-xs)] px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>
              {p.label}
            </span>
          </div>

          {/* 患者 + 类型 */}
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1">
            {patientName} · {taskType}
          </p>

          {/* 时间 */}
          <div className="flex items-center gap-1 mt-2 text-[var(--text-xs)] text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 ml-4">
          <Button variant="primary" size="sm" onClick={onAction} icon={<ArrowRight className="w-4 h-4" />}>
            {recommendedAction}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ClinicalTaskCard;

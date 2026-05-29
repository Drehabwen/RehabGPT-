/**
 * AssessmentModuleCard — 评估模块卡片
 *
 * 用于评估中心。
 * 模块包括：姿态采集、Adams筛查、ROM评估、SOAP病历。
 */

import React from 'react';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

export interface AssessmentModuleCardProps {
  moduleName: string;
  description: string;
  status: 'not_measured' | 'in_progress' | 'completed' | 'needs_retest';
  isRecommended?: boolean;
  lastMeasured?: string;
  resultSummary?: string;
  progress?: number;
  actionLabel: string;
  onAction: () => void;
}

export const AssessmentModuleCard: React.FC<AssessmentModuleCardProps> = ({
  moduleName,
  description,
  status,
  isRecommended = false,
  lastMeasured,
  resultSummary,
  progress,
  actionLabel,
  onAction,
}) => {
  const statusMap = {
    not_measured: 'not_measured' as const,
    in_progress: 'in_progress' as const,
    completed: 'completed' as const,
    needs_retest: 'needs_retest' as const,
  };

  return (
    <Card variant={status === 'completed' ? 'subtle' : 'default'} padding="lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 标题 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {moduleName}
            </h3>
            <Chip variant={statusMap[status]} size="sm" />
            {isRecommended && (
              <span className="text-[var(--text-xs)] px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] font-[var(--font-medium)]">
                推荐优先
              </span>
            )}
          </div>

          {/* 描述 */}
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1">{description}</p>

          {/* 进度 */}
          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} size="sm" showLabel={false} />
            </div>
          )}

          {/* 结果摘要 */}
          {resultSummary && (
            <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-subtle)]">
              <p className="text-[var(--text-xs)] text-[var(--text-secondary)]">{resultSummary}</p>
            </div>
          )}

          {/* 最近测量 */}
          {lastMeasured && (
            <div className="flex items-center gap-1 mt-2 text-[var(--text-xs)] text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              {lastMeasured}
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className="flex-shrink-0 ml-4">
          <Button
            variant={status === 'completed' ? 'secondary' : 'primary'}
            size="sm"
            onClick={onAction}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AssessmentModuleCard;

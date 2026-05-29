/**
 * ReportModuleCard — 报告模块卡片
 *
 * 用于报告管理页面展示各模块报告。
 */

import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendMiniChart } from './TrendMiniChart';

export interface ReportModuleCardProps {
  moduleName: string;
  status: 'not_measured' | 'completed' | 'generated' | 'attention';
  summary?: string;
  trendData?: number[];
  lastUpdated?: string;
  onView: () => void;
}

export const ReportModuleCard: React.FC<ReportModuleCardProps> = ({
  moduleName,
  status,
  summary,
  trendData,
  lastUpdated,
  onView,
}) => {
  const statusMap = {
    not_measured: 'not_measured' as const,
    completed: 'completed' as const,
    generated: 'generated' as const,
    attention: 'attention' as const,
  };

  return (
    <Card variant={status === 'attention' ? 'risk' : 'default'} padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {moduleName}
            </h3>
            <Chip variant={statusMap[status]} size="sm" />
          </div>

          {summary && (
            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1">{summary}</p>
          )}

          {lastUpdated && (
            <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-2">{lastUpdated}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {trendData && trendData.length > 0 && (
            <TrendMiniChart data={trendData} width={80} height={32} />
          )}
          <Button variant="ghost" size="sm" onClick={onView} icon={<ArrowRight className="w-4 h-4" />}>
            查看
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportModuleCard;

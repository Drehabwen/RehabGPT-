/**
 * DataCompletenessCard — 数据完整度卡片
 *
 * 显示：已完成模块、缺失模块、缺失数据影响、推荐补测顺序、进度条。
 */

import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';

export interface DataCompletenessCardProps {
  completedModules: string[];
  missingModules: Array<{
    name: string;
    impact: string;
    priority: number;
  }>;
  overallProgress: number;
  onRetest: (module: string) => void;
}

export const DataCompletenessCard: React.FC<DataCompletenessCardProps> = ({
  completedModules,
  missingModules,
  overallProgress,
  onRetest,
}) => {
  return (
    <Card variant="default" padding="lg">
      <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)] mb-4">
        数据完整度
      </h3>

      {/* 总进度 */}
      <Progress value={overallProgress} label="整体完成度" size="md" className="mb-4" />

      {/* 已完成 */}
      {completedModules.length > 0 && (
        <div className="mb-4">
          <p className="text-[var(--text-xs)] text-[var(--text-muted)] mb-2">已完成模块</p>
          <div className="flex flex-wrap gap-2">
            {completedModules.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[var(--text-xs)] px-2 py-1 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]"
              >
                <CheckCircle2 className="w-3 h-3" />
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 缺失模块 */}
      {missingModules.length > 0 && (
        <div>
          <p className="text-[var(--text-xs)] text-[var(--text-muted)] mb-2">推荐补测顺序</p>
          <div className="space-y-2">
            {missingModules.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-warning)] text-white flex items-center justify-center text-[10px] font-bold">
                    {m.priority}
                  </div>
                  <div>
                    <p className="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--text-primary)]">
                      {m.name}
                    </p>
                    <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{m.impact}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onRetest(m.name)} icon={<ArrowRight className="w-3 h-3" />}>
                  补测
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DataCompletenessCard;

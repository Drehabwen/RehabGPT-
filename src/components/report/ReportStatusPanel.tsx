/**
 * ReportStatusPanel — 报告状态面板
 *
 * 用于报告管理顶部。
 * 显示：当前患者、当前诊次、报告完成度、可否生成、关键缺失、核心结论摘要、主按钮、次按钮。
 */

import React from 'react';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

export interface ReportStatusPanelProps {
  patientName: string;
  visitNumber: string;
  completion: number;
  canGenerate: boolean;
  missingItems?: string[];
  coreSummary?: string;
  onGenerate: () => void;
  onExport: () => void;
}

export const ReportStatusPanel: React.FC<ReportStatusPanelProps> = ({
  patientName,
  visitNumber,
  completion,
  canGenerate,
  missingItems = [],
  coreSummary,
  onGenerate,
  onExport,
}) => {
  return (
    <Card variant="elevated" padding="lg" className="mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 标题 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[var(--text-lg)] font-[var(--font-bold)] text-[var(--text-primary)]">
              {patientName}
            </h2>
            <Chip variant="in_progress" size="sm">{visitNumber}</Chip>
            {canGenerate ? (
              <Chip variant="ready" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                可生成
              </Chip>
            ) : (
              <Chip variant="incomplete" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
                数据不完整
              </Chip>
            )}
          </div>

          {/* 完成度 */}
          <div className="mt-4">
            <Progress value={completion} label="报告完成度" size="md" />
          </div>

          {/* 缺失项 */}
          {missingItems.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[var(--text-xs)] text-[var(--text-muted)]">缺失：</span>
              {missingItems.map((item, i) => (
                <span
                  key={i}
                  className="text-[var(--text-xs)] px-2 py-0.5 rounded-full bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* 核心结论 */}
          {coreSummary && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-light)]">
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{coreSummary}</p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 ml-6 flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onGenerate}
            disabled={!canGenerate}
            icon={<FileText className="w-4 h-4" />}
          >
            生成综合报告
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport}>
            导出数据
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportStatusPanel;

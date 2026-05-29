/**
 * 数据中心
 *
 * 主叙事：这些临床数据是否完整、可信、可导出、可用于科研建模？
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Button } from '../../components/ui/Button';
import { MetricDelta } from '../../components/report/MetricDelta';
import { TrendMiniChart } from '../../components/report/TrendMiniChart';
import { Database, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const DataCenterPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock 数据质量
  const dataQuality = {
    overallCompleteness: 82,
    assessmentCoverage: 75,
    missingFields: [
      { field: '家族史', count: 12, impact: '高风险' },
      { field: '生长速度', count: 8, impact: '中风险' },
      { field: '运动习惯', count: 5, impact: '低风险' },
    ],
    storageStatus: '正常',
    lastSync: '2025-06-10 14:30',
    lastExport: '2025-06-05',
    totalPatients: 156,
    totalAssessments: 423,
  };

  const handleNavigate = (route: string) => {
    if (route === 'xiaozhu') navigate('/chat');
    else if (route === 'dashboard') navigate('/dashboard');
    else navigate(`/${route}`);
  };

  return (
    <AppShell activeRoute="data-center" onNavigate={handleNavigate}>
      <PageHeader
        title="数据中心"
        subtitle="临床数据是否完整、可信、可导出、可用于科研建模？"
      />

      {/* 数据概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card variant="default" padding="md">
          <MetricDelta label="总患者数" value={dataQuality.totalPatients} />
        </Card>
        <Card variant="default" padding="md">
          <MetricDelta label="总评估数" value={dataQuality.totalAssessments} />
        </Card>
        <Card variant="default" padding="md">
          <MetricDelta label="数据完整度" value={`${dataQuality.overallCompleteness}%`} />
        </Card>
        <Card variant="default" padding="md">
          <MetricDelta label="评估覆盖率" value={`${dataQuality.assessmentCoverage}%`} />
        </Card>
      </div>

      {/* 数据完整度 */}
      <Card variant="default" padding="lg" className="mb-6">
        <SectionHeader title="数据完整度分析" />
        <Progress value={dataQuality.overallCompleteness} label="整体数据完整度" size="lg" className="mb-4" />
        <Progress value={dataQuality.assessmentCoverage} label="评估数据覆盖率" size="lg" />
      </Card>

      {/* 缺失字段分布 */}
      <Card variant="default" padding="lg" className="mb-6">
        <SectionHeader title="缺失字段分布" count={dataQuality.missingFields.length} />
        <div className="space-y-3">
          {dataQuality.missingFields.map((field, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)]">
              <div>
                <p className="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--text-primary)]">{field.field}</p>
                <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{field.count} 位患者缺失</p>
              </div>
              <span
                className={`text-[var(--text-xs)] px-2 py-1 rounded-full ${
                  field.impact === '高风险'
                    ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'
                    : field.impact === '中风险'
                      ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {field.impact}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 存储状态 */}
      <Card variant="default" padding="lg" className="mb-6">
        <SectionHeader title="存储与同步状态" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              IndexedDB 存储：{dataQuality.storageStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[var(--color-primary)]" />
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              最近同步：{dataQuality.lastSync}
            </span>
          </div>
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button variant="primary" icon={<Download className="w-4 h-4" />}>
          导出科研数据集
        </Button>
        <Button variant="secondary" icon={<Upload className="w-4 h-4" />}>
          同步到云端
        </Button>
      </div>
    </AppShell>
  );
};

export default DataCenterPage;

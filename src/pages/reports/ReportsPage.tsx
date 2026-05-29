/**
 * 报告管理
 *
 * 主叙事：这份报告现在能不能生成？关键结论是什么？缺什么？下一步怎么补齐或导出？
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { ReportStatusPanel } from '../../components/report/ReportStatusPanel';
import { DataCompletenessCard } from '../../components/report/DataCompletenessCard';
import { ReportModuleCard } from '../../components/report/ReportModuleCard';
import { MetricDelta } from '../../components/report/MetricDelta';
import { TrendMiniChart } from '../../components/report/TrendMiniChart';
import { PatientQueueCard } from '../../components/clinical/PatientQueueCard';
import { EmptyStateActionPanel } from '../../components/ui/EmptyStateActionPanel';
import { Card } from '../../components/ui/Card';
import { FileText } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient] = useState('P001');

  // Mock 报告队列
  const reportQueue = [
    {
      name: '张小明',
      gender: '男',
      age: 10,
      patientId: 'P001',
      stage: '初筛评估',
      concerns: ['双肩不等高'],
      riskLevel: 'high_risk' as const,
      status: 'pending' as const,
      lastUpdated: '今日',
      nextAction: '生成综合报告',
      onClick: () => {},
    },
  ];

  // Mock 报告模块
  const reportModules = [
    {
      moduleName: '姿态分析报告',
      status: 'completed' as const,
      summary: '双肩高度差 12mm，脊柱轻度右凸',
      trendData: [5, 8, 10, 12],
      lastUpdated: '2025-06-10',
      onView: () => {},
    },
    {
      moduleName: 'Adams 筛查报告',
      status: 'attention' as const,
      summary: 'ATR 角度 8.5°，建议进一步检查',
      trendData: [4, 5, 7, 8.5],
      lastUpdated: '2025-06-10',
      onView: () => {},
    },
    {
      moduleName: 'ROM 评估报告',
      status: 'completed' as const,
      summary: '腰椎前屈正常，侧屈轻度受限',
      lastUpdated: '2025-06-01',
      onView: () => {},
    },
    {
      moduleName: '综合康复报告',
      status: 'not_measured' as const,
      onView: () => {},
    },
  ];

  const handleNavigate = (route: string) => {
    if (route === 'xiaozhu') navigate('/chat');
    else if (route === 'dashboard') navigate('/dashboard');
    else navigate(`/${route}`);
  };

  return (
    <AppShell activeRoute="reports" onNavigate={handleNavigate}>
      <PageHeader
        title="报告管理"
        subtitle="报告能不能生成？缺什么？关键结论是什么？"
      />

      {/* 患者队列 */}
      <SectionHeader title="患者报告队列" count={reportQueue.length} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {reportQueue.map((patient, i) => (
          <PatientQueueCard key={i} {...patient} />
        ))}
      </div>

      {/* 报告状态面板 */}
      {selectedPatient && (
        <>
          <ReportStatusPanel
            patientName="张小明"
            visitNumber="初诊"
            completion={75}
            canGenerate={false}
            missingItems={['Adams 筛查复评', '姿态照片']}
            coreSummary="双肩高度差 12mm，ATR 8.5°，建议进一步影像学检查排除结构性侧弯"
            onGenerate={() => console.log('生成报告')}
            onExport={() => console.log('导出')}
          />

          {/* 指标变化 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card variant="default" padding="md">
              <MetricDelta label="双肩高度差" value="12" unit="mm" delta={2} deltaLabel="较上次" />
            </Card>
            <Card variant="default" padding="md">
              <MetricDelta label="ATR 角度" value="8.5" unit="°" delta={1.5} deltaLabel="较上次" />
            </Card>
            <Card variant="default" padding="md">
              <MetricDelta label="腰椎前屈" value="45" unit="°" delta={0} deltaLabel="正常范围" />
            </Card>
            <Card variant="default" padding="md">
              <MetricDelta label="侧屈" value="25" unit="°" delta={-3} deltaLabel="轻度受限" />
            </Card>
          </div>

          {/* 数据完整度 */}
          <DataCompletenessCard
            completedModules={['姿态采集', 'ROM 评估']}
            missingModules={[
              { name: 'Adams 前屈筛查复评', impact: '影响风险等级判定', priority: 1 },
              { name: '姿态照片补拍', impact: '影响趋势对比', priority: 2 },
            ]}
            overallProgress={75}
            onRetest={(module) => console.log('补测', module)}
          />

          {/* 报告模块 */}
          <SectionHeader title="报告模块" count={reportModules.length} className="mt-6" />
          <div className="space-y-3">
            {reportModules.map((module, i) => (
              <ReportModuleCard key={i} {...module} />
            ))}
          </div>
        </>
      )}

      {!selectedPatient && (
        <EmptyStateActionPanel
          title="请选择一位患者"
          description="从左侧队列中选择患者，查看报告状态和生成报告"
          icon={<FileText className="w-8 h-8" />}
          primaryAction={{ label: '查看患者队列', onClick: () => {} }}
        />
      )}
    </AppShell>
  );
};

export default ReportsPage;

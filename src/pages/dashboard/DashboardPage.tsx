/**
 * 工作主页
 *
 * 主叙事：今天谁需要处理？风险在哪里？下一步做什么？
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { ClinicalTaskCard } from '../../components/clinical/ClinicalTaskCard';
import { PatientQueueCard } from '../../components/clinical/PatientQueueCard';
import { RiskRadarCard } from '../../components/clinical/RiskRadarCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyStateActionPanel } from '../../components/ui/EmptyStateActionPanel';
import { Camera, ClipboardCheck, FileText, AlertTriangle, Activity, Brain } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRoute] = useState('dashboard');

  // Mock 数据
  const todayTasks = [
    {
      taskName: 'Adams 前屈筛查',
      patientName: '张小明',
      taskType: '体态筛查',
      priority: 'high' as const,
      time: '今日 10:00',
      status: 'pending' as const,
      recommendedAction: '开始筛查',
      onAction: () => navigate('/assessment'),
    },
    {
      taskName: 'ROM 关节活动度评估',
      patientName: '李小红',
      taskType: '功能评估',
      priority: 'medium' as const,
      time: '今日 14:00',
      status: 'pending' as const,
      recommendedAction: '开始评估',
      onAction: () => navigate('/assessment'),
    },
  ];

  const riskPatients = [
    {
      patientName: '张小明',
      riskLevel: 'high_risk' as const,
      keyMetric: 'ATR 角度',
      metricValue: '8.5°',
      trend: 'up' as const,
      nextVisit: '2025-06-15',
      recommendedAction: '安排复评',
      onAction: () => navigate('/assessment'),
    },
  ];

  const followUpQueue = [
    {
      name: '李小红',
      gender: '女',
      age: 12,
      stage: '康复训练期',
      concerns: ['双肩不等高', '久坐习惯'],
      riskLevel: 'medium_risk' as const,
      status: 'tracking' as const,
      lastUpdated: '2天前',
      nextAction: '查看训练记录',
      onClick: () => navigate('/assessment'),
    },
  ];

  const handleNavigate = (route: string) => {
    if (route === 'xiaozhu') navigate('/chat');
    else if (route === 'dashboard') navigate('/dashboard');
    else navigate(`/${route}`);
  };

  return (
    <AppShell activeRoute={activeRoute} onNavigate={handleNavigate}>
      <PageHeader
        title="工作主页"
        subtitle="今天谁需要处理？风险在哪里？下一步做什么？"
      />

      {/* AI 能力区 */}
      <Card variant="elevated" padding="lg" className="mb-6 bg-gradient-to-r from-[var(--ink-green-50)] to-[var(--teal-50)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ink-green-500)] to-[var(--teal-500)] flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[var(--text-base)] font-[var(--font-bold)] text-[var(--text-primary)]">AI 多模态分析能力</h2>
            <p className="text-[var(--text-xs)] text-[var(--text-muted)]">姿态识别 · 风险评估 · 趋势预测 · 报告生成</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button variant="secondary" size="sm" icon={<Camera className="w-4 h-4" />} onClick={() => navigate('/assessment')}>
            姿态采集
          </Button>
          <Button variant="secondary" size="sm" icon={<ClipboardCheck className="w-4 h-4" />} onClick={() => navigate('/assessment')}>
            Adams 筛查
          </Button>
          <Button variant="secondary" size="sm" icon={<Activity className="w-4 h-4" />} onClick={() => navigate('/assessment')}>
            ROM 评估
          </Button>
          <Button variant="secondary" size="sm" icon={<FileText className="w-4 h-4" />} onClick={() => navigate('/reports')}>
            生成报告
          </Button>
        </div>
      </Card>

      {/* 今日任务 */}
      <SectionHeader title="今日待评估" count={todayTasks.length} />
      <div className="space-y-3 mb-6">
        {todayTasks.length > 0 ? (
          todayTasks.map((task, i) => <ClinicalTaskCard key={i} {...task} />)
        ) : (
          <EmptyStateActionPanel
            title="今日暂无待评估任务"
            description="所有患者评估已完成，可以查看历史记录或安排新的随访"
            icon={<ClipboardCheck className="w-8 h-8" />}
            primaryAction={{ label: '查看患者队列', onClick: () => navigate('/assessment') }}
          />
        )}
      </div>

      {/* 高风险复评 */}
      <SectionHeader title="高风险复评" count={riskPatients.length} />
      <div className="space-y-3 mb-6">
        {riskPatients.length > 0 ? (
          riskPatients.map((patient, i) => <RiskRadarCard key={i} {...patient} />)
        ) : (
          <EmptyStateActionPanel
            title="暂无高风险患者"
            description="所有患者风险等级正常，继续保持随访"
            icon={<AlertTriangle className="w-8 h-8" />}
          />
        )}
      </div>

      {/* 随访队列 */}
      <SectionHeader title="今日接诊与随访队列" count={followUpQueue.length} />
      <div className="space-y-3">
        {followUpQueue.map((patient, i) => (
          <PatientQueueCard key={i} {...patient} />
        ))}
      </div>
    </AppShell>
  );
};

export default DashboardPage;

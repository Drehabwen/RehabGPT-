/**
 * 评估中心
 *
 * 主叙事：当前患者需要完成哪些评估？哪个最优先？做完后进入什么下一步？
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { PatientContextBar } from '../../components/clinical/PatientContextBar';
import { AssessmentModuleCard } from '../../components/clinical/AssessmentModuleCard';
import { PatientQueueCard } from '../../components/clinical/PatientQueueCard';
import { EmptyStateActionPanel } from '../../components/ui/EmptyStateActionPanel';
import { ClipboardCheck } from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<string | null>('P001');

  // Mock 患者队列
  const patientQueue = [
    {
      name: '张小明',
      gender: '男',
      age: 10,
      patientId: 'P001',
      stage: '初筛评估',
      concerns: ['双肩不等高', '头部前倾'],
      riskLevel: 'high_risk' as const,
      status: 'pending' as const,
      lastUpdated: '今日',
      nextAction: '开始 Adams 筛查',
      onClick: () => setSelectedPatient('P001'),
    },
    {
      name: '李小红',
      gender: '女',
      age: 12,
      patientId: 'P002',
      stage: '康复训练期',
      concerns: ['腰部不适'],
      riskLevel: 'medium_risk' as const,
      status: 'tracking' as const,
      lastUpdated: '2天前',
      nextAction: 'ROM 复评',
      onClick: () => setSelectedPatient('P002'),
    },
  ];

  // Mock 评估模块
  const assessmentModules = [
    {
      moduleName: '姿态采集与关键点识别',
      description: '通过正面、背面、侧面照片识别体态关键点，评估脊柱对称性',
      status: 'not_measured' as const,
      isRecommended: true,
      actionLabel: '开始姿态采集',
      onAction: () => console.log('开始姿态采集'),
    },
    {
      moduleName: 'Adams 前屈筛查与 ATR 评估',
      description: '前屈试验评估脊柱旋转角度，计算 ATR 值判断侧弯风险',
      status: 'not_measured' as const,
      isRecommended: true,
      actionLabel: '开始 Adams 筛查',
      onAction: () => console.log('开始 Adams 筛查'),
    },
    {
      moduleName: 'ROM 关节活动度评估',
      description: '评估脊柱各方向活动范围，判断功能受限程度',
      status: 'completed' as const,
      lastMeasured: '2025-06-01',
      resultSummary: '腰椎前屈 45°（正常），侧屈 25°（轻度受限）',
      actionLabel: '查看结果',
      onAction: () => console.log('查看 ROM 结果'),
    },
    {
      moduleName: '智能语音 SOAP 病历整理',
      description: '通过语音输入自动生成结构化 SOAP 病历',
      status: 'in_progress' as const,
      progress: 60,
      actionLabel: '继续 SOAP 整理',
      onAction: () => console.log('继续 SOAP'),
    },
  ];

  const handleNavigate = (route: string) => {
    if (route === 'xiaozhu') navigate('/chat');
    else if (route === 'dashboard') navigate('/dashboard');
    else navigate(`/${route}`);
  };

  return (
    <AppShell activeRoute="assessment" onNavigate={handleNavigate}>
      <PageHeader
        title="评估中心"
        subtitle="当前患者需要完成哪些评估？哪个最优先？"
      />

      {/* 患者队列 */}
      <SectionHeader title="患者评估队列" count={patientQueue.length} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {patientQueue.map((patient, i) => (
          <PatientQueueCard key={i} {...patient} />
        ))}
      </div>

      {/* 选中患者后的上下文 */}
      {selectedPatient && (
        <>
          <PatientContextBar
            name="张小明"
            gender="男"
            age={10}
            patientId="P001"
            visitNumber="初诊"
            stage="初筛评估"
            concerns={['双肩不等高', '头部前倾']}
            riskLevel="high_risk"
            lastAssessment="尚未完成"
            nextStep="完成 Adams 前屈筛查"
            onNextStep={() => console.log('下一步')}
          />

          <SectionHeader title="评估模块" count={assessmentModules.length} />
          <div className="space-y-3">
            {assessmentModules.map((module, i) => (
              <AssessmentModuleCard key={i} {...module} />
            ))}
          </div>
        </>
      )}

      {/* 未选择患者 */}
      {!selectedPatient && (
        <EmptyStateActionPanel
          title="请选择一位患者"
          description="从左侧队列中选择患者，查看需要完成的评估任务"
          icon={<ClipboardCheck className="w-8 h-8" />}
          primaryAction={{ label: '查看患者队列', onClick: () => {} }}
          secondaryActions={[
            { label: '今日待评估', onClick: () => navigate('/dashboard') },
            { label: '历史记录', onClick: () => {} },
          ]}
        />
      )}
    </AppShell>
  );
};

export default AssessmentPage;

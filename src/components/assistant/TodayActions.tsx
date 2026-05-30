/**
 * TodayActions — 今天可以做什么
 *
 * 聚焦康复师处方的训练执行。训练卡片数据来源：GET /api/integration/plan/pending
 */

import React from 'react';
import { ClipboardCheck, TrendingUp, Dumbbell } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { TreatmentPlan } from '../../pages/hooks/useTreatmentPlan';

export interface TodayActionsProps {
  childName?: string;
  treatmentPlan?: TreatmentPlan | null;
  onViewTraining?: () => void;
  onRecordChange?: () => void;
}

export const TodayActions: React.FC<TodayActionsProps> = ({
  childName = '孩子',
  treatmentPlan,
  onViewTraining,
  onRecordChange,
}) => {
  // 训练卡片动态内容
  const trainingTitle = treatmentPlan
    ? '今日训练计划'
    : '等待训练处方';
  const trainingDesc = treatmentPlan
    ? `康复师 ${treatmentPlan.therapist_name || ''} 已为孩子制定训练计划`
    : '康复师正在为孩子制定个性化训练计划';
  const trainingBtn = treatmentPlan ? '查看训练' : '查看详情';

  const actions = [
    {
      id: 'training',
      icon: treatmentPlan ? ClipboardCheck : Dumbbell,
      title: trainingTitle,
      desc: trainingDesc,
      buttonText: trainingBtn,
      btnVariant: 'primary' as const,
      bgColor: 'bg-gradient-to-br from-[var(--color-primary-light)] to-white',
      iconColor: 'text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary-border)]',
      onClick: onViewTraining,
    },
    {
      id: 'record',
      icon: TrendingUp,
      title: '记录孩子的变化',
      desc: '打卡训练 · 记录感受 · 追踪进展',
      buttonText: '去记录',
      btnVariant: 'secondary' as const,
      bgColor: 'bg-gradient-to-br from-[var(--color-secondary-light)] to-white',
      iconColor: 'text-[var(--color-secondary)] bg-[var(--color-secondary-light)] border border-[var(--color-primary-border)]',
      onClick: onRecordChange,
    },
  ];

  return (
    <div className="w-full">
      <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-4 flex items-center gap-2 select-none">
        <span className="w-1.5 h-4.5 rounded-full bg-[var(--color-primary)] inline-block" />
        今天可以做什么
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              variant="interactive"
              padding="lg"
              radius="3xl"
              onClick={action.onClick}
              className={`${action.bgColor} flex flex-col justify-between items-start min-h-[170px] transition-all duration-300 hover:translate-y-[-2px]`}
            >
              <div className="w-full">
                {/* 图标 */}
                <div className={`w-9 h-9 rounded-[var(--radius-lg)] ${action.iconColor} flex items-center justify-center shadow-inner mb-3`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {/* 标题 & 说明 */}
                <h3 className="text-xs font-extrabold text-[var(--text-primary)] tracking-wide mb-1.5 leading-tight">
                  {action.title}
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed mb-4">
                  {action.desc}
                </p>
              </div>

              <div className="w-full">
                <Button
                  variant={action.btnVariant}
                  size="sm"
                  radius="full"
                  shadow
                  fullWidth
                  onClick={action.onClick}
                >
                  {action.buttonText}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TodayActions;

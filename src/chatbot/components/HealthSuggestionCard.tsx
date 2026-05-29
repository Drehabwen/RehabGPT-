/**
 * 结构化健康建议卡
 *
 * 当小柱回复健康建议时，显示结构化的步骤和按钮。
 */

import React from 'react';
import { Camera, ClipboardCheck, Stethoscope, ArrowRight } from 'lucide-react';
import { Card, Button } from '../ui';

interface HealthSuggestionCardProps {
  title: string;
  steps: { number: number; text: string }[];
  actions: { label: string; action: string; variant?: 'primary' | 'secondary' }[];
  onAction: (action: string) => void;
}

export const HealthSuggestionCard: React.FC<HealthSuggestionCardProps> = ({
  title,
  steps,
  actions,
  onAction,
}) => {
  return (
    <Card padding="lg" shadow="md" className="bg-gradient-to-br from-emerald-50/30 to-teal-50/20">
      <h3 className="text-base font-bold text-slate-800 mb-4">{title}</h3>

      {/* 步骤列表 */}
      <div className="space-y-3 mb-5">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
              {step.number}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{step.text}</p>
          </div>
        ))}
      </div>

      {/* 行动按钮 */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => (
          <Button
            key={i}
            variant={action.variant || 'primary'}
            size="md"
            onClick={() => onAction(action.action)}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
};

/**
 * 预定义的"开始初筛"建议卡
 */
export const StartScreeningCard: React.FC<{ onAction: (action: string) => void }> = ({
  onAction,
}) => {
  return (
    <HealthSuggestionCard
      title="建议先完成三步初筛"
      steps={[
        { number: 1, text: '上传孩子站立背面照，AI辅助识别体态对称性' },
        { number: 2, text: '回答5个体态筛查问题，评估风险因素' },
        { number: 3, text: '查看评估结果，判断是否需要康复师复核' },
      ]}
      actions={[
        { label: '开始姿态初筛', action: 'upload_photo', variant: 'primary' },
        { label: '填写筛查问卷', action: 'screening', variant: 'secondary' },
        { label: '查看历史追踪', action: 'tracking', variant: 'secondary' },
      ]}
      onAction={onAction}
    />
  );
};

export default HealthSuggestionCard;

/**
 * StructuredAssistantMessage — 结构化助手消息
 *
 * 小柱回复支持结构化健康建议卡。
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface StructuredAssistantMessageProps {
  title: string;
  steps: { number: number; text: string }[];
  actions: { label: string; action: string; variant?: 'primary' | 'secondary' }[];
  onAction: (action: string) => void;
}

export const StructuredAssistantMessage: React.FC<StructuredAssistantMessageProps> = ({
  title,
  steps,
  actions,
  onAction,
}) => {
  return (
    <Card variant="default" padding="lg" radius="2xl" className="bg-gradient-to-br from-[var(--ink-green-50)] to-[var(--teal-50)]">
      <h3 className="text-[var(--text-base)] font-[var(--font-bold)] text-[var(--text-primary)] mb-4">{title}</h3>

      <div className="space-y-3 mb-5">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">
              {step.number}
            </div>
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed pt-0.5">{step.text}</p>
          </div>
        ))}
      </div>

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

export default StructuredAssistantMessage;

/**
 * PatientQueueCard — 患者队列卡片
 *
 * 所有患者列表必须复用。
 * 禁止展示大段病历。
 */

import React from 'react';
import { User, Clock } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';

export interface PatientQueueCardProps {
  name: string;
  gender?: string;
  age?: number;
  patientId?: string;
  stage?: string;
  concerns?: string[];
  riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  status?: ChipVariant;
  lastUpdated?: string;
  nextAction?: string;
  onClick?: () => void;
}

import type { ChipVariant } from '../ui/Chip';

export const PatientQueueCard: React.FC<PatientQueueCardProps> = ({
  name,
  gender,
  age,
  patientId,
  stage,
  concerns = [],
  riskLevel = 'low_risk',
  status = 'pending',
  lastUpdated,
  nextAction,
  onClick,
}) => {
  return (
    <Card variant="interactive" padding="md" onClick={onClick}>
      <div className="flex items-start gap-3">
        {/* 头像 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--ink-green-100)] to-[var(--teal-100)] flex items-center justify-center">
          <User className="w-5 h-5 text-[var(--color-primary)]" />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {name}
            </h3>
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">
              {gender} {age && `${age}岁`}
            </span>
            <Chip variant={status} size="sm" />
            <Chip variant={riskLevel} size="sm" />
          </div>

          {stage && (
            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1">{stage}</p>
          )}

          {/* 问题标签 */}
          {concerns.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {concerns.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 右侧 */}
        <div className="flex-shrink-0 text-right">
          {lastUpdated && (
            <div className="flex items-center gap-1 text-[var(--text-xs)] text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              {lastUpdated}
            </div>
          )}
          {nextAction && (
            <p className="text-[var(--text-xs)] text-[var(--color-primary)] mt-1 font-[var(--font-medium)]">
              {nextAction}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PatientQueueCard;

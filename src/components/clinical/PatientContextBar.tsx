/**
 * PatientContextBar — 患者上下文条
 *
 * 所有临床页面选中患者后必须使用。
 * 显示：姓名、性别、年龄、ID、当前诊次、当前阶段、核心问题、风险等级、最近评估时间、推荐下一步动作。
 */

import React from 'react';
import { User, Calendar, ChevronRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';

export interface PatientContextBarProps {
  name: string;
  gender?: string;
  age?: number;
  patientId?: string;
  visitNumber?: string;
  stage?: string;
  concerns?: string[];
  riskLevel?: 'low_risk' | 'medium_risk' | 'high_risk';
  lastAssessment?: string;
  nextStep?: string;
  onNextStep?: () => void;
}

export const PatientContextBar: React.FC<PatientContextBarProps> = ({
  name,
  gender,
  age,
  patientId,
  visitNumber,
  stage,
  concerns = [],
  riskLevel = 'low_risk',
  lastAssessment,
  nextStep,
  onNextStep,
}) => {
  return (
    <Card variant="elevated" padding="md" className="mb-6">
      <div className="flex items-start gap-4">
        {/* 头像 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--ink-green-100)] to-[var(--teal-100)] flex items-center justify-center">
          <User className="w-6 h-6 text-[var(--color-primary)]" />
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[var(--text-lg)] font-[var(--font-bold)] text-[var(--text-primary)]">
              {name}
            </h2>
            <span className="text-[var(--text-sm)] text-[var(--text-muted)]">
              {gender} {age && `${age}岁`} {patientId && `· ID:${patientId.slice(-6)}`}
            </span>
            {visitNumber && (
              <Chip variant="in_progress" size="sm">
                {visitNumber}
              </Chip>
            )}
            <Chip variant={riskLevel} size="sm">
              {riskLevel === 'high_risk' ? '高风险' : riskLevel === 'medium_risk' ? '中风险' : '低风险'}
            </Chip>
          </div>

          {/* 阶段 + 问题 */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {stage && (
              <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">{stage}</span>
            )}
            {concerns.map((c, i) => (
              <span
                key={i}
                className="text-[var(--text-xs)] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-light)]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex-shrink-0 text-right">
          {lastAssessment && (
            <div className="flex items-center gap-1 text-[var(--text-xs)] text-[var(--text-muted)]">
              <Calendar className="w-3 h-3" />
              {lastAssessment}
            </div>
          )}
        </div>
      </div>

      {/* 下一步建议 */}
      {nextStep && (
        <button
          onClick={onNextStep}
          className="mt-3 w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--teal-50)] border border-[var(--color-primary-border)] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center text-[10px] font-bold">
              →
            </div>
            <span className="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--color-primary)]">
              下一步：{nextStep}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-primary)]" />
        </button>
      )}
    </Card>
  );
};

export default PatientContextBar;

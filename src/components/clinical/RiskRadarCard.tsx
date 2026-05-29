/**
 * RiskRadarCard — 风险雷达卡片
 *
 * 显示重点关注患者：患者、风险等级、关键指标变化、趋势、下次复诊时间、建议动作。
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight } from 'lucide-react';
import { Chip } from '../ui/Chip';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface RiskRadarCardProps {
  patientName: string;
  riskLevel: 'high_risk' | 'medium_risk' | 'low_risk';
  keyMetric: string;
  metricValue: string;
  trend: 'up' | 'down' | 'stable';
  nextVisit?: string;
  recommendedAction: string;
  onAction: () => void;
}

export const RiskRadarCard: React.FC<RiskRadarCardProps> = ({
  patientName,
  riskLevel,
  keyMetric,
  metricValue,
  trend,
  nextVisit,
  recommendedAction,
  onAction,
}) => {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-[var(--color-danger)]', label: '恶化' },
    down: { icon: TrendingDown, color: 'text-[var(--color-success)]', label: '改善' },
    stable: { icon: Minus, color: 'text-[var(--text-muted)]', label: '稳定' },
  };

  const t = trendConfig[trend];
  const TrendIcon = t.icon;

  return (
    <Card variant={riskLevel === 'high_risk' ? 'risk' : 'default'} padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 患者 + 风险 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-[var(--text-primary)]">
              {patientName}
            </h3>
            <Chip variant={riskLevel} size="sm" />
          </div>

          {/* 关键指标 */}
          <div className="flex items-center gap-3 mt-2">
            <div>
              <p className="text-[var(--text-xs)] text-[var(--text-muted)]">{keyMetric}</p>
              <p className="text-[var(--text-lg)] font-[var(--font-bold)] text-[var(--text-primary)]">
                {metricValue}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${t.color}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-[var(--text-xs)] font-[var(--font-medium)]">{t.label}</span>
            </div>
          </div>

          {/* 下次复诊 */}
          {nextVisit && (
            <div className="flex items-center gap-1 mt-2 text-[var(--text-xs)] text-[var(--text-muted)]">
              <Calendar className="w-3 h-3" />
              下次复诊：{nextVisit}
            </div>
          )}
        </div>

        {/* 操作 */}
        <div className="flex-shrink-0 ml-4">
          <Button variant="secondary" size="sm" onClick={onAction} icon={<ArrowRight className="w-4 h-4" />}>
            {recommendedAction}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RiskRadarCard;

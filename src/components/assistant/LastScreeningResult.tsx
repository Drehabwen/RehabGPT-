/**
 * LastScreeningResult — 康复师评估结果卡片
 *
 * 数据来源从「家长自筛」切换为「康复师推送的评估摘要」。
 * 当前过渡期复用 riskResult，API 返回空则显示「等待康复师评估」。
 */

import React from 'react';
import { CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface LastScreeningResultProps {
  screeningDate?: string;
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
  riskLabel?: string;
  recommendation?: string;
  concerns?: string[];
  onViewFullReport?: () => void;
  isEmpty?: boolean;
}

export const LastScreeningResult: React.FC<LastScreeningResultProps> = ({
  screeningDate = '今日',
  riskLevel = 'none',
  riskLabel = '当前建议继续观察',
  recommendation = '暂未发现明显异常提示，建议保持良好习惯，定期观察。',
  concerns = [],
  onViewFullReport,
  isEmpty = false,
}) => {
  if (isEmpty) {
    return (
      <Card
        variant="default"
        padding="lg"
        radius="3xl"
        className="flex flex-col justify-center items-center text-center min-h-[200px]"
      >
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-4">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">等待康复师评估</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed max-w-xs">
          康复师完成专业评估后，结果将显示在这里
        </p>
        <Button
          variant="primary"
          size="md"
          radius="full"
          shadow
          onClick={onViewFullReport}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          查看完整报告
        </Button>
      </Card>
    );
  }

  const statusColor = riskLevel === 'none' || riskLevel === 'low'
    ? 'bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success-border)]'
    : 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent-border)]';

  return (
    <Card
      variant="default"
      padding="lg"
      radius="3xl"
      className="flex flex-col justify-between min-h-[200px]"
    >
      <div>
        <div className="flex items-center justify-between mb-4 select-none">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-1.5 h-4.5 rounded-full bg-[var(--color-primary)] inline-block" />
            康复师评估结果
          </h3>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">{screeningDate}</span>
        </div>

        {/* 状态标记 */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[var(--color-primary)] flex-shrink-0" />
          <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${statusColor}`}>
            {riskLabel}
          </span>
        </div>

        {/* 建议说明 */}
        <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed mb-5">
          {recommendation}
        </p>

        {/* 评估要点 */}
        {concerns && concerns.length > 0 && (
          <div className="mt-2.5">
            <p className="text-[10px] text-[var(--text-tertiary)] font-extrabold mb-2 uppercase tracking-wider select-none">
              评估要点
            </p>
            <ul className="space-y-2">
              {concerns.map((concern, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-primary)] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 完整报告按钮 */}
      <div className="mt-6 w-full">
        <Button
          variant="secondary"
          size="md"
          radius="full"
          shadow
          fullWidth
          onClick={onViewFullReport}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          查看完整报告
        </Button>
      </div>
    </Card>
  );
};

export default LastScreeningResult;

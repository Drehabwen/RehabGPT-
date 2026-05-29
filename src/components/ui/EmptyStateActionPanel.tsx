/**
 * EmptyStateActionPanel 组件
 *
 * 禁止只写"请选择患者"，必须提供：
 * - 推荐下一步
 * - 常用入口
 * - 最近记录
 * - 主操作按钮
 */

import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export interface EmptyStateActionPanelProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  recentItems?: Array<{
    label: string;
    time: string;
    onClick: () => void;
  }>;
}

export const EmptyStateActionPanel: React.FC<EmptyStateActionPanelProps> = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryActions,
  recentItems,
}) => {
  return (
    <Card variant="subtle" padding="lg" className="text-center">
      {/* 图标 */}
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center mx-auto mb-4">
          <div className="text-[var(--color-primary)]">{icon}</div>
        </div>
      )}

      {/* 标题 */}
      <h3 className="text-[var(--text-lg)] font-[var(--font-semibold)] text-[var(--text-primary)]">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-2 max-w-md mx-auto">
          {description}
        </p>
      )}

      {/* 主操作按钮 */}
      {primaryAction && (
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={primaryAction.onClick}>
            {primaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 次要操作 */}
      {secondaryActions && secondaryActions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {secondaryActions.map((action, i) => (
            <Button
              key={i}
              variant="secondary"
              size="sm"
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* 最近记录 */}
      {recentItems && recentItems.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[var(--border-light)]">
          <p className="text-[var(--text-xs)] text-[var(--text-muted)] mb-3">最近记录</p>
          <div className="space-y-2">
            {recentItems.map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">{item.label}</span>
                <span className="flex items-center gap-1 text-[var(--text-xs)] text-[var(--text-muted)]">
                  <Clock className="w-3 h-3" />
                  {item.time}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EmptyStateActionPanel;

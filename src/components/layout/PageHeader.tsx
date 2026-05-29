/**
 * PageHeader — 页面头部
 *
 * 显示页面标题、描述和操作按钮
 */

import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-[var(--text-2xl)] font-[var(--font-bold)] text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;

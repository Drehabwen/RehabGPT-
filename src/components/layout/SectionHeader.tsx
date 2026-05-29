/**
 * SectionHeader — 区块头部
 *
 * 用于页面内各区块的标题
 */

import React from 'react';

export interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        <h2 className="text-[var(--text-md)] font-[var(--font-semibold)] text-[var(--text-primary)]">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-[var(--text-xs)] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default SectionHeader;

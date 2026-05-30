/**
 * ChildProfileHeader — 孩子档案头部
 *
 * 家长端全新设计：温和简洁的顶部上下文，支持快速切换和通知
 */

import React from 'react';
import { Bell } from 'lucide-react';

export interface ChildProfileHeaderProps {
  childName: string;
  childAge: string;
  childGender: string;
  childPhoto?: string;
  concerns: string[];
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export const ChildProfileHeader: React.FC<ChildProfileHeaderProps> = ({
  childName,
  childAge,
  childGender,
  childPhoto,
  concerns,
  onNotificationClick,
  onProfileClick,
}) => {
  return (
    <div className="bg-transparent py-3 flex items-center justify-between border-b border-[var(--border-light)] select-none gap-4">
      {/* 左侧：Logo & 产品名 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-gradient-to-tr from-[var(--color-primary)] to-[var(--brand-500)] text-white flex items-center justify-center shadow-[var(--shadow-xs)]">
          <span className="text-xl">🦕</span>
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-[var(--text-primary)] tracking-wide leading-tight">小柱健康</h1>
          <p className="text-[10px] text-[var(--text-tertiary)] font-medium leading-tight">陪伴孩子端正体态</p>
        </div>
      </div>

      {/* 中间：孩子个人档案展示 */}
      <button
        onClick={onProfileClick}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-[var(--shadow-xs)] active:scale-95 flex-1 max-w-sm justify-start min-w-0"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)]/80 flex items-center justify-center text-[var(--color-primary)] text-xs font-extrabold border border-[var(--color-primary-border)] shadow-inner flex-shrink-0">
          {childPhoto ? (
            <img src={childPhoto} alt={childName} className="w-full h-full rounded-full object-cover" />
          ) : (
            childName.slice(0, 1)
          )}
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-[var(--text-primary)] truncate">{childName}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] font-extrabold flex-shrink-0">
              {childGender}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5 truncate">
            {childAge} · {concerns.join(' · ')}
          </p>
        </div>
      </button>

      {/* 右侧：通知中心 */}
      <button
        onClick={onNotificationClick}
        className="relative w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-light)] hover:bg-[var(--bg-hover)] flex items-center justify-center transition-all cursor-pointer shadow-[var(--shadow-xs)] active:scale-95 flex-shrink-0"
      >
        <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-danger)] border-2 border-white shadow-sm" />
      </button>
    </div>
  );
};

export default ChildProfileHeader;

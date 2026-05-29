/**
 * SidebarNav — 侧边导航
 *
 * 康复工作台主导航
 */

import React from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  Database,
  MessageCircle,
  Settings,
} from 'lucide-react';

interface SidebarNavProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: '工作主页', icon: LayoutDashboard, description: '今日待处理' },
  { id: 'assessment', label: '评估中心', icon: ClipboardCheck, description: '患者评估队列' },
  { id: 'reports', label: '报告管理', icon: FileText, description: '报告生成与查看' },
  { id: 'data-center', label: '数据中心', icon: Database, description: '数据质量与导出' },
  { id: 'xiaozhu', label: '小柱助手', icon: MessageCircle, description: '家长端助手' },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeRoute = 'dashboard', onNavigate }) => {
  return (
    <aside className="w-64 bg-[var(--bg-card)] border-r border-[var(--border-light)] flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--ink-green-600)] to-[var(--teal-600)] flex items-center justify-center text-white text-lg font-bold">
            青
          </div>
          <div>
            <h1 className="text-[var(--text-sm)] font-[var(--font-bold)] text-[var(--text-primary)]">
              青跃康复
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">AI 运动康复评估系统</p>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-left transition-all duration-[var(--transition-base)]
                ${
                  isActive
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-[var(--font-semibold)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <div className="flex-1 min-w-0">
                <span className="text-[var(--text-sm)]">{item.label}</span>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* 底部 */}
      <div className="px-4 py-3 border-t border-[var(--border-light)]">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors text-left">
          <Settings className="w-4 h-4" />
          <span className="text-[var(--text-sm)]">系统设置</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;

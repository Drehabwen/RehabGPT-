/**
 * AppShell — 应用外壳
 *
 * 提供统一的页面布局结构：侧边栏 + 主内容区
 */

import React from 'react';
import { SidebarNav } from './SidebarNav';

export interface AppShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeRoute, onNavigate }) => {
  return (
    <div className="min-h-screen flex bg-[var(--bg-page)]">
      {/* 侧边栏 */}
      <SidebarNav activeRoute={activeRoute} onNavigate={onNavigate} />

      {/* 主内容区 */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;

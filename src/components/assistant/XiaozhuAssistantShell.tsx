/**
 * XiaozhuAssistantShell — 小柱助手外壳
 *
 * 小柱助手页面布局容器。
 */

import React from 'react';

export interface XiaozhuAssistantShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const XiaozhuAssistantShell: React.FC<XiaozhuAssistantShellProps> = ({
  header,
  children,
  footer,
}) => {
  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[var(--bg-page)]">
      {/* 顶部上下文 */}
      {header}

      {/* 主内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">{children}</div>
      </div>

      {/* 底部导航 */}
      {footer}
    </div>
  );
};

export default XiaozhuAssistantShell;

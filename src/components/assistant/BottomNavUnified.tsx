/**
 * BottomNavUnified — 家长端底部 3 栏导航（固定悬浮胶囊）
 *
 * 首页 | 训练打卡 | 评估报告
 *
 * 自驱动路由：使用 useNavigate + useLocation，无需外部回调
 * 固定悬浮于视口底部，不占内容流高度
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, FileText } from 'lucide-react';

const TABS = [
  {
    id: 'chat',
    label: '首页',
    icon: LayoutDashboard,
    path: '/chat',
  },
  {
    id: 'tracking',
    label: '训练打卡',
    icon: ClipboardCheck,
    path: '/tracking',
  },
  {
    id: 'result',
    label: '评估报告',
    icon: FileText,
    path: '/result',
  },
] as const;

export const BottomNavUnified: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = (() => {
    const p = location.pathname;
    if (p.startsWith('/chat')) return 'chat';
    if (p.startsWith('/tracking')) return 'tracking';
    if (p.startsWith('/result')) return 'result';
    return 'chat';
  })();

  return (
    <nav className="fixed left-1/2 bottom-3.5 -translate-x-1/2 w-[min(560px,calc(100vw-24px))] h-[68px] grid grid-cols-3 items-center rounded-[28px] border border-[var(--border-light)] bg-[var(--surface)]/95 shadow-[0_16px_42px_rgba(27,74,63,0.13)] backdrop-blur-[18px] z-50 select-none">
      {TABS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-0.5 h-full transition-colors duration-200 cursor-pointer ${
              isActive
                ? 'text-[var(--text-brand)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <Icon
              size={20}
              className={`transition-transform duration-200 ${isActive ? 'stroke-[2.5]' : ''}`}
            />
            <span className="text-[11px] font-extrabold tracking-wide">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavUnified;

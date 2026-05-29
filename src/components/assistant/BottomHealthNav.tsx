/**
 * BottomHealthNav — 底部健康导航
 *
 * 强化家庭健康管理路径，姿态初筛作为凸起主入口。
 */

import React from 'react';
import { MessageCircle, Camera, FileText, Activity, ClipboardList } from 'lucide-react';

export interface BottomHealthNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onScreeningClick: () => void;
}

const NAV_ITEMS = [
  { id: 'chat', label: '问小柱', icon: MessageCircle },
  { id: 'prescriptions', label: '执行处方', icon: FileText },
  { id: 'tracking', label: '日常追踪', icon: Activity },
  { id: 'scales', label: '量表/报告', icon: ClipboardList },
];

export const BottomHealthNav: React.FC<BottomHealthNavProps> = ({
  activeTab,
  onTabChange,
  onScreeningClick,
}) => {
  return (
    <div className="bg-white/90 border-t border-[var(--border-light)] backdrop-blur-md shadow-lg shadow-[var(--border-light)]">
      <div className="max-w-3xl mx-auto px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[var(--color-primary)] font-[var(--font-bold)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] font-[var(--font-medium)]'
              }`}
            >
              <div className={isActive ? 'scale-110' : ''}>
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : ''} />
              </div>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}

        {/* 中间凸起按钮 - 姿态初筛 */}
        <button onClick={onScreeningClick} className="relative -mt-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--ink-green-500)] to-[var(--teal-500)] text-white flex items-center justify-center shadow-lg shadow-[var(--ink-green-300)] hover:shadow-xl hover:shadow-[var(--ink-green-300)] transition-all duration-200 active:scale-95">
            <Camera size={24} />
          </div>
          <span className="text-[10px] font-[var(--font-bold)] text-[var(--ink-green-700)] mt-1">姿态初筛</span>
        </button>
      </div>
    </div>
  );
};

export default BottomHealthNav;

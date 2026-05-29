/**
 * 底部健康管理导航栏
 *
 * 强化家庭健康管理路径，"姿态初筛"作为突出的主入口。
 */

import React from 'react';
import { MessageCircle, Camera, FileText, Activity, ClipboardList } from 'lucide-react';
import { IconButton } from '../ui';

interface HealthNavBarProps {
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

export const HealthNavBar: React.FC<HealthNavBarProps> = ({
  activeTab,
  onTabChange,
  onScreeningClick,
}) => {
  return (
    <div className="bg-white/90 border-t border-slate-100/80 backdrop-blur-md shadow-lg shadow-slate-100">
      <div className="max-w-3xl mx-auto px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <IconButton
              key={item.id}
              icon={<Icon size={20} className={activeTab === item.id ? 'stroke-[2.5]' : ''} />}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          );
        })}

        {/* 中间凸起按钮 - 姿态初筛 */}
        <button
          onClick={onScreeningClick}
          className="relative -mt-6 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 active:scale-95">
            <Camera size={24} />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-1">姿态初筛</span>
        </button>
      </div>
    </div>
  );
};

export default HealthNavBar;

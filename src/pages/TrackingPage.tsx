/**
 * 日常追踪页面
 * 
 * 整合：追踪仪表板 + 每日追踪表单
 * 家长端核心功能：2分钟完成每日汇报
 */

import React, { useState } from 'react';
import { ArrowLeft, Calendar, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TrackingDashboard } from '../tracking/components/TrackingDashboard';
import { DailyTrackingForm } from '../tracking/components/DailyTrackingForm';
import { useTrackingStore } from '../tracking/store/useTrackingStore';

type TabType = 'dashboard' | 'daily' | 'weekly';

export const TrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const patientName = useTrackingStore((s) => s.patientName);
  const todayRecord = useTrackingStore((s) => s.getTodayRecord());

  const tabs = [
    { id: 'dashboard' as TabType, label: '总览', icon: TrendingUp },
    { id: 'daily' as TabType, label: '每日追踪', icon: Calendar },
    { id: 'weekly' as TabType, label: '每周总结', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">日常追踪</h1>
              <p className="text-xs text-slate-500">
                {patientName ? `${patientName}的康复追踪` : '患者康复追踪'}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {todayRecord ? '今日已汇报' : '今日未汇报'}
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 内容区域 */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <TrackingDashboard />}
        {activeTab === 'daily' && <DailyTrackingForm />}
        {activeTab === 'weekly' && (
          <div className="bg-white rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">每周总结</h3>
            <p className="text-slate-500 text-sm">每周追踪表单即将上线</p>
            <p className="text-slate-400 text-xs mt-1">基于每日数据自动生成周报</p>
          </div>
        )}
      </main>
    </div>
  );
};

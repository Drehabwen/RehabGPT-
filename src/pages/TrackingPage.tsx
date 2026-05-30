/**
 * 日常追踪页面
 *
 * 3 tab：训练处方 / 每日打卡 / 趋势总览
 * 训练处方由康复师推送，家长端执行打卡。
 */

import React, { useState } from 'react';
import { ClipboardList, Calendar, TrendingUp, Dumbbell, Loader2, User } from 'lucide-react';
import { TrackingDashboard } from '../tracking/components/TrackingDashboard';
import { DailyTrackingForm } from '../tracking/components/DailyTrackingForm';
import { useTrackingStore } from '../tracking/store/useTrackingStore';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { AppLayout } from '../chatbot/components/AppLayout';
import { useTreatmentPlan } from './hooks/useTreatmentPlan';

type TabType = 'prescription' | 'daily' | 'dashboard';

/** 训练处方内容 — 从 GET /api/integration/plan/pending 拉取 */
const TreatmentPrescription: React.FC = () => {
  const patientId = useChatbotStore((s) => s.patientId);
  const { latestPlan, loading } = useTreatmentPlan(patientId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-4" />
        <p className="text-sm text-[var(--text-secondary)] font-medium">加载训练处方中...</p>
      </div>
    );
  }

  if (!latestPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center mb-5">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-[var(--text-primary)] mb-2">
          训练处方
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-1 max-w-xs leading-relaxed">
          康复师正在为孩子制定个性化的训练计划
        </p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
          处方完成后将自动推送到这里，您可以查看每个动作的详细说明并开始每日打卡
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 处方来源信息 */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
          <User className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)]">
            {latestPlan.therapist_name || '康复师'} 开具
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {latestPlan.created_at?.split('T')[0] || ''}
          </p>
        </div>
      </div>

      {/* 处方内容 — Markdown 渲染 */}
      <div className="rounded-2xl border border-[var(--border-light)] bg-white/80 p-5 shadow-sm">
        <div
          className="prose prose-sm max-w-none text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: latestPlan.plan_content
              .replace(/^### (.+)$/gm, '<h3 class="text-base font-extrabold mt-4 mb-2 text-[var(--text-primary)]">$1</h3>')
              .replace(/^## (.+)$/gm, '<h2 class="text-lg font-extrabold mt-5 mb-3 text-[var(--text-primary)]">$1</h2>')
              .replace(/^# (.+)$/gm, '<h1 class="text-xl font-extrabold mt-6 mb-3 text-[var(--text-primary)]">$1</h1>')
              .replace(/^- (.+)$/gm, '<li class="ml-4 text-[var(--text-secondary)]">$1</li>')
              .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-[var(--text-secondary)]">$1. $2</li>')
              .replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-[var(--text-primary)]">$1</strong>')
              .replace(/\n\n/g, '<br/><br/>')
              .replace(/\n/g, '<br/>'),
          }}
        />
      </div>
    </div>
  );
};

export const TrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('prescription');
  const todayRecord = useTrackingStore((s) => s.getTodayRecord());

  const tabs = [
    { id: 'prescription' as TabType, label: '训练处方', icon: ClipboardList },
    { id: 'daily' as TabType, label: '每日打卡', icon: Calendar },
    { id: 'dashboard' as TabType, label: '趋势总览', icon: TrendingUp },
  ];

  return (
    <AppLayout
      title="训练与追踪"
      backPath="/chat"
      headerRight={
        <span className="text-xs text-[var(--text-muted)]">
          {todayRecord ? '今日已汇报' : '今日未汇报'}
        </span>
      }
    >
      {/* Tab 切换 */}
      <div className="flex gap-1 mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      {activeTab === 'prescription' && <TreatmentPrescription />}
      {activeTab === 'daily' && <DailyTrackingForm />}
      {activeTab === 'dashboard' && <TrackingDashboard />}
    </AppLayout>
  );
};

export default TrackingPage;

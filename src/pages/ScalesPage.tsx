/**
 * 量表中心页面
 *
 * 显示：待填量表列表、已完成量表、量表填写入口
 */

import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { useScaleStore } from '../chatbot/store/useScaleStore';
import { ScaleForm } from '../chatbot/components/ScaleForm';
import { AppLayout } from '../chatbot/components/AppLayout';
import { getScaleDefinition } from '../api/scaleApi';
import type { PendingScale } from '../api/scaleApi';

type TabType = 'pending' | 'completed';

export const ScalesPage: React.FC = () => {
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);

  const pendingScales = useScaleStore((s) => s.pendingScales);
  const completedScales = useScaleStore((s) => s.completedScales);
  const isLoading = useScaleStore((s) => s.isLoading);
  const error = useScaleStore((s) => s.error);
  const fetchPendingScales = useScaleStore((s) => s.fetchPendingScales);
  const clearError = useScaleStore((s) => s.clearError);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedTask, setSelectedTask] = useState<PendingScale | null>(null);

  // 加载待填量表
  useEffect(() => {
    if (patientId) {
      fetchPendingScales(patientId);
    }
  }, [patientId]);

  // 如果正在填写某个量表 — 隐藏底部导航
  if (selectedTask) {
    return (
      <AppLayout title="填写量表" backPath="/scales" showBottomNav={false}>
        <ScaleForm
          task={selectedTask}
          onComplete={() => {
            setSelectedTask(null);
            if (patientId) fetchPendingScales(patientId);
          }}
          onCancel={() => setSelectedTask(null)}
        />
      </AppLayout>
    );
  }

  const pendingBadge = pendingScales.length > 0 ? (
    <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
      {pendingScales.length} 个待填
    </span>
  ) : undefined;

  return (
    <AppLayout
      title="量表中心"
      backPath="/chat"
      headerRight={pendingBadge}
    >
      {/* 错误提示 */}
      {error && (
        <div role="alert" aria-live="polite" className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => {
                clearError();
                if (patientId) fetchPendingScales(patientId);
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
            >
              点击重试
            </button>
          </div>
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 mt-3">加载量表...</span>
        </div>
      )}

      {/* Tab 切换 */}
      {!isLoading && (
        <>
          <div className="flex gap-1 mb-5">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'pending'
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Clock className="w-4 h-4" />
              待填写
              {pendingScales.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingScales.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'completed'
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              已完成
            </button>
          </div>

          {/* 待填写列表 */}
          {activeTab === 'pending' && (
            <>
              {pendingScales.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">暂无待填量表</h3>
                  <p className="text-sm text-slate-500">康复师下发量表后，会在这里显示</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingScales.map((scale) => {
                    const def = getScaleDefinition(scale.scale_id);
                    return (
                      <div
                        key={scale.task_id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedTask(scale);
                          }
                        }}
                        className="bg-white rounded-xl p-5 border border-slate-100 hover:border-emerald-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(scale)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <ClipboardList className="w-5 h-5 text-emerald-500" />
                              <h3 className="font-semibold text-slate-800">
                                {def?.name || scale.scale_id}
                              </h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">
                              {def?.description || '请按要求填写量表'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                预计 {def?.estimatedMinutes || '?'} 分钟
                              </span>
                              <span>
                                下发时间: {new Date(scale.created_at).toLocaleDateString('zh-CN')}
                              </span>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors ml-4">
                            去填写
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* 已完成列表 */}
          {activeTab === 'completed' && (
            <>
              {completedScales.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-2">暂无已完成量表</h3>
                  <p className="text-sm text-slate-500">填写量表后会在这里显示记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedScales.map((scale) => {
                    const def = getScaleDefinition(scale.scale_id);
                    return (
                      <div
                        key={scale.task_id}
                        className="bg-white rounded-xl p-5 border border-slate-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-semibold text-slate-800">
                            {def?.name || scale.scale_id}
                          </h3>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full">
                            已完成
                          </span>
                        </div>
                        {scale.scale_data && 'percentageScore' in scale.scale_data && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${scale.scale_data.percentageScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-emerald-600">
                              {scale.scale_data.percentageScore}分
                            </span>
                          </div>
                        )}
                        {scale.submitted_at && (
                          <p className="text-xs text-slate-400 mt-2">
                            提交时间: {new Date(scale.submitted_at).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default ScalesPage;

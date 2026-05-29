/**
 * 追踪仪表板
 * 
 * 显示：今日状态、趋势图表、预警列表、快速入口
 */

import React from 'react';
import { Activity, Heart, Shield, AlertTriangle, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { useTrackingStore } from '../store/useTrackingStore';

export const TrackingDashboard: React.FC = () => {
  const summary = useTrackingStore((s) => s.getSummary(7));
  const alerts = useTrackingStore((s) => s.getAlerts(true));
  const todayRecord = useTrackingStore((s) => s.getTodayRecord());
  const patientName = useTrackingStore((s) => s.patientName);

  // 计算今日状态
  const todayStatus = todayRecord
    ? {
        pain: todayRecord.pain.hasPain ? `${todayRecord.pain.level}/10` : '无',
        exercise: todayRecord.exercise.completed ? '已完成' : '未完成',
        brace: todayRecord.brace.worn ? `${todayRecord.brace.hours}h` : '未佩戴',
        mood: todayRecord.mood,
        sleep: todayRecord.sleep,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">{patientName || '患者'}的康复追踪</h2>
        <p className="text-emerald-100 text-sm">
          {todayRecord ? '今日已记录' : '今日尚未记录'}
        </p>
      </div>

      {/* 今日状态卡片 */}
      {todayStatus && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-red-500" />
              <span className="text-xs text-slate-500">疼痛</span>
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {todayStatus.pain}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-emerald-500" />
              <span className="text-xs text-slate-500">训练</span>
            </div>
            <div className={`text-lg font-semibold ${todayRecord?.exercise.completed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {todayStatus.exercise}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-blue-500" />
              <span className="text-xs text-slate-500">支具</span>
            </div>
            <div className={`text-lg font-semibold ${todayRecord?.brace.worn ? 'text-blue-600' : 'text-slate-400'}`}>
              {todayStatus.brace}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-purple-500" />
              <span className="text-xs text-slate-500">情绪/睡眠</span>
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {todayStatus.mood}/{todayStatus.sleep}
            </div>
          </div>
        </div>
      )}

      {/* 7天趋势 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">7天趋势</h3>
        
        {/* 疼痛趋势 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">疼痛程度</span>
            <span className="text-xs text-slate-400">0-10</span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {summary.painTrend.levels.map((level, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    level === 0
                      ? 'bg-slate-100'
                      : level <= 3
                      ? 'bg-yellow-200'
                      : level <= 6
                      ? 'bg-orange-300'
                      : 'bg-red-400'
                  }`}
                  style={{ height: `${(level / 10) * 100}%` }}
                />
                <span className="text-[10px] text-slate-400">
                  {new Date(summary.painTrend.dates[i]).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 训练完成度 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">训练完成</span>
            <span className="text-xs text-emerald-600">{summary.adherence.exercise}%</span>
          </div>
          <div className="flex gap-1">
            {summary.exerciseTrend.completed.map((completed, i) => (
              <div
                key={i}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center ${
                  completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {completed ? <CheckCircle size={14} /> : <span className="text-xs">-</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 支具佩戴时长 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">支具佩戴</span>
            <span className="text-xs text-blue-600">{summary.adherence.brace}%</span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {summary.braceTrend.hours.map((hours, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    hours >= 16 ? 'bg-blue-400' : hours >= 12 ? 'bg-blue-300' : hours > 0 ? 'bg-blue-200' : 'bg-slate-100'
                  }`}
                  style={{ height: `${(hours / 20) * 100}%` }}
                />
                <span className="text-[10px] text-slate-400">
                  {new Date(summary.braceTrend.dates[i]).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 预警列表 */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-800">需要关注</h3>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border-l-4 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-400'
                    : alert.severity === 'medium'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <p className="text-sm text-slate-700">{alert.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(alert.date).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速入口 */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white rounded-xl p-4 border border-slate-100 text-left hover:border-emerald-300 transition-colors">
          <Calendar size={20} className="text-emerald-500 mb-2" />
          <div className="text-sm font-medium text-slate-800">填写今日追踪</div>
          <div className="text-xs text-slate-400">2分钟完成</div>
        </button>
        <button className="bg-white rounded-xl p-4 border border-slate-100 text-left hover:border-emerald-300 transition-colors">
          <TrendingUp size={20} className="text-blue-500 mb-2" />
          <div className="text-sm font-medium text-slate-800">查看详细报告</div>
          <div className="text-xs text-slate-400">本周汇总</div>
        </button>
      </div>
    </div>
  );
};

export default TrackingDashboard;

/**
 * XiaozhuWelcomeCard — 小柱欢迎卡片
 *
 * 小柱形象 + 能力入口。
 */

import React from 'react';
import { Camera, ClipboardCheck, FileText, Activity, BookOpen, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';

export interface XiaozhuWelcomeCardProps {
  patientName?: string;
  onAction: (action: string) => void;
}

const CAPABILITIES = [
  { id: 'upload_photo', icon: Camera, title: '上传姿态照片', desc: 'AI辅助识别体态问题', color: 'from-[var(--ink-green-500)] to-[var(--teal-500)]', bg: 'bg-[var(--ink-green-50)]', text: 'text-[var(--ink-green-700)]' },
  { id: 'screening', icon: ClipboardCheck, title: '体态筛查问卷', desc: '5分钟完成初筛评估', color: 'from-[var(--teal-500)] to-[var(--teal-600)]', bg: 'bg-[var(--teal-50)]', text: 'text-[var(--teal-700)]' },
  { id: 'prescription', icon: FileText, title: '查看训练处方', desc: '康复师定制方案', color: 'from-[var(--ink-green-600)] to-[var(--ink-green-700)]', bg: 'bg-[var(--ink-green-50)]', text: 'text-[var(--ink-green-700)]' },
  { id: 'tracking', icon: Activity, title: '记录今日训练', desc: '每日2分钟打卡', color: 'from-[var(--status-amber-500)] to-[var(--status-amber-600)]', bg: 'bg-[var(--status-amber-50)]', text: 'text-[var(--status-amber-700)]' },
  { id: 'report', icon: BookOpen, title: '解释评估报告', desc: '通俗化医学术语', color: 'from-[var(--status-red-500)] to-[var(--status-red-600)]', bg: 'bg-[var(--status-red-50)]', text: 'text-[var(--status-red-700)]' },
];

export const XiaozhuWelcomeCard: React.FC<XiaozhuWelcomeCardProps> = ({ patientName, onAction }) => {
  return (
    <Card variant="elevated" padding="none" radius="3xl">
      {/* 主视觉 */}
      <div className="relative bg-gradient-to-br from-[var(--ink-green-50)] via-[var(--teal-50)] to-[var(--paper-50)] px-6 py-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ink-green-100)] opacity-30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--teal-100)] opacity-20 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-5">
          <div className="flex-shrink-0 w-20 h-20 rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--ink-green-500)] to-[var(--teal-500)] flex items-center justify-center text-4xl shadow-[var(--shadow-md)] border-4 border-white">
            🦕
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[var(--status-amber-500)]" />
              <span className="text-[var(--text-xs)] font-[var(--font-medium)] text-[var(--ink-green-700)]">儿童脊柱健康智能助手</span>
            </div>
            <h2 className="text-[var(--text-xl)] font-[var(--font-bold)] text-[var(--text-primary)]">你好，我是小柱</h2>
            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              {patientName
                ? `我来帮你管理 ${patientName} 的脊柱健康，完成姿态初筛、解释报告并跟踪训练情况`
                : '我来帮你了解孩子体态问题、完成姿态初筛、解释报告并跟踪训练情况'}
            </p>
          </div>
        </div>
      </div>

      {/* 能力入口 */}
      <div className="px-4 py-5">
        <p className="text-[var(--text-xs)] font-[var(--font-medium)] text-[var(--text-muted)] mb-3 px-1">我可以帮你</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <button
                key={cap.id}
                onClick={() => onAction(cap.id)}
                className={`group flex flex-col items-start gap-2 p-3.5 rounded-[var(--radius-xl)] ${cap.bg} hover:shadow-md transition-all duration-200 border border-transparent hover:border-[var(--border-light)] text-left`}
              >
                <div className={`w-9 h-9 rounded-[var(--radius-lg)] bg-gradient-to-br ${cap.color} text-white flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className={`text-[var(--text-sm)] font-[var(--font-semibold)] ${cap.text}`}>{cap.title}</p>
                  <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-0.5">{cap.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-3 bg-[var(--bg-subtle)] border-t border-[var(--border-light)]">
        <p className="text-[var(--text-xs)] text-[var(--text-muted)] text-center">
          💡 小柱的建议仅供参考，不能替代专业医疗诊断
        </p>
      </div>
    </Card>
  );
};

export default XiaozhuWelcomeCard;

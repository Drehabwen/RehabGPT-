/**
 * 顶部孩子健康上下文条
 *
 * 明确告诉用户：这不是普通聊天，而是围绕某个孩子的健康管理。
 */

import React from 'react';
import { User, Calendar, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { Badge, Avatar } from '../ui';

interface ChildHealthHeaderProps {
  patientName: string;
  patientAge?: number | null;
  patientGender?: string;
  patientId?: string;
  currentStatus?: 'pending_screening' | 'tracking' | 'needs_review' | 'completed';
  lastAssessmentDate?: string;
  concerns?: string[];
  nextStep?: string;
}

const STATUS_CONFIG = {
  pending_screening: {
    label: '待初筛',
    variant: 'warning' as const,
    icon: AlertCircle,
  },
  tracking: {
    label: '追踪中',
    variant: 'success' as const,
    icon: Activity,
  },
  needs_review: {
    label: '需复核',
    variant: 'danger' as const,
    icon: AlertCircle,
  },
  completed: {
    label: '已完成',
    variant: 'info' as const,
    icon: Activity,
  },
};

export const ChildHealthHeader: React.FC<ChildHealthHeaderProps> = ({
  patientName,
  patientAge,
  patientGender,
  patientId,
  currentStatus = 'pending_screening',
  lastAssessmentDate,
  concerns = ['体态不良', '双肩不等高', '久坐习惯'],
  nextStep = '上传站立背面照完成姿态初筛',
}) => {
  const status = STATUS_CONFIG[currentStatus];
  const StatusIcon = status.icon;

  return (
    <div className="bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-start gap-4">
          {/* 孩子头像 */}
          <Avatar size="lg">
            <User className="w-7 h-7 text-emerald-600" />
          </Avatar>

          {/* 信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-800">{patientName || '孩子'}</h2>
              <span className="text-sm text-slate-400">｜儿童脊柱健康随访</span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              {patientAge && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {patientAge}岁
                </span>
              )}
              {patientGender && <span>{patientGender}</span>}
              {patientId && <span className="text-slate-300">ID: {patientId.slice(-6)}</span>}
            </div>

            {/* 当前关注 */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs text-slate-400">当前关注：</span>
              {concerns.map((c, i) => (
                <Badge key={i} variant="default" size="sm">
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          {/* 状态标签 */}
          <div className="flex-shrink-0">
            <Badge variant={status.variant} size="md" icon={<StatusIcon className="w-3.5 h-3.5" />}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* 下一步建议 */}
        <div className="mt-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 rounded-xl px-4 py-3 border border-emerald-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span className="text-sm font-medium text-emerald-800">
                下一步：{nextStep}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </div>
          {lastAssessmentDate && (
            <p className="text-[11px] text-slate-400 mt-1.5 ml-8">
              最近评估：{lastAssessmentDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildHealthHeader;

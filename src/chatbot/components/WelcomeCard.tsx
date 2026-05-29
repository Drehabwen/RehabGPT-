/**
 * 主视觉助手欢迎区
 *
 * 当聊天内容较少或未开始时显示，避免大面积空白。
 */

import React from 'react';
import { Camera, ClipboardCheck, FileText, Activity, BookOpen, Sparkles } from 'lucide-react';
import { ActionCard, Avatar, Card } from '../ui';

interface WelcomeCardProps {
  patientName?: string;
  onAction: (action: string) => void;
}

const CAPABILITIES = [
  {
    id: 'upload_photo',
    icon: <Camera className="w-5 h-5" />,
    title: '上传姿态照片',
    desc: 'AI辅助识别体态问题',
    color: 'emerald' as const,
  },
  {
    id: 'screening',
    icon: <ClipboardCheck className="w-5 h-5" />,
    title: '体态筛查问卷',
    desc: '5分钟完成初筛评估',
    color: 'sky' as const,
  },
  {
    id: 'prescription',
    icon: <FileText className="w-5 h-5" />,
    title: '查看训练处方',
    desc: '康复师定制方案',
    color: 'violet' as const,
  },
  {
    id: 'tracking',
    icon: <Activity className="w-5 h-5" />,
    title: '记录今日训练',
    desc: '每日2分钟打卡',
    color: 'amber' as const,
  },
  {
    id: 'report',
    icon: <BookOpen className="w-5 h-5" />,
    title: '解释评估报告',
    desc: '通俗化医学术语',
    color: 'rose' as const,
  },
];

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ patientName, onAction }) => {
  return (
    <Card padding="none" shadow="md">
      {/* 主视觉区 */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50/50 to-sky-50/30 px-6 py-8 overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100/20 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center gap-5">
          {/* 小柱形象 */}
          <Avatar size="xl" className="shadow-lg shadow-emerald-200/50 border-4 border-white">
            <span>🦕</span>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-emerald-600">儿童脊柱健康智能助手</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              你好，我是小柱
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              {patientName
                ? `我来帮你管理 ${patientName} 的脊柱健康，完成姿态初筛、解释报告并跟踪训练情况`
                : '我来帮你了解孩子体态问题、完成姿态初筛、解释报告并跟踪训练情况'}
            </p>
          </div>
        </div>
      </div>

      {/* 能力入口区 */}
      <div className="px-4 py-5">
        <p className="text-xs font-medium text-slate-400 mb-3 px-1">我可以帮你</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CAPABILITIES.map((cap) => (
            <ActionCard
              key={cap.id}
              icon={cap.icon}
              title={cap.title}
              description={cap.desc}
              color={cap.color}
              onClick={() => onAction(cap.id)}
            />
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          💡 小柱的建议仅供参考，不能替代专业医疗诊断
        </p>
      </div>
    </Card>
  );
};

export default WelcomeCard;

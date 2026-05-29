import React from 'react';
import { ShieldCheck, AlertTriangle, Siren } from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import type { RiskResult as RiskResultType } from '../types';

interface RiskResultProps {
  result: RiskResultType;
}

const LEVEL_CONFIG = {
  low: {
    icon: ShieldCheck,
    bgClass: 'bg-emerald-50/70 border-emerald-100',
    textClass: 'text-emerald-600',
    badgeBg: 'bg-emerald-100/80 text-emerald-700',
  },
  mild: {
    icon: ShieldCheck,
    bgClass: 'bg-amber-50/70 border-amber-100',
    textClass: 'text-amber-600',
    badgeBg: 'bg-amber-100/80 text-amber-700',
  },
  moderate: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-50/70 border-orange-100',
    textClass: 'text-orange-650',
    badgeBg: 'bg-orange-100/80 text-orange-700',
  },
  high: {
    icon: Siren,
    bgClass: 'bg-red-50/70 border-red-100',
    textClass: 'text-red-600',
    badgeBg: 'bg-red-100/80 text-red-700',
  },
};

const FACTOR_LABELS: Record<string, string> = {
  familyHistory: '家族侧弯史',
  backPain: '日常背痛频率',
  painSeverity: '背痛严重程度',
  postureAsymmetry: '双肩与体态对称度',
  growthRisk: '青春期生长速度',
  adams: "Adam's 前屈测试",
};

/**
 * 风险评分结果面板
 * 包含：SVG 仪表盘、风险等级徽章、六因子分解、建议
 */
export const RiskResult: React.FC<RiskResultProps> = ({ result }) => {
  const config = LEVEL_CONFIG[result.level];
  const Icon = config.icon;

  return (
    <div className={`rounded-3xl border ${config.bgClass} p-5.5 mb-4`}>
      {/* 等级图标 + 标签 */}
      <div className="flex items-center gap-2 mb-4.5">
        <Icon size={18} className={`${config.textClass} stroke-[2.5]`} />
        <span
          className={`px-3 py-0.5 rounded-full text-xs font-bold ${config.badgeBg}`}
        >
          {result.levelLabel}
        </span>
        <span className="text-xs text-slate-450 font-bold bg-white/60 px-2.5 py-0.5 rounded-full border border-slate-100">
          {result.urgency === 'urgent'
            ? '🚨 极高风险 / 建议尽快就医'
            : result.urgency === 'semi-urgent'
              ? '⚕️ 中度风险 / 建议预约评估'
              : '✅ 风险较低 / 保持日常观察'}
        </span>
      </div>

      {/* 仪表盘 */}
      <div className="flex justify-center mb-5 bg-white/40 p-4 rounded-2xl border border-white/60">
        <RiskGauge score={result.total} maxScore={160} color={result.color} />
      </div>

      {/* 因子分解 */}
      <div className="space-y-3 mb-5">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          📊 脊柱风险多因子指标分析
        </h4>
        <div className="space-y-2.5 bg-white/50 p-3.5 rounded-2xl border border-white/40">
          {Object.entries(result.factors).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-slate-650 font-bold">
                {FACTOR_LABELS[key] || key}
              </span>
              <div className="flex items-center gap-2.5">
                <div className="w-24 h-2 bg-slate-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((value / 30) * 100, 100)}%`,
                      backgroundColor:
                        value >= 25
                          ? '#ef4444' // red-500
                          : value >= 15
                            ? '#f97316' // orange-500
                            : value >= 5
                              ? '#eab308' // yellow-500
                              : '#10b981', // emerald-500
                    }}
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-500 w-5 text-right">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 总分 */}
      <div className="flex items-center justify-between py-3.5 border-t border-slate-200/50">
        <span className="text-xs font-bold text-slate-600">综合脊柱分指数</span>
        <span className="text-base font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {result.total} <span className="text-xs font-bold text-slate-400">/ 160 分</span>
        </span>
      </div>

      {/* 建议 */}
      <div className="mt-3.5 p-4.5 rounded-2xl bg-white/80 border border-white/80 shadow-sm shadow-emerald-50/10">
        <h4 className="text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1">
          💡 小柱与专家的康复建议
        </h4>
        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
          {result.recommendation}
        </p>
      </div>
    </div>
  );
};

export default RiskResult;

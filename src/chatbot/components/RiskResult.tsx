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
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  mild: {
    icon: ShieldCheck,
    bgClass: 'bg-yellow-50 border-yellow-200',
    textClass: 'text-yellow-700',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
  },
  moderate: {
    icon: AlertTriangle,
    bgClass: 'bg-orange-50 border-orange-200',
    textClass: 'text-orange-700',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  high: {
    icon: Siren,
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
};

const FACTOR_LABELS: Record<string, string> = {
  familyHistory: '家族史',
  backPain: '背痛频率',
  painSeverity: '疼痛程度',
  postureAsymmetry: '体态不对称',
  growthRisk: '生长风险',
  adams: "Adam's 测试",
};

/**
 * 风险评分结果面板
 * 包含：SVG 仪表盘、风险等级徽章、六因子分解、建议
 */
export const RiskResult: React.FC<RiskResultProps> = ({ result }) => {
  const config = LEVEL_CONFIG[result.level];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.bgClass} p-5 mb-4 mx-2`}>
      {/* 等级图标 + 标签 */}
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className={config.textClass} />
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}
        >
          {result.levelLabel}
        </span>
        <span className="text-xs text-slate-400">
          {result.urgency === 'urgent'
            ? '紧急'
            : result.urgency === 'semi-urgent'
              ? '建议就医'
              : '常规观察'}
        </span>
      </div>

      {/* 仪表盘 */}
      <div className="flex justify-center mb-4">
        <RiskGauge score={result.total} maxScore={160} color={result.color} />
      </div>

      {/* 因子分解 */}
      <div className="space-y-2 mb-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          风险因子分解
        </h4>
        {Object.entries(result.factors).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {FACTOR_LABELS[key] || key}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((value / 30) * 100, 100)}%`,
                    backgroundColor:
                      value >= 25
                        ? '#dc2626'
                        : value >= 15
                          ? '#ea580c'
                          : value >= 5
                            ? '#ca8a04'
                            : '#16a34a',
                  }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 w-6 text-right">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 总分 */}
      <div className="flex items-center justify-between py-3 border-t border-slate-200">
        <span className="text-sm font-semibold text-slate-700">总分</span>
        <span className="text-lg font-bold" style={{ color: `var(--${result.color === 'green' ? 'success' : result.color === 'yellow' ? 'warning' : result.color === 'orange' ? 'warning' : 'error'})` }}>
          {result.total} / 160
        </span>
      </div>

      {/* 建议 */}
      <div className="mt-3 p-3 rounded-xl bg-white/60 border border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 mb-1">建议</h4>
        <p className="text-sm text-slate-700 leading-relaxed">
          {result.recommendation}
        </p>
      </div>
    </div>
  );
};

export default RiskResult;

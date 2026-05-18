import React from 'react';

interface RiskGaugeProps {
  score: number;
  maxScore?: number;
  color?: 'green' | 'yellow' | 'orange' | 'red';
}

const COLOR_MAP = {
  green: '#16a34a',
  yellow: '#ca8a04',
  orange: '#ea580c',
  red: '#dc2626',
};

/**
 * SVG 半圆仪表盘
 * 显示风险评分在 0-160 范围中的位置
 */
export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  maxScore = 160,
  color = 'green',
}) => {
  const percentage = Math.min(score / maxScore, 1);
  // SVG 半圆弧参数
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - percentage);

  const gaugeColor = COLOR_MAP[color];

  return (
    <div className="risk-gauge flex flex-col items-center">
      <svg
        width="200"
        height="120"
        viewBox="0 0 200 120"
        className="overflow-visible"
        aria-label={`风险评分 ${score} / ${maxScore}`}
      >
        {/* 背景弧 */}
        <path
          d={`M ${100 - radius},100 A ${radius},${radius} 0 0,1 ${100 + radius},100`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* 分数弧 */}
        <path
          d={`M ${100 - radius},100 A ${radius},${radius} 0 0,1 ${100 + radius},100`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />

        {/* 分数文字 */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="text-3xl font-bold"
          fill={gaugeColor}
        >
          {score}
        </text>
        <text
          x="100"
          y="108"
          textAnchor="middle"
          className="text-xs"
          fill="#94a3b8"
        >
          / {maxScore}
        </text>
      </svg>
    </div>
  );
};

export default RiskGauge;

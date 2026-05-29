/**
 * TrendMiniChart — 轻量趋势图
 *
 * 用 SVG/CSS 实现，不引入大型图表库。
 */

import React from 'react';

export interface TrendMiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export const TrendMiniChart: React.FC<TrendMiniChartProps> = ({
  data,
  width = 120,
  height = 40,
  color = 'var(--color-primary)',
  showArea = true,
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const areaPoints = `${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <polygon
          points={areaPoints}
          fill={color}
          opacity={0.1}
        />
      )}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 数据点 */}
      {data.map((value, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            fill="white"
            stroke={color}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
};

export default TrendMiniChart;

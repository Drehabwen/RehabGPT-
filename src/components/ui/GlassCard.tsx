/**
 * GlassCard — 超通透磨砂玻璃卡片
 *
 * 背景半透明 + backdrop-blur + 白色边框，适用于需要现代毛玻璃质感的信息面板。
 */

import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  style,
}) => (
  <div
    onClick={onClick}
    style={style}
    className={`
      bg-white/70 backdrop-blur-xl
      rounded-[var(--radius-2xl)]
      border border-white/60
      shadow-[0_12px_32px_rgba(15,23,42,0.04)]
      ${className}
    `}
  >
    {children}
  </div>
);

export default GlassCard;

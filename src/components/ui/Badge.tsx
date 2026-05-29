/**
 * Badge 组件
 *
 * 数值徽标，用于显示计数、提醒等
 */

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-[var(--status-slate-500)] text-white',
    primary: 'bg-[var(--color-primary)] text-white',
    danger: 'bg-[var(--color-danger)] text-white',
    warning: 'bg-[var(--color-accent)] text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[18px] h-[18px]
        px-1
        rounded-full
        text-[10px] font-[var(--font-bold)]
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;

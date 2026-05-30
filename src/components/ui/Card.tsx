/**
 * Card 组件
 *
 * 变体：default / elevated / interactive / selected / risk / subtle
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'selected' | 'risk' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  overflow?: 'hidden' | 'visible';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  fullWidth?: boolean;
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  overflow = 'hidden',
  radius = 'xl',
  fullWidth = false,
  border = true,
}) => {
  const variantClasses = {
    default:
      'bg-[var(--bg-card)] shadow-[var(--shadow-card)]',
    elevated:
      'bg-[var(--bg-card)] shadow-[var(--shadow-elevated)]',
    interactive:
      'bg-[var(--bg-card)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] cursor-pointer transition-all duration-[var(--transition-base)]',
    selected:
      'bg-[var(--color-primary-light)] shadow-[var(--shadow-card)]',
    risk:
      'bg-[var(--color-danger-light)] shadow-[var(--shadow-card)]',
    subtle:
      'bg-[var(--bg-subtle)]',
  };

  const borderClasses = border
    ? variant === 'selected'
      ? 'border-2 border-[var(--color-primary)]'
      : variant === 'risk'
      ? 'border border-[var(--color-danger-border)]'
      : variant === 'interactive'
      ? 'border border-[var(--border-light)] hover:border-[var(--border-default)]'
      : 'border border-[var(--border-light)]'
    : 'border-0';

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-md)]',
    lg: 'rounded-[var(--radius-lg)]',
    xl: 'rounded-[var(--radius-xl)]',
    '2xl': 'rounded-[var(--radius-2xl)]',
    '3xl': 'rounded-[var(--radius-3xl)]',
    full: 'rounded-[var(--radius-full)]',
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${radiusClasses[radius]}
        ${overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible'}
        ${variantClasses[variant]}
        ${borderClasses}
        ${paddingClasses[padding]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;

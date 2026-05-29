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
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}) => {
  const variantClasses = {
    default:
      'bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[var(--shadow-card)]',
    elevated:
      'bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[var(--shadow-elevated)]',
    interactive:
      'bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-[var(--border-default)] cursor-pointer transition-all duration-[var(--transition-base)]',
    selected:
      'bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] shadow-[var(--shadow-card)]',
    risk:
      'bg-[var(--color-danger-light)] border border-[var(--color-danger-border)] shadow-[var(--shadow-card)]',
    subtle:
      'bg-[var(--bg-subtle)] border border-[var(--border-light)]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-[var(--radius-xl)]
        overflow-hidden
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;

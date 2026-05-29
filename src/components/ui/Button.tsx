/**
 * Button 组件
 *
 * 变体：primary / secondary / ghost / subtle / danger / disabled / loading
 */

import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  onClick,
  className = '',
  type = 'button',
}) => {
  const isDisabled = disabled || loading;

  const variantClasses = {
    primary:
      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
    secondary:
      'bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-border)] hover:bg-[var(--ink-green-100)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
    subtle:
      'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
    danger:
      'bg-[var(--color-danger)] text-white hover:bg-[var(--status-red-700)] shadow-sm',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-[var(--text-sm)] gap-1.5',
    md: 'h-10 px-4 text-[var(--text-base)] gap-2',
    lg: 'h-12 px-6 text-[var(--text-md)] gap-2',
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        rounded-[var(--radius-lg)]
        font-[var(--font-medium)]
        transition-all duration-[var(--transition-base)]
        active:scale-[0.97]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon}
      {children}
    </button>
  );
};

export default Button;

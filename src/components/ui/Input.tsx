/**
 * Input 组件
 *
 * 文本输入框，支持各种状态
 */

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, iconRight, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full
              h-10
              px-3
              ${icon ? 'pl-10' : ''}
              ${iconRight ? 'pr-10' : ''}
              bg-[var(--bg-card)]
              border
              rounded-[var(--radius-lg)]
              text-[var(--text-base)] text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)]
              transition-all duration-[var(--transition-base)]
              focus:border-[var(--color-primary)]
              focus:shadow-[var(--shadow-glow-brand)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-[var(--color-danger)]' : 'border-[var(--border-default)]'}
              ${className}
            `}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-[var(--text-xs)] text-[var(--color-danger)]">{error}</p>}
        {helper && !error && (
          <p className="mt-1 text-[var(--text-xs)] text-[var(--text-muted)]">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

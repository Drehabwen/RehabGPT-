/**
 * 统一 UI 组件库
 *
 * 设计原则：
 * - 所有组件使用 Tailwind CSS，不内联样式
 * - 支持变体（variants）通过 props 控制
 * - 保持医疗/健康领域的专业感
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// 主题配置
// ═══════════════════════════════════════════════════════════════

export const THEME = {
  colors: {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    secondary: '#0ea5e9',
    accent: '#f59e0b',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// Card 组件
// ═══════════════════════════════════════════════════════════════

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  onClick,
}) => {
  const paddingClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  const shadowClass = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }[shadow];

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl
        ${border ? 'border border-slate-100' : ''}
        ${shadowClass}
        ${paddingClass}
        ${hover ? 'hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GlassCard 组件（毛玻璃效果）
// ═══════════════════════════════════════════════════════════════

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/80 backdrop-blur-md
        rounded-2xl
        border border-white/50
        shadow-lg shadow-slate-100/50
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Badge 组件
// ═══════════════════════════════════════════════════════════════

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full border
        font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {icon}
      {children}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// Button 组件
// ═══════════════════════════════════════════════════════════════

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
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
}) => {
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20',
    secondary:
      'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    danger:
      'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-medium
        transition-all duration-200
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
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

// ═══════════════════════════════════════════════════════════════
// IconButton 组件
// ═══════════════════════════════════════════════════════════════

export interface IconButtonProps {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1
        px-4 py-2 rounded-xl
        transition-all duration-200
        cursor-pointer
        ${
          active
            ? 'text-emerald-700 font-bold'
            : 'text-slate-400 hover:text-emerald-600 font-medium'
        }
        ${className}
      `}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>{icon}</div>
      {label && <span className="text-[10px] tracking-wide">{label}</span>}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// ActionCard 组件（能力入口卡片）
// ═══════════════════════════════════════════════════════════════

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  color,
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      text: 'text-emerald-700',
    },
    sky: {
      bg: 'bg-sky-50',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
      text: 'text-sky-700',
    },
    violet: {
      bg: 'bg-violet-50',
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
      text: 'text-violet-700',
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      text: 'text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      text: 'text-rose-700',
    },
    slate: {
      bg: 'bg-slate-50',
      iconBg: 'bg-gradient-to-br from-slate-500 to-slate-600',
      text: 'text-slate-700',
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`
        group flex flex-col items-start gap-2.5
        p-4 rounded-xl
        ${c.bg}
        hover:shadow-md
        transition-all duration-200
        border border-transparent hover:border-slate-100
        text-left w-full
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-xl
          ${c.iconBg}
          text-white
          flex items-center justify-center
          shadow-sm
        `}
      >
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${c.text}`}>{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// StatusBadge 组件（状态标签）
// ═══════════════════════════════════════════════════════════════

export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'pending';
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const colors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    pending: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-1 rounded-lg
        border text-xs font-semibold
        ${colors[status]}
      `}
    >
      {children}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// LoadingSpinner 组件
// ═══════════════════════════════════════════════════════════════

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        border-slate-200 border-t-emerald-500
        rounded-full animate-spin
        ${className}
      `}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// SectionTitle 组件
// ═══════════════════════════════════════════════════════════════

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-xs font-medium text-slate-400 uppercase tracking-wider ${className}`}>
      {children}
    </h3>
  );
};

// ═══════════════════════════════════════════════════════════════
// EmptyState 组件
// ═══════════════════════════════════════════════════════════════

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-slate-300 mb-3">{icon}</div>
      <h3 className="text-base font-medium text-slate-600">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Avatar 组件
// ═══════════════════════════════════════════════════════════════

export const Avatar: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ children, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-2xl
        bg-gradient-to-br from-emerald-100 to-teal-50
        border-2 border-emerald-100
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// StepIndicator 组件（步骤指示器）
// ═══════════════════════════════════════════════════════════════

export const StepIndicator: React.FC<{
  steps: string[];
  currentStep: number;
}> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center gap-1">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`
            flex-1 h-1.5 rounded-full transition-colors
            ${i <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'}
          `}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

export function getRiskColor(riskLevel: string): string {
  const map: Record<string, string> = {
    '低风险': 'text-emerald-600 bg-emerald-50',
    '轻度关注': 'text-amber-600 bg-amber-50',
    '中度风险': 'text-orange-600 bg-orange-50',
    '高风险': 'text-rose-600 bg-rose-50',
  };
  return map[riskLevel] || 'text-slate-600 bg-slate-50';
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

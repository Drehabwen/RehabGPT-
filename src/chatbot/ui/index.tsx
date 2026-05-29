/**
 * 统一 UI 组件库
 * 
 * 之前的问题：
 * - 12个组件各自管理样式，大量重复
 * - glass card、button、spacing 等样式散落在各组件
 * - ChatbotAgent.tsx 内联大量 JSX 和样式
 * 
 * 改进：
 * - 提取通用样式模式
 * - 统一组件接口
 * - 支持主题定制
 */

import React from 'react';

// ── 主题配置 ──
export const THEME = {
  colors: {
    primary: '#0ea5e9',
    primaryLight: '#38bdf8',
    primaryDark: '#0284c7',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
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
    xl: '24px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
    glass: '0 8px 32px rgba(0,0,0,0.08)',
  },
} as const;

// ── 通用样式类 ──
export const COMMON_STYLES = {
  glassCard: {
    background: THEME.colors.surfaceGlass,
    backdropFilter: 'blur(12px)',
    borderRadius: THEME.borderRadius.lg,
    boxShadow: THEME.shadows.glass,
    border: '1px solid rgba(255,255,255,0.5)',
  },
  button: {
    base: {
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
    },
    primary: {
      background: THEME.colors.primary,
      color: '#fff',
    },
    secondary: {
      background: 'transparent',
      color: THEME.colors.primary,
      border: `1px solid ${THEME.colors.primary}`,
    },
    ghost: {
      background: 'transparent',
      color: THEME.colors.textSecondary,
    },
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
} as const;

// ── GlassCard 组件 ──
export interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, className, onClick }) => {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...COMMON_STYLES.glassCard,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── Button 组件 ──
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  style,
}) => {
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        ...COMMON_STYLES.button.base,
        ...COMMON_STYLES.button[variant],
        ...sizeStyles[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// ── LoadingSpinner 组件 ──
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = THEME.colors.primary,
}) => {
  return (
    <div
      style={{
        ...COMMON_STYLES.flexCenter,
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${color}20`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
};

// ── StatusBadge 组件 ──
export interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const colors = {
    success: { bg: '#dcfce7', text: '#166534' },
    warning: { bg: '#fef3c7', text: '#92400e' },
    danger: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
  };

  const { bg, text } = colors[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        background: bg,
        color: text,
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
};

// ── 动画 keyframes（需注入全局） ──
export const GLOBAL_ANIMATIONS = `
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

// ── 工具函数 ──
export function mergeStyles(...styles: (React.CSSProperties | undefined)[]): React.CSSProperties {
  return styles.reduce<React.CSSProperties>((acc, style) => ({ ...acc, ...style }), {});
}

export function getRiskColor(riskLevel: string): string {
  const map: Record<string, string> = {
    '低风险': THEME.colors.success,
    '轻度关注': THEME.colors.warning,
    '中度风险': '#f97316',
    '高风险': THEME.colors.danger,
  };
  return map[riskLevel] || THEME.colors.textSecondary;
}

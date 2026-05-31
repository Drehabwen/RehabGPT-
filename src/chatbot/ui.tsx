import React from 'react';

type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';

const toneClasses: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
};

export const Card: React.FC<{
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}> = ({ children, padding = 'md', shadow = 'sm', className = '', onClick }) => {
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
  }[shadow];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-white ${paddingClass} ${shadowClass} ${className}`}
    >
      {children}
    </div>
  );
};

export const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, variant = 'primary', size = 'md', fullWidth, icon, className = '', onClick }) => {
  const variantClass =
    variant === 'secondary'
      ? 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
      : 'bg-emerald-600 text-white hover:bg-emerald-700';
  const sizeClass = size === 'lg' ? 'h-12 px-5 text-sm' : 'h-10 px-4 text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}> = ({ children, variant = 'default', size = 'sm', icon, className = '' }) => {
  const variantClass = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
  }[variant];
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${variantClass} ${sizeClass} ${className}`}>
      {icon}
      {children}
    </span>
  );
};

export const Avatar: React.FC<{
  children: React.ReactNode;
  size?: 'lg' | 'xl';
  className?: string;
}> = ({ children, size = 'lg', className = '' }) => {
  const sizeClass = size === 'xl' ? 'h-16 w-16 text-3xl' : 'h-12 w-12 text-xl';
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-emerald-50 ${sizeClass} ${className}`}>
      {children}
    </div>
  );
};

export const IconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors ${
      active ? 'text-emerald-700' : 'text-slate-500 hover:text-emerald-700'
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

export const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: Tone;
  onClick?: () => void;
}> = ({ icon, title, description, color = 'emerald', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[96px] flex-col items-start rounded-xl border p-3 text-left transition-transform active:scale-[0.98] ${toneClasses[color]}`}
  >
    <span className="mb-2">{icon}</span>
    <span className="text-xs font-bold">{title}</span>
    <span className="mt-1 text-[11px] opacity-75">{description}</span>
  </button>
);

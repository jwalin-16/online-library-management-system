import React from 'react';

interface BadgeProps {
  variant: 
    | 'success' 
    | 'danger' 
    | 'warning' 
    | 'info' 
    | 'neutral' 
    | 'purple';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant, 
  children, 
  size = 'md',
  dot = true 
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const dots = {
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${styles[variant]} ${sizeClasses}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};

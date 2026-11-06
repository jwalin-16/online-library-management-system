import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple';
  trend?: {
    label: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue',
  trend,
  onClick,
}) => {
  const schemeStyles = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      bar: 'bg-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      bar: 'bg-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      bar: 'bg-amber-600',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      bar: 'bg-rose-600',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      bar: 'bg-indigo-600',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      bar: 'bg-purple-600',
    },
  };

  const scheme = schemeStyles[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl border ${scheme.bg} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.positive ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  glowColor?: 'cyan' | 'indigo' | 'emerald' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  glowColor = 'cyan',
}) => {
  const borderGlow = {
    cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-500/20',
    indigo: 'hover:border-indigo-500/50 hover:shadow-indigo-500/20',
    emerald: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
    amber: 'hover:border-amber-500/50 hover:shadow-amber-500/20',
  }[glowColor];

  return (
    <div className={`glass-panel p-5 rounded-2xl transition-all duration-300 ${borderGlow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700/50">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        {trend && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};

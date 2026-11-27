import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'teal' | 'blue' | 'emerald' | 'amber' | 'rose';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'teal',
}) => {
  const colorMap = {
    teal: 'bg-[#E0F2F1] text-[#00897B] border-[#B2DFDB]',
    blue: 'bg-[#E8F1FC] text-[#1565C0] border-[#BFDBFE]',
    emerald: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
    amber: 'bg-[#FEF3C7] text-[#F59E0B] border-[#FDE68A]',
    rose: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-[#183153] mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[colorScheme]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-[#16A34A]' : 'text-slate-500'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400 ml-1.5">vs last shift</span>
        </div>
      )}
    </div>
  );
};

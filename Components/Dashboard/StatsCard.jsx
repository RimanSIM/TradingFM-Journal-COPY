import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, variant = 'default' }) {
  const variants = {
    default: 'from-gray-800/50 to-gray-900/50 border-gray-700/50',
    success: 'from-emerald-900/30 to-emerald-950/20 border-emerald-500/40',
    danger: 'from-red-900/30 to-red-950/20 border-red-500/40',
    accent: 'from-cyan-900/30 to-blue-950/20 border-cyan-500/40',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border p-6
      bg-gradient-to-br ${variants[variant]}
      transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10
    `}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <Icon className="w-6 h-6 text-cyan-300" />
          </div>
        )}
      </div>
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-600/10 blur-3xl" />
    </div>
  );
}
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, variant = 'default' }) {
  const variants = {
    default: 'from-gray-800/50 to-gray-900/50 border-gray-700/50',
    success: 'from-emerald-900/20 to-emerald-950/20 border-emerald-500/30',
    danger: 'from-red-900/20 to-red-950/20 border-red-500/30',
    accent: 'from-cyan-900/20 to-blue-950/20 border-cyan-500/30',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border p-5 
      bg-gradient-to-br ${variants[variant]}
      transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/5
    `}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
        )}
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/5 to-blue-600/5 blur-2xl" />
    </div>
  );
}
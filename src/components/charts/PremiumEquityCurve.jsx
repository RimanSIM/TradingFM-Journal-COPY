import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-cyan-400">
          ${payload[0].value?.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PremiumEquityCurve({ data, height = 320 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500" style={{ height: `${height}px` }}>
        No data yet
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.4}/>
              <stop offset="50%" stopColor="#00D9FF" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="#00D9FF" stopOpacity={0}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#1F2937" 
            vertical={false}
            strokeOpacity={0.3}
          />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280" 
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            dy={10}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            tickFormatter={(value) => `$${value}`}
            dx={-5}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              stroke: '#00D9FF', 
              strokeWidth: 1, 
              strokeDasharray: '3 3',
              strokeOpacity: 0.5
            }}
          />
          <Area 
            type="monotone" 
            dataKey="equity" 
            stroke="#00D9FF" 
            fill="url(#equityGradient)"
            strokeWidth={2.5}
            filter="url(#glow)"
            dot={false}
            activeDot={{ 
              r: 5, 
              fill: '#00D9FF',
              stroke: '#0A0E1A',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
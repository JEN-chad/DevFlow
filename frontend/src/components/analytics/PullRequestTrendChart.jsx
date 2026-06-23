import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs">
        <p className="font-bold text-slate-900 dark:text-white mb-1.5">{label}</p>
        {payload.map((item, i) => (
          <p key={i} className="font-semibold" style={{ color: item.color }}>
            {item.name === 'opened' ? 'Opened' : 'Merged'}: {item.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PullRequestTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No pull request trend data available.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="prOpenedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prMergedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={4}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="opened"
            name="opened"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#prOpenedGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="merged"
            name="merged"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#prMergedGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PullRequestTrendChart;

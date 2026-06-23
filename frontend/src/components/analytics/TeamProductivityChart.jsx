import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const BAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs min-w-[150px]">
        <p className="font-black text-slate-900 dark:text-white mb-2">{d.username}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Tasks Done</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.completedTasks}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Story Points</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{d.storyPointsDelivered} SP</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Commits</span>
            <span className="font-bold text-violet-600 dark:text-violet-400">{d.commitsContributed}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-bold">Score</span>
            <span className="font-black text-slate-900 dark:text-white">{d.score}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const TeamProductivityChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl min-h-[180px]">
        No team productivity data available.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8);

  return (
    <div className="flex-1 min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="username"
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.06)' }} />
          <Bar dataKey="score" radius={[5, 5, 0, 0]}>
            {sorted.map((entry, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamProductivityChart;

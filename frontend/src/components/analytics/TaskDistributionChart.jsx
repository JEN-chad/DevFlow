import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS = {
  BACKLOG: '#64748B',    // Slate
  TODO: '#3B82F6',       // Blue
  IN_PROGRESS: '#F59E0B',// Amber
  REVIEW: '#8B5CF6',     // Purple
  DONE: '#10B981',       // Emerald
};

const DEMO_DATA = [
  { status: 'BACKLOG', count: 5 },
  { status: 'TODO', count: 8 },
  { status: 'IN_PROGRESS', count: 4 },
  { status: 'REVIEW', count: 2 },
  { status: 'DONE', count: 12 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-bold text-slate-850 dark:text-slate-200">{data.status}</p>
        <div className="mt-1 flex items-center gap-4">
          <span className="text-slate-500">Tasks: <strong className="text-slate-800 dark:text-slate-100">{data.count}</strong></span>
          <span className="text-slate-500">Story Points: <strong className="text-slate-800 dark:text-slate-100">{data.storyPoints || 0}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

export const TaskDistributionChart = ({ data = [], loading = false }) => {
  const hasData = data && data.some(d => d.count > 0);
  const chartData = hasData ? data : DEMO_DATA;

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="space-y-3 w-full max-w-[200px]">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4 mx-auto"></div>
          <div className="h-28 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mx-auto"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 flex flex-col justify-between">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] z-10 rounded-xl">
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase border border-slate-200 dark:border-slate-700 shadow-sm">
            Demo State
          </span>
        </div>
      )}
      <div className="flex-1 w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              nameKey="status"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status]}
                  opacity={hasData ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 capitalize">
                  {value.toLowerCase().replace('_', ' ')}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaskDistributionChart;

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DEMO_DATA = [
  { username: 'Alex', completedTasks: 8, storyPointsDelivered: 24 },
  { username: 'Taylor', completedTasks: 6, storyPointsDelivered: 18 },
  { username: 'Jordan', completedTasks: 5, storyPointsDelivered: 15 },
  { username: 'Morgan', completedTasks: 3, storyPointsDelivered: 10 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-bold text-slate-850 dark:text-slate-200">{data.username}</p>
        <p className="mt-1 text-primary-500 font-semibold">Completed Tasks: {data.completedTasks}</p>
        <p className="text-emerald-500 font-semibold">Story Points: {data.storyPointsDelivered}</p>
      </div>
    );
  }
  return null;
};

export const TeamProductivityChart = ({ data = [], loading = false }) => {
  const hasData = data && data.length > 0;
  const chartData = hasData ? data : DEMO_DATA;

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="space-y-4 w-full px-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/4"></div>
          <div className="flex items-end gap-3 h-36">
            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-28 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
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
      <div className="flex-1 w-full h-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis
              dataKey="username"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 capitalize">
                  {value.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              )}
            />
            <Bar
              dataKey="completedTasks"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
              opacity={hasData ? 1 : 0.25}
            />
            <Bar
              dataKey="storyPointsDelivered"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              opacity={hasData ? 1 : 0.25}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeamProductivityChart;

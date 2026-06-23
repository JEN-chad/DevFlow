import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DEMO_DATA = [
  { date: 'Mon', commits: 3 },
  { date: 'Tue', commits: 7 },
  { date: 'Wed', commits: 4 },
  { date: 'Thu', commits: 8 },
  { date: 'Fri', commits: 5 },
  { date: 'Sat', commits: 2 },
  { date: 'Sun', commits: 1 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-semibold text-slate-500">{payload[0].payload.date}</p>
        <p className="mt-1 font-bold text-primary-500">Commits: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export const CommitActivityChart = ({ data = [], loading = false }) => {
  const hasData = data && data.some(d => d.commits > 0);
  const chartData = hasData ? data : DEMO_DATA;

  // Format dates for display
  const formattedData = chartData.map(d => {
    // If it looks like a date e.g. YYYY-MM-DD, convert to Mon/Tue etc. or short form
    if (d.date && d.date.includes('-')) {
      const dateObj = new Date(d.date);
      return {
        ...d,
        date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    }
    return d;
  });

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="space-y-4 w-full px-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/4"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
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
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
            <XAxis
              dataKey="date"
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
            <Area
              type="monotone"
              dataKey="commits"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCommits)"
              opacity={hasData ? 1 : 0.25}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CommitActivityChart;

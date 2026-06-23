import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, HelpCircle, Activity, Hourglass } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
        <p className="font-semibold text-slate-500">{payload[0].payload.day}</p>
        <div className="mt-1.5 space-y-1">
          <p className="font-semibold text-blue-500">Ideal Remaining: {payload[0].value} pts</p>
          {payload[1] && payload[1].value !== null && (
            <p className="font-semibold text-primary-500">Actual Remaining: {payload[1].value} pts</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const SprintBurndownChart = ({ sprintId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchBurndown = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getSprintBurndown(sprintId);
        if (active) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load burndown data');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (sprintId) {
      fetchBurndown();
    }
    return () => {
      active = false;
    };
  }, [sprintId]);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-52 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <HelpCircle className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Burndown Data Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {error || 'Make sure the sprint has started and contains tasks with estimated story points to begin tracking.'}
        </p>
      </div>
    );
  }

  const { sprintName, totalStoryPoints, completedStoryPoints, completionPercentage, daysRemaining, health, chartData } = data;

  const getHealthBadgeColor = (h) => {
    switch (h) {
      case 'On Track':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'At Risk':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Delayed':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sprint Aggregation</span>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">{sprintName} Progress Burndown</h2>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getHealthBadgeColor(health)}`}>
          <Activity className="h-3 w-3" />
          {health}
        </span>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-100/50 dark:bg-slate-800/30 p-3 space-y-0.5 text-center">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Burndown Completion</span>
          <p className="text-xl font-black text-primary-600 dark:text-primary-400">{completionPercentage}%</p>
        </div>
        <div className="rounded-lg bg-slate-100/50 dark:bg-slate-800/30 p-3 space-y-0.5 text-center">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Story Points Done</span>
          <p className="text-xl font-black text-slate-800 dark:text-slate-200">
            {completedStoryPoints} <span className="text-xs text-slate-400 font-normal">/ {totalStoryPoints}</span>
          </p>
        </div>
        <div className="rounded-lg bg-slate-100/50 dark:bg-slate-800/30 p-3 space-y-0.5 text-center">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Days Remaining</span>
          <p className="text-xl font-black text-slate-850 dark:text-slate-150 flex items-center justify-center gap-1.5">
            <Hourglass className="h-4 w-4 text-slate-400" />
            {daysRemaining}
          </p>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="h-60 w-full">
        {totalStoryPoints === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No story points estimated for tasks in this sprint.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
              <XAxis
                dataKey="day"
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
                    {value === 'ideal' ? 'Ideal Burndown' : 'Actual Remaining'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SprintBurndownChart;

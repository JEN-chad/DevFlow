import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const STATUS_COLORS = {
  BACKLOG:     { color: '#94A3B8', label: 'Backlog' },
  TODO:        { color: '#3B82F6', label: 'To Do' },
  IN_PROGRESS: { color: '#F59E0B', label: 'In Progress' },
  REVIEW:      { color: '#8B5CF6', label: 'Review' },
  DONE:        { color: '#10B981', label: 'Done' },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs">
        <p className="font-bold text-slate-900 dark:text-white">{entry.name}</p>
        <p className="font-semibold mt-0.5" style={{ color: entry.payload.fill }}>
          {entry.value} tasks · {((entry.value / entry.payload.total) * 100).toFixed(0)}%
        </p>
      </div>
    );
  }
  return null;
};

const TaskDistributionChart = ({ data = [] }) => {
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

  const chartData = data.map(item => ({
    name: STATUS_COLORS[item._id]?.label || item._id,
    value: item.count || 0,
    fill: STATUS_COLORS[item._id]?.color || '#94A3B8',
    total,
  }));

  if (!chartData || chartData.length === 0 || total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No task data available.
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(value) => (
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ marginTop: '-16px' }}>
          <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{total}</p>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">Total</p>
        </div>
      </div>
    </div>
  );
};

export default TaskDistributionChart;

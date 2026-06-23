import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sprintService } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  ChevronLeft,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import SprintBurndownChart from '../components/analytics/SprintBurndownChart';

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1'];
const PRIORITY_COLORS = {
  LOW: '#64748B',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7F1D1D',
};

export const SprintDashboard = () => {
  const { id } = useParams();

  // Fetch Sprint details and tasks
  const {
    data: sprintData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['sprint', id],
    queryFn: () => sprintService.getSprint(id),
  });

  const sprint = sprintData?.sprint;
  const stats = sprintData?.stats;
  const tasks = sprintData?.tasks || [];

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold">Loading sprint analytics dashboard...</p>
      </div>
    );
  }

  if (isError || !sprint) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-base font-semibold text-red-900">Sprint dashboard unavailable</h3>
        <p className="mt-1 text-sm text-red-500">{error?.response?.data?.message || 'Failed to fetch analytics data.'}</p>
        <Link
          to="/dashboard/sprints"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-350 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Sprints
        </Link>
      </div>
    );
  }

  // 1. Process Task Status Distribution (Pie Chart)
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  // 2. Process Effort Hours comparison (Bar Chart)
  // We compare estimated hours vs completed hours for each task
  const effortData = tasks.map((t, idx) => ({
    name: t.title.length > 15 ? `${t.title.substring(0, 15)}...` : t.title,
    estimated: t.estimatedHours || 0,
    completed: t.completedHours || 0,
  }));

  // 3. Process Priority Breakdown (Bar Chart)
  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityData = Object.keys(priorityCounts).map((key) => ({
    priority: key,
    tasks: priorityCounts[key],
    fill: PRIORITY_COLORS[key] || '#6366F1',
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <Link
          to={`/dashboard/sprints/${sprint._id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-505 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to sprint backlog board
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {sprint.name} — Metrics Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize completion rates, burndown efforts, and priority bottlenecks.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4.5 py-2.5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-500" />
            <span>
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Progress KPI */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Sprint Progress</span>
            <span className="text-2xl font-extrabold tracking-tight mt-0.5 block">{stats?.progressPercentage || 0}%</span>
          </div>
        </div>

        {/* Burned Hours KPI */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Burned Effort</span>
            <span className="text-2xl font-extrabold tracking-tight mt-0.5 block">
              {stats?.totalCompletedHours || 0} / {stats?.totalEstimatedHours || 0} hrs
            </span>
          </div>
        </div>

        {/* Completion Rate KPI */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-405 flex items-center justify-center shrink-0">
            <Clock className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Done Tasks</span>
            <span className="text-2xl font-extrabold tracking-tight mt-0.5 block">
              {stats?.completedTasks || 0} / {stats?.totalTasks || 0}
            </span>
          </div>
        </div>

        {/* Velocity KPI */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Zap className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Sprint Velocity</span>
            <span className="text-2xl font-extrabold tracking-tight mt-0.5 block">
              {sprint.status === 'COMPLETED' ? `${sprint.velocity} hrs` : 'Calculating...'}
            </span>
          </div>
        </div>
      </div>

      {/* Sprint Burndown Widget */}
      <SprintBurndownChart sprintId={id} />

      {/* Analytics Visualizations */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-550">
          No metrics available. Map tasks to this sprint to display analytics charts.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart: Status Distribution */}
          <div className="lg:col-span-1 glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5.5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task Status Breakdown</h3>
            <div className="h-64 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3.5 justify-center text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase">
              {statusData.map((d, index) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Effort Burn comparison Chart */}
          <div className="lg:col-span-2 glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5.5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task Estimate vs Completion (Hours)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={effortData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="estimated" name="Estimated Hrs" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed Hrs" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Priority Distribution */}
          <div className="lg:col-span-3 glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5.5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task Priority Bottlenecks</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="priority" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="tasks" name="Number of Tasks" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintDashboard;

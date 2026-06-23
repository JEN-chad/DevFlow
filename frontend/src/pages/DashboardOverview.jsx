import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Code, GitPullRequest, CheckSquare, TrendingUp, FolderKanban,
  Users, Activity as ActivityIcon, Zap, Clock, CheckCircle,
  ChevronDown, Info, ArrowUpRight, ArrowDownRight, Minus,
  AlertTriangle, GitCommit, Calendar, Flame
} from 'lucide-react';
import { projectService } from '../services/api';
import { analyticsService } from '../services/analyticsService';
import TaskDistributionChart from '../components/analytics/TaskDistributionChart';
import TeamProductivityChart from '../components/analytics/TeamProductivityChart';
import CommitActivityChart from '../components/analytics/CommitActivityChart';
import PullRequestTrendChart from '../components/analytics/PullRequestTrendChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StatCardSkeleton, ChartSkeleton } from '../components/ui/SkeletonCard';

/* ─────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────── */

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ─────────────────────────────────────────
   KPI STAT CARD
   ───────────────────────────────────────── */

const StatCard = ({ name, value, icon: Icon, color, delta, deltaLabel, sub }) => {
  const isPositive = delta > 0;
  const isNeutral = delta === 0 || delta == null;

  return (
    <div className="stat-card group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {delta != null && (
          <div className={`flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 ${
            isNeutral
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              : isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
          }`}>
            {isNeutral ? <Minus className="h-3 w-3" /> : isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-1">
        <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
      </div>

      {/* Label + sub */}
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{name}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
};

/* ─────────────────────────────────────────
   WORKSPACE HEALTH CARD
   ───────────────────────────────────────── */

const WorkspaceHealthCard = ({ analytics }) => {
  const { overview = {} } = analytics || {};
  const completionRate = overview.sprintCompletionRate ?? 0;

  const health = completionRate >= 80 ? 'healthy' : completionRate >= 50 ? 'at-risk' : 'delayed';
  const healthConfig = {
    healthy:  { label: 'Healthy',  bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'health-healthy' },
    'at-risk': { label: 'At Risk', bg: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',   badge: 'health-at-risk' },
    delayed:  { label: 'Delayed',  bg: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',       badge: 'health-delayed' },
  }[health];

  const metrics = [
    { label: 'Sprint Completion', value: `${completionRate}%`, bar: completionRate, barColor: 'bg-blue-500' },
    { label: 'Weekly Throughput', value: `${overview.weeklyThroughput ?? 0} tasks`, bar: Math.min((overview.weeklyThroughput ?? 0) * 5, 100), barColor: 'bg-violet-500' },
    { label: 'Lead Time',         value: `${overview.leadTimeHours ?? 0}h`,         bar: null, barColor: '' },
    { label: 'Cycle Time',        value: `${overview.cycleTimeHours ?? 0}h`,        bar: null, barColor: '' },
  ];

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Health</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sprint delivery status overview</p>
        </div>
        <span className={healthConfig.badge}>
          <span className={`h-1.5 w-1.5 rounded-full bg-current opacity-80`} />
          {healthConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{m.label}</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{m.value}</span>
            </div>
            {m.bar != null && (
              <div className="progress-track">
                <div
                  className={`progress-fill ${m.barColor}`}
                  style={{ width: `${m.bar}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   LEADERBOARD ROW
   ───────────────────────────────────────── */

const LeaderboardRow = ({ dev, rank }) => {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
          {medals[rank] || <span className="text-slate-300">{rank}</span>}
        </span>
        {dev.avatar ? (
          <img src={dev.avatar} alt={dev.username} className="h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shrink-0" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[10px] font-bold">
            {dev.username.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{dev.username}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {dev.completedTasks}t · {dev.storyPointsDelivered}SP · {dev.commitsContributed}↑
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 text-[11px] font-black tabular-nums">
        {dev.score}
      </span>
    </div>
  );
};

/* ═════════════════════════════════════════
   DASHBOARD OVERVIEW
   ═════════════════════════════════════════ */

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await projectService.getProjects();
        setProjects(list);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getDashboardAnalytics(selectedProjectId);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to fetch analytics metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedProjectId]);

  const selectedProjectName = selectedProjectId
    ? projects.find(p => String(p._id) === String(selectedProjectId))?.name || 'Selected Project'
    : 'All Projects';

  const {
    overview = {},
    taskDistribution = [],
    teamProductivity = [],
    commitActivity = [],
    pullRequestTrends = [],
    sprintVelocity = []
  } = analytics || {};

  const primaryCards = [
    { name: 'Active Projects',  value: overview.activeProjects ?? 0,  icon: FolderKanban,  color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',    delta: null },
    { name: 'Active Sprints',   value: overview.activeSprints ?? 0,   icon: Calendar,      color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400', delta: null },
    { name: 'Open Tasks',       value: overview.openTasks ?? 0,       icon: CheckSquare,   color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',  delta: null },
    { name: 'Completed Tasks',  value: overview.completedTasks ?? 0,  icon: CheckCircle,   color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', delta: null },
    { name: 'Sprint Velocity',  value: `${overview.sprintCompletionRate ?? 0}%`, icon: TrendingUp, color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400', delta: null },
    { name: 'Weekly Throughput', value: `${overview.weeklyThroughput ?? 0}`, icon: Zap, color: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400', delta: null, sub: 'tasks done this week' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {getGreeting()}, <span className="gradient-text-primary">{user?.username}</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time delivery KPIs, GitHub telemetry, and sprint metrics.
          </p>
        </div>

        {/* Project Selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center justify-between gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md focus:outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-blue-500 shrink-0" />
              {selectedProjectName}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {selectorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSelectorOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl z-20 overflow-hidden animate-slideDown"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="p-1">
                  <button onClick={() => { setSelectedProjectId(''); setSelectorOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors font-semibold ${!selectedProjectId ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    All Projects
                  </button>
                  {projects.map(proj => (
                    <button key={proj._id}
                      onClick={() => { setSelectedProjectId(proj._id); setSelectorOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors font-semibold ${selectedProjectId === proj._id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {proj.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Onboarding Banner ─── */}
      {projects.length === 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/10 p-5 flex gap-4">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">Welcome to DevFlow Analytics!</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
              Connect a GitHub repository and create sprints/tasks within a project to begin collecting real productivity, commit, and PR metrics.
            </p>
          </div>
        </div>
      )}

      {/* ─── Primary KPI Grid ─── */}
      {loading && !analytics ? (
        <StatCardSkeleton count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {primaryCards.map((card, idx) => (
            <div key={card.name} className="animate-slideUp" style={{ animationDelay: `${idx * 50}ms` }}>
              <StatCard {...card} />
            </div>
          ))}
        </div>
      )}

      {/* ─── Workspace Health + Leaderboard ─── */}
      {!loading && analytics && (
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkspaceHealthCard analytics={analytics} />

          {/* Leaderboard */}
          <div className="chart-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Leaderboard</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rankings by delivery & contribution</p>
              </div>
              <Flame className="h-4.5 w-4.5 text-orange-500" />
            </div>
            {teamProductivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No developer activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamProductivity.slice(0, 5).map((dev, idx) => (
                  <LeaderboardRow key={dev.username} dev={dev} rank={idx + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Charts Row 1 ─── */}
      {loading && !analytics ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartSkeleton />
          <div className="lg:col-span-2"><ChartSkeleton /></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="chart-card flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Proportion by current board state</p>
            </div>
            <TaskDistributionChart data={taskDistribution} />
          </div>
          <div className="chart-card lg:col-span-2 flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Productivity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Completed tasks and story points delivered</p>
            </div>
            <TeamProductivityChart data={teamProductivity} />
          </div>
        </div>
      )}

      {/* ─── Charts Row 2 ─── */}
      {!loading && analytics && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="chart-card">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Commit Activity</h3>
            <p className="text-xs text-slate-400 mb-4">Push volume over the past 7 days</p>
            <CommitActivityChart data={commitActivity} />
          </div>
          <div className="chart-card">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Pull Request Trends</h3>
            <p className="text-xs text-slate-400 mb-4">Opened vs merged pull requests</p>
            <PullRequestTrendChart data={pullRequestTrends} />
          </div>
        </div>
      )}

      {/* ─── Sprint Velocity ─── */}
      {!loading && analytics && (
        <div className="chart-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sprint Velocity Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Planned vs completed story points for past 5 sprints</p>
          </div>
          <div className="h-64 w-full">
            {sprintVelocity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No past sprints to track velocity yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sprintVelocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="sprintName" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs">
                            <p className="font-bold text-slate-900 dark:text-white mb-1">{d.sprintName}</p>
                            <p className="text-blue-500">Planned: {d.plannedPoints} pts</p>
                            <p className="text-emerald-500">Completed: {d.completedPoints} pts</p>
                            <p className="text-violet-500 font-bold mt-1">Velocity: {d.velocityPct}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8}
                    formatter={(value) => (
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {value === 'plannedPoints' ? 'Planned' : 'Completed'}
                      </span>
                    )}
                  />
                  <Bar dataKey="plannedPoints" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedPoints" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;

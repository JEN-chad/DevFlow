import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Code,
  GitPullRequest,
  CheckSquare,
  TrendingUp,
  FolderKanban,
  Users,
  Activity as ActivityIcon,
  Zap,
  Clock,
  CheckCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import { projectService } from '../services/api';
import { analyticsService } from '../services/analyticsService';
import TaskDistributionChart from '../components/analytics/TaskDistributionChart';
import TeamProductivityChart from '../components/analytics/TeamProductivityChart';
import CommitActivityChart from '../components/analytics/CommitActivityChart';
import PullRequestTrendChart from '../components/analytics/PullRequestTrendChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // 1. Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await projectService.getProjects();
        setProjects(list);
      } catch (err) {
        console.error('Failed to load projects list:', err);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch analytics when project selection changes
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

  if (loading && !analytics) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const {
    overview = {},
    taskDistribution = [],
    teamProductivity = [],
    commitActivity = [],
    pullRequestTrends = [],
    sprintVelocity = []
  } = analytics || {};

  const cards = [
    {
      name: 'Active Projects',
      value: overview.activeProjects ?? 0,
      icon: FolderKanban,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      name: 'Active Sprints',
      value: overview.activeSprints ?? 0,
      icon: GitPullRequest,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    },
    {
      name: 'Open Tasks',
      value: overview.openTasks ?? 0,
      icon: CheckSquare,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      name: 'Completed Tasks',
      value: overview.completedTasks ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics Insights</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time delivery KPIs, GitHub telemetry, and sprint metrics.
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center justify-between gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold shadow-sm focus:outline-none transition-colors"
          >
            <span>{selectedProjectName}</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
          {selectorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSelectorOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-lg z-20">
                <button
                  onClick={() => {
                    setSelectedProjectId('');
                    setSelectorOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors font-medium ${!selectedProjectId ? 'text-primary-500' : 'text-slate-700 dark:text-slate-350'}`}
                >
                  All Projects
                </button>
                {projects.map(proj => (
                  <button
                    key={proj._id}
                    onClick={() => {
                      setSelectedProjectId(proj._id);
                      setSelectorOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors font-medium ${selectedProjectId === proj._id ? 'text-primary-500' : 'text-slate-700 dark:text-slate-350'}`}
                  >
                    {proj.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Onboarding Alert for Fresh Accounts */}
      {projects.length === 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-xs text-blue-600 dark:text-blue-400">
          <Info className="h-5 w-5 shrink-0" />
          <div>
            <h4 className="font-bold">Welcome to DevFlow Analytics!</h4>
            <p className="mt-1 leading-relaxed">
              Connect a GitHub repository and create sprints/tasks within a project to begin collecting real productivity, commit, and PR metrics.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.name} className="glass-panel rounded-xl p-5 flex items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.name}</span>
              <p className="text-2xl font-black tracking-tight">{card.value}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Interview-Level Agile Delivery Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Clock className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Lead Time</span>
          </div>
          <p className="text-xl font-bold">{overview.leadTimeHours ?? 0} hrs</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Creation to completion</p>
        </div>
        <div className="glass-panel rounded-xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Zap className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Cycle Time</span>
          </div>
          <p className="text-xl font-bold">{overview.cycleTimeHours ?? 0} hrs</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Start to completion</p>
        </div>
        <div className="glass-panel rounded-xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Weekly Throughput</span>
          </div>
          <p className="text-xl font-bold">{overview.weeklyThroughput ?? 0} tasks</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Done in last 7 days</p>
        </div>
        <div className="glass-panel rounded-xl p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <CheckCircle className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Sprint Completion</span>
          </div>
          <p className="text-xl font-bold">{overview.sprintCompletionRate ?? 0}%</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Closed tasks vs sprint goals</p>
        </div>
      </div>

      {/* Grid of Main Telemetry Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Status Distribution */}
        <div className="glass-panel rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Task Distribution</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Proportion of tasks by current board state.</p>
          </div>
          <TaskDistributionChart data={taskDistribution} />
        </div>

        {/* Team Productivity */}
        <div className="glass-panel rounded-xl p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Team Productivity</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Completed tasks and total story points delivered.</p>
          </div>
          <TeamProductivityChart data={teamProductivity} />
        </div>
      </div>

      {/* Git Webhook Integrations Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Commit Activity */}
        <div className="glass-panel rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Commit Activity</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Chronological volume of pushes received over past 7 days.</p>
          <CommitActivityChart data={commitActivity} />
        </div>

        {/* Pull Request Trends */}
        <div className="glass-panel rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Pull Request Trends</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Telemetry of opened vs merged pull requests.</p>
          <PullRequestTrendChart data={pullRequestTrends} />
        </div>
      </div>

      {/* Agile Sprints Velocity Trend and Developer Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sprint Velocity Trend */}
        <div className="glass-panel rounded-xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Sprint Velocity Trend</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Planned story points vs completed points for the past 5 sprints.</p>
          </div>
          <div className="h-64 w-full">
            {sprintVelocity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-550 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                No past sprints found to track velocity.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sprintVelocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                  <XAxis dataKey="sprintName" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md dark:border-slate-800 dark:bg-slate-900 text-xs">
                            <p className="font-bold text-slate-850 dark:text-slate-200">{data.sprintName}</p>
                            <p className="mt-1 text-primary-500">Planned: {data.plannedPoints} pts</p>
                            <p className="text-emerald-500">Completed: {data.completedPoints} pts</p>
                            <p className="text-purple-500 font-semibold">Velocity: {data.velocityPct}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 capitalize">
                        {value === 'plannedPoints' ? 'Planned Story Points' : 'Completed Story Points'}
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

        {/* Developer Productivity Leaderboard */}
        <div className="glass-panel rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Rankings based on delivery and git actions.</p>
          </div>
          <div className="flex-1 space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {teamProductivity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center py-10">
                No developer activity recorded yet.
              </div>
            ) : (
              teamProductivity.map((dev, index) => (
                <div key={dev.username} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/40 dark:bg-slate-800/20 border border-slate-200/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{index + 1}</span>
                    {dev.avatar ? (
                      <img src={dev.avatar} alt={dev.username} className="h-7 w-7 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                        {dev.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{dev.username}</span>
                      <span className="text-[9px] text-slate-550 dark:text-slate-450">
                        {dev.completedTasks} Tasks • {dev.storyPointsDelivered} Pts • {dev.commitsContributed} Commits
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-primary-600/10 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 px-2 py-0.5 text-[10px] font-bold tracking-tight">
                    {dev.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

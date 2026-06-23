import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import {
  ChevronLeft,
  Star,
  GitFork,
  AlertCircle,
  Users,
  Clock,
  GitBranch,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  FileCode,
  Calendar,
  TrendingUp
} from 'lucide-react';

export const RepositoryDetailsPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch repository details
  const {
    data: repository,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useQuery({
    queryKey: ['repositoryDetails', id],
    queryFn: () => repositoryService.getRepositoryDetails(id),
  });

  // Fetch repository analytics data
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
  } = useQuery({
    queryKey: ['repositoryAnalytics', id],
    queryFn: () => repositoryService.getRepositoryAnalytics(id),
  });

  // Force sync mutation
  const syncRepoMutation = useMutation({
    mutationFn: () => repositoryService.syncRepository(id),
    onSuccess: (updatedRepo) => {
      queryClient.invalidateQueries({ queryKey: ['repositoryDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['repositoryAnalytics', id] });
      showToast(`Synchronized successfully!`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    },
  });

  const handleSync = () => {
    syncRepoMutation.mutate();
  };

  if (isDetailsLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading repository analytics workspace...</p>
      </div>
    );
  }

  if (isDetailsError || !repository) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Repository unavailable</h3>
        <p className="text-sm text-slate-500 mt-1">
          This repository connection may have been disconnected or you do not have permission to view it.
        </p>
        <Link
          to="/dashboard/repositories"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Connected Repositories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="space-y-2">
        <Link
          to="/dashboard/repositories"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-650 dark:hover:text-primary-400 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to repositories
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {repository.name}
              </h1>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-500 font-bold bg-primary-500/5 dark:bg-primary-500/10 hover:bg-primary-500/10 px-2.5 py-1 rounded-full transition-colors"
              >
                Open on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Owned by <span className="font-semibold text-slate-650 dark:text-slate-355">{repository.owner}</span> | Target Branch:{' '}
              <span className="font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                {repository.defaultBranch}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-2">
              <Clock className="h-3.5 w-3.5" /> Synced:{' '}
              {new Date(repository.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Link
              to={`/dashboard/repositories/${id}/insights`}
              className="flex items-center gap-1.5 rounded-lg bg-primary-650 hover:bg-primary-700 text-white px-4.5 py-2.5 text-xs font-bold transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              View Insights
            </Link>
            <button
              onClick={handleSync}
              disabled={syncRepoMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 px-4.5 py-2.5 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncRepoMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Repo
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stars */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Stars</span>
            <span className="text-xl font-extrabold tracking-tight">
              {repository.starsCount ?? 0}
            </span>
          </div>
        </div>

        {/* Forks */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-550 flex items-center justify-center shrink-0">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Forks</span>
            <span className="text-xl font-extrabold tracking-tight">
              {repository.forksCount ?? 0}
            </span>
          </div>
        </div>

        {/* Open Issues */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Open Issues</span>
            <span className="text-xl font-extrabold tracking-tight">
              {repository.openIssuesCount ?? 0}
            </span>
          </div>
        </div>

        {/* Contributors */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Contributors</span>
            <span className="text-xl font-extrabold tracking-tight">
              {repository.contributorsCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics & Latest Commit Area (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Commit Details */}
          {repository.latestCommit?.sha ? (
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                <GitBranch className="h-5 w-5 text-primary-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Latest Commit Activity</h3>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <div className="space-y-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    "{repository.latestCommit.message}"
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {repository.latestCommit.authorAvatar ? (
                      <img
                        src={repository.latestCommit.authorAvatar}
                        alt="author"
                        className="h-6 w-6 rounded-full border border-slate-350 dark:border-slate-750"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold">
                        {repository.latestCommit.authorName?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      {repository.latestCommit.authorName}
                    </span>
                    <span className="text-slate-400">committed on</span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(repository.latestCommit.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs bg-slate-200 dark:bg-slate-850 text-slate-550 dark:text-slate-350 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-750/50">
                    {repository.latestCommit.sha.substring(0, 7)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
              No commit information found. Force sync to load metadata.
            </div>
          )}

          {/* Graphical Analytics charts */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="h-4.5 w-4.5 text-primary-500" />
                Repository Activity Analytics
              </h3>
            </div>

            {isAnalyticsLoading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading charts...
              </div>
            ) : !analytics || analytics.contributions.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-450">
                Insufficient analytics history. Try syncing or checking commit logs.
              </div>
            ) : (
              <div className="space-y-8">
                {/* Commit Trend Area Chart */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Commit Activity (Past 7 Days)
                  </span>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.commitTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="commits"
                          stroke="#2563EB"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCommits)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Contributor contributions Bar Chart */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Contributions by Contributor
                  </span>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.contributions} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="commits" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contributors List Panel (Right 1/3) */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Users className="h-4.5 w-4.5 text-primary-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Top Contributors</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {repository.contributors && repository.contributors.length > 0 ? (
              repository.contributors.map((contrib, index) => (
                <div
                  key={contrib.username}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    {contrib.avatar ? (
                      <img
                        src={contrib.avatar}
                        alt={contrib.username}
                        className="h-8.5 w-8.5 rounded-full border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="h-8.5 w-8.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                        {contrib.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-none">
                        {contrib.username}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-none">
                        Top Contributor #{index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-750">
                      {contrib.contributions} commits
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No contributor list loaded yet. Force sync repository to update details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetailsPage;

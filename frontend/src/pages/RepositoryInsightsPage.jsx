import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '../services/api';
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Users,
  ChevronLeft,
  Calendar,
  ExternalLink,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle,
  FileCode,
  GitBranch,
  TrendingUp,
  Inbox
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const RepositoryInsightsPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('commits');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Queries
  const { data: repository, isLoading: isRepoLoading } = useQuery({
    queryKey: ['repositoryDetails', id],
    queryFn: () => repositoryService.getRepositoryDetails(id),
  });

  const { data: commits, isLoading: isCommitsLoading } = useQuery({
    queryKey: ['repositoryCommits', id],
    queryFn: () => repositoryService.getRepositoryCommits(id, 1, 50),
    enabled: !!id,
  });

  const { data: pullRequests, isLoading: isPrsLoading } = useQuery({
    queryKey: ['repositoryPulls', id],
    queryFn: () => repositoryService.getRepositoryPulls(id, 'all', 1, 50),
    enabled: !!id,
  });

  const { data: issues, isLoading: isIssuesLoading } = useQuery({
    queryKey: ['repositoryIssues', id],
    queryFn: () => repositoryService.getRepositoryIssues(id, 'all', 1, 50),
    enabled: !!id,
  });

  const { data: contributors, isLoading: isContributorsLoading } = useQuery({
    queryKey: ['repositoryContributors', id],
    queryFn: () => repositoryService.getRepositoryContributors(id),
    enabled: !!id,
  });

  const syncRepoMutation = useMutation({
    mutationFn: () => repositoryService.syncRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositoryDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['repositoryCommits', id] });
      queryClient.invalidateQueries({ queryKey: ['repositoryPulls', id] });
      queryClient.invalidateQueries({ queryKey: ['repositoryIssues', id] });
      queryClient.invalidateQueries({ queryKey: ['repositoryContributors', id] });
      showToast('Repository data synced with GitHub!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Sync failed', 'error');
    },
  });

  const handleSync = () => {
    syncRepoMutation.mutate();
  };

  if (isRepoLoading || isCommitsLoading || isPrsLoading || isIssuesLoading || isContributorsLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary-650 animate-spin" />
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Fetching live GitHub repository insights...</p>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Repository not found</h3>
        <Link
          to="/dashboard/repositories"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Repositories
        </Link>
      </div>
    );
  }

  // Calculate quick stats
  const totalCommitsCount = commits?.length || 0;
  const openPRs = pullRequests?.filter(pr => pr.state === 'open') || [];
  const mergedPRs = pullRequests?.filter(pr => pr.mergedAt) || [];
  const closedPRs = pullRequests?.filter(pr => pr.state === 'closed' && !pr.mergedAt) || [];
  const openIssues = issues?.filter(issue => issue.state === 'open') || [];
  const closedIssues = issues?.filter(issue => issue.state === 'closed') || [];

  // Recharts Chart Data Prep
  const contributorChartData = (contributors || []).slice(0, 10).map(c => ({
    name: c.username,
    commits: c.contributions
  }));

  const prStatusData = [
    { name: 'Open PRs', value: openPRs.length, color: '#3B82F6' },
    { name: 'Merged PRs', value: mergedPRs.length, color: '#10B981' },
    { name: 'Closed PRs', value: closedPRs.length, color: '#EF4444' }
  ].filter(d => d.value > 0);

  const issueStatusData = [
    { name: 'Open Issues', value: openIssues.length, color: '#F59E0B' },
    { name: 'Closed Issues', value: closedIssues.length, color: '#10B981' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 relative animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link
            to={`/dashboard/repositories/${id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-650 dark:hover:text-primary-400 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to details
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {repository.name} Insights
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950/40 text-primary-650 dark:text-primary-400 border border-primary-200/50 dark:border-primary-900/40">
                GitHub Activity Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analyzing repository <span className="font-semibold">{repository.owner}/{repository.name}</span> default branch <span className="font-semibold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{repository.defaultBranch}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Synced:{' '}
              {new Date(repository.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={handleSync}
              disabled={syncRepoMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-250 px-4.5 py-2 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${syncRepoMutation.isPending ? 'animate-spin' : ''}`} />
              Fetch Live Data
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <GitCommit className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Loaded Commits</span>
            <span className="text-xl font-extrabold tracking-tight">{totalCommitsCount}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <GitPullRequest className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Open Pull Requests</span>
            <span className="text-xl font-extrabold tracking-tight">{openPRs.length}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Open Issues</span>
            <span className="text-xl font-extrabold tracking-tight">{openIssues.length}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Contributors</span>
            <span className="text-xl font-extrabold tracking-tight">{contributors?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contributor contributions */}
        <div className="lg:col-span-2 glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary-500" />
            Top Contributor Activity
          </h3>
          <div className="h-64 w-full">
            {contributorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributorChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
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
                  <Bar dataKey="commits" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No contributor activity metrics available.
              </div>
            )}
          </div>
        </div>

        {/* PR & Issue breakdown */}
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <FileCode className="h-4.5 w-4.5 text-primary-500" />
            Pull Request States
          </h3>
          <div className="h-44 w-full flex items-center justify-center">
            {prStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {prStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No PR distribution data.</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold mt-2">
            {prStatusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-slate-600 dark:text-slate-350">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs and Tab Content */}
      <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('commits')}
            className={`flex items-center gap-2 px-6 py-4.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'commits'
                ? 'border-primary-500 text-primary-650 dark:text-primary-400 bg-white dark:bg-slate-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GitCommit className="h-4 w-4" />
            Commits ({totalCommitsCount})
          </button>
          <button
            onClick={() => setActiveTab('prs')}
            className={`flex items-center gap-2 px-6 py-4.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'prs'
                ? 'border-primary-500 text-primary-650 dark:text-primary-400 bg-white dark:bg-slate-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GitPullRequest className="h-4 w-4" />
            Pull Requests ({pullRequests?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-2 px-6 py-4.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'issues'
                ? 'border-primary-500 text-primary-650 dark:text-primary-400 bg-white dark:bg-slate-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Issues ({issues?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('contributors')}
            className={`flex items-center gap-2 px-6 py-4.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'contributors'
                ? 'border-primary-500 text-primary-650 dark:text-primary-400 bg-white dark:bg-slate-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Contributors ({contributors?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* Commits Tab */}
          {activeTab === 'commits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Recent Git Commits</h4>
                <span className="text-xs text-slate-400">Showing last 50 commits</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {commits && commits.length > 0 ? (
                  commits.map((commit) => (
                    <div key={commit.sha} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-750">
                          <GitBranch className="h-4.5 w-4.5 text-primary-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            {commit.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {commit.authorAvatar && (
                              <img src={commit.authorAvatar} alt="avatar" className="h-4 w-4 rounded-full" />
                            )}
                            <span className="font-semibold text-slate-750 dark:text-slate-300">{commit.authorName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {commit.date ? new Date(commit.date).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                          {commit.sha.substring(0, 7)}
                        </span>
                        <a
                          href={commit.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-12 text-slate-500 text-sm">
                    <Inbox className="h-10 w-10 text-slate-350 mb-3" />
                    No recent commits found for this branch.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pull Requests Tab */}
          {activeTab === 'prs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Recent Pull Requests</h4>
                <div className="flex gap-2.5 text-xs text-slate-550 font-semibold">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">{openPRs.length} Open</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-605">{mergedPRs.length} Merged</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {pullRequests && pullRequests.length > 0 ? (
                  pullRequests.map((pr) => (
                    <div key={pr.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                          pr.mergedAt
                            ? 'bg-emerald-500/10 text-emerald-555 border-emerald-250/20'
                            : pr.state === 'closed'
                            ? 'bg-red-500/10 text-red-500 border-red-200/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-200/20'
                        }`}>
                          <GitPullRequest className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            <span className="text-slate-450 mr-1.5">#{pr.number}</span>
                            {pr.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {pr.user.avatar && (
                              <img src={pr.user.avatar} alt="avatar" className="h-4 w-4 rounded-full" />
                            )}
                            <span className="font-semibold text-slate-750 dark:text-slate-300">{pr.user.username}</span>
                            <span>•</span>
                            <span>Created {new Date(pr.createdAt).toLocaleDateString()}</span>
                            {pr.mergedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-500 font-bold">Merged {new Date(pr.mergedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          pr.mergedAt
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/40'
                            : pr.state === 'closed'
                            ? 'bg-red-500/10 text-red-650 border border-red-200/40'
                            : 'bg-blue-500/10 text-blue-600 border border-blue-200/40'
                        }`}>
                          {pr.mergedAt ? 'MERGED' : pr.state.toUpperCase()}
                        </span>
                        <a
                          href={pr.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-12 text-slate-500 text-sm">
                    <Inbox className="h-10 w-10 text-slate-350 mb-3" />
                    No pull requests found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Open & Closed Issues</h4>
                <span className="text-xs text-amber-500 font-semibold">{openIssues.length} Open Issues</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {issues && issues.length > 0 ? (
                  issues.map((issue) => (
                    <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                          issue.state === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-555 border-emerald-250/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-250/20'
                        }`}>
                          <AlertCircle className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                            <span className="text-slate-450 mr-1.5">#{issue.number}</span>
                            {issue.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {issue.user.avatar && (
                              <img src={issue.user.avatar} alt="avatar" className="h-4 w-4 rounded-full" />
                            )}
                            <span className="font-semibold text-slate-750 dark:text-slate-300">{issue.user.username}</span>
                            <span>•</span>
                            <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
                            {issue.labels && issue.labels.map(lbl => (
                              <span
                                key={lbl.name}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{ backgroundColor: `#${lbl.color}25`, color: `#${lbl.color}` }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          issue.state === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/40'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-200/40'
                        }`}>
                          {issue.state.toUpperCase()}
                        </span>
                        <a
                          href={issue.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-12 text-slate-500 text-sm">
                    <Inbox className="h-10 w-10 text-slate-350 mb-3" />
                    No issues found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contributors Tab */}
          {activeTab === 'contributors' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Repository Contributors</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contributors && contributors.length > 0 ? (
                  contributors.map((contrib, idx) => (
                    <div
                      key={contrib.username}
                      className="flex items-center justify-between p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20"
                    >
                      <div className="flex items-center gap-3">
                        {contrib.avatar ? (
                          <img
                            src={contrib.avatar}
                            alt={contrib.username}
                            className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                            {contrib.username.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-none">
                            {contrib.username}
                          </p>
                          <p className="text-[10px] text-slate-450 mt-1.5 leading-none">
                            Contributor rank #{idx + 1}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center text-xs font-bold bg-primary-100 dark:bg-primary-950/40 text-primary-650 dark:text-primary-400 px-2.5 py-1 rounded-full border border-primary-200/50 dark:border-primary-900/40">
                          {contrib.contributions} commits
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-xs text-slate-500">
                    No contributor statistics loaded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryInsightsPage;

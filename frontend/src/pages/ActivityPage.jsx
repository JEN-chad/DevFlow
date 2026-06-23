import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { activityService, projectService } from '../services/api';
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  MessageSquare,
  Tag,
  Play,
  CheckCircle2,
  Activity,
  Calendar,
  ExternalLink,
  Clock,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  FolderKanban
} from 'lucide-react';

const GithubIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Helper to format timestamps human-readably
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Component to render event icons with corresponding HSL colors
const ActivityIcon = ({ action, source }) => {
  if (source === 'github') {
    const act = action.toLowerCase();
    if (act.includes('push')) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <GitCommit className="h-5 w-5" />
        </div>
      );
    }
    if (act.includes('pr') || act.includes('pull request')) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <GitPullRequest className="h-5 w-5" />
        </div>
      );
    }
    if (act.includes('comment')) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
          <MessageSquare className="h-5 w-5" />
        </div>
      );
    }
    if (act.includes('release')) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
          <Tag className="h-5 w-5" />
        </div>
      );
    }
    if (act.includes('issue')) {
      return (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <AlertCircle className="h-5 w-5" />
        </div>
      );
    }
  }

  // Fallback / Task & Sprint actions
  const act = action.toLowerCase();
  if (act.includes('start') || act.includes('created sprint')) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Play className="h-5 w-5" />
      </div>
    );
  }
  if (act.includes('completed') || act.includes('done') || act.includes('status to "done"')) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
      <Activity className="h-5 w-5" />
    </div>
  );
};

export const ActivityPage = () => {
  const { socket, isConnected } = useSocket();
  const [liveActivities, setLiveActivities] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch projects (for dropdown filtering and socket room joining)
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Fetch initial activity list
  const {
    data: initialActivities,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityService.getUserActivities(70),
  });

  // Initialize liveActivities state once queries are loaded
  useEffect(() => {
    if (initialActivities) {
      setLiveActivities(initialActivities);
    }
  }, [initialActivities]);

  // Connect sockets to catch new activities in real-time
  useEffect(() => {
    if (!socket || !isConnected || !projects) return;

    // Join all project rooms to listen to their activities
    projects.forEach((proj) => {
      socket.emit('join-project', proj._id);
    });

    const handleNewActivity = (activity) => {
      setLiveActivities((prev) => {
        // Prevent duplicate appending
        if (prev.some((a) => a._id === activity._id)) return prev;
        return [activity, ...prev];
      });
    };

    socket.on('activity-added', handleNewActivity);

    return () => {
      projects.forEach((proj) => {
        socket.emit('leave-project', proj._id);
      });
      socket.off('activity-added', handleNewActivity);
    };
  }, [socket, isConnected, projects]);

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter activities locally based on selections
  const filteredActivities = liveActivities.filter((act) => {
    // Project filter
    if (projectFilter !== 'all' && act.project?._id !== projectFilter) {
      return false;
    }

    // Type filter
    if (typeFilter === 'github') {
      return act.metadata?.source === 'github';
    }
    if (typeFilter === 'local') {
      return act.metadata?.source !== 'github';
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Activity Feed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chronological history of sprint updates, task movements, and live GitHub webhook actions.
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 self-start bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1 text-xs font-semibold">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-600 dark:text-slate-350">
            {isConnected ? 'Live Sync Active' : 'Disconnected'}
          </span>
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-1" />}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <FolderKanban className="h-4 w-4 text-slate-400" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-200 w-full sm:w-44"
            >
              <option value="all">All Projects</option>
              {projects?.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-200 w-full sm:w-44"
            >
              <option value="all">All Event Types</option>
              <option value="github">GitHub Events</option>
              <option value="local">Tasks & Sprints</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline px-3 py-1.5"
        >
          Refresh Feed
        </button>
      </div>

      {/* Main Timeline Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="glass-panel border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl animate-pulse flex items-start gap-4"
            >
              <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-4.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
          <h3 className="text-base font-semibold text-red-900 dark:text-red-300">Failed to load activity log</h3>
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            {error.response?.data?.message || error.message || 'An error occurred while fetching user activities.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-350 dark:border-slate-800 p-16 text-center max-w-xl mx-auto bg-slate-100/50 dark:bg-slate-900/20">
          <Activity className="mx-auto h-14 w-14 text-slate-400 dark:text-slate-655 mb-4" />
          <h3 className="text-base font-bold">No matching activity found</h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your filters, or push a commit, start a sprint, or update a task to register new events.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4.5 pl-6.5 space-y-6">
          {filteredActivities.map((act) => {
            const hasMetadata =
              act.metadata &&
              (act.metadata.commits?.length > 0 ||
                act.metadata.prNumber ||
                act.metadata.issueNumber ||
                act.metadata.commentBody ||
                act.metadata.tag);

            const isExpanded = expandedItems[act._id];

            // Resolve User Display details (supporting both registered users and external GitHub profiles)
            let displayName = 'Unknown User';
            let displayAvatar = '';
            let isGithubSender = act.metadata?.source === 'github';

            if (act.user) {
              displayName = act.user.username;
              displayAvatar = act.user.avatar;
            } else if (act.metadata?.senderUsername) {
              displayName = act.metadata.senderUsername;
              displayAvatar = act.metadata.senderAvatar;
            }

            return (
              <div key={act._id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[30px] top-1 transition-transform group-hover:scale-105">
                  <ActivityIcon action={act.action} source={act.metadata?.source} />
                </div>

                {/* Card Container */}
                <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      {/* Sub-header info: User + Action + Project */}
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-bold text-slate-850 dark:text-slate-100">
                          {displayAvatar ? (
                            <img
                              src={displayAvatar}
                              alt={displayName}
                              className="h-5 w-5 rounded-full border border-slate-200 dark:border-slate-850"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-400">
                              {displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            {displayName}
                          </span>
                          {isGithubSender && !act.user && (
                            <span className="flex items-center" title="GitHub Contributor">
                              <GithubIcon className="h-3 w-3 text-slate-400 dark:text-slate-550 ml-0.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {act.action}
                        </span>
                        {act.project && (
                          <>
                            <span className="text-slate-350 dark:text-slate-655">•</span>
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-1.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                              {act.project.name}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Event Specific Subtitles */}
                      {act.metadata?.repoName && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                          <GithubIcon className="h-3 w-3" />
                          {act.metadata.repoOwner}/{act.metadata.repoName}
                          {act.metadata.branch && (
                            <span className="ml-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10px] font-bold px-1 rounded text-slate-600 dark:text-slate-455">
                              {act.metadata.branch}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-550 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimeAgo(act.createdAt)}</span>
                    </div>
                  </div>

                  {/* Metadata Expand Section */}
                  {hasMetadata && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-200/50 dark:border-slate-800/50">
                      <button
                        onClick={() => toggleExpand(act._id)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-xl p-3.5 text-sm space-y-2 animate-slideDown">
                          {/* Commits Details */}
                          {act.metadata.commitsCount && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Commits List ({act.metadata.commitsCount})
                              </p>
                              <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                {act.metadata.commits.map((commit, idx) => (
                                  <div key={commit.sha || idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4">
                                    <div className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-600 dark:text-slate-400 shrink-0">
                                      {commit.sha?.substring(0, 7)}
                                    </div>
                                    <div className="flex-1 text-slate-700 dark:text-slate-300 line-clamp-1">
                                      {commit.message}
                                    </div>
                                    <div className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">
                                      {commit.authorName}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pull Request Details */}
                          {act.metadata.prNumber && (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-slate-850 dark:text-slate-150">
                                  PR #{act.metadata.prNumber}: {act.metadata.prTitle}
                                </h4>
                                <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                                  Status: {act.metadata.merged ? 'Merged' : act.metadata.prAction}
                                </p>
                              </div>
                              {act.metadata.url && (
                                <a
                                  href={act.metadata.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  <span>GitHub</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Issue Details */}
                          {act.metadata.issueNumber && (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-slate-850 dark:text-slate-150">
                                  Issue #{act.metadata.issueNumber}: {act.metadata.issueTitle}
                                </h4>
                                <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                                  Action: {act.metadata.issueAction}
                                </p>
                              </div>
                              {act.metadata.url && (
                                <a
                                  href={act.metadata.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  <span>GitHub</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Issue Comment Details */}
                          {act.metadata.commentBody && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4 mb-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comment</span>
                                {act.metadata.url && (
                                  <a
                                    href={act.metadata.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                  >
                                    <span>GitHub</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <blockquote className="border-l-2 border-slate-350 dark:border-slate-800 pl-3 italic text-xs text-slate-600 dark:text-slate-400">
                                "{act.metadata.commentBody}"
                              </blockquote>
                            </div>
                          )}

                          {/* Release Details */}
                          {act.metadata.tag && (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-slate-850 dark:text-slate-150">
                                  Release: {act.metadata.releaseName}
                                </h4>
                                <p className="text-xs text-slate-450 dark:text-slate-550 mt-0.5">
                                  Tag: {act.metadata.tag}
                                </p>
                              </div>
                              {act.metadata.url && (
                                <a
                                  href={act.metadata.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  <span>View Release</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;

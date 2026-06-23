import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repositoryService, projectService } from '../services/api';
import {
  GitBranch,
  Link2,
  RefreshCw,
  Trash2,
  Star,
  GitFork,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Plus,
  Loader2,
  X,
  CheckCircle,
  FolderOpen
} from 'lucide-react';

export const RepositoriesPage = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [gitSearchQuery, setGitSearchQuery] = useState('');
  const [selectedGitRepo, setSelectedGitRepo] = useState(null);
  const [customBranch, setCustomBranch] = useState('main');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Queries
  const {
    data: connectedRepos,
    isLoading: isReposLoading,
    isError: isReposError,
  } = useQuery({
    queryKey: ['connectedRepositories'],
    queryFn: repositoryService.getConnectedRepositories,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const {
    data: gitHubRepos,
    isLoading: isGitHubLoading,
    refetch: refetchGitHubRepos,
  } = useQuery({
    queryKey: ['gitHubRepositories', gitSearchQuery],
    queryFn: () => {
      if (gitSearchQuery.trim() === '') {
        return repositoryService.getGitHubRepositories();
      } else {
        return repositoryService.searchGitHubRepositories(gitSearchQuery);
      }
    },
    enabled: isModalOpen, // Only fetch when modal is active
  });

  // Filter projects where current user is the owner
  const ownedProjects = projects?.filter(
    (p) => (p.owner?._id || p.owner) === currentUser?._id
  ) || [];

  // Mutations
  const connectRepoMutation = useMutation({
    mutationFn: ({ projectId, repoData }) =>
      repositoryService.connectRepository(projectId, repoData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedRepositories'] });
      showToast('Repository connected successfully!', 'success');
      handleCloseModal();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to connect repository', 'error');
    },
  });

  const syncRepoMutation = useMutation({
    mutationFn: (id) => repositoryService.syncRepository(id),
    onSuccess: (updatedRepo) => {
      queryClient.invalidateQueries({ queryKey: ['connectedRepositories'] });
      showToast(`Synchronized "${updatedRepo.name}" with GitHub!`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to sync repository', 'error');
    },
  });

  const disconnectRepoMutation = useMutation({
    mutationFn: (id) => repositoryService.disconnectRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedRepositories'] });
      showToast('Repository disconnected successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to disconnect repository', 'error');
    },
  });

  // Handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
    if (ownedProjects.length > 0) {
      setSelectedProjectId(ownedProjects[0]._id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGitRepo(null);
    setGitSearchQuery('');
    setCustomBranch('main');
  };

  const handleConnectSubmit = (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      showToast('Please select a project to map this repository to', 'error');
      return;
    }
    if (!selectedGitRepo) {
      showToast('Please select a GitHub repository', 'error');
      return;
    }

    connectRepoMutation.mutate({
      projectId: selectedProjectId,
      repoData: {
        githubRepoId: selectedGitRepo.githubRepoId,
        name: selectedGitRepo.name,
        owner: selectedGitRepo.owner,
        url: selectedGitRepo.url,
        defaultBranch: customBranch || selectedGitRepo.defaultBranch || 'main',
      },
    });
  };

  const handleSync = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    syncRepoMutation.mutate(id);
  };

  const handleDisconnect = (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to disconnect repository "${name}"? This removes commit, branch, and metadata association within DevFlow projects.`
      )
    ) {
      disconnectRepoMutation.mutate(id);
    }
  };

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
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Connected Repositories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Link and synchronize GitHub repositories for task mappings and code metrics.
          </p>
        </div>
        {ownedProjects.length > 0 ? (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/10 px-4.5 py-2.5 text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Link Repository
          </button>
        ) : (
          <button
            disabled
            title="Create a project to connect repositories"
            className="flex items-center gap-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 px-4.5 py-2.5 text-sm font-semibold cursor-not-allowed"
          >
            <Link2 className="h-4 w-4" />
            Link Repository
          </button>
        )}
      </div>

      {/* Repository Listing */}
      {isReposLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading connected workspaces...</p>
        </div>
      ) : isReposError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Failed to load connected repositories
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Check network status and refresh the dashboard.
          </p>
        </div>
      ) : !connectedRepos || connectedRepos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center glass-panel">
          <GitBranch className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4 animate-pulse" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No repositories linked
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select a project and connect your GitHub repositories to import tasks and analyze commits.
          </p>
          {ownedProjects.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-4.5 py-2.5 text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" /> Link Your First Repo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedRepos.map((repo) => {
            const isOwner =
              repo.projectId?.owner?.toString() === currentUser?._id.toString() ||
              repo.projectId?.owner?._id === currentUser?._id;

            return (
              <Link
                key={repo._id}
                to={`/dashboard/repositories/${repo._id}`}
                className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all flex flex-col justify-between group cursor-pointer hover:shadow-xl dark:hover:shadow-primary-500/5"
              >
                <div className="space-y-4">
                  {/* Title & External Link */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {repo.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        by {repo.owner}
                      </p>
                    </div>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="Open GitHub"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  {/* Project Tag */}
                  {repo.projectId && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-750/30 w-fit">
                      <FolderOpen className="h-3.5 w-3.5 text-primary-500" />
                      Project: <span className="font-semibold">{repo.projectId.name}</span>
                    </div>
                  )}

                  {/* GitHub Statistics */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    <div className="flex items-center gap-1" title="Stars">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>{repo.starsCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Forks">
                      <GitFork className="h-4 w-4 text-blue-500" />
                      <span>{repo.forksCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Open Issues">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>{repo.openIssuesCount ?? 0}</span>
                    </div>
                  </div>

                  {/* Latest Commit Snippet */}
                  {repo.latestCommit?.message && (
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-3.5 mt-2 text-xs space-y-2">
                      <span className="text-slate-400 font-bold block">LATEST COMMIT</span>
                      <p className="text-slate-600 dark:text-slate-300 italic truncate font-medium">
                        "{repo.latestCommit.message}"
                      </p>
                      <div className="flex items-center gap-2">
                        {repo.latestCommit.authorAvatar ? (
                          <img
                            src={repo.latestCommit.authorAvatar}
                            alt="Author"
                            className="h-5.5 w-5.5 rounded-full"
                          />
                        ) : (
                          <div className="h-5.5 w-5.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[9px]">
                            {repo.latestCommit.authorName?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-slate-500 font-semibold truncate">
                          {repo.latestCommit.authorName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Sync & Disconnect */}
                <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 pt-4 mt-5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      Synced {new Date(repo.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleSync(e, repo._id)}
                      disabled={syncRepoMutation.isPending}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Sync Stats"
                    >
                      <RefreshCw
                        className={`h-4.5 w-4.5 ${
                          syncRepoMutation.isPending &&
                          syncRepoMutation.variables === repo._id
                            ? 'animate-spin text-primary-500'
                            : ''
                        }`}
                      />
                    </button>

                    {isOwner && (
                      <button
                        onClick={(e) => handleDisconnect(e, repo._id, repo.name)}
                        disabled={disconnectRepoMutation.isPending}
                        className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-450 border border-red-500/10 transition-colors"
                        title="Disconnect Repo"
                      >
                        <Trash2
                          className={`h-4.5 w-4.5 ${
                            disconnectRepoMutation.isPending &&
                            disconnectRepoMutation.variables === repo._id
                              ? 'animate-pulse'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Link Repository Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5.5 border-b border-slate-250 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Link GitHub Repository
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Form Project Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Target Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>-- Select a Project --</option>
                  {ownedProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* GitHub Search & Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select GitHub Repository
                </label>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search your repos..."
                    value={gitSearchQuery}
                    onChange={(e) => setGitSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Selected Repo Card */}
                {selectedGitRepo ? (
                  <div className="p-3.5 rounded-lg border border-primary-500/40 bg-primary-500/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary-500 block uppercase">
                        Selected Repository
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedGitRepo.owner} / {selectedGitRepo.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedGitRepo(null)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-colors text-xs font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  /* GitHub Repos Dropdown List */
                  <div className="border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden max-h-52 overflow-y-auto bg-slate-100/50 dark:bg-slate-900/40">
                    {isGitHubLoading ? (
                      <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                        Fetching GitHub repos...
                      </div>
                    ) : !gitHubRepos || gitHubRepos.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No repositories found on your GitHub account.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-250/40 dark:divide-slate-800/40">
                        {gitHubRepos.map((repo) => (
                          <button
                            key={repo.githubRepoId}
                            type="button"
                            onClick={() => setSelectedGitRepo(repo)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">
                                {repo.name}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                owner: {repo.owner}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{' '}
                                {repo.stars}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Advanced branch setting */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Default Tracking Branch
                </label>
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  placeholder="e.g. main, master, dev"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5.5 border-t border-slate-250 dark:border-slate-850 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectSubmit}
                disabled={connectRepoMutation.isPending || !selectedGitRepo}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-600/10 disabled:opacity-50 transition-colors"
              >
                {connectRepoMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Connect Repository
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoriesPage;

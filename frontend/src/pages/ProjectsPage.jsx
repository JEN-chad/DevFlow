import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/api';
import {
  FolderKanban, Plus, Users, GitBranch, Archive, Trash2,
  X, AlertCircle, Loader2, LayoutGrid, List, CheckCircle,
  Clock, ArrowRight, Calendar, MoreHorizontal
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { ProjectCardSkeleton } from '../components/ui/SkeletonCard';
import { HealthBadge } from '../components/ui/Badge';
import { useToast, ToastContainer } from '../components/ui/Toast';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/* ─────────────────────────────────────────
   MEMBER AVATARS STACK
   ───────────────────────────────────────── */
const MemberAvatars = ({ members = [], max = 4 }) => {
  const shown = members.slice(0, max);
  const overflow = members.length - max;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div key={m._id || i} className="relative" style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}>
          {m.avatar ? (
            <img src={m.avatar} alt={m.username} title={m.username} className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[9px] font-bold">
              {(m.username || 'U').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-bold" style={{ marginLeft: -8 }}>
          +{overflow}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   PROJECT CARD (Grid view)
   ───────────────────────────────────────── */
const ProjectCard = ({ project, isOwner, onArchive, onDelete, onClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isArchived = project.status === 'ARCHIVED';
  const completionPct = project.totalTasks > 0
    ? Math.round((project.completedTasks / project.totalTasks) * 100)
    : 0;

  const health = !isArchived ? (completionPct >= 70 ? 'healthy' : completionPct >= 40 ? 'at-risk' : 'delayed') : null;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-5 cursor-pointer flex flex-col transition-all duration-200 ${
        isArchived
          ? 'opacity-60 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:border-blue-200 dark:hover:border-blue-900/50'
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isArchived ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
        } group-hover:scale-110 transition-transform shrink-0`}>
          <FolderKanban className="h-5 w-5" />
        </div>

        <div className="flex items-center gap-2">
          {health && <HealthBadge health={health} />}
          {!health && isArchived && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
              Archived
            </span>
          )}

          {isOwner && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-20 overflow-hidden animate-slideDown"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="p-1">
                      <button onClick={(e) => { onArchive(e, project._id); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium">
                        <Archive className="h-3.5 w-3.5 text-slate-400" />
                        {isArchived ? 'Restore Project' : 'Archive Project'}
                      </button>
                      <button onClick={(e) => { onDelete(e, project._id); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Project
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Name + Description */}
      <h3 className={`text-sm font-bold mb-1.5 transition-colors truncate ${
        isArchived ? 'text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
      }`}>
        {project.name}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex-1 mb-4">
        {project.description || 'No description provided.'}
      </p>

      {/* Progress bar */}
      {!isArchived && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400">Progress</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{completionPct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill bg-blue-500" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <MemberAvatars members={[...(project.members || [])]} />

        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs">
          <span className="flex items-center gap-1" title="Members">
            <Users className="h-3 w-3" />
            {(project.members?.length || 0) + 1}
          </span>
          <span className="flex items-center gap-1" title="Repositories">
            <GitBranch className="h-3 w-3" />
            {project.repositories?.length || 0}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   PROJECT TABLE ROW (Table view)
   ───────────────────────────────────────── */
const ProjectTableRow = ({ project, isOwner, onArchive, onDelete, onClick }) => {
  const isArchived = project.status === 'ARCHIVED';
  const health = !isArchived ? (project.completedTasks > project.totalTasks / 2 ? 'healthy' : 'at-risk') : null;

  return (
    <tr
      onClick={onClick}
      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{project.description || 'No description'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        {health ? <HealthBadge health={health} /> : (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
            Archived
          </span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {(project.members?.length || 0) + 1}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            {project.repositories?.length || 0}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDate(project.createdAt)}</td>
      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
        {isOwner && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => onArchive(e, project._id)} title={isArchived ? 'Restore' : 'Archive'}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => onDelete(e, project._id)} title="Delete"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

/* ═════════════════════════════════════════
   PROJECTS PAGE
   ═════════════════════════════════════════ */
export const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, removeToast, toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'archived'

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', description: '' },
  });
  const watchedName = watch('name', '');
  const watchedDesc = watch('description', '');

  const { data: projects, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!', { title: 'Success' });
      reset();
      setShowCreateModal(false);
      navigate(`/dashboard/projects/${newProject._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const archiveMutation = useMutation({
    mutationFn: projectService.archiveProject,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project ${updated.status === 'ARCHIVED' ? 'archived' : 'restored'}.`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const onSubmit = (data) => createMutation.mutate(data);

  const handleArchive = (e, projectId) => {
    e.stopPropagation(); e.preventDefault();
    if (confirm('Change the archived status of this project?')) archiveMutation.mutate(projectId);
  };

  const handleDelete = (e, projectId) => {
    e.stopPropagation(); e.preventDefault();
    if (confirm('WARNING: This permanently deletes all sprints, tasks, and repositories. Continue?')) deleteMutation.mutate(projectId);
  };

  const filtered = (projects || []).filter(p => {
    if (filterTab === 'active') return p.status !== 'ARCHIVED';
    if (filterTab === 'archived') return p.status === 'ARCHIVED';
    return true;
  });

  const FILTER_TABS = [
    { id: 'all', label: 'All', count: projects?.length },
    { id: 'active', label: 'Active', count: projects?.filter(p => p.status !== 'ARCHIVED').length },
    { id: 'archived', label: 'Archived', count: projects?.filter(p => p.status === 'ARCHIVED').length },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create workspaces, map repositories, and manage sprint collaborations.
          </p>
        </div>
        <button
          onClick={() => { reset(); setShowCreateModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Filter + View Toggle Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 w-fit">
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFilterTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  filterTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          {[
            { id: 'grid', icon: LayoutGrid },
            { id: 'table', icon: List },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === v.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              <v.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <ProjectCardSkeleton count={3} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Failed to load projects</h3>
          <p className="mt-1 text-sm text-red-500">{error.response?.data?.message || error.message}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-lg bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="projects"
          title={filterTab === 'archived' ? 'No archived projects' : 'No projects yet'}
          message={filterTab === 'archived' ? 'Archive a project to see it here.' : 'Create your first project workspace to connect GitHub repos and plan sprints.'}
          ctaLabel={filterTab === 'all' ? 'Create First Project' : undefined}
          onCta={filterTab === 'all' ? () => setShowCreateModal(true) : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project, idx) => (
            <div key={project._id} className="animate-slideUp" style={{ animationDelay: `${idx * 60}ms` }}>
              <ProjectCard
                project={project}
                isOwner={project.owner?._id === user?._id}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onClick={() => navigate(`/dashboard/projects/${project._id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fadeIn">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(project => (
                <ProjectTableRow
                  key={project._id}
                  project={project}
                  isOwner={project.owner?._id === user?._id}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scaleUp"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <FolderKanban className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">New Project</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-medium ${watchedName.length > 45 ? 'text-red-500' : 'text-slate-400'}`}>
                    {watchedName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Apollo Dashboard, DevFlow"
                  className={`input-base ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('name', {
                    required: 'Project name is required',
                    minLength: { value: 3, message: 'Minimum 3 characters' },
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
                  <span className={`text-[10px] font-medium ${watchedDesc.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {watchedDesc.length}/500
                  </span>
                </div>
                <textarea rows="4" placeholder="Summarize the project's goal, tech stack, or roadmap..."
                  className={`input-base resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                  {...register('description', { maxLength: { value: 500, message: 'Maximum 500 characters' } })}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || createMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all">
                  {(isSubmitting || createMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

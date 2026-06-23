import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/api';
import {
  FolderKanban,
  Plus,
  Users,
  GitBranch,
  Archive,
  Trash2,
  FolderOpen,
  X,
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';

export const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Query projects
  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Mutation: Create project
  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project created successfully!', 'success');
      reset();
      setShowCreateModal(false);
      // Navigate to details of new project
      navigate(`/dashboard/projects/${newProject._id}`);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to create project', 'error');
    },
  });

  // Mutation: Archive project
  const archiveMutation = useMutation({
    mutationFn: projectService.archiveProject,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast(`Project ${updated.status === 'ARCHIVED' ? 'archived' : 'activated'} successfully!`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    },
  });

  // Mutation: Delete project
  const deleteMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete project', 'error');
    },
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleArchive = (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to change the archived status of this project?')) {
      archiveMutation.mutate(projectId);
    }
  };

  const handleDelete = (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('WARNING: Deleting this project will permanently remove all associated sprints, tasks, and repository configurations. Are you sure you want to proceed?')) {
      deleteMutation.mutate(projectId);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create workspaces, map Git repositories, and manage sprint collaborations.
          </p>
        </div>
        <button
          onClick={() => {
            reset();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-primary-600/10 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-10 w-10 rounded-lg bg-slate-300 dark:bg-slate-800" />
                <div className="h-5 w-16 rounded-full bg-slate-300 dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-2/3 rounded bg-slate-300 dark:bg-slate-800" />
                <div className="h-4 w-5/6 rounded bg-slate-300 dark:bg-slate-800" />
              </div>
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-slate-800" />
                  <div className="h-4 w-16 rounded bg-slate-300 dark:bg-slate-800" />
                </div>
                <div className="h-4 w-12 rounded bg-slate-300 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4 animate-bounce" />
          <h3 className="text-base font-semibold text-red-900 dark:text-red-300">Failed to load projects</h3>
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            {error.response?.data?.message || error.message || 'An error occurred while fetching your projects.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold"
          >
            Retry Fetching
          </button>
        </div>
      ) : projects?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center max-w-xl mx-auto bg-slate-100/50 dark:bg-slate-900/20">
          <FolderKanban className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold">No workspaces connected</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Initialize your first project, sync repositories, and invite collaborators to get started.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-primary-600/10 transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Workspace Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isOwner = project.owner?._id === user?._id;
            return (
              <div
                key={project._id}
                onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                className={`glass-panel rounded-xl p-6 border transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 ${
                  project.status === 'ARCHIVED'
                    ? 'border-slate-300 dark:border-slate-900/60 opacity-70 bg-slate-200/25 dark:bg-slate-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/40 hover:shadow-lg dark:hover:shadow-primary-950/10'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 dark:bg-primary-500/5 text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                      <FolderKanban className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          project.status === 'ARCHIVED'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            : 'bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {project.status}
                      </span>

                      {/* Quick Actions (Owner only) */}
                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleArchive(e, project._id)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors"
                            title={project.status === 'ARCHIVED' ? 'Activate Project' : 'Archive Project'}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, project._id)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Footer details */}
                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.owner?.avatar ? (
                      <img
                        src={project.owner.avatar}
                        alt={project.owner.username}
                        className="h-6.5 w-6.5 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="h-6.5 w-6.5 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-[10px] font-bold">
                        {project.owner?.username?.substring(0, 2).toUpperCase() || 'P'}
                      </div>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      By {isOwner ? 'me' : project.owner?.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs">
                    <span className="flex items-center gap-1" title="Members count">
                      <Users className="h-3.5 w-3.5" />
                      {project.members?.length || 1}
                    </span>
                    <span className="flex items-center gap-1" title="Connected repositories">
                      <GitBranch className="h-3.5 w-3.5" />
                      {project.repositories?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                  <FolderKanban className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">Create New Workspace</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Dashboard, DevFlow"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('name', {
                    required: 'Project name is required',
                    minLength: { value: 3, message: 'Project name must be at least 3 characters' },
                    maxLength: { value: 50, message: 'Project name must be 50 characters or less' },
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="4"
                  placeholder="Summarize the project's goal, tech stack, or roadmap..."
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('description', {
                    maxLength: { value: 500, message: 'Description must be 500 characters or less' },
                  })}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.description.message}
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/15 disabled:opacity-50 transition-colors"
                >
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

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, sprintService } from '../services/api';
import {
  Calendar,
  Plus,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Zap,
  Target,
  ChevronRight
} from 'lucide-react';
import { SprintStatusBadge } from '../components/ui/Badge';
import { useToast, ToastContainer } from '../components/ui/Toast';

export const SprintsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, removeToast, toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form setup for creating/editing sprint
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
    },
  });

  const showToast = (message, type = 'success') => {
    toast[type === 'error' ? 'error' : 'success'](message);
  };

  // Fetch all projects user has access to
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Set default selected project when loaded
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // Fetch sprints for the selected project
  const {
    data: sprints,
    isLoading: isSprintsLoading,
    isError: isSprintsError,
    error: sprintsError,
    refetch: refetchSprints,
  } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => sprintService.getSprints(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // Fetch current project role
  const { data: projectDetails } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => projectService.getProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const userRole = projectDetails?.userRole || 'VIEWER';
  const canManageSprints = ['OWNER', 'SCRUM_MASTER'].includes(userRole);

  // Mutation: Create Sprint
  const createSprintMutation = useMutation({
    mutationFn: (data) => sprintService.createSprint(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      showToast('Sprint planned successfully!', 'success');
      reset();
      setShowCreateModal(false);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to plan sprint', 'error');
    },
  });

  // Mutation: Start Sprint
  const startSprintMutation = useMutation({
    mutationFn: (id) => sprintService.startSprint(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      showToast(`Sprint "${updated.name}" is now ACTIVE!`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to start sprint', 'error');
    },
  });

  // Mutation: Complete Sprint
  const completeSprintMutation = useMutation({
    mutationFn: (id) => sprintService.completeSprint(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      showToast(`Sprint "${updated.name}" completed successfully! Final Velocity: ${updated.velocity} hrs`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to complete sprint', 'error');
    },
  });

  // Mutation: Delete Sprint
  const deleteSprintMutation = useMutation({
    mutationFn: (id) => sprintService.deleteSprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      showToast('Sprint deleted successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete sprint', 'error');
    },
  });

  const onSubmit = (data) => {
    createSprintMutation.mutate(data);
  };

  const handleStartSprint = (sprintId) => {
    if (confirm('Are you sure you want to start this sprint? Only one active sprint is allowed per project.')) {
      startSprintMutation.mutate(sprintId);
    }
  };

  const handleCompleteSprint = (sprintId) => {
    if (confirm('Are you sure you want to complete this sprint? This will calculate the final velocity.')) {
      completeSprintMutation.mutate(sprintId);
    }
  };

  const handleDeleteSprint = (sprintId) => {
    if (confirm('Are you sure you want to delete this sprint? Tasks will be unlinked.')) {
      deleteSprintMutation.mutate(sprintId);
    }
  };

  // Group sprints by status
  const activeSprints = sprints?.filter((s) => s.status === 'ACTIVE') || [];
  const plannedSprints = sprints?.filter((s) => s.status === 'PLANNED') || [];
  const completedSprints = sprints?.filter((s) => s.status === 'COMPLETED') || [];

  return (
    <div className="space-y-6 relative animate-fadeIn">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Agile Sprints</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Plan timelines, manage goals, and measure velocity burndown statistics.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={isProjectsLoading}
            className="input-base font-semibold max-w-xs"
          >
            {isProjectsLoading ? (
              <option>Loading workspaces...</option>
            ) : projects?.length === 0 ? (
              <option>No projects found</option>
            ) : (
              projects?.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))
            )}
          </select>

          <button
            onClick={() => { reset(); setShowCreateModal(true); }}
            disabled={!selectedProjectId || !canManageSprints}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Plan Sprint
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedProjectId ? (
        <div className="rounded-xl border border-dashed border-slate-350 dark:border-slate-850 p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-base font-semibold">No project selected</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select or create a workspace project first to manage sprints.</p>
        </div>
      ) : isSprintsLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading agile sprints...</p>
        </div>
      ) : isSprintsError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Failed to fetch sprints</p>
          <p className="text-xs text-red-500 mt-1">{sprintsError?.response?.data?.message || sprintsError.message}</p>
        </div>
      ) : sprints?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center bg-slate-100/50 dark:bg-slate-900/20 max-w-xl mx-auto">
          <Calendar className="mx-auto h-14 w-14 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-base font-bold">No Sprints Planned</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            There are no sprints mapped for this project yet. Start organizing your sprint board now.
          </p>
          {canManageSprints && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" /> Plan First Sprint
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Active Sprints Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Active Sprint</h2>
            </div>
            {activeSprints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No active sprint. Start a planned sprint to begin tracking progress.
              </div>
            ) : (
              activeSprints.map((sprint) => {
                const totalDays = Math.max(1, Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / 86400000));
                const elapsed = Math.ceil((new Date() - new Date(sprint.startDate)) / 86400000);
                const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
                const remaining = Math.max(0, totalDays - elapsed);

                return (
                  <div key={sprint._id}
                    className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-6 shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <SprintStatusBadge status="ACTIVE" />
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{sprint.name}</h3>
                        </div>
                        {sprint.goal && (
                          <div className="flex items-start gap-2">
                            <Target className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">{sprint.goal}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(sprint.startDate).toLocaleDateString()} → {new Date(sprint.endDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            {remaining}d remaining
                          </span>
                        </div>
                        {/* Progress */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Sprint Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill bg-emerald-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                        <Link to={`/dashboard/sprints/${sprint._id}/dashboard`}
                          className="px-3.5 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                          Sprint Dashboard
                        </Link>
                        <Link to={`/dashboard/sprints/${sprint._id}`}
                          className="px-3.5 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                          View Tasks
                        </Link>
                        {canManageSprints && (
                          <button
                            onClick={() => handleCompleteSprint(sprint._id)}
                            disabled={completeSprintMutation.isPending}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50">
                            {completeSprintMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Complete Sprint
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. Planned Sprints Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 dark:bg-slate-600">
                <Calendar className="h-2.5 w-2.5 text-white" />
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Planned ({plannedSprints.length})</h2>
            </div>
            {plannedSprints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No planned sprints. Click "Plan Sprint" to initialize one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plannedSprints.map((sprint) => {
                  const totalDays = Math.max(1, Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / 86400000));
                  return (
                    <div key={sprint._id}
                      className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <SprintStatusBadge status="PLANNED" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {sprint.name}
                          </h3>
                          {sprint.goal && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{sprint.goal}</p>
                          )}
                        </div>
                        {canManageSprints && (
                          <button onClick={() => handleDeleteSprint(sprint._id)}
                            className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-all shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {new Date(sprint.startDate).toLocaleDateString()} – {new Date(sprint.endDate).toLocaleDateString()}
                        <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                          {totalDays}d
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link to={`/dashboard/sprints/${sprint._id}`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                          Details & Tasks
                        </Link>
                        {canManageSprints && (
                          <button
                            onClick={() => handleStartSprint(sprint._id)}
                            disabled={startSprintMutation.isPending}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all">
                            <Play className="h-3 w-3 fill-current" />
                            Start Sprint
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Completed Sprints Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Completed History Sprints ({completedSprints.length})
            </h2>
            {completedSprints.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100/10">
                No sprints have been completed yet.
              </div>
            ) : (
              <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-850 uppercase font-bold tracking-wider">
                        <th className="py-3 px-5.5">Sprint Name</th>
                        <th className="py-3 px-5.5">Duration Timeline</th>
                        <th className="py-3 px-5.5">Goal Description</th>
                        <th className="py-3 px-5.5 text-right">Sprint Velocity</th>
                        <th className="py-3 px-5.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                      {completedSprints.map((sprint) => (
                        <tr key={sprint._id} className="hover:bg-slate-200/20 dark:hover:bg-slate-850/20 transition-colors">
                          <td className="py-3.5 px-5.5 font-bold text-slate-900 dark:text-white">
                            {sprint.name}
                          </td>
                          <td className="py-3.5 px-5.5 text-slate-500 font-semibold">
                            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-5.5 text-slate-500 max-w-xs truncate italic">
                            {sprint.goal || 'No goal set'}
                          </td>
                          <td className="py-3.5 px-5.5 text-right font-extrabold text-green-600 dark:text-green-400">
                            <span className="flex items-center justify-end gap-1.5 text-xs">
                              <TrendingUp className="h-3.5 w-3.5" />
                              {sprint.velocity || 0} hrs
                            </span>
                          </td>
                          <td className="py-3.5 px-5.5 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/dashboard/sprints/${sprint._id}/dashboard`}
                                className="px-2.5 py-1 text-slate-600 hover:text-primary-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded font-semibold transition-colors"
                              >
                                Stats
                              </Link>
                              <Link
                                to={`/dashboard/sprints/${sprint._id}`}
                                className="px-2.5 py-1 text-slate-600 hover:text-primary-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded font-semibold transition-colors"
                              >
                                Tasks
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-500" />
                <h2 className="text-base font-bold text-slate-950 dark:text-white">Plan Workspace Sprint</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint 1 - Core MVP"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('name', {
                    required: 'Sprint name is required',
                    minLength: { value: 3, message: 'Sprint name must be at least 3 characters' },
                    maxLength: { value: 50, message: 'Sprint name must be 50 characters or less' },
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
                  Sprint Goal Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Define major milestones, deliverable components, or focus targets..."
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.goal ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('goal', {
                    maxLength: { value: 500, message: 'Goal must be 500 characters or less' },
                  })}
                />
                {errors.goal && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.goal.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                      errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    {...register('startDate', {
                      required: 'Start date is required',
                    })}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                      errors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    {...register('endDate', {
                      required: 'End date is required',
                    })}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.endDate.message}
                    </p>
                  )}
                </div>
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
                  disabled={isSubmitting || createSprintMutation.isPending}
                  className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/15 disabled:opacity-50 transition-colors"
                >
                  {(isSubmitting || createSprintMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Plan Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintsPage;

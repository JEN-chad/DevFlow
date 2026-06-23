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
  Edit2
} from 'lucide-react';

export const SprintsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

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
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Agile Sprints
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Plan timelines, manage goals, and measure velocity burndown statistics.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase hidden md:inline">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isProjectsLoading}
              className="px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              {isProjectsLoading ? (
                <option>Loading workspaces...</option>
              ) : projects?.length === 0 ? (
                <option>No projects found</option>
              ) : (
                projects?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => {
              reset();
              setShowCreateModal(true);
            }}
            disabled={!selectedProjectId || !canManageSprints}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white px-4.5 py-2 text-sm font-semibold shadow-md shadow-primary-600/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4.5 w-4.5" />
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Sprint
            </h2>
            {activeSprints.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100/10">
                No currently active sprint. Start a planned sprint below.
              </div>
            ) : (
              activeSprints.map((sprint) => (
                <div
                  key={sprint._id}
                  className="glass-panel border-l-4 border-l-primary-600 border border-slate-250 dark:border-slate-800 rounded-xl p-5.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{sprint.name}</h3>
                      <span className="text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase">
                        ACTIVE
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Goal: <span className="italic">{sprint.goal}</span>
                      </p>
                    )}
                    <div className="flex gap-4.5 text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Link
                      to={`/dashboard/sprints/${sprint._id}/dashboard`}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 transition-colors"
                    >
                      Sprint Dashboard
                    </Link>
                    <Link
                      to={`/dashboard/sprints/${sprint._id}`}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 transition-colors"
                    >
                      View Board Tasks
                    </Link>
                    {canManageSprints && (
                      <button
                        onClick={() => handleCompleteSprint(sprint._id)}
                        disabled={completeSprintMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-green-650 hover:bg-green-600 text-white shadow-md shadow-green-600/10 transition-colors"
                      >
                        {completeSprintMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Complete Sprint
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 2. Planned Sprints Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Planned Backlog Sprints ({plannedSprints.length})
            </h2>
            {plannedSprints.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100/10">
                No planned sprints found. Click "Plan Sprint" to initialize one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plannedSprints.map((sprint) => (
                  <div
                    key={sprint._id}
                    className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-5 group hover:border-primary-500/40 transition-all duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-500 transition-colors">
                          {sprint.name}
                        </h3>
                        <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded uppercase">
                          PLANNED
                        </span>
                      </div>
                      {sprint.goal && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
                          {sprint.goal}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-850 flex items-center justify-between">
                      {/* Delete Action */}
                      <div>
                        {canManageSprints && (
                          <button
                            onClick={() => handleDeleteSprint(sprint._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-500/5 transition-colors"
                            title="Delete Sprint"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/dashboard/sprints/${sprint._id}`}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 transition-colors"
                        >
                          Details & Tasks
                        </Link>
                        {canManageSprints && (
                          <button
                            onClick={() => handleStartSprint(sprint._id)}
                            disabled={startSprintMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/10 transition-colors"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { sprintService, taskService, projectService } from '../services/api';
import {
  Calendar,
  ChevronLeft,
  Play,
  CheckCircle,
  Clock,
  Plus,
  Trash,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  TrendingUp,
  Tag,
  Check
} from 'lucide-react';

export const SprintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Form setup for tasks
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: '',
      estimatedHours: 0,
    },
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Sprint Details and Stats
  const {
    data: sprintData,
    isLoading: isSprintLoading,
    isError: isSprintError,
    error: sprintError,
  } = useQuery({
    queryKey: ['sprint', id],
    queryFn: () => sprintService.getSprint(id),
  });

  const sprint = sprintData?.sprint;
  const stats = sprintData?.stats;
  const tasks = sprintData?.tasks || [];
  const projectId = sprint?.projectId;

  // Fetch project details to get members list for assignment & role checks
  const { data: projectDetails, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId,
  });

  const members = projectDetails?.project?.members || [];
  const userRole = sprintData?.userRole || 'VIEWER';
  const canManageSprints = ['OWNER', 'SCRUM_MASTER'].includes(userRole);

  // Mutations
  const startSprintMutation = useMutation({
    mutationFn: () => sprintService.startSprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      showToast('Sprint started successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to start sprint', 'error');
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: () => sprintService.completeSprint(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      showToast(`Sprint completed! Final Velocity: ${updated.velocity} hours`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to complete sprint', 'error');
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (data) => taskService.createTask(projectId, { ...data, sprintId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      showToast('Task added to sprint successfully!', 'success');
      reset();
      setShowAddTaskModal(false);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to add task', 'error');
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => taskService.updateTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      showToast('Task status updated!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update task status', 'error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });
      showToast('Task deleted successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    },
  });

  // Action handlers
  const handleStartSprint = () => {
    if (confirm('Start this sprint? Only one active sprint is allowed per project.')) {
      startSprintMutation.mutate();
    }
  };

  const handleCompleteSprint = () => {
    if (confirm('Complete this sprint? This action calculates the final velocity based on DONE tasks.')) {
      completeSprintMutation.mutate();
    }
  };

  const handleAddTask = (data) => {
    addTaskMutation.mutate(data);
  };

  const handleStatusChange = (taskId, status) => {
    updateTaskStatusMutation.mutate({ taskId, status });
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  if (isSprintLoading || isProjectLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading sprint details...</p>
      </div>
    );
  }

  if (isSprintError || !sprint) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-base font-semibold text-red-900 dark:text-red-300">Sprint details unavailable</h3>
        <p className="mt-1 text-sm text-red-500">{sprintError?.response?.data?.message || 'Failed to load details'}</p>
        <Link
          to="/dashboard/sprints"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Sprints
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-fadeIn">
      {/* Toast */}
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

      {/* Breadcrumb Header */}
      <div className="space-y-2">
        <Link
          to="/dashboard/sprints"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to sprints list
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {sprint.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                  sprint.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                    : sprint.status === 'COMPLETED'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
                }`}
              >
                {sprint.status}
              </span>
            </div>
            {sprint.goal && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Goal: <span className="italic">{sprint.goal}</span>
              </p>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 mt-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
              {sprint.status === 'COMPLETED' && (
                <span className="ml-4 flex items-center gap-1 text-green-600 dark:text-green-400 font-bold bg-green-500/5 px-2 py-0.5 rounded">
                  <TrendingUp className="h-3.5 w-3.5" /> Final Velocity: {sprint.velocity} hrs
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              to={`/dashboard/sprints/${sprint._id}/dashboard`}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Sprint Dashboard
            </Link>

            {canManageSprints && sprint.status === 'PLANNED' && (
              <button
                onClick={handleStartSprint}
                disabled={startSprintMutation.isPending}
                className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/10 transition-colors"
              >
                {startSprintMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                Start Sprint
              </button>
            )}

            {canManageSprints && sprint.status === 'ACTIVE' && (
              <button
                onClick={handleCompleteSprint}
                disabled={completeSprintMutation.isPending}
                className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-lg bg-green-650 hover:bg-green-600 text-white shadow-md shadow-green-600/10 transition-colors"
              >
                {completeSprintMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Complete Sprint
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Dashboard Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Tasks</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{stats?.totalTasks || 0}</span>
        </div>
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block text-green-600 dark:text-green-400">Completed Tasks</span>
          <span className="text-2xl font-extrabold tracking-tight text-green-600 dark:text-green-400 mt-1 block">{stats?.completedTasks || 0}</span>
        </div>
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block text-orange-500">Remaining Tasks</span>
          <span className="text-2xl font-extrabold tracking-tight text-orange-550 mt-1 block">{stats?.remainingTasks || 0}</span>
        </div>
        <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Estimated Effort</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{stats?.totalEstimatedHours || 0} hrs</span>
        </div>
      </div>

      {/* Sprint Task Board / List */}
      <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5.5 border-b border-slate-200/50 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sprint Backlog Board</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check off tasks, assign developers, and track daily progress updates.
            </p>
          </div>
          {sprint.status !== 'COMPLETED' && (
            <button
              onClick={() => {
                reset();
                setShowAddTaskModal(true);
              }}
              className="flex items-center gap-1 rounded-lg bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No tasks mapped to this sprint backlog yet. Click "Add Task" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-850 uppercase font-bold tracking-wider">
                  <th className="py-3 px-5.5">Task Title</th>
                  <th className="py-3 px-5.5">Status</th>
                  <th className="py-3 px-5.5">Priority</th>
                  <th className="py-3 px-5.5">Assignee</th>
                  <th className="py-3 px-5.5 text-right">Estimate</th>
                  <th className="py-3 px-5.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-200/20 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-3.5 px-5.5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{task.title}</div>
                      {task.description && <div className="text-[10px] text-slate-550 mt-0.5 line-clamp-1 italic max-w-sm">{task.description}</div>}
                    </td>
                    <td className="py-3.5 px-5.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        disabled={sprint.status === 'COMPLETED'}
                        className="bg-transparent border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-350 focus:outline-none uppercase"
                      >
                        <option value="BACKLOG">BACKLOG</option>
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="REVIEW">REVIEW</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold ${
                          task.priority === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                            : task.priority === 'MEDIUM'
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-405'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-5.5">
                      <div className="flex items-center gap-1.5">
                        {task.assignee?.avatar ? (
                          <img src={task.assignee.avatar} className="h-5 w-5 rounded-full object-cover" alt="assignee" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[8px]">
                            {task.assignee?.username?.substring(0, 2).toUpperCase() || 'UN'}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500">{task.assignee?.username || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5.5 text-right font-semibold text-slate-700 dark:text-slate-350">
                      {task.estimatedHours || 0} hrs
                    </td>
                    <td className="py-3.5 px-5.5 text-right">
                      {sprint.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1 text-slate-450 hover:text-red-650 rounded transition-colors"
                          title="Delete Task"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary-500" />
                <h2 className="text-base font-bold text-slate-955 dark:text-white">Create Sprint Task</h2>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAddTask)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Integrate Auth Token Middleware"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('title', {
                    required: 'Task title is required',
                    minLength: { value: 3, message: 'Task title must be at least 3 characters' },
                  })}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Add detailed task notes or reference commits..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assignee
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    {...register('assignee')}
                  >
                    <option value="">Unassigned</option>
                    {/* Filter members out or list them */}
                    {members.map((m) => (
                      <option key={m.userId?._id} value={m.userId?._id}>
                        {m.userId?.username}
                      </option>
                    ))}
                    {/* Owner fallback */}
                    {projectDetails?.project?.owner && (
                      <option value={projectDetails.project.owner._id}>
                        {projectDetails.project.owner.username} (Creator)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    {...register('estimatedHours', {
                      valueAsNumber: true,
                      min: 0,
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    {...register('priority')}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    {...register('status')}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/15 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintDetailsPage;

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskService, projectService, sprintService, activityService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Plus,
  ClipboardList,
  AlertCircle,
  Loader2,
  CheckCircle,
  User,
  Clock,
  Trash2,
  Calendar,
  Layers,
  X,
  History,
  CornerDownRight
} from 'lucide-react';

const COLUMNS = [
  { id: 'BACKLOG',     name: 'Backlog',     accent: '#94A3B8', dot: 'bg-slate-400'  },
  { id: 'TODO',        name: 'To Do',       accent: '#3B82F6', dot: 'bg-blue-500'   },
  { id: 'IN_PROGRESS', name: 'In Progress', accent: '#F59E0B', dot: 'bg-amber-500'  },
  { id: 'REVIEW',      name: 'Review',      accent: '#8B5CF6', dot: 'bg-violet-500' },
  { id: 'DONE',        name: 'Done',        accent: '#10B981', dot: 'bg-emerald-500'},
];

export const TasksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket, joinProject, leaveProject } = useSocket();
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('activeProjectId') || '');
  const [selectedSprintId, setSelectedSprintId] = useState(localStorage.getItem('activeSprintId') || 'all');
  const [toast, setToast] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  // Modals & Drawer States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // If null, we are creating a new task
  const [selectedTaskId, setSelectedTaskId] = useState(null); // For details drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Socket room join / leave
  useEffect(() => {
    if (!selectedProjectId) return;
    joinProject(selectedProjectId);

    return () => {
      leaveProject(selectedProjectId);
    };
  }, [selectedProjectId, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      showToast(`Task "${newTask.title}" created in real-time`, 'success');
    };

    const handleTaskUpdated = (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      if (selectedTaskId === updatedTask._id) {
        queryClient.invalidateQueries({ queryKey: ['taskActivities', selectedTaskId] });
      }
    };

    const handleTaskMoved = (movedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      showToast(`Task "${movedTask.title}" moved to ${movedTask.status}`, 'success');
    };

    const handleTaskDeleted = ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      if (selectedTaskId === taskId) {
        setIsDrawerOpen(false);
        setSelectedTaskId(null);
        showToast('Active task was deleted by another user', 'error');
      }
    };

    const handleSprintCreated = (newSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      showToast(`Sprint "${newSprint.name}" planned in real-time`, 'success');
    };

    const handleSprintUpdated = (updatedSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      showToast(`Sprint "${updatedSprint.name}" status updated`, 'success');
    };

    const handleOnlineMembers = (users) => {
      setOnlineMembers(users);
    };

    const handleMemberAdded = (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
      showToast('A new member was added to the project', 'success');
    };

    socket.on('task-created', handleTaskCreated);
    socket.on('task-updated', handleTaskUpdated);
    socket.on('task-moved', handleTaskMoved);
    socket.on('task-deleted', handleTaskDeleted);
    socket.on('sprint-created', handleSprintCreated);
    socket.on('sprint-updated', handleSprintUpdated);
    socket.on('project-members-online', handleOnlineMembers);
    socket.on('member-added', handleMemberAdded);

    return () => {
      socket.off('task-created', handleTaskCreated);
      socket.off('task-updated', handleTaskUpdated);
      socket.off('task-moved', handleTaskMoved);
      socket.off('task-deleted', handleTaskDeleted);
      socket.off('sprint-created', handleSprintCreated);
      socket.off('sprint-updated', handleSprintUpdated);
      socket.off('project-members-online', handleOnlineMembers);
      socket.off('member-added', handleMemberAdded);
    };
  }, [socket, selectedProjectId, selectedSprintId, selectedTaskId]);

  // 1. Query Projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Set default project if none selected
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      const firstId = projects[0]._id;
      setSelectedProjectId(firstId);
      localStorage.setItem('activeProjectId', firstId);
    }
  }, [projects, selectedProjectId]);

  // 2. Query Sprints for selected project
  const { data: sprints, isLoading: isSprintsLoading } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => sprintService.getSprints(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // 3. Query Members of selected project
  const { data: projectDetails } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => projectService.getProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const members = projectDetails?.project?.members || [];
  const projectOwner = projectDetails?.project?.owner;

  // 4. Query Tasks
  const { data: tasks, isLoading: isTasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', selectedProjectId, selectedSprintId],
    queryFn: () => {
      const sprintFilter = selectedSprintId === 'all' ? '' : selectedSprintId;
      return taskService.getTasks(selectedProjectId, sprintFilter);
    },
    enabled: !!selectedProjectId,
  });

  // 5. Query Task Activities (for drawer)
  const { data: taskActivities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['taskActivities', selectedTaskId],
    queryFn: () => activityService.getTaskActivities(selectedTaskId),
    enabled: !!selectedTaskId && isDrawerOpen,
  });

  // Selected Task Object for Drawer
  const activeTaskDetail = tasks?.find((t) => t._id === selectedTaskId);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: '',
      sprintId: '',
      storyPoints: 0,
    },
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: (data) => taskService.createTask(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] }); // invalidate sprint details stats
      showToast('Task created successfully!', 'success');
      setShowTaskModal(false);
      reset();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
    },
  });

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => taskService.updateTask(id, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      queryClient.invalidateQueries({ queryKey: ['taskActivities', updatedTask._id] });
      showToast('Task updated successfully!', 'success');
      setShowTaskModal(false);
      setEditingTask(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprint'] });
      showToast('Task deleted successfully!', 'success');
      setIsDrawerOpen(false);
      setSelectedTaskId(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    },
  });

  // Drag and Drop End Handler
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Optimistically update the UI status local cache
    const taskToMove = tasks.find(t => t._id === draggableId);
    if (!taskToMove) return;

    const queryKey = ['tasks', selectedProjectId, selectedSprintId];
    const previousTasks = queryClient.getQueryData(queryKey);
    if (previousTasks) {
      const updatedTasks = previousTasks.map(t => 
        t._id === draggableId ? { ...t, status: destStatus } : t
      );
      queryClient.setQueryData(queryKey, updatedTasks);
    }

    // Trigger update status on server
    updateTaskMutation.mutate({
      id: draggableId,
      data: { status: destStatus }
    }, {
      onError: () => {
        // Rollback on error
        if (previousTasks) {
          queryClient.setQueryData(queryKey, previousTasks);
        }
      }
    });
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    reset({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: '',
      sprintId: selectedSprintId === 'all' ? '' : selectedSprintId,
      storyPoints: 0,
    });
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee?._id || '',
      sprintId: task.sprintId || '',
      storyPoints: task.storyPoints || 0,
    });
    setShowTaskModal(true);
  };

  const onSubmitTask = (data) => {
    // Clean up empty fields to avoid sending empty string ObjectIds
    const payload = {
      ...data,
      assignee: data.assignee || undefined,
      sprintId: data.sprintId || undefined,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask._id, data: payload });
    } else {
      createTaskMutation.mutate(payload);
    }
  };

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
  };

  const handleDrawerFieldChange = (field, value) => {
    updateTaskMutation.mutate({
      id: selectedTaskId,
      data: { [field]: value }
    });
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('Are you sure you want to permanently delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleProjectChange = (e) => {
    const val = e.target.value;
    setSelectedProjectId(val);
    localStorage.setItem('activeProjectId', val);
    setSelectedSprintId('all');
    localStorage.setItem('activeSprintId', 'all');
  };

  const handleSprintChange = (e) => {
    const val = e.target.value;
    setSelectedSprintId(val);
    localStorage.setItem('activeSprintId', val);
  };

  // Priority badge config
  const PRIORITY_STRIPE = {
    CRITICAL: 'border-l-red-500',
    HIGH:     'border-l-orange-500',
    MEDIUM:   'border-l-amber-500',
    LOW:      'border-l-slate-300 dark:border-l-slate-700',
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      CRITICAL: { label: 'Critical', className: 'priority-critical' },
      HIGH:     { label: 'High',     className: 'priority-high'     },
      MEDIUM:   { label: 'Medium',   className: 'priority-medium'   },
      LOW:      { label: 'Low',      className: 'priority-low'      },
    };
    const c = configs[priority] || configs.LOW;
    return (
      <span className={c.className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {c.label}
      </span>
    );
  };

  // Group tasks by column
  const getTasksByColumn = (colId) => {
    if (!tasks) return [];
    return tasks.filter((task) => task.status === colId);
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-55 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-55 border-red-200 dark:bg-red-950/30 dark:border-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-green-55 border-green-200 dark:bg-green-950/30 dark:border-green-900/50 text-green-600 dark:text-green-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-605 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Sprint Board
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor workloads, configure tickets, and drag tasks into status stages.
            </p>
          </div>

          {/* Online Members Indicator */}
          {onlineMembers.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/55 border border-slate-200/60 dark:border-slate-800/80 px-3 py-1 rounded-full text-xs font-medium text-slate-650 shrink-0 self-start sm:self-center">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex -space-x-1.5 overflow-hidden">
                {onlineMembers.map((member) => (
                  <img
                    key={member._id}
                    className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-white dark:ring-slate-950 object-cover"
                    src={member.avatar}
                    alt={member.username}
                    title={`${member.username} (Online)`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {onlineMembers.length} active
              </span>
            </div>
          )}
        </div>

        {selectedProjectId && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-primary-600/10 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Active Workspace</label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            disabled={isProjectsLoading}
            className="input-base font-semibold"
          >
            {isProjectsLoading ? (
              <option>Loading projects...</option>
            ) : projects && projects.length > 0 ? (
              projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))
            ) : (
              <option value="">No projects available</option>
            )}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sprint Scope</label>
          <select
            value={selectedSprintId}
            onChange={handleSprintChange}
            disabled={isSprintsLoading || !selectedProjectId}
            className="input-base font-semibold"
          >
            <option value="all">All Sprints & Backlog</option>
            <option value="">Backlog Only (No Sprint)</option>
            {sprints && sprints.length > 0 && (
              <optgroup label="Sprints">
                {sprints.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 pb-0.5 shrink-0">
          {tasks && (
            <>
              <span className="flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1.5">
                {tasks.filter(t => t.status !== 'DONE').length} open
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1.5">
                {tasks.filter(t => t.status === 'DONE').length} done
              </span>
            </>
          )}
        </div>
      </div>

      {/* Kanban Board Grid */}
      {isTasksLoading || isProjectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-[400px]">
          {[1, 2, 3, 4, 5].map((col) => (
            <div key={col} className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-850 h-14 flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-350 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4.5 w-8 bg-slate-350 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
              <div className="p-3 space-y-3 flex-1">
                {[1, 2].map((card) => (
                  <div key={card} className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3 animate-pulse">
                    <div className="h-4 w-12 bg-slate-300 dark:bg-slate-850 rounded" />
                    <div className="h-4.5 w-full bg-slate-300 dark:bg-slate-850 rounded" />
                    <div className="h-3 w-5/6 bg-slate-300 dark:bg-slate-850 rounded" />
                    <div className="flex justify-between pt-2">
                      <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-850" />
                      <div className="h-5 w-8 bg-slate-300 dark:bg-slate-850 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !selectedProjectId ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center max-w-xl mx-auto bg-slate-100/30 dark:bg-slate-900/10">
          <ClipboardList className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold">No active project connected</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create or select a workspace project first to start coordinating tasks.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4.5 items-start select-none overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
              const colTasks = getTasksByColumn(column.id);
              const totalStoryPoints = colTasks.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

              return (
                <div
                  key={column.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[75vh] w-full min-w-[220px] shadow-sm"
                  style={{ borderTop: `3px solid ${column.accent}` }}
                >
                  {/* Column Header */}
                  <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{column.name}</span>
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black px-1.5 text-slate-600 dark:text-slate-400">
                        {colTasks.length}
                      </span>
                    </div>
                    {totalStoryPoints > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {totalStoryPoints}SP
                      </span>
                    )}
                  </div>

                  {/* Droppable Card Lane */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 space-y-2.5 flex-1 overflow-y-auto min-h-[300px] transition-colors rounded-b-xl ${
                          snapshot.isDraggingOver ? 'kanban-drop-zone-active bg-blue-50/30 dark:bg-blue-950/10' : ''
                        }`}
                      >
                        {colTasks.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] text-slate-400 dark:text-slate-600 min-h-[120px]">
                            <div>
                              <div className="text-lg mb-1">+</div>
                              Drop tasks here
                            </div>
                          </div>
                        ) : (
                          colTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleTaskClick(task._id)}
                                  className={`relative pl-3 pr-3 pt-3 pb-2.5 bg-white dark:bg-slate-900 border-l-2 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col cursor-grab active:cursor-grabbing transition-all duration-150 group ${
                                    PRIORITY_STRIPE[task.priority] || 'border-l-slate-300'
                                  } ${
                                    snapshot.isDragging
                                      ? 'task-card-dragging'
                                      : 'hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/50 hover:-translate-y-0.5'
                                  }`}
                                >
                                  {/* Top row: priority badge + assignee */}
                                  <div className="flex items-center justify-between mb-2">
                                    {getPriorityBadge(task.priority)}
                                    <div className="flex items-center gap-1.5">
                                      {task.storyPoints > 0 && (
                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 tabular-nums">
                                          {task.storyPoints}
                                        </span>
                                      )}
                                      {task.assignee?.avatar ? (
                                        <img src={task.assignee.avatar} alt={task.assignee.username}
                                          className="h-5 w-5 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                                          title={`Assigned to ${task.assignee.username}`}
                                        />
                                      ) : (
                                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400"
                                          title={task.assignee?.username ? `Assigned: ${task.assignee.username}` : 'Unassigned'}>
                                          {task.assignee?.username?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task Title */}
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {task.title}
                                  </h4>

                                  {/* Description snippet */}
                                  {task.description && (
                                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Footer */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                                      <Layers className="h-3 w-3 shrink-0" />
                                      {task.sprintId ? 'In Sprint' : 'Backlog'}
                                    </div>
                                    {task.githubIssueNumber && (
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                        #{task.githubIssueNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Task Creation / Edit Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                  <ClipboardList className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  {editingTask ? 'Edit Task Ticket' : 'Create Task Ticket'}
                </h2>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmitTask)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement refresh token route"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.title ? 'border-red-500 focus:ring-red-550' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  {...register('title', {
                    required: 'Task title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                  })}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-355 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Add detailed task instructions, reference endpoints, or notes..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Assignee
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    {...register('assignee')}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId?._id} value={m.userId?._id}>
                        {m.userId?.username}
                      </option>
                    ))}
                    {projectOwner && (
                      <option value={projectOwner._id}>
                        {projectOwner.username} (Creator)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Sprint Scope
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    {...register('sprintId')}
                  >
                    <option value="">Backlog (No Sprint)</option>
                    {sprints && sprints.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    {...register('priority')}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    {...register('status')}
                  >
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                    Story Points
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-955 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    {...register('storyPoints', {
                      valueAsNumber: true,
                      min: 0,
                    })}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/15 disabled:opacity-50 transition-colors"
                >
                  {(createTaskMutation.isPending || updateTaskMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Drawer Overlay */}
      {isDrawerOpen && activeTaskDetail && (
        <div className="fixed inset-0 z-40 overflow-hidden flex justify-end transition-all">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 shadow-2xl flex flex-col z-50 animate-slideOver">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-900 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Task Details</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleOpenEditModal(activeTaskDetail, e)}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-slate-105 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
                  title="Edit full ticket details"
                >
                  <Layers className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(activeTaskDetail._id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
                  title="Delete Task Ticket"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Title */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {activeTaskDetail.title}
                </h3>
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Description</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-xl min-h-[5rem] text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {activeTaskDetail.description || <span className="italic text-slate-400">No description provided. Click edit to write one.</span>}
                </div>
              </div>

              {/* Task Field Settings Grid */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Assignee</label>
                  <select
                    value={activeTaskDetail.assignee?._id || ''}
                    onChange={(e) => handleDrawerFieldChange('assignee', e.target.value || null)}
                    className="w-full bg-transparent border-0 font-semibold text-xs focus:ring-0 px-0 cursor-pointer text-slate-800 dark:text-slate-200 py-1"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId?._id} value={m.userId?._id}>
                        {m.userId?.username}
                      </option>
                    ))}
                    {projectOwner && (
                      <option value={projectOwner._id}>
                        {projectOwner.username} (Creator)
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Priority</label>
                  <select
                    value={activeTaskDetail.priority}
                    onChange={(e) => handleDrawerFieldChange('priority', e.target.value)}
                    className="w-full bg-transparent border-0 font-semibold text-xs focus:ring-0 px-0 cursor-pointer text-slate-800 dark:text-slate-200 py-1"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Status Stage</label>
                  <select
                    value={activeTaskDetail.status}
                    onChange={(e) => handleDrawerFieldChange('status', e.target.value)}
                    className="w-full bg-transparent border-0 font-semibold text-xs focus:ring-0 px-0 cursor-pointer text-slate-800 dark:text-slate-200 py-1"
                  >
                    <option value="BACKLOG">BACKLOG</option>
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Story Points</label>
                  <input
                    type="number"
                    value={activeTaskDetail.storyPoints || 0}
                    onChange={(e) => handleDrawerFieldChange('storyPoints', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent border-0 font-semibold text-xs focus:ring-0 px-0 cursor-pointer text-slate-800 dark:text-slate-200 py-1"
                  />
                </div>
              </div>

              {/* Task Activity Logs Timeline */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2 text-slate-505 dark:text-slate-400">
                  <History className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Activity History</h4>
                </div>

                {isActivitiesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-900 rounded" />
                    <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-900 rounded" />
                  </div>
                ) : taskActivities && taskActivities.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {taskActivities.map((act, actIdx) => (
                        <li key={act._id}>
                          <div className="relative pb-8">
                            {actIdx !== taskActivities.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-850"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                {act.user?.avatar ? (
                                  <img src={act.user.avatar} className="h-8 w-8 rounded-full object-cover" alt="user avatar" />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-650 dark:text-primary-400 font-bold text-xs">
                                    {act.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-xs text-slate-600 dark:text-slate-350">
                                    <span className="font-semibold text-slate-950 dark:text-white mr-1">
                                      {act.user?.username || 'System'}
                                    </span>
                                    {act.action}
                                  </p>
                                </div>
                                <div className="text-right text-[10px] whitespace-nowrap text-slate-450 dark:text-slate-500 font-semibold">
                                  {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No activity recorded for this task yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;

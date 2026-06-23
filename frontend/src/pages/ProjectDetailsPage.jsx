import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { projectService, userService } from '../services/api';
import {
  FolderKanban,
  Users,
  GitBranch,
  Calendar,
  ClipboardList,
  ChevronLeft,
  Settings,
  Shield,
  Trash2,
  Archive,
  UserPlus,
  Trash,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
  Search,
  Check
} from 'lucide-react';

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  
  // Search state for member invitation
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteRole, setInviteRole] = useState('DEVELOPER');

  // Fetch project details
  const {
    data: projectData,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id),
  });

  // Fetch project dashboard metrics
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
  } = useQuery({
    queryKey: ['projectDashboard', id],
    queryFn: () => projectService.getProjectDashboard(id),
  });

  // Fetch user search results for autocomplete
  const {
    data: searchResults,
    isLoading: isSearchingUsers,
  } = useQuery({
    queryKey: ['usersSearch', userSearchQuery],
    queryFn: () => userService.searchUsers(userSearchQuery),
    enabled: userSearchQuery.trim().length >= 2,
  });

  // project and user role resolved from API
  const project = projectData?.project;
  const userRole = projectData?.userRole; // OWNER, SCRUM_MASTER, DEVELOPER, VIEWER
  const isOwner = userRole === 'OWNER';

  // React Hook Form for settings edit
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when project data is loaded
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
      });
    }
  }, [project, reset]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: (data) => projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project settings updated successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update project settings', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => projectService.archiveProject(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast(`Project ${updated.status === 'ARCHIVED' ? 'archived' : 'activated'} successfully!`, 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to archive project', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted successfully!', 'success');
      navigate('/dashboard/projects');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete project', 'error');
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (memberData) => projectService.inviteMember(id, memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projectDashboard', id] });
      showToast('Team member added successfully!', 'success');
      setSelectedUser(null);
      setUserSearchQuery('');
      setInviteRole('DEVELOPER');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to add team member', 'error');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => projectService.updateMemberRole(id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Member role updated successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update member role', 'error');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectService.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projectDashboard', id] });
      showToast('Member removed from project successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    },
  });

  // Handlers
  const handleSaveSettings = (data) => {
    updateProjectMutation.mutate(data);
  };

  const handleArchive = () => {
    if (confirm(`Are you sure you want to ${project?.status === 'ARCHIVED' ? 'activate' : 'archive'} this project?`)) {
      archiveMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm('CRITICAL WARNING: Deleting this project will permanently delete all associated sprints, issues, and Git mappings from the database. This action CANNOT be undone. Proceed?')) {
      deleteMutation.mutate();
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      showToast('Please search and select a system user first', 'error');
      return;
    }
    inviteMemberMutation.mutate({
      userId: selectedUser._id,
      username: selectedUser.username,
      role: inviteRole,
    });
  };

  const handleRoleChange = (userId, role) => {
    updateMemberRoleMutation.mutate({ userId, role });
  };

  const handleRemoveMember = (userId, username) => {
    if (confirm(`Are you sure you want to remove ${username} from this project?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  // Rendering loading and error screens
  if (isProjectLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading project workspace details...</p>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 p-8 text-center max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-base font-semibold text-red-900 dark:text-red-300">Project details unavailable</h3>
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">
          {projectError?.response?.data?.message || 'The workspace could not be loaded or you do not have permission to view it.'}
        </p>
        <Link
          to="/dashboard/projects"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Projects
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

      {/* Breadcrumb & Title */}
      <div className="space-y-2">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  project.status === 'ARCHIVED'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}
              >
                {project.status}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-primary-500 font-bold bg-primary-500/5 dark:bg-primary-500/10 px-2 py-0.5 rounded-full">
                <Shield className="h-3.5 w-3.5" /> Role: {userRole}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {project.description || 'No description added to this project.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4.5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'dashboard'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4.5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'members'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Members & Collaboration
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Member count */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4.5">
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Team Members</span>
                <span className="text-2xl font-extrabold tracking-tight">
                  {isDashboardLoading ? '...' : dashboardData?.membersCount ?? (project.members?.length || 1)}
                </span>
              </div>
            </div>

            {/* Repos count */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4.5">
              <div className="h-11 w-11 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <GitBranch className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Repositories</span>
                <span className="text-2xl font-extrabold tracking-tight">
                  {isDashboardLoading ? '...' : dashboardData?.repositoriesCount ?? (project.repositories?.length || 0)}
                </span>
              </div>
            </div>

            {/* Sprint count */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4.5">
              <div className="h-11 w-11 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Calendar className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Sprints</span>
                <span className="text-2xl font-extrabold tracking-tight">
                  {isDashboardLoading ? '...' : dashboardData?.sprintsCount ?? 0}
                </span>
              </div>
            </div>

            {/* Tasks count */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4.5">
              <div className="h-11 w-11 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Open Issues</span>
                <span className="text-2xl font-extrabold tracking-tight">
                  {isDashboardLoading ? '...' : dashboardData?.openTasksCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Project Details Form / Settings (Owners only) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-slate-500" />
                Workspace Metadata
              </h3>
              
              <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-150/50 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    {...register('name', {
                      required: 'Project name is required',
                      minLength: { value: 3, message: 'Project name must be at least 3 characters' },
                    })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows="4"
                    disabled={!isOwner}
                    className={`w-full px-3.5 py-2 text-sm rounded-lg bg-slate-150/50 dark:bg-slate-900 border text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    {...register('description', {
                      maxLength: { value: 500, message: 'Description must be 500 characters or less' },
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.description.message}
                    </p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updateProjectMutation.isPending || !isDirty || !isValid}
                      className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/15 disabled:opacity-50 transition-colors"
                    >
                      {updateProjectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Updates
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Risk Zone (Owners only) */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="h-4.5 w-4.5" />
                Administrative Risk Actions
              </h3>
              <p className="text-xs text-slate-500">
                Administrative changes modifying workspace viability. Actions here require owner clearance.
              </p>

              <div className="space-y-3">
                {/* Archive Button */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {project.status === 'ARCHIVED' ? 'Activate Project' : 'Archive Project'}
                  </span>
                  <button
                    onClick={handleArchive}
                    disabled={!isOwner || archiveMutation.isPending}
                    className={`flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-350 dark:border-slate-750 px-4 py-2 text-xs font-semibold transition-colors bg-transparent ${
                      isOwner
                        ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'opacity-50 cursor-not-allowed text-slate-400'
                    }`}
                  >
                    {archiveMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                    {project.status === 'ARCHIVED' ? 'De-archive Workspace' : 'Archive Workspace'}
                  </button>
                </div>

                {/* Delete Button */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-250 dark:border-slate-850">
                  <span className="text-[11px] font-bold text-red-500">
                    Permanently Delete Workspace
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={!isOwner || deleteMutation.isPending}
                    className={`flex items-center justify-center gap-1.5 w-full rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                      isOwner
                        ? 'bg-red-650/10 hover:bg-red-650 hover:text-white text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 border border-red-500/30'
                        : 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete Workspace Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Members Tab */
        <div className="space-y-6">
          {/* Add member box (Owners only) */}
          {isOwner && (
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl p-5.5 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-primary-500" />
                Invite Workspace Collaborator
              </h3>

              <form onSubmit={handleInviteSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                {/* Search Box with Autocomplete dropdown */}
                <div className="flex-1 relative w-full">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Search Registered System Users
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type username or email..."
                      value={selectedUser ? `${selectedUser.username} (${selectedUser.email || 'No email'})` : userSearchQuery}
                      disabled={!!selectedUser || inviteMemberMutation.isPending}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-85 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                    />
                    
                    {/* Clear selection */}
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="absolute right-3.5 top-2.5 rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown search results */}
                  {!selectedUser && userSearchQuery.trim().length >= 2 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg shadow-2xl z-20 p-1 max-h-56 overflow-y-auto">
                      {isSearchingUsers ? (
                        <div className="p-3 text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> Finding matches...
                        </div>
                      ) : !searchResults || searchResults.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          No matched registered user found.
                        </div>
                      ) : (
                        searchResults.map((sysUser) => (
                          <button
                            key={sysUser._id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(sysUser);
                              setUserSearchQuery('');
                            }}
                            className="flex items-center gap-2.5 w-full text-left rounded-md px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {sysUser.avatar ? (
                              <img src={sysUser.avatar} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold">
                                {sysUser.username?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-xs leading-none text-slate-900 dark:text-white">{sysUser.username}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{sysUser.email || 'No email sync'}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Role select */}
                <div className="w-full md:w-48 shrink-0">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assign Project Role
                  </label>
                  <select
                    value={inviteRole}
                    disabled={inviteMemberMutation.isPending}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="SCRUM_MASTER">SCRUM MASTER</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending || !selectedUser}
                  className="flex items-center justify-center gap-1.5 w-full md:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/10 disabled:opacity-55 transition-colors shrink-0"
                >
                  {inviteMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Member
                </button>
              </form>
            </div>
          )}

          {/* Members List Table */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5.5 border-b border-slate-200/50 dark:border-slate-850">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Workspace Members</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Colleagues mapped to this sprint project workspace.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-900/40 text-slate-500 border-b border-slate-200/50 dark:border-slate-850 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5.5">User</th>
                    <th className="py-3 px-5.5">Project Role</th>
                    <th className="py-3 px-5.5 hidden md:table-cell">Account Status</th>
                    {isOwner && <th className="py-3 px-5.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850">
                  {/* Primary Owner Row */}
                  <tr className="hover:bg-slate-200/20 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-4 px-5.5 flex items-center gap-3">
                      {project.owner?.avatar ? (
                        <img
                          src={project.owner.avatar}
                          alt={project.owner.username}
                          className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <div className="h-8.5 w-8.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                          {project.owner?.username?.substring(0, 2).toUpperCase() || 'P'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {project.owner?.username}
                          <span className="inline-flex items-center text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">Creator</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{project.owner?.email || 'No email synchronized'}</div>
                      </div>
                    </td>
                    <td className="py-4 px-5.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700/60 uppercase">
                        OWNER
                      </span>
                    </td>
                    <td className="py-4 px-5.5 hidden md:table-cell">
                      <span className="text-xs text-slate-500 dark:text-slate-400">System Creator</span>
                    </td>
                    {isOwner && <td className="py-4 px-5.5 text-right text-xs text-slate-400 italic">Primary Creator</td>}
                  </tr>

                  {/* Other members */}
                  {project.members
                    .filter((m) => m.userId?._id !== project.owner?._id)
                    .map((member) => {
                      const memberId = member.userId?._id;
                      const memberName = member.userId?.username || 'Unknown Member';
                      
                      return (
                        <tr key={memberId} className="hover:bg-slate-200/20 dark:hover:bg-slate-850/20 transition-colors">
                          <td className="py-4 px-5.5 flex items-center gap-3">
                            {member.userId?.avatar ? (
                              <img
                                src={member.userId.avatar}
                                alt={memberName}
                                className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              />
                            ) : (
                              <div className="h-8.5 w-8.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                {memberName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white leading-none">{memberName}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-none">{member.userId?.email || 'No email synchronised'}</p>
                            </div>
                          </td>
                          
                          <td className="py-4 px-5.5">
                            {isOwner ? (
                              <select
                                value={member.role}
                                disabled={updateMemberRoleMutation.isPending}
                                onChange={(e) => handleRoleChange(memberId, e.target.value)}
                                className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-950 dark:text-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase font-semibold"
                              >
                                <option value="OWNER">OWNER</option>
                                <option value="SCRUM_MASTER">SCRUM MASTER</option>
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="VIEWER">VIEWER</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800/40 uppercase">
                                {member.role}
                              </span>
                            )}
                          </td>
                          
                          <td className="py-4 px-5.5 hidden md:table-cell">
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Collaborator</span>
                          </td>
                          
                          {isOwner && (
                            <td className="py-4 px-5.5 text-right">
                              <button
                                onClick={() => handleRemoveMember(memberId, memberName)}
                                disabled={removeMemberMutation.isPending}
                                className="p-1.5 text-slate-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-950/20 rounded transition-colors"
                                title="Remove member"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  
                  {/* Empty members state */}
                  {project.members.filter((m) => m.userId?._id !== project.owner?._id).length === 0 && (
                    <tr>
                      <td colSpan={isOwner ? 4 : 3} className="py-8 px-5.5 text-center text-xs text-slate-500 dark:text-slate-400">
                        No team members added to this workspace yet. Invite collaborators to co-manage this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;

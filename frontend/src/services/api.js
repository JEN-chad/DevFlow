import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send credentials (cookies) with requests
});

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

// Request interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Transparently handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`;
        const response = await axios.post(refreshUrl, {}, { withCredentials: true });

        const { accessToken: newAccessToken } = response.data;
        setAccessToken(newAccessToken);

        // Update Authorization header on original request and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. cookie expired), clear access token
        setAccessToken('');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Projects API Services
export const projectService = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data.projects;
  },
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  createProject: async (data) => {
    const response = await api.post('/projects', data);
    return response.data.project;
  },
  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  },
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
  archiveProject: async (id) => {
    const response = await api.patch(`/projects/${id}/archive`);
    return response.data.project;
  },
  getProjectDashboard: async (id) => {
    const response = await api.get(`/projects/${id}/dashboard`);
    return response.data.dashboard;
  },
  inviteMember: async (projectId, { email, username, role }) => {
    const response = await api.post(`/projects/${projectId}/members`, { email, username, role });
    return response.data.project;
  },
  updateMemberRole: async (projectId, userId, role) => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, { role });
    return response.data.project;
  },
  removeMember: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data.project;
  },
};

// Users API Services
export const userService = {
  searchUsers: async (query) => {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data.users;
  },
};

// Repository API Services
export const repositoryService = {
  getConnectedRepositories: async () => {
    const response = await api.get('/repositories');
    return response.data.repositories;
  },
  getGitHubRepositories: async () => {
    const response = await api.get('/repositories/github');
    return response.data.repositories;
  },
  searchGitHubRepositories: async (query) => {
    const response = await api.get(`/repositories/github/search?q=${encodeURIComponent(query)}`);
    return response.data.repositories;
  },
  connectRepository: async (projectId, repoData) => {
    const response = await api.post(`/repositories/project/${projectId}`, repoData);
    return response.data.repository;
  },
  disconnectRepository: async (id) => {
    const response = await api.delete(`/repositories/${id}`);
    return response.data;
  },
  syncRepository: async (id) => {
    const response = await api.post(`/repositories/${id}/sync`);
    return response.data.repository;
  },
  getRepositoryDetails: async (id) => {
    const response = await api.get(`/repositories/${id}`);
    return response.data.repository;
  },
  getRepositoryAnalytics: async (id) => {
    const response = await api.get(`/repositories/${id}/analytics`);
    return response.data.analytics;
  },
  getRepositoryCommits: async (id, page = 1, perPage = 30) => {
    const response = await api.get(`/repositories/${id}/commits?page=${page}&perPage=${perPage}`);
    return response.data.commits;
  },
  getRepositoryPulls: async (id, state = 'all', page = 1, perPage = 30) => {
    const response = await api.get(`/repositories/${id}/pulls?state=${state}&page=${page}&perPage=${perPage}`);
    return response.data.pulls;
  },
  getRepositoryIssues: async (id, state = 'open', page = 1, perPage = 30) => {
    const response = await api.get(`/repositories/${id}/issues?state=${state}&page=${page}&perPage=${perPage}`);
    return response.data.issues;
  },
  getRepositoryContributors: async (id) => {
    const response = await api.get(`/repositories/${id}/contributors`);
    return response.data.contributors;
  },
};

// Sprint API Services
export const sprintService = {
  getSprints: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/sprints`);
    return response.data.sprints;
  },
  getSprint: async (id) => {
    const response = await api.get(`/sprints/${id}`);
    return response.data;
  },
  createSprint: async (projectId, data) => {
    const response = await api.post(`/projects/${projectId}/sprints`, data);
    return response.data.sprint;
  },
  updateSprint: async (id, data) => {
    const response = await api.put(`/sprints/${id}`, data);
    return response.data.sprint;
  },
  startSprint: async (id) => {
    const response = await api.patch(`/sprints/${id}/start`);
    return response.data.sprint;
  },
  completeSprint: async (id) => {
    const response = await api.patch(`/sprints/${id}/complete`);
    return response.data.sprint;
  },
  deleteSprint: async (id) => {
    const response = await api.delete(`/sprints/${id}`);
    return response.data;
  },
};

// Task API Services
export const taskService = {
  createTask: async (projectId, data) => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data.task;
  },
  getTasks: async (projectId, sprintId = '') => {
    const response = await api.get(`/projects/${projectId}/tasks${sprintId ? `?sprintId=${sprintId}` : ''}`);
    return response.data.tasks;
  },
  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.task;
  },
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

// Activity API Services
export const activityService = {
  getUserActivities: async (limit = 50) => {
    const response = await api.get(`/activities?limit=${limit}`);
    return response.data.activities;
  },
  getProjectActivities: async (projectId, limit = 50) => {
    const response = await api.get(`/projects/${projectId}/activities?limit=${limit}`);
    return response.data.activities;
  },
  getTaskActivities: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/activities`);
    return response.data.activities;
  },
};

// Notification API Services
export const notificationService = {
  getNotifications: async (page = 1, limit = 50) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  },
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
};

export default api;


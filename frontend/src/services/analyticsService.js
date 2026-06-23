import api from './api.js';

export const analyticsService = {
  getDashboardAnalytics: async (projectId = '') => {
    const url = projectId ? `/analytics?projectId=${projectId}` : '/analytics';
    const response = await api.get(url);
    return response.data.analytics;
  },
  getSprintBurndown: async (sprintId) => {
    const response = await api.get(`/analytics/sprints/${sprintId}/burndown`);
    return response.data.burndown;
  }
};

export default analyticsService;

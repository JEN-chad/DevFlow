import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardOverview from './pages/DashboardOverview';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import SprintsPage from './pages/SprintsPage';
import SprintDetailsPage from './pages/SprintDetailsPage';
import SprintDashboard from './pages/SprintDashboard';

import TasksPage from './pages/TasksPage';
import RepositoriesPage from './pages/RepositoriesPage';
import RepositoryDetailsPage from './pages/RepositoryDetailsPage';
import RepositoryInsightsPage from './pages/RepositoryInsightsPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailsPage />} />
                <Route path="sprints" element={<SprintsPage />} />
                <Route path="sprints/:id" element={<SprintDetailsPage />} />
                <Route path="sprints/:id/dashboard" element={<SprintDashboard />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="repositories" element={<RepositoriesPage />} />
                <Route path="repositories/:id" element={<RepositoryDetailsPage />} />
                <Route path="repositories/:id/insights" element={<RepositoryInsightsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

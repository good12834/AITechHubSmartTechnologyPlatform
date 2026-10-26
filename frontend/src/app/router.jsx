import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public & Auth Pages
import LandingPage from '../features/public/LandingPage';
import FeaturesPage from '../features/public/FeaturesPage';
import PricingPage from '../features/public/PricingPage';
import PrivacyPage from '../features/public/PrivacyPage';
import TermsPage from '../features/public/TermsPage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';

// Workspace Pages
import DashboardPage from '../features/dashboard/DashboardPage';
import ChatPage from '../features/chat/ChatPage';
import CodeStudioPage from '../features/code-studio/CodeStudioPage';
import DocumentsPage from '../features/documents/DocumentsPage';
import ImageStudioPage from '../features/image-studio/ImageStudioPage';
import ProjectsPage from '../features/projects/ProjectsPage';
import WorkflowsPage from '../features/workflows/WorkflowsPage';
import ActivityPage from '../features/activity/ActivityPage';
import UsagePage from '../features/usage/UsagePage';
import SettingsPage from '../features/settings/SettingsPage';

// Admin Pages
import AdminOverviewPage from '../features/admin/AdminOverviewPage';
import AdminUsersPage from '../features/admin/AdminUsersPage';
import AdminModelsPage from '../features/admin/AdminModelsPage';
import AdminUsagePage from '../features/admin/AdminUsagePage';
import AdminJobsPage from '../features/admin/AdminJobsPage';
import AdminAuditLogsPage from '../features/admin/AdminAuditLogsPage';

export const router = createBrowserRouter([
  // Public Marketing & Legal Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Authenticated Workspace Routes
  {
    element: <WorkspaceLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'code-studio', element: <CodeStudioPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'image-studio', element: <ImageStudioPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'workflows', element: <WorkflowsPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'usage', element: <UsagePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },

  // Administrator Control Routes
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'models', element: <AdminModelsPage /> },
      { path: 'usage', element: <AdminUsagePage /> },
      { path: 'jobs', element: <AdminJobsPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    ],
  },

  // Fallback Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/feedback/ErrorBoundary';

export default function WorkspaceLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7959F5] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-[#9CA8C5]">Loading AI TechHub Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen bg-[#080F20] text-[#F8FAFC]">
      {/* Ambient glow backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-48 h-[600px] w-[600px] rounded-full bg-[#6046F5]/20 blur-[140px]" />
        <div className="absolute -right-56 top-[20%] h-[600px] w-[600px] rounded-full bg-[#7C3AED]/15 blur-[140px]" />
        <div className="absolute -bottom-56 left-1/3 h-[500px] w-[500px] rounded-full bg-[#6046F5]/15 blur-[140px]" />
      </div>

      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content body */}
      <div className="relative z-10 flex min-h-screen flex-col pl-0 md:pl-64 transition-all duration-300">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, Cpu, BarChart2, CheckSquare, FileText } from 'lucide-react';
import ErrorBoundary from '../components/feedback/ErrorBoundary';

const ADMIN_TABS = [
  { label: 'Overview', path: '/admin', exact: true, icon: ShieldCheck },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Models', path: '/admin/models', icon: Cpu },
  { label: 'Platform Usage', path: '/admin/usage', icon: BarChart2 },
  { label: 'Background Jobs', path: '/admin/jobs', icon: CheckSquare },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
];

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080D] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#08080D] text-[#F8FAFC] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-28 transition-all duration-300">
        <Topbar />

        {/* Admin Navigation Header Bar */}
        <div className="bg-[#11182A] border-b border-rose-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Admin Control Center
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Superuser Active
              </span>
            </div>

            {/* Admin sub-tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {ADMIN_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    end={tab.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-[#9CA8C5] hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

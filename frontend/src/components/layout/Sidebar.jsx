import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Code2,
  FileText,
  Image as ImageIcon,
  User,
  Settings,
  Sparkles,
  LogOut,
  Crown,
  Sun,
  Moon,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Chat', path: '/chat', icon: MessageSquare, badge: 'Live' },
  { label: 'Code Studio', path: '/code-studio', icon: Code2 },
  { label: 'Document AI', path: '/documents', icon: FileText },
  { label: 'Image Studio', path: '/image-studio', icon: ImageIcon },
  { label: 'Profile', path: '/settings', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const { isAiOnline } = useWorkspace();
  const navigate = useNavigate();
  const [themeDark, setThemeDark] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-[#6046F5] text-white shadow-lg shadow-[#6046F5]/35 font-bold'
        : 'text-[#94A3B8] hover:bg-[#152038] hover:text-white'
    }`;

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col justify-between border-r border-[#19233C] bg-[#0A1124] p-4 md:flex">
      {/* Brand Header */}
      <div>
        <NavLink to="/dashboard" className="flex items-center gap-3 px-2 py-2 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6046F5] via-[#7C3AED] to-[#A78BFA] shadow-lg shadow-[#6046F5]/30">
            <BrainCircuit className="h-5 w-5 text-white" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0A1124] ${
                isAiOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              title={isAiOnline ? 'Ollama runtime online' : 'Mock/Fallback engine active'}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>AI TechHub</span>
            </h1>
            <p className="text-[10px] text-[#A78BFA] font-medium tracking-wide">AI Chat &amp; Code Studio</p>
          </div>
        </NavLink>

        {/* Navigation items */}
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path + item.label} to={item.path} className={navLinkClass}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-[#19233C]" />
              <NavLink
                to="/admin"
                className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 transition-all hover:bg-rose-500/15 hover:text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Portal</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Footer Area: Upgrade Card & Theme Toggle */}
      <div className="space-y-4 pt-4 border-t border-[#19233C]">
        {/* Upgrade to Pro Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#233152] bg-gradient-to-br from-[#111D34] via-[#101B30] to-[#0D1526] p-3.5 shadow-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400">
              <Crown className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="text-xs font-bold text-white">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-tight mb-3">
            Unlock advanced AI models, unlimited tokens &amp; priority GPU.
          </p>
          <NavLink
            to="/pricing"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#6046F5] py-2 text-xs font-bold text-white shadow-md shadow-[#6046F5]/30 transition-all hover:bg-[#5035e0] hover:scale-[1.02] active:scale-98"
          >
            <span>Go Pro</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>

        {/* Theme switch & User quick logout */}
        <div className="flex items-center justify-between px-1">
          {/* Light / Dark Mode switch pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#1E2C48] bg-[#0E172A] p-1">
            <button
              type="button"
              onClick={() => setThemeDark(false)}
              className={`rounded-full p-1 transition-colors ${
                !themeDark ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-[#64748B] hover:text-white'
              }`}
              title="Light theme"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setThemeDark(true)}
              className={`rounded-full p-1 transition-colors ${
                themeDark ? 'bg-[#6046F5] text-white shadow-sm' : 'text-[#64748B] hover:text-white'
              }`}
              title="Dark theme"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Sign Out button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-[#94A3B8] hover:bg-white/5 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-[11px]">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}


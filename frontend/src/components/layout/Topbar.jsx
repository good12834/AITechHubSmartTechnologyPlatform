import React, { useState } from 'react';
import { Search, Bell, Cpu, ChevronDown, User, ShieldCheck, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Gradient top bar (redesigned to match the dashboard mockup).
 * The search field doubles as an AI quick-ask: submitting navigates to /chat.
 */
export default function Topbar() {
  const { user, isAdmin, logout } = useAuth();
  const { selectedModel, setSelectedModel, availableModels } = useWorkspace();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate('/chat', { state: { initialPrompt: q } });
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#19233C] bg-[#0A1124]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Search / quick ask */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything..."
          aria-label="Search or ask AI"
          className="w-full rounded-full border border-[#1E2C48] bg-[#111D34] py-2 pl-10 pr-4 text-xs text-white placeholder-[#64748B] transition-all focus:border-[#6046F5] focus:bg-[#152442] focus:outline-none"
        />
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model selector pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#1E2C48] bg-[#111D34] px-3 py-1.5">
          <Cpu className="h-3.5 w-3.5 text-[#A78BFA]" />
          <select
            aria-label="Select AI model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-white focus:outline-none"
          >
            {availableModels.map((m) => (
              <option key={m.name} value={m.name} className="bg-[#111D34] text-white">
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative rounded-xl p-2 text-white/90 transition-colors hover:bg-white/15"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FBBF24]" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[#14141C] p-2 text-xs shadow-2xl">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6B7385]">
                Notifications
              </p>
              <div className="flex items-start gap-2.5 rounded-xl bg-[#0B0B14] p-3">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#C084FC]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white">AI TechHub Workspace</p>
                  <p className="mt-0.5 text-[#8B95AE]">
                    Welcome! Explore AI Chat, Code Studio, and Workflows.
                  </p>
                  <span className="text-[10px] text-[#5A6275]">10m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-xl p-1.5 transition-colors hover:bg-white/15"
            aria-label="Open profile menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/60 bg-[#0B0B14] text-[11px] font-bold text-[#C084FC]">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-white/80 sm:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#14141C] p-2 text-xs shadow-2xl"
              onClick={() => setProfileOpen(false)}
            >
              <div className="mb-1 border-b border-white/5 px-3 py-2">
                <p className="font-semibold text-white">{user?.username}</p>
                <p className="truncate text-[11px] text-[#8B95AE]">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#C084FC]">
                  {user?.role} • {user?.plan || 'Free'} Plan
                </span>
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#8B95AE] transition-colors hover:bg-white/5 hover:text-white"
              >
                <User className="h-4 w-4 text-[#C084FC]" />
                <span>Profile &amp; Account</span>
              </Link>

              <Link
                to="/usage"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#8B95AE] transition-colors hover:bg-white/5 hover:text-white"
              >
                <Sparkles className="h-4 w-4 text-[#22D3EE]" />
                <span>Plan Quotas &amp; Usage</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4 text-rose-400" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <div className="border-t border-white/5 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


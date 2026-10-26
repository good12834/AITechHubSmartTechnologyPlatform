import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Cpu,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import authApi from '../../services/authApi';
import PageHeader from '../../components/layout/PageHeader';

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const { selectedModel, setSelectedModel, availableModels } = useWorkspace();

  // Profile form state
  const [username, setUsername] = useState(user?.username || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Model settings state
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [modelSuccess, setModelSuccess] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      await updateUserProfile({ username });
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleModelSave = (e) => {
    e.preventDefault();
    localStorage.setItem('ollama_url', ollamaUrl);
    setModelSuccess('Model runtime preferences saved.');
    setTimeout(() => setModelSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        description="Manage your account security, AI provider connection endpoints, and workspace preferences."
      />

      {/* Profile Section */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#7959F5]" />
          <span>Profile Information</span>
        </h3>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0D1324] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Email (Fixed)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#0D1324]/50 border border-white/5 rounded-xl px-4 py-2 text-xs text-[#64748B] cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7959F5] text-white text-xs font-semibold shadow-md shadow-[#7959F5]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{profileLoading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </form>
      </div>

      {/* AI Runtime Configuration */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#22D3EE]" />
          <span>Local AI Inference Provider</span>
        </h3>

        {modelSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{modelSuccess}</span>
          </div>
        )}

        <form onSubmit={handleModelSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Default LLM Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#0D1324] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7959F5]"
              >
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Ollama Base URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full bg-[#0D1324] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Save Runtime Preferences</span>
          </button>
        </form>
      </div>

      {/* Security & Password Section */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Password</span>
        </h3>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0D1324] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="w-full bg-[#0D1324] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7959F5] text-white text-xs font-semibold shadow-md shadow-[#7959F5]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

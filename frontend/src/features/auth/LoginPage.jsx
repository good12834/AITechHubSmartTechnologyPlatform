import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../services/authApi';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your email/username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIdentifier('demo_user');
    setPassword('DemoPass123!');
    setError('');
    setLoading(true);
    try {
      await login('demo_user', 'DemoPass123!');
      navigate(from, { replace: true });
    } catch (err) {
      // If demo user does not exist in backend yet, try registering it transparently
      try {
        await authApi.register({
          email: 'demo@aitechhub.local',
          username: 'demo_user',
          password: 'DemoPass123!',
        });
        await login('demo_user', 'DemoPass123!');
        navigate(from, { replace: true });
      } catch (regErr) {
        setError('Demo login: ' + (regErr.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#7959F5]/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
          <p className="text-xs text-[#9CA8C5] mt-1">Sign in to access your local AI workspaces</p>
        </div>

        {/* Login Form Box */}
        <div className="rounded-3xl bg-[#151C30] border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or username"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#22D3EE] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs shadow-lg shadow-[#7959F5]/25 hover:shadow-[#22D3EE]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Portfolio Demo Login</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#9CA8C5] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#22D3EE] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

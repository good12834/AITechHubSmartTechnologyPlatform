import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import authApi from '../../services/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setSubmitted(true);
      // For developer testing convenience, capture returned token if demo
      if (res?.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.resetPassword({
        email,
        password: newPassword,
        token: resetToken,
      });
      setResetComplete(true);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#7959F5]/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Reset Password</h1>
          <p className="text-xs text-[#9CA8C5] mt-1">
            {resetComplete
              ? 'Your password has been updated'
              : submitted
              ? 'Enter your new password below'
              : 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        <div className="rounded-3xl bg-[#151C30] border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetComplete ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Password reset successful!</p>
              <p className="text-xs text-[#9CA8C5]">You can now log in with your new password.</p>
              <Link
                to="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs shadow-lg shadow-[#7959F5]/25 block"
              >
                Go to Sign In
              </Link>
            </div>
          ) : !submitted ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs shadow-lg shadow-[#7959F5]/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Send Recovery Instructions'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#11182A] text-xs text-emerald-400 border border-emerald-500/20 mb-3">
                Recovery email validated. Create your new password:
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min. 8 characters)"
                    className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs shadow-lg shadow-[#7959F5]/25 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <Link to="/login" className="text-xs text-[#9CA8C5] hover:text-white transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

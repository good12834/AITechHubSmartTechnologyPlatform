import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Simple password strength calculation
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#7959F5]/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create your account</h1>
          <p className="text-xs text-[#9CA8C5] mt-1">Join AI TechHub and start building with local AI</p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-[#151C30] border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex_dev"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#11182A] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5] focus:ring-1 focus:ring-[#7959F5] transition-all"
                  required
                />
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all ${
                          strength >= step
                            ? strength <= 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#9CA8C5] mt-1 block">
                    {strength <= 1 && 'Weak password'}
                    {strength === 2 && 'Moderate'}
                    {strength === 3 && 'Strong'}
                    {strength === 4 && 'Very strong'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white font-bold text-xs shadow-lg shadow-[#7959F5]/25 hover:shadow-[#22D3EE]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9CA8C5] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#22D3EE] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

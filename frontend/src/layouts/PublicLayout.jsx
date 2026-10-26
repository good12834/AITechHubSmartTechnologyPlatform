import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, Cpu, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC] flex flex-col selection:bg-[#7959F5] selection:text-white">
      {/* Public Navbar */}
      <header className="sticky top-0 z-50 bg-[#0B1020]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-[#7959F5]/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                AI TechHub
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#7959F5]/20 text-[#22D3EE] border border-[#7959F5]/30">
                  Local AI
                </span>
              </span>
              <span className="text-[11px] text-[#9CA8C5]">Intelligent Workspace Platform</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CA8C5]">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-white' : 'hover:text-white transition-colors'
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/features"
              className={({ isActive }) =>
                isActive ? 'text-white' : 'hover:text-white transition-colors'
              }
            >
              Features
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                isActive ? 'text-white' : 'hover:text-white transition-colors'
              }
            >
              Pricing
            </NavLink>
            <NavLink
              to="/privacy"
              className={({ isActive }) =>
                isActive ? 'text-white' : 'hover:text-white transition-colors'
              }
            >
              Privacy
            </NavLink>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#6846EB] text-white text-xs font-semibold shadow-lg shadow-[#7959F5]/30 hover:shadow-[#7959F5]/50 transition-all hover:scale-105"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9CA8C5] hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-semibold shadow-lg shadow-[#7959F5]/25 hover:shadow-[#22D3EE]/30 transition-all hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#11182A] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">AI TechHub</span>
            </div>
            <p className="text-xs text-[#9CA8C5] leading-relaxed mb-4">
              A professional full-stack platform for local AI chat, automated coding, RAG document intelligence, and multi-step workflows. Zero per-token cloud fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ollama & Local Runtime Ready</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Modules</h4>
            <ul className="space-y-2 text-xs text-[#9CA8C5]">
              <li><Link to="/chat" className="hover:text-white transition-colors">AI Chat & Streaming</Link></li>
              <li><Link to="/code-studio" className="hover:text-white transition-colors">Code Studio & Refactor</Link></li>
              <li><Link to="/documents" className="hover:text-white transition-colors">Document AI & RAG</Link></li>
              <li><Link to="/image-studio" className="hover:text-white transition-colors">Image Studio Gallery</Link></li>
              <li><Link to="/workflows" className="hover:text-white transition-colors">Visual Workflows</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-[#9CA8C5]">
              <li><Link to="/features" className="hover:text-white transition-colors">Platform Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy & Data Handling</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Stack Details</h4>
            <div className="space-y-2 text-xs text-[#9CA8C5]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>React 19 + Vite + Tailwind CSS</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#7959F5]" />
                <span>Python Flask REST API + MySQL</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local Ollama & Sentence Transformers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} AI TechHub Platform. Built for developers and intelligent teams.</p>
          <p className="mt-2 sm:mt-0">Private & Secure • Local Inference First</p>
        </div>
      </footer>
    </div>
  );
}

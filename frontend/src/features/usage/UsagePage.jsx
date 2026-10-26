import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Sparkles,
  Image as ImageIcon,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import usageApi from '../../services/usageApi';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { Link } from 'react-router-dom';

export default function UsagePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      try {
        const res = await usageApi.getLimits();
        setData(res);
      } catch (err) {
        console.warn('Failed to load usage limits:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsage();
  }, []);

  const plan = data?.plan || user?.plan || 'free';
  const limits = data?.limits || {
    messages_per_day: 50,
    images_per_day: 5,
    storage_mb: 100,
  };
  const usageToday = data?.usage_today || {
    chat_messages_today: 0,
    images_today: 0,
  };

  const messagePercent = Math.min(
    100,
    Math.round((usageToday.chat_messages_today / limits.messages_per_day) * 100)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Quotas"
        description="Monitor your compute consumption, daily limits, and local inference metrics."
        badge={`${plan.toUpperCase()} Plan`}
      />

      {/* Quota Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages Quota */}
        <div className="rounded-3xl bg-[#151C30] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5]">
              Daily Messages
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#7959F5]/20 text-[#7959F5] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-white">
              {usageToday.chat_messages_today}
            </span>
            <span className="text-xs text-[#9CA8C5]">/ {limits.messages_per_day} limit</span>
          </div>
          <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-[#7959F5] to-[#22D3EE] h-full rounded-full transition-all duration-500"
              style={{ width: `${messagePercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">
            Resets automatically at 00:00 UTC. Local Ollama inference is unlimited.
          </p>
        </div>

        {/* Images Quota */}
        <div className="rounded-3xl bg-[#151C30] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5]">
              Image Studio Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-white">
              {usageToday.images_today}
            </span>
            <span className="text-xs text-[#9CA8C5]">/ {limits.images_per_day} limit</span>
          </div>
          <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((usageToday.images_today / limits.images_per_day) * 100))}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">Daily diffusion and vision processing jobs.</p>
        </div>

        {/* Storage Capacity */}
        <div className="rounded-3xl bg-[#151C30] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9CA8C5]">
              Document Storage
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-white">{limits.storage_mb}</span>
            <span className="text-xs text-[#9CA8C5]">MB allocated</span>
          </div>
          <div className="w-full bg-[#0B1020] h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '15%' }} />
          </div>
          <p className="text-[11px] text-[#64748B]">Indexed RAG vector storage & PDF cache.</p>
        </div>
      </div>

      {/* Plan Details & Upgrade Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#151C30] via-[#11182A] to-[#7959F5]/20 border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-xs font-bold uppercase tracking-wide text-white">
              Current Tier: {plan.toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">Need higher concurrency or GPU cloud fallback?</h3>
          <p className="text-xs text-[#9CA8C5] max-w-xl mt-1">
            Upgrade your plan to unlock 1,000+ daily hosted queries, multi-gigabyte vector indexing, and priority background workers.
          </p>
        </div>

        <Link
          to="/pricing"
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7959F5] to-[#22D3EE] text-white text-xs font-bold shadow-lg shadow-[#7959F5]/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
        >
          <span>View Tier Plans</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

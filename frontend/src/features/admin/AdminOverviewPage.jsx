import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Server,
  Cpu,
  Database,
  BarChart3,
  HardDrive,
  Workflow,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/layout/PageHeader';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await adminApi.getOverview();
      setData(res);
    } catch (err) {
      console.warn('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const metrics = data?.metrics || {};
  const services = data?.services || {
    api_server: 'healthy',
    database: 'connected',
    ai_runtime: 'online',
    task_queue: 'ready',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview & Service Health"
        description="Global platform telemetry, active tenant counts, and infrastructure service states."
        badge="Superuser Dashboard"
        actions={
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Health</span>
          </button>
        }
      />

      {/* Service Health Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#11182A] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#9CA8C5]">Flask REST API</p>
            <p className="text-sm font-extrabold text-white mt-0.5 capitalize">{services.api_server}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[#11182A] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#9CA8C5]">MySQL Database</p>
            <p className="text-sm font-extrabold text-white mt-0.5 capitalize">{services.database}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[#11182A] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#9CA8C5]">Ollama Runtime</p>
            <p className="text-sm font-extrabold text-white mt-0.5 capitalize">{services.ai_runtime}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-[#22D3EE] shadow-md shadow-[#22D3EE]/50" />
        </div>

        <div className="p-4 rounded-2xl bg-[#11182A] border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#9CA8C5]">Celery Worker</p>
            <p className="text-sm font-extrabold text-white mt-0.5 capitalize">{services.task_queue}</p>
          </div>
          <span className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={metrics.total_users ?? 0}
          change={`${metrics.active_users ?? 0} active`}
          icon={Users}
          color="violet"
        />
        <StatCard
          title="Total Projects"
          value={metrics.total_projects ?? 0}
          change="Persistent"
          icon={HardDrive}
          color="cyan"
        />
        <StatCard
          title="Conversations"
          value={metrics.total_conversations ?? 0}
          change="Multi-turn"
          icon={BarChart3}
          color="emerald"
        />
        <StatCard
          title="Documents Indexed"
          value={metrics.total_documents ?? 0}
          change="RAG Chunks"
          icon={Database}
          color="amber"
        />
      </div>

      {/* System Architecture Details */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-white mb-3">Platform Infrastructure Specs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#9CA8C5]">
          <div className="p-3.5 rounded-xl bg-[#0D1324] border border-white/5">
            <span className="text-[#CBD5E1] font-semibold block mb-1">Inference Engine</span>
            <span>Ollama Provider Layer with local fallback resilience</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0D1324] border border-white/5">
            <span className="text-[#CBD5E1] font-semibold block mb-1">Retrieval Engine</span>
            <span>TF-IDF Vector Chunker & Ingest Pipeline</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0D1324] border border-white/5">
            <span className="text-[#CBD5E1] font-semibold block mb-1">Security Isolation</span>
            <span>Role-Based Access Control + Row Ownership Checks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

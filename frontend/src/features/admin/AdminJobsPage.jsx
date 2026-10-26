import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Workflow,
  CheckCircle2,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function AdminJobsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await adminApi.getJobs();
      setData(res);
    } catch (err) {
      console.warn('Failed to load admin jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const docs = data?.active_and_failed_documents || [];
  const gens = data?.active_and_failed_generations || [];
  const workflows = data?.active_and_failed_workflow_runs || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Background Jobs & Worker Queue"
        description="Inspect Celery tasks, document indexing status, asynchronous vision generations, and workflow jobs."
        badge="Celery / Redis Worker"
        actions={
          <button
            onClick={fetchJobs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Queue</span>
          </button>
        }
      />

      {/* Grid of Jobs Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Ingestion Tasks */}
        <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <FileText className="w-4 h-4 text-[#22D3EE]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Document Ingestion ({docs.length})
            </h3>
          </div>

          {docs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No active or failed document tasks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {docs.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-[#0D1324] border border-white/5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[150px]">{d.filename}</span>
                    <span className="text-[10px] uppercase font-semibold text-amber-400">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">{formatDate(d.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generation Jobs */}
        <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Vision & Image Jobs ({gens.length})
            </h3>
          </div>

          {gens.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No active image generations in queue.
            </div>
          ) : (
            <div className="space-y-2.5">
              {gens.map((g) => (
                <div key={g.id} className="p-3 rounded-xl bg-[#0D1324] border border-white/5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white text-[11px]">Job #{g.id.slice(0, 8)}</span>
                    <span className="text-[10px] uppercase font-semibold text-[#22D3EE]">
                      {g.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA8C5] line-clamp-1 mt-1">{g.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Runs */}
        <div className="rounded-3xl bg-[#11182A] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-4">
            <Workflow className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Workflow Pipeline Runs ({workflows.length})
            </h3>
          </div>

          {workflows.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No queued workflow runs.
            </div>
          ) : (
            <div className="space-y-2.5">
              {workflows.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-[#0D1324] border border-white/5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white text-[11px]">Run #{w.id.slice(0, 8)}</span>
                    <span className="text-[10px] uppercase font-semibold text-emerald-400">
                      {w.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">{formatDate(w.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

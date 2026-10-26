import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Code2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Filter,
} from 'lucide-react';
import usageApi from '../../services/usageApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function ActivityPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchActivity = async () => {
    try {
      const data = await usageApi.getSummary(30);
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load activity summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const records = summary?.recent_activity || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity & Event Logs"
        description="Audit timeline of your model requests, document indexing jobs, and workflow executions."
        badge="Audit Trail"
        actions={
          <button
            onClick={fetchActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Main Activity Log Table */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-[#0D1324] border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#22D3EE]" />
            <span>Recent System Events</span>
          </span>
          <span className="text-xs text-[#9CA8C5]">Past 30 Days</span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#7959F5] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 text-xs text-[#64748B]">
            No recent activity recorded yet. Start a chat or run Code Studio to generate events.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map((r, i) => (
              <div
                key={r.id || i}
                className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#151C30] flex items-center justify-center text-[#22D3EE]">
                    {r.type?.includes('code') ? (
                      <Code2 className="w-4 h-4 text-[#7959F5]" />
                    ) : r.type?.includes('image') ? (
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white capitalize">
                      {r.type ? r.type.replace('_', ' ') : 'AI Action'}
                    </p>
                    <p className="text-[11px] text-[#9CA8C5]">
                      Tokens / Units: {r.tokens || r.quantity || 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                    Success
                  </span>
                  <span className="text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(r.created_at)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

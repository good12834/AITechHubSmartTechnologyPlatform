import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  RefreshCw,
  PieChart,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function AdminUsagePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const res = await adminApi.getUsage();
      setData(res);
    } catch (err) {
      console.warn('Failed to load admin usage telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const byType = data?.by_type || {};
  const recentRecords = data?.recent_records || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Request Telemetry"
        description="Global system usage, inference volume distributions, and error metrics across all tenants."
        badge="System Analytics"
        actions={
          <button
            onClick={fetchUsage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        }
      />

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(byType).length === 0 ? (
          <div className="col-span-full p-4 rounded-2xl bg-[#11182A] border border-white/5 text-xs text-[#64748B] text-center">
            No inference volume recorded yet.
          </div>
        ) : (
          Object.entries(byType).map(([type, count]) => (
            <div key={type} className="p-5 rounded-2xl bg-[#151C30] border border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA8C5]">
                {type.replace('_', ' ')}
              </span>
              <p className="text-2xl font-black text-white mt-1">{count}</p>
              <span className="text-[10px] text-emerald-400 font-medium">Logged events</span>
            </div>
          ))
        )}
      </div>

      {/* Recent Telemetry Table */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-[#0D1324] border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Raw Event Telemetry Stream
          </span>
          <span className="text-xs text-[#9CA8C5]">Total Logged: {data?.total_logged ?? 0}</span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#7959F5] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : recentRecords.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#64748B]">No records available.</div>
        ) : (
          <div className="divide-y divide-white/5 text-xs">
            {recentRecords.map((r) => (
              <div
                key={r.id}
                className="p-4 px-6 flex items-center justify-between hover:bg-white/[0.02] text-[#CBD5E1]"
              >
                <div>
                  <span className="font-bold text-white capitalize">{r.type?.replace('_', ' ')}</span>
                  <p className="text-[10px] text-[#9CA8C5] font-mono">User ID: {r.user_id}</p>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  <span className="font-mono text-[#22D3EE]">{r.tokens || r.quantity || 1} units</span>
                  <span className="text-[#64748B]">{formatDate(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Search,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await adminApi.getAuditLogs();
      setLogs(res?.audit_logs || []);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.actor?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Audit Logs"
        description="Immutable record of security events, administrative permissions grants, and authentication logs."
        badge="Security Compliance"
        actions={
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        }
      />

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by actor or action..."
          className="w-full bg-[#11182A] border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#64748B]">No audit events logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1324] text-[#9CA8C5] border-b border-white/5 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action Event</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {filtered.map((evt, i) => (
                  <tr key={evt.id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span className="font-semibold text-white">{evt.actor}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-[#7959F5] font-bold text-[11px]">
                        {evt.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#9CA8C5] max-w-xs truncate">
                      {evt.details}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {evt.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-[#64748B]">
                      {formatDate(evt.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

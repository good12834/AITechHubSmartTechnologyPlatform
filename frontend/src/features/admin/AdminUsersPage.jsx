import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatters';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await adminApi.listUsers({ per_page: 50 });
      setUsers(res?.items || []);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (id, fields) => {
    try {
      const updated = await adminApi.updateUser(id, fields);
      setUsers(users.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user account and all owned assets?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Account Administration"
        description="Inspect registered tenant profiles, modify access roles, and suspend malicious actors."
        badge="Access Control"
        actions={
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9CA8C5] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email address..."
          className="w-full bg-[#11182A] border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7959F5]"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-[#11182A] border border-white/5 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1324] text-[#9CA8C5] border-b border-white/5 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Plan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7959F5] to-[#22D3EE] p-0.5 flex-shrink-0">
                          <div className="w-full h-full bg-[#11182A] rounded-full flex items-center justify-center font-bold text-xs text-[#22D3EE]">
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.username}</p>
                          <p className="text-[11px] text-[#9CA8C5]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                        className="bg-[#151C30] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={u.plan || 'free'}
                        onChange={(e) => handleUpdate(u.id, { plan: e.target.value })}
                        className="bg-[#151C30] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer uppercase"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Suspended</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-[#64748B]">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-[#64748B] hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

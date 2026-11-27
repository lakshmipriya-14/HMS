import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import {
  History,
  Search,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const ActivityHistory: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getActivityLogs({ page: 1, limit: 50 });
      if (res.data) setLogs(res.data);
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
      setError(err.message || 'Failed to load department audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const act = (log.action || '').toLowerCase();
    const details = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')).toLowerCase();
    const entity = (log.entity || log.module || '').toLowerCase();
    const user = (log.user?.firstName || log.userId || '').toLowerCase();
    return act.includes(search.toLowerCase()) || details.includes(search.toLowerCase()) || entity.includes(search.toLowerCase()) || user.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#00897B]" />
            Department Audit Log & Activity Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident chronological record of all operational, clinical, and administrative actions in this department.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Refresh Activity
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit logs by action, user, entity, or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
        />
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <LoadingState message="Loading department activity logs..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Activity Logged</p>
          <p className="text-xs text-slate-400 mt-1">No recorded activities match your search parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          {filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2F1] text-[#00897B] flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black uppercase text-[#00897B] bg-[#E0F2F1] px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {log.entity || log.module || 'Department'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(log.createdAt || Date.now()).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-xs text-slate-600 mt-1">
                  {typeof log.details === 'string'
                    ? log.details
                    : log.details?.notes || log.details?.reason || JSON.stringify(log.details || {})}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId || 'Department User'}
                  </span>
                  <span>•</span>
                  <span>IP: {log.ipAddress || 'Internal Network'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

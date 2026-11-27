import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CheckSquare,
  Clock,
  CalendarOff,
  Layers,
  ShoppingCart,
  Hammer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApprovalsTracking: React.FC = () => {
  const [items, setItems] = useState<{ leaves: any[]; requests: any[] }>({ leaves: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LEAVES' | 'RESOURCES' | 'PURCHASE' | 'MAINTENANCE'>('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadAllApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      const [leavesRes, reqRes] = await Promise.allSettled([
        apiClient.departmentAdmin.getLeaves(),
        apiClient.departmentAdmin.getRequests(),
      ]);

      const leaves = leavesRes.status === 'fulfilled' && leavesRes.value.data ? leavesRes.value.data : [];
      const requests = reqRes.status === 'fulfilled' && reqRes.value.data ? reqRes.value.data : [];
      setItems({ leaves, requests });
    } catch (err: any) {
      console.error('Failed to load approvals:', err);
      setError(err.message || 'Failed to load approvals tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllApprovals();
  }, []);

  const combinedList = [
    ...items.leaves.map((l) => ({
      id: l.id,
      category: 'LEAVES',
      title: `${l.user?.firstName || ''} ${l.user?.lastName || 'Staff'} – ${l.leaveType || 'Leave Application'}`,
      description: `${new Date(l.startDate).toLocaleDateString('en-IN')} to ${new Date(l.endDate).toLocaleDateString('en-IN')} (${l.totalDays || 1} days) • Reason: ${l.reason || 'Personal'}`,
      status: l.status || 'PENDING',
      priority: 'MEDIUM',
      createdAt: l.createdAt,
      link: '/department-admin/leaves',
    })),
    ...items.requests.map((r) => ({
      id: r.id,
      category: r.type === 'PURCHASE' ? 'PURCHASE' : r.type === 'MAINTENANCE' ? 'MAINTENANCE' : 'RESOURCES',
      title: r.title,
      description: r.description,
      status: r.status || 'PENDING',
      priority: r.priority || 'MEDIUM',
      createdAt: r.createdAt,
      link:
        r.type === 'PURCHASE'
          ? '/department-admin/purchase-requests'
          : r.type === 'MAINTENANCE'
          ? '/department-admin/maintenance-requests'
          : '/department-admin/resource-requests',
    })),
  ];

  const filtered = combinedList.filter((item) => {
    if (activeTab !== 'ALL' && item.category !== activeTab) return false;
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-[#00897B]" />
            Centralized Requisitions & Approvals Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated ledger of all department leave reviews, staff/bed requisitions, purchase indents, and work orders.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Items</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{combinedList.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Attention</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {combinedList.filter((i) => ['PENDING', 'SUBMITTED', 'REQUESTED'].includes(i.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Approved / Active</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            {combinedList.filter((i) => i.status === 'APPROVED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#00897B] uppercase tracking-wider">Completed / Resolved</p>
          <p className="text-2xl font-black text-[#00897B] mt-1">
            {combinedList.filter((i) => ['RESOLVED', 'COMPLETED', 'DELIVERED'].includes(i.status)).length}
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'LEAVES', 'RESOURCES', 'PURCHASE', 'MAINTENANCE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                activeTab === tab
                  ? 'bg-[#1565C0] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL'
                ? 'All Items'
                : tab === 'LEAVES'
                ? 'Leaves'
                : tab === 'RESOURCES'
                ? 'Resources'
                : tab === 'PURCHASE'
                ? 'Purchases'
                : 'Maintenance'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Aggregating department approvals..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Approvals or Requisitions</p>
          <p className="text-xs text-slate-400 mt-1">No pending or historical requests match your query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject & Description</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged</th>
                  <th className="py-3 px-4 text-right">Module Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.priority === 'URGENT' || item.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-[#DC2626]'
                            : item.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status || 'PENDING'} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={item.link}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#00897B] bg-[#E0F2F1] hover:bg-[#E0F2F1] rounded-lg transition inline-flex items-center gap-1"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

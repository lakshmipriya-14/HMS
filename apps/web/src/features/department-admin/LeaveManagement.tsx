import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CalendarOff,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  ThumbsUp,
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'RECOMMEND' | 'APPROVE' | 'REJECT'>('RECOMMEND');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getLeaves({ status: statusFilter || undefined });
      if (res.data) setLeaves(res.data);
    } catch (err: any) {
      console.error('Failed to load leave requests:', err);
      setError(err.message || 'Failed to load department staff leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter]);

  const handleOpenReview = (leave: any, action: 'RECOMMEND' | 'APPROVE' | 'REJECT') => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setRemarks('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    try {
      setSubmitting(true);
      setError('');
      await apiClient.departmentAdmin.reviewLeave(selectedLeave.id, reviewAction, remarks);
      setSelectedLeave(null);
      setSuccessMessage(`Leave request successfully marked as ${reviewAction}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadLeaves();
    } catch (err: any) {
      console.error('Failed to review leave:', err);
      setError(err.message || 'Failed to review leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = leaves.filter((l) => {
    if (!search) return true;
    const name = `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.toLowerCase();
    const role = (l.user?.role || '').toLowerCase();
    const type = (l.leaveType || '').toLowerCase();
    return name.includes(search.toLowerCase()) || role.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <CalendarOff className="w-6 h-6 text-teal-600" />
            Department Leave & Absence Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review leave applications from department doctors, nurses, and technicians to ensure shift coverage.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{leaves.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {leaves.filter((l) => ['PENDING', 'SUBMITTED', 'REQUESTED'].includes(l.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved / Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {leaves.filter((l) => l.status === 'APPROVED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Recommended to HR</p>
          <p className="text-2xl font-black text-teal-700 mt-1">
            {leaves.filter((l) => l.status === 'RECOMMENDED').length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, designation, leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="RECOMMENDED">Recommended</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading department leave requests..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Leave Applications Found</p>
          <p className="text-xs text-slate-400 mt-1">There are no pending or logged leave requests.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Date Range & Days</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>
                        {item.user?.firstName} {item.user?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.user?.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {item.user?.role || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{item.leaveType || 'Casual Leave'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div>
                        {new Date(item.startDate).toLocaleDateString('en-IN')} –{' '}
                        {new Date(item.endDate).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-[10px] text-teal-600 font-bold">{item.totalDays || 1} day(s)</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate">{item.reason || 'Personal'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status || 'PENDING'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['PENDING', 'SUBMITTED', 'REQUESTED'].includes(item.status) ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenReview(item, 'RECOMMEND')}
                            className="px-2 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                          >
                            Recommend
                          </button>
                          <button
                            onClick={() => handleOpenReview(item, 'APPROVE')}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(item, 'REJECT')}
                            className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">
                {reviewAction === 'RECOMMEND'
                  ? 'Recommend Leave to Hospital HR'
                  : reviewAction === 'APPROVE'
                  ? 'Approve Department Leave'
                  : 'Reject Leave Request'}
              </h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="text-slate-700 font-bold">
                  {selectedLeave.user?.firstName} {selectedLeave.user?.lastName} ({selectedLeave.user?.role})
                </div>
                <div className="text-slate-500">
                  {selectedLeave.leaveType} • {new Date(selectedLeave.startDate).toLocaleDateString('en-IN')} to{' '}
                  {new Date(selectedLeave.endDate).toLocaleDateString('en-IN')}
                </div>
                <div className="text-slate-600 italic">"{selectedLeave.reason}"</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Department Admin Remarks {reviewAction === 'REJECT' && '*'}
                </label>
                <textarea
                  required={reviewAction === 'REJECT'}
                  rows={3}
                  placeholder="Enter coverage arrangements, justification, or reason..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition shadow-sm ${
                    reviewAction === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {submitting ? 'Processing...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

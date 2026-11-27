import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const PurchaseRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getRequests({
        type: 'PURCHASE',
        status: statusFilter || undefined,
      });
      if (res.data) setRequests(res.data);
    } catch (err: any) {
      console.error('Failed to load purchase requests:', err);
      setError(err.message || 'Failed to load department purchase requisitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await apiClient.departmentAdmin.createRequest({
        type: 'PURCHASE',
        title: itemName,
        description: `${description} | Est. Cost: ₹${estimatedCost}`,
        quantity: Number(quantity),
        estimatedCost: Number(estimatedCost) || 0,
        priority: 'MEDIUM',
      });
      setShowModal(false);
      setItemName('');
      setDescription('');
      setEstimatedCost('');
      setSuccessMessage('Purchase requisition forwarded to Hospital Procurement & Finance.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadRequests();
    } catch (err: any) {
      console.error('Failed to submit purchase request:', err);
      setError(err.message || 'Failed to submit purchase requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const t = (r.title || '').toLowerCase();
    const d = (r.description || '').toLowerCase();
    return t.includes(search.toLowerCase()) || d.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-[#00897B]" />
            Department Purchase & Capital Requisitions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Procurement requisitions for specialized department tools, medical instruments, and clinical equipment.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Purchase Indent
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-[#16A34A] text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Indents</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{requests.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Awaiting Finance</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {requests.filter((r) => ['PENDING', 'SUBMITTED'].includes(r.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Approved Orders</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            {requests.filter((r) => r.status === 'APPROVED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#00897B] uppercase tracking-wider">Completed / Received</p>
          <p className="text-2xl font-black text-[#00897B] mt-1">
            {requests.filter((r) => ['COMPLETED', 'DELIVERED', 'FULFILLED'].includes(r.status)).length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search purchase requisitions by title or specification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading purchase requisitions..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Purchase Indents Found</p>
          <p className="text-xs text-slate-400 mt-1">Submit a purchase indent when new instruments or items are needed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Item & Specification</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.quantity || 1}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#00897B]">
                      {item.estimatedCost ? `₹${item.estimatedCost.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status || 'PENDING'} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">New Purchase Indent</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5x Portable Diagnostic Otoscopes"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Est. Total Cost (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 45000"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Technical Specifications & Vendor *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify model numbers, brand preference, or vendor quote..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Indent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

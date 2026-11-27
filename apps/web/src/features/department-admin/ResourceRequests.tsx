import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Package,
} from 'lucide-react';

export const ResourceRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('STAFF');
  const [priority, setPriority] = useState('MEDIUM');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getRequests({
        type: 'RESOURCE',
        status: statusFilter || undefined,
      });
      if (res.data) setRequests(res.data);
    } catch (err: any) {
      console.error('Failed to load resource requests:', err);
      setError(err.message || 'Failed to load department resource requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await apiClient.departmentAdmin.createRequest({
        type: 'RESOURCE',
        title,
        description,
        resourceType,
        priority,
        quantity: Number(quantity),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSuccessMessage('Resource requisition submitted to Hospital Administration.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadRequests();
    } catch (err: any) {
      console.error('Failed to submit resource request:', err);
      setError(err.message || 'Failed to submit resource request');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const t = (r.title || '').toLowerCase();
    const d = (r.description || '').toLowerCase();
    const rt = (r.resourceType || '').toLowerCase();
    return t.includes(search.toLowerCase()) || d.includes(search.toLowerCase()) || rt.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#00897B]" />
            Department Resource Requisitions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Request temporary staff, extra ward beds, emergency medical devices, or clinical supplies.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Resource Request
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requisitions</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{requests.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Review</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {requests.filter((r) => ['PENDING', 'SUBMITTED'].includes(r.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Approved & Allocated</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            {requests.filter((r) => r.status === 'APPROVED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#00897B] uppercase tracking-wider">Staff Requests</p>
          <p className="text-2xl font-black text-[#00897B] mt-1">
            {requests.filter((r) => r.resourceType === 'STAFF').length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search requisitions by title, resource type, description..."
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
          <option value="FULFILLED">Fulfilled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading resource requisitions..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Resource Requisitions</p>
          <p className="text-xs text-slate-400 mt-1">Create a new requisition when your department needs additional resources.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Resource Type</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Priority</th>
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
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{item.resourceType || 'General'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.quantity || 1}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">New Resource Requisition</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requisition Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 Additional On-call ICU Nurses for Night Shift"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Resource Type</label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                  >
                    <option value="STAFF">Staff / Nurse / Doctor</option>
                    <option value="BED">Ward / ICU Bed</option>
                    <option value="EQUIPMENT">Biomedical Device</option>
                    <option value="SUPPLIES">Emergency Consumables</option>
                  </select>
                </div>
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
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                >
                  <option value="LOW">Low (Routine)</option>
                  <option value="MEDIUM">Medium (Expected Patient Surge)</option>
                  <option value="HIGH">High (Immediate Clinical Need)</option>
                  <option value="URGENT">Urgent (Emergency / Critical)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Justification *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the clinical circumstances, patient volume, or departmental necessity..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

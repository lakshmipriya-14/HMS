import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Scan,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

export const RadiologyRequests: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getRadiologyRequests({ status: statusFilter || undefined });
      if (res.data) setOrders(res.data);
    } catch (err: any) {
      console.error('Failed to load radiology requests:', err);
      setError(err.message || 'Failed to load department radiology requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const patName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    const uhid = (o.patient?.uhid || '').toLowerCase();
    const orderNo = (o.orderNumber || '').toLowerCase();
    const testName = (o.testName || o.scanType || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || orderNo.includes(search.toLowerCase()) || testName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Scan className="w-6 h-6 text-[#00897B]" />
            Radiology & Imaging Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department diagnostic imaging tracking: X-Ray, CT, MRI, Ultrasound, scan status, and radiologist reports.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Refresh Orders
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scans</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{orders.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Scheduled / Pending</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {orders.filter((o) => ['ORDERED', 'SCHEDULED', 'PENDING'].includes(o.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-sky-500 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-black text-[#1565C0] mt-1">
            {orders.filter((o) => o.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Completed Reports</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            {orders.filter((o) => ['COMPLETED', 'REPORTED'].includes(o.status)).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by UHID, patient name, scan order #, modality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
          >
            <option value="">All Statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading department radiology requests..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Scan className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Radiology Orders Found</p>
          <p className="text-xs text-slate-400 mt-1">
            No diagnostic imaging orders match your current filter parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Order # & Modality</th>
                  <th className="py-3 px-4">Patient (UHID)</th>
                  <th className="py-3 px-4">Scan / Investigation</th>
                  <th className="py-3 px-4">Ordering Physician</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <div>{o.orderNumber || o.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-[10px] text-[#00897B] font-sans font-semibold">
                        {o.modality || 'Imaging'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {o.patient?.firstName} {o.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{o.patient?.uhid || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <div>{o.testName || o.scanType || 'Diagnostic Scan'}</div>
                      {o.clinicalNotes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          Note: {o.clinicalNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      Dr. {o.doctor?.user?.firstName || o.doctor?.name || 'Department Physician'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          o.priority === 'STAT' || o.urgency === 'STAT'
                            ? 'bg-rose-100 text-[#DC2626]'
                            : o.priority === 'URGENT' || o.urgency === 'URGENT'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {o.priority || o.urgency || 'ROUTINE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={o.status || 'ORDERED'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#00897B] bg-[#E0F2F1] hover:bg-[#E0F2F1] rounded-lg transition"
                      >
                        View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-[#00897B]" />
                <h3 className="text-base font-black text-slate-800">Radiology Order Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedOrder.orderNumber || selectedOrder.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">
                  {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName} ({selectedOrder.patient?.uhid})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Scan / Investigation:</span>
                <span className="font-bold text-[#00897B]">
                  {selectedOrder.testName || selectedOrder.scanType || 'Diagnostic Imaging'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Modality:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.modality || 'Radiology'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ordering Physician:</span>
                <span className="font-medium text-slate-800">
                  Dr. {selectedOrder.doctor?.user?.firstName || selectedOrder.doctor?.name || 'Department Physician'}
                </span>
              </div>
              {selectedOrder.reportFindings && (
                <div className="pt-2">
                  <span className="text-slate-500 font-bold block mb-1">Radiologist Report Findings:</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap">
                    {selectedOrder.reportFindings}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

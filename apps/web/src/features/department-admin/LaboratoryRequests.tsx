import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FlaskConical,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Barcode,
} from 'lucide-react';

export const LaboratoryRequests: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getLabRequests({ status: statusFilter || undefined });
      if (res.data) setOrders(res.data);
    } catch (err: any) {
      console.error('Failed to load lab requests:', err);
      setError(err.message || 'Failed to load department laboratory requests');
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
    const barcode = (o.barcode || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || orderNo.includes(search.toLowerCase()) || barcode.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-teal-600" />
            Department Laboratory Requests Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track lab test orders ordered by department physicians, specimen collection barcodes, and report sign-offs.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order ID, patient, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="COLLECTED">Specimen Collected</option>
            <option value="PROCESSING">In Processing</option>
            <option value="COMPLETED">Report Signed & Released</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingState message="Loading department laboratory orders..." />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Order No</th>
                  <th className="py-3.5 px-4 font-bold">Barcode</th>
                  <th className="py-3.5 px-4 font-bold">Patient</th>
                  <th className="py-3.5 px-4 font-bold">Ordering Doctor</th>
                  <th className="py-3.5 px-4 font-bold">Tests Ordered</th>
                  <th className="py-3.5 px-4 font-bold">Priority</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ord) => {
                  const pat = ord.patient;
                  const doc = ord.doctor?.employee?.user;
                  const testNames = ord.orderItems?.map((i: any) => i.labTest?.name).filter(Boolean).join(', ') || 'Diagnostic Panel';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ord.barcode}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{pat?.firstName} {pat?.lastName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{pat?.uhid}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Dr. {doc?.firstName} {doc?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {testNames}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.priority === 'STAT' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
                          {ord.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ord.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No laboratory test requests recorded for department doctors.
        </div>
      )}
    </div>
  );
};

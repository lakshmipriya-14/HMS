import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Stethoscope,
  FlaskConical,
  Scan,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DiagnosticsOverview: React.FC = () => {
  const [data, setData] = useState<any>({ labOrders: [], radiologyOrders: [] });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [labRes, radRes] = await Promise.allSettled([
        apiClient.departmentAdmin.getLabRequests(),
        apiClient.departmentAdmin.getRadiologyRequests(),
      ]);

      const labOrders = labRes.status === 'fulfilled' && labRes.value.data ? labRes.value.data : [];
      const radOrders = radRes.status === 'fulfilled' && radRes.value.data ? radRes.value.data : [];
      setData({ labOrders, radiologyOrders: radOrders });
    } catch (err: any) {
      console.error('Failed to load diagnostics overview:', err);
      setError(err.message || 'Failed to load diagnostics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const combinedItems: any[] = [
    ...data.labOrders.map((o: any) => ({ ...o, category: 'LAB', title: o.testName || 'Lab Investigation' })),
    ...data.radiologyOrders.map((o: any) => ({ ...o, category: 'RADIOLOGY', title: o.testName || o.scanType || 'Radiology Scan' })),
  ];

  const filtered = combinedItems.filter((item) => {
    if (filterType !== 'ALL' && item.category !== filterType) return false;
    if (!search) return true;
    const patName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
    const uhid = (item.patient?.uhid || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || title.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            Diagnostics & Investigations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated view of all laboratory, radiology, and point-of-care investigations ordered in this department.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/department-admin/lab-requests"
            className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <FlaskConical className="w-3.5 h-3.5" /> Lab Portal <ArrowUpRight className="w-3 h-3" />
          </Link>
          <Link
            to="/department-admin/radiology-requests"
            className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <Scan className="w-3.5 h-3.5" /> Radiology Portal <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Diagnostic Orders</p>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1">{combinedItems.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider">Lab Tests</p>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-700 mt-1">{data.labOrders.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Radiology Scans</p>
            <Scan className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-sky-700 mt-1">{data.radiologyOrders.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Awaiting Report</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {combinedItems.filter((i) => !['COMPLETED', 'REPORTED', 'CANCELLED'].includes(i.status)).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by UHID, patient name, investigation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
              filterType === 'ALL' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('LAB')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
              filterType === 'LAB' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Lab Only
          </button>
          <button
            onClick={() => setFilterType('RADIOLOGY')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
              filterType === 'RADIOLOGY' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Radiology Only
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Aggregating department diagnostics..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Investigations Found</p>
          <p className="text-xs text-slate-400 mt-1">There are no diagnostic orders currently active.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Investigation Details</th>
                  <th className="py-3 px-4">Patient (UHID)</th>
                  <th className="py-3 px-4">Physician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={`${item.category}-${item.id}`} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      {item.category === 'LAB' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/50">
                          <FlaskConical className="w-3 h-3" /> LAB
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/50">
                          <Scan className="w-3 h-3" /> RADIOLOGY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {item.orderNumber || item.barcode || item.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">
                        {item.patient?.firstName} {item.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.patient?.uhid || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Department Physician'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status || 'ORDERED'} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
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

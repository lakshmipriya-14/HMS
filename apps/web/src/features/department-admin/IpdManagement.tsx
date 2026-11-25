import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  DoorOpen,
  BedDouble,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Search,
  Eye,
  Filter,
} from 'lucide-react';

export const IpdManagement: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const loadIpd = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getIpdMonitoring();
      if (res.data) setAdmissions(res.data);
    } catch (err: any) {
      console.error('Failed to load IPD census:', err);
      setError(err.message || 'Failed to load IPD monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIpd();
  }, []);

  const filtered = admissions.filter((adm) => {
    if (statusFilter && adm.status !== statusFilter) return false;
    if (!search) return true;
    const name = `${adm.patient?.firstName || ''} ${adm.patient?.lastName || ''}`.toLowerCase();
    const uhid = (adm.patient?.uhid || '').toLowerCase();
    const admNo = (adm.admissionNumber || '').toLowerCase();
    return name.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || admNo.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <DoorOpen className="w-6 h-6 text-teal-600" />
            IPD Inpatient Monitoring & Census
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department inpatients, bed assignments, initial diagnoses, and admission durations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, UHID, or admission ID..."
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
            <option value="ADMITTED">Currently Admitted</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
        </div>
      </div>

      {/* IPD Census Table */}
      {loading ? (
        <LoadingState message="Loading department inpatient census..." />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Admission No</th>
                  <th className="py-3.5 px-4 font-bold">Inpatient</th>
                  <th className="py-3.5 px-4 font-bold">Ward & Bed</th>
                  <th className="py-3.5 px-4 font-bold">Admitting Doctor</th>
                  <th className="py-3.5 px-4 font-bold">Admitted Date</th>
                  <th className="py-3.5 px-4 font-bold">Diagnosis / Reason</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((adm) => {
                  const pat = adm.patient;
                  const doc = adm.admittingDoctor?.employee?.user;
                  const daysAdmitted = Math.max(
                    1,
                    Math.ceil((Date.now() - new Date(adm.admittedAt).getTime()) / (1000 * 60 * 60 * 24))
                  );
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {adm.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{pat?.firstName} {pat?.lastName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{pat?.uhid}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{adm.ward?.name || 'General Ward'}</p>
                        <p className="text-[11px] text-teal-700 font-bold">
                          Room {adm.bed?.roomNumber || '—'} • Bed {adm.bed?.bedNumber || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Dr. {doc?.firstName} {doc?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p>{new Date(adm.admittedAt).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-400 font-medium">Day {daysAdmitted} of stay</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {adm.initialDiagnosis || adm.admissionReason}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={adm.status} />
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
          No inpatients currently admitted under this department.
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  LogOut,
  UserCheck,
  Calendar,
  AlertCircle,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const DischargeMonitoring: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadDischarges = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getDischarges();
      if (res.data) setAdmissions(res.data);
    } catch (err: any) {
      console.error('Failed to load discharge monitoring:', err);
      setError(err.message || 'Failed to load discharge monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDischarges();
  }, []);

  const candidates = admissions.map((adm) => {
    const daysStayed = Math.max(
      1,
      Math.ceil((Date.now() - new Date(adm.admittedAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    const isDischarged = adm.status === 'DISCHARGED';
    const isReadyForDischarge = daysStayed >= 3 && !isDischarged;
    return {
      ...adm,
      daysStayed,
      isDischarged,
      dischargeStatus: isDischarged
        ? 'DISCHARGED'
        : isReadyForDischarge
        ? 'DISCHARGE_CANDIDATE'
        : 'IN_TREATMENT',
    };
  });

  const filtered = candidates.filter((item) => {
    if (!search) return true;
    const name = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
    const uhid = (item.patient?.uhid || '').toLowerCase();
    const admNo = (item.admissionNumber || '').toLowerCase();
    return name.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || admNo.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <LogOut className="w-6 h-6 text-teal-600" />
            Inpatient Discharge Progress & Turnover Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department inpatient length of stay, discharge readiness tracking, and post-discharge bed turnover.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          <strong>Operational Monitoring:</strong> Final clinical discharge summaries are signed by attending doctors, and financial clearance is handled by Billing. Department Admin tracks readiness and bed turnover.
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient name, UHID, admission ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Discharges Table */}
      {loading ? (
        <LoadingState message="Loading discharge tracking data..." />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Admission ID</th>
                  <th className="py-3.5 px-4 font-bold">Patient</th>
                  <th className="py-3.5 px-4 font-bold">Attending Doctor</th>
                  <th className="py-3.5 px-4 font-bold">Ward & Bed</th>
                  <th className="py-3.5 px-4 font-bold">Length of Stay</th>
                  <th className="py-3.5 px-4 font-bold">Discharge Status</th>
                  <th className="py-3.5 px-4 font-bold">Discharged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const pat = item.patient;
                  const doc = item.admittingDoctor?.employee?.user;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {item.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{pat?.firstName} {pat?.lastName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{pat?.uhid}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Dr. {doc?.firstName} {doc?.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.ward?.name} • Room {item.bed?.roomNumber} (Bed {item.bed?.bedNumber})
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {item.daysStayed} Day(s)
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.dischargeStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.dischargedAt ? new Date(item.dischargedAt).toLocaleDateString() : 'Active Inpatient'}
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
          No inpatient discharge records found.
        </div>
      )}
    </div>
  );
};

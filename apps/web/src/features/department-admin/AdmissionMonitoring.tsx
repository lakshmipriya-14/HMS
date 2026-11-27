import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  UserPlus,
  DoorOpen,
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdmissionMonitoring: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getAdmissions();
      if (res.data) setAdmissions(res.data);
    } catch (err: any) {
      console.error('Failed to load admissions:', err);
      setError(err.message || 'Failed to load admission monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const filtered = admissions.filter((adm) => {
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
            <UserPlus className="w-6 h-6 text-[#00897B]" />
            Inpatient Admission Monitoring & Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department IPD admissions, admitting consultant doctor, bed allocation, and diagnostic justifications.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by patient, UHID, or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00897B]"
          />
        </div>
      </div>

      {/* Admissions Table */}
      {loading ? (
        <LoadingState message="Loading department admissions..." />
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Admission ID</th>
                  <th className="py-3.5 px-4 font-bold">Patient</th>
                  <th className="py-3.5 px-4 font-bold">Admitting Doctor</th>
                  <th className="py-3.5 px-4 font-bold">Allocated Ward & Bed</th>
                  <th className="py-3.5 px-4 font-bold">Admission Date</th>
                  <th className="py-3.5 px-4 font-bold">Admission Reason</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((adm) => {
                  const pat = adm.patient;
                  const doc = adm.admittingDoctor?.employee?.user;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#183153]">
                        {adm.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{pat?.firstName} {pat?.lastName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{pat?.uhid}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Dr. {doc?.firstName} {doc?.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{adm.ward?.name || 'General Ward'}</p>
                        <p className="text-[11px] text-[#00897B] font-bold">Room {adm.bed?.roomNumber} • Bed {adm.bed?.bedNumber}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(adm.admittedAt).toLocaleDateString()}
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
          No inpatient admission records recorded for this department.
        </div>
      )}
    </div>
  );
};

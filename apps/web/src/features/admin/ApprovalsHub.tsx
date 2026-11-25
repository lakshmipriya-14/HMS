import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  CalendarCheck,
  BedDouble,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApprovalsHub: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [bedsInMaintenance, setBedsInMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, wardRes] = await Promise.all([
        apiClient.hospitalAdmin.getDepartments(),
        apiClient.hospitalAdmin.getWards(),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);

      // Collect all beds in maintenance / cleaning across all wards
      const maintBeds: any[] = [];
      if (wardRes.data) {
        for (const ward of wardRes.data) {
          if (ward.beds) {
            for (const bed of ward.beds) {
              if (bed.status === 'MAINTENANCE' || bed.status === 'CLEANING' || bed.status === 'HOUSEKEEPING') {
                maintBeds.push({ ...bed, wardName: ward.name });
              }
            }
          }
        }
      }
      setBedsInMaintenance(maintBeds);
    } catch (err: any) {
      console.error('Failed to load approvals:', err);
      setErrorMessage(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearBed = async (bed: any) => {
    try {
      await apiClient.hospitalAdmin.updateBedStatus(bed.id, 'AVAILABLE');
      setSuccessMessage(`Bed ${bed.bedNumber} cleared and returned to AVAILABLE status.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear bed');
    }
  };

  if (loading) return <LoadingState message="Loading hospital approvals hub & pending actions..." />;

  // Filter departments needing attention
  const deptsNeedingAdmin = departments.filter((d) => {
    const hasAdmin = d.userRoleScopes?.some((ur: any) => ur.user);
    return !hasAdmin;
  });

  const deptsNeedingHod = departments.filter((d) => !d.headOfDepartmentId);

  return (
    <div className="space-y-6 pb-12">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <CheckSquare className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Executive Approvals & Action Hub</h1>
            <p className="text-xs text-slate-500">
              Departmental governance, bed maintenance turnovers, and operational task clearances
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Approval Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Administrative Coverage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Department Administrative Coverage</h3>
            </div>
            <span className="px-2 py-0.5 rounded font-bold text-xs bg-amber-100 text-amber-800">
              {deptsNeedingAdmin.length} Needs Attention
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Hospital bylaws require exactly one active Department Admin per department for operational governance.
          </p>

          {deptsNeedingAdmin.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              All clinical departments have assigned administrators.
            </div>
          ) : (
            <div className="space-y-2.5">
              {deptsNeedingAdmin.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900">{dept.name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{dept.code}</span>
                  </div>

                  <Link
                    to="/admin/departments"
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1"
                  >
                    Assign Admin
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bed Maintenance & Housekeeping Turnover Clearances */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Bed Turnover Clearances</h3>
            </div>
            <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-700">
              {bedsInMaintenance.length} In Progress
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Release beds from engineering maintenance or terminal housekeeping cleaning back into active admission circulation.
          </p>

          {bedsInMaintenance.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No beds currently waiting for housekeeping or maintenance sign-off.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {bedsInMaintenance.map((bed) => (
                <div
                  key={bed.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Bed {bed.bedNumber}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Room {bed.roomNumber}</span>
                    </div>
                    <span className="text-[10px] text-teal-700 font-semibold">{bed.wardName}</span>
                    <span className="text-[10px] text-amber-700 block font-semibold uppercase">{bed.status}</span>
                  </div>

                  <button
                    onClick={() => handleClearBed(bed)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1"
                  >
                    Clear to Available
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

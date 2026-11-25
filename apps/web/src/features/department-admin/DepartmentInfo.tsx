import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { Modal } from '../../components/Modal';
import {
  Building2,
  UserCheck,
  Clock,
  Shield,
  Layers,
  Edit,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';

export const DepartmentInfo: React.FC = () => {
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getInfo();
      if (res.data) {
        setDepartment(res.data);
        setEditName(res.data.name || '');
        setEditDescription(res.data.description || '');
      }
    } catch (err: any) {
      console.error('Failed to load department info:', err);
      setError(err.message || 'Failed to load department info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.updateInfo({
        name: editName,
        description: editDescription,
      });
      setSuccess('Department details updated successfully.');
      setIsEditOpen(false);
      await loadInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to update department details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading department configuration & parameters..." />;
  }

  const hod = department?.headOfDepartment;
  const admin = department?.userRoleScopes?.[0]?.user;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-teal-600" />
            Department Specification & Parameters
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department-level operational capacity, designated leadership, and operating parameters.
          </p>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-900/20"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit Permitted Details
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Metadata */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Identity & Operational Scope
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Department Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{department?.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Department Code</span>
                <span className="font-bold text-teal-700 font-mono text-sm mt-0.5 block">{department?.code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Branch Location</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{department?.branch?.name} ({department?.branch?.city})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Operating Hospital</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{department?.hospital?.name}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              Clinical Description & Scope
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {department?.description || 'Comprehensive clinical outpatient and inpatient care services.'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Department Resource Totals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-center">
                <span className="text-2xl font-black text-teal-700">{department?._count?.doctors || 0}</span>
                <span className="block text-[11px] text-teal-600 font-semibold mt-0.5">Assigned Doctors</span>
              </div>
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
                <span className="text-2xl font-black text-indigo-700">{department?._count?.employees || 0}</span>
                <span className="block text-[11px] text-indigo-600 font-semibold mt-0.5">Staff & Nurses</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
                <span className="text-2xl font-black text-amber-700">{department?._count?.wards || 0}</span>
                <span className="block text-[11px] text-amber-600 font-semibold mt-0.5">Assigned Wards</span>
              </div>
              <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl text-center">
                <span className="text-2xl font-black text-sky-700">{department?._count?.appointments || 0}</span>
                <span className="block text-[11px] text-sky-600 font-semibold mt-0.5">Appointments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leadership Cards */}
        <div className="space-y-6">
          {/* HOD Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Clinical Leadership
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-2 mb-3">Head of Department (HOD)</h3>
            {hod ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                    {hod.employee?.user?.firstName?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Dr. {hod.employee?.user?.firstName} {hod.employee?.user?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500">{hod.designation} • {hod.specialization}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] mt-2">
                  <p><span className="text-slate-400">License:</span> <span className="font-mono text-slate-700">{hod.licenseNumber}</span></p>
                  <p><span className="text-slate-400">Consultation Fee:</span> <span className="font-semibold text-slate-800">₹{hod.consultationFee}</span></p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No Head of Department assigned yet.</p>
            )}
          </div>

          {/* Department Admin Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Operations Lead
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-2 mb-3">Assigned Department Admin</h3>
            {admin ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {admin.firstName?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{admin.firstName} {admin.lastName}</p>
                    <p className="text-[11px] text-slate-500">{admin.email}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] mt-2">
                  <p><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{admin.phone || 'N/A'}</span></p>
                  <p><span className="text-slate-400">Role Status:</span> <span className="text-emerald-600 font-semibold">Active Scoped Admin</span></p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Department Admin account info unavailable.</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>Permission Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Hospital Admin governs department code assignments and administrator appointment. Only operational description and clinical hours may be updated directly.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Permitted Info Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Permitted Department Information"
        subtitle="Department Admin is authorized to update description and operational details."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Description & Scope</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
            <strong>Note:</strong> Department Code ({department?.code}) and Hospital Admin assignment cannot be modified by Department Admin.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

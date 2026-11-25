import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  UserCheck,
  Search,
  Plus,
  Edit,
  Clock,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [designation, setDesignation] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: 'SPECIALIST',
    licenseNumber: '',
    specialization: 'General Medicine',
    consultationFee: 500,
    shift: 'MORNING',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getDoctors({
        search: search || undefined,
        designation: designation || undefined,
      });
      if (res.data) setDoctors(res.data);
    } catch (err: any) {
      console.error('Failed to load doctors:', err);
      setError(err.message || 'Failed to load department doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [search, designation]);

  const handleToggleStatus = async (doctor: any) => {
    try {
      await apiClient.departmentAdmin.toggleDoctorStatus(doctor.id);
      setSuccess(`Doctor ${doctor.employee?.user?.firstName} availability status updated.`);
      await loadDoctors();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle doctor status');
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.addDoctor(formData);
      setSuccess('Doctor added to department successfully.');
      setIsAddOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: 'SPECIALIST',
        licenseNumber: '',
        specialization: 'General Medicine',
        consultationFee: 500,
        shift: 'MORNING',
      });
      await loadDoctors();
    } catch (err: any) {
      setError(err.message || 'Failed to add doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.updateDoctor(selectedDoctor.id, {
        designation: formData.designation,
        specialization: formData.specialization,
        consultationFee: Number(formData.consultationFee),
        shift: formData.shift,
      });
      setSuccess('Doctor record updated successfully.');
      setIsEditOpen(false);
      await loadDoctors();
    } catch (err: any) {
      setError(err.message || 'Failed to update doctor');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (doc: any) => {
    setSelectedDoctor(doc);
    setFormData({
      firstName: doc.employee?.user?.firstName || '',
      lastName: doc.employee?.user?.lastName || '',
      email: doc.employee?.user?.email || '',
      phone: doc.employee?.user?.phone || '',
      designation: doc.designation || 'SPECIALIST',
      licenseNumber: doc.licenseNumber || '',
      specialization: doc.specialization || '',
      consultationFee: Number(doc.consultationFee) || 500,
      shift: doc.shift || 'MORNING',
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-teal-600" />
            Department Doctor Directory & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical specialist rosters, daily availability, and consultation parameters.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-900/20"
        >
          <Plus className="w-4 h-4" />
          Add Department Doctor
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by doctor name, specialization, license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 font-medium text-slate-700"
          >
            <option value="">All Designations</option>
            <option value="GENERAL_PHYSICIAN">General Physician</option>
            <option value="SPECIALIST">Specialist</option>
            <option value="SURGEON">Surgeon</option>
            <option value="DUTY_DOCTOR">Duty Doctor</option>
            <option value="RESIDENT_DOCTOR">Resident Doctor</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards / Table */}
      {loading ? (
        <LoadingState message="Loading department doctors..." />
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => {
            const user = doc.employee?.user;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-teal-900/20">
                        {user?.firstName?.[0] || 'D'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          Dr. {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-[11px] text-teal-600 font-semibold">{doc.specialization}</p>
                      </div>
                    </div>
                    <StatusBadge status={doc.isAvailableToday ? 'AVAILABLE' : 'OFF_DUTY'} />
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Designation:</span>
                      <span className="font-semibold text-slate-700">{doc.designation?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">License No:</span>
                      <span className="font-mono text-slate-700">{doc.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consultation Fee:</span>
                      <span className="font-bold text-slate-800">₹{doc.consultationFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shift:</span>
                      <span className="text-slate-700 font-medium">{doc.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duty Days:</span>
                      <span className="text-slate-700 text-[11px] font-medium">{doc.availableDays?.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 mt-2">
                  <button
                    onClick={() => handleToggleStatus(doc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      doc.isAvailableToday
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {doc.isAvailableToday ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                    {doc.isAvailableToday ? 'Set Off Duty' : 'Set Available'}
                  </button>

                  <button
                    onClick={() => openEdit(doc)}
                    className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                    title="Edit Doctor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No doctors found for this department. Click "Add Department Doctor" to assign.
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Department Doctor"
        subtitle="Provision a doctor directly linked to this assigned department."
        maxWidth="lg"
      >
        <form onSubmit={handleAddDoctor} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="GENERAL_PHYSICIAN">General Physician</option>
                <option value="SPECIALIST">Specialist</option>
                <option value="SURGEON">Surgeon</option>
                <option value="DUTY_DOCTOR">Duty Doctor</option>
                <option value="RESIDENT_DOCTOR">Resident Doctor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical License Number</label>
              <input
                type="text"
                required
                placeholder="MCI-TN-XXXX"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Dr. ${selectedDoctor?.employee?.user?.firstName} ${selectedDoctor?.employee?.user?.lastName}`}
        subtitle="Update permitted consultation fee, specialization, and shift assignment."
        maxWidth="lg"
      >
        <form onSubmit={handleEditDoctor} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="GENERAL_PHYSICIAN">General Physician</option>
                <option value="SPECIALIST">Specialist</option>
                <option value="SURGEON">Surgeon</option>
                <option value="DUTY_DOCTOR">Duty Doctor</option>
                <option value="RESIDENT_DOCTOR">Resident Doctor</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="MORNING">Morning (09:00 - 13:00)</option>
                <option value="EVENING">Evening (14:00 - 18:00)</option>
                <option value="NIGHT">Night On-Call</option>
                <option value="ROTATING">Rotating</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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

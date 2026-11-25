import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  Award,
  Edit2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: 'GENERAL_PHYSICIAN',
    licenseNumber: '',
    specialization: '',
    subSpecialization: '',
    experienceYears: 5,
    consultationFee: 500,
    followUpFee: 300,
    opdFee: 500,
    ipdAvailable: true,
    consultationDurationMin: 15,
    shift: 'MORNING',
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  });

  const [scheduleData, setScheduleData] = useState({
    availableDays: [] as string[],
    shift: 'MORNING',
    isAvailableToday: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, deptRes] = await Promise.all([
        apiClient.hospitalAdmin.getDoctors({
          departmentId: departmentFilter || undefined,
          designation: designationFilter || undefined,
        }),
        apiClient.hospitalAdmin.getDepartments(),
      ]);
      if (docRes.data) setDoctors(docRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (err: any) {
      console.error('Failed to load doctors:', err);
      setErrorMessage(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [departmentFilter, designationFilter]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createDoctor(formData);
      setSuccessMessage(`Dr. ${formData.firstName} ${formData.lastName} successfully registered.`);
      setAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateDoctorSchedule(selectedDoctor.id, scheduleData);
      setSuccessMessage('Duty schedule and daily availability updated.');
      setScheduleModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodayAvailability = async (doc: any) => {
    try {
      await apiClient.hospitalAdmin.updateDoctorSchedule(doc.id, {
        isAvailableToday: !doc.isAvailableToday,
      });
      setSuccessMessage(`Dr. ${doc.employee?.user?.lastName || ''} availability toggled.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle availability');
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const user = doc.employee?.user;
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    const lic = (doc.licenseNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || spec.includes(query) || lic.includes(query);
  });

  const availableCount = doctors.filter((d) => d.isAvailableToday).length;

  if (loading) return <LoadingState message="Loading hospital clinical doctor directory..." />;

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
            <UserCheck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Doctor Directory & Clinical Rostering</h1>
            <p className="text-xs text-slate-500">
              Manage attending consultants, outpatient duty shifts, and clinical availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {availableCount} / {doctors.length} Doctors Available Today
          </div>

          <button
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                departmentId: departments[0]?.id || '',
                designation: 'GENERAL_PHYSICIAN',
                licenseNumber: '',
                specialization: '',
                subSpecialization: '',
                experienceYears: 5,
                consultationFee: 500,
                followUpFee: 300,
                opdFee: 500,
                ipdAvailable: true,
                consultationDurationMin: 15,
                shift: 'MORNING',
                availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
              });
              setErrorMessage('');
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by doctor name, license, specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        <select
          value={designationFilter}
          onChange={(e) => setDesignationFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Designations</option>
          <option value="GENERAL_PHYSICIAN">General Physician</option>
          <option value="SPECIALIST">Specialist</option>
          <option value="SURGEON">Surgeon</option>
          <option value="DUTY_DOCTOR">Duty Doctor</option>
          <option value="RESIDENT_DOCTOR">Resident Doctor</option>
        </select>
      </div>

      {/* Doctors Table / Cards */}
      {filteredDoctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="Try clearing your search filters or click 'Add Doctor' to register a clinical physician."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => {
            const user = doc.employee?.user;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {doc.designation?.replace(/_/g, ' ')}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Dr. {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-xs font-semibold text-teal-700">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{doc.department?.name}</p>
                    </div>

                    <button
                      onClick={() => handleToggleTodayAvailability(doc)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        doc.isAvailableToday
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {doc.isAvailableToday ? 'On Duty Today' : 'Off Duty'}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-slate-400" /> License
                      </span>
                      <span className="font-mono font-semibold text-slate-800">{doc.licenseNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Shift
                      </span>
                      <span className="font-semibold text-slate-800">{doc.shift}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" /> OPD Fee
                      </span>
                      <span className="font-bold text-emerald-700">₹{Number(doc.consultationFee || 500)}</span>
                    </div>

                    {user?.phone && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                        </span>
                        <span className="text-slate-700 font-medium">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>Days:</span>
                    <span className="font-bold text-slate-800">
                      {doc.availableDays?.length === 7 ? 'Daily' : doc.availableDays?.join(', ') || 'Mon-Sat'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setScheduleData({
                        availableDays: doc.availableDays || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
                        shift: doc.shift || 'MORNING',
                        isAvailableToday: doc.isAvailableToday,
                      });
                      setScheduleModalOpen(true);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all"
                  >
                    Set Schedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Clinical Doctor">
        <form onSubmit={handleCreateDoctor} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
              <select
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="GENERAL_PHYSICIAN">General Physician</option>
                <option value="SPECIALIST">Specialist</option>
                <option value="SURGEON">Surgeon</option>
                <option value="DUTY_DOCTOR">Duty Doctor</option>
                <option value="RESIDENT_DOCTOR">Resident Doctor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License Number (MCI/NMC) *</label>
              <input
                type="text"
                required
                placeholder="e.g. TN-MED-49201"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Specialization *</label>
              <input
                type="text"
                required
                placeholder="e.g. Interventional Cardiology"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.followUpFee}
                onChange={(e) => setFormData({ ...formData, followUpFee: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="MORNING">Morning (08:00 - 14:00)</option>
                <option value="EVENING">Evening (14:00 - 20:00)</option>
                <option value="NIGHT">Night (20:00 - 08:00)</option>
                <option value="ROTATING">Rotating</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Registering...' : 'Complete Doctor Registration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SCHEDULE MODAL */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={`Duty Schedule: Dr. ${selectedDoctor?.employee?.user?.lastName || ''}`}
      >
        <form onSubmit={handleUpdateSchedule} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h5 className="text-xs font-bold text-slate-800">Available on Duty Today</h5>
              <p className="text-[11px] text-slate-500">Enable or disable doctor for today's OPD token bookings</p>
            </div>
            <input
              type="checkbox"
              checked={scheduleData.isAvailableToday}
              onChange={(e) => setScheduleData({ ...scheduleData, isAvailableToday: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
            <select
              value={scheduleData.shift}
              onChange={(e) => setScheduleData({ ...scheduleData, shift: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="MORNING">Morning Shift (08:00 - 14:00)</option>
              <option value="EVENING">Evening Shift (14:00 - 20:00)</option>
              <option value="NIGHT">Night Shift (20:00 - 08:00)</option>
              <option value="ROTATING">Rotating</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Available Clinical Working Days</label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => {
                const checked = scheduleData.availableDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => {
                      if (checked) {
                        setScheduleData({
                          ...scheduleData,
                          availableDays: scheduleData.availableDays.filter((d) => d !== day),
                        });
                      } else {
                        setScheduleData({
                          ...scheduleData,
                          availableDays: [...scheduleData.availableDays, day],
                        });
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                      checked
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Saving...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

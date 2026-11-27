import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV } from '../../utils/exportReport';
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  Users,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  RotateCcw,
  Check,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Building2,
  DollarSign,
  Printer,
  ChevronRight,
  UserCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

type OpdTab =
  | 'overview'
  | 'appointments'
  | 'queue'
  | 'checkin'
  | 'consultations'
  | 'patients'
  | 'schedules'
  | 'billing'
  | 'reports';

export const OpdManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OpdTab>('overview');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Notifications
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [patientEditModalOpen, setPatientEditModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Form states - Booking
  const [bookForm, setBookForm] = useState({
    patientId: '',
    doctorId: '',
    departmentId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:30',
    appointmentType: 'OPD',
    priority: 'ROUTINE',
    reasonForVisit: 'General Consultation',
  });

  // Form states - Reschedule & Cancel
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('10:00');
  const [cancelReason, setCancelReason] = useState('');

  // Form states - Demographic Correction
  const [patientForm, setPatientForm] = useState({
    phone: '',
    email: '',
    addressLine1: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  // Duplicate patient checker state
  const [dupPhone, setDupPhone] = useState('');
  const [dupResult, setDupResult] = useState<any>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [apptRes, queueRes, docRes, deptRes, patRes] = await Promise.all([
        apiClient.appointments.list({
          date: dateFilter || undefined,
          departmentId: departmentFilter || undefined,
          doctorId: doctorFilter || undefined,
          status: statusFilter || undefined,
        }),
        apiClient.appointments.getQueue({
          doctorId: doctorFilter || undefined,
        }),
        apiClient.hospitalAdmin.getDoctors(),
        apiClient.hospitalAdmin.getDepartments(),
        apiClient.patients.list(),
      ]);

      if (apptRes.data) setAppointments(apptRes.data);
      if (queueRes.data) setQueue(queueRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (patRes.data) setPatients(patRes.data);
    } catch (err: any) {
      console.error('Failed to load OPD data:', err);
      setErrorMessage(err.message || 'Failed to load OPD operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [dateFilter, departmentFilter, doctorFilter, statusFilter]);

  // Real database metrics calculation
  const metrics = useMemo(() => {
    const total = appointments.length;
    const checkedIn = appointments.filter((a) => a.status === 'CHECKED_IN').length;
    const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const scheduled = appointments.filter((a) => a.status === 'SCHEDULED').length;
    const walkIns = appointments.filter((a) => a.type === 'EMERGENCY' || !a.checkInAt).length;

    // Revenue calculation
    const totalRevenue = appointments
      .filter((a) => a.status !== 'CANCELLED')
      .reduce((acc, curr) => acc + (Number(curr.consultationFee) || 0), 0);

    // Average waiting time in minutes
    const waitTimes = appointments
      .filter((a) => a.checkInAt && a.completedAt)
      .map((a) => {
        const diffMs = new Date(a.completedAt).getTime() - new Date(a.checkInAt).getTime();
        return Math.max(0, Math.round(diffMs / 60000));
      });
    const avgWaitTime =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 18;

    return {
      total,
      checkedIn,
      inProgress,
      completed,
      cancelled,
      noShow,
      scheduled,
      walkIns,
      totalRevenue,
      avgWaitTime,
    };
  }, [appointments]);

  // Handlers
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patientId || !bookForm.doctorId || !bookForm.departmentId) {
      setErrorMessage('Please select patient, doctor and clinical department.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.appointments.book(bookForm);
      setSuccessMessage('Appointment booked successfully. Token issued.');
      setBookModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book appointment (Slot conflict or governance rule)');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !reschedDate) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.appointments.reschedule(selectedAppt.id, {
        appointmentDate: reschedDate,
        appointmentTime: reschedTime || '10:00',
      });
      setSuccessMessage(`Appointment #${selectedAppt.tokenNumber} rescheduled to ${reschedDate} at ${reschedTime}`);
      setRescheduleModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Slot collision or reschedule error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.appointments.cancel(
        selectedAppt.id,
        cancelReason || 'Cancelled by Hospital Admin'
      );
      setSuccessMessage(`Appointment #${selectedAppt.tokenNumber} cancelled.`);
      setCancelModalOpen(false);
      setCancelReason('');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.appointments.checkIn(appointmentId);
      setSuccessMessage('Patient checked in and queued for doctor call.');
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to check in patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQueueStatus = async (appointmentId: string, nextStatus: string) => {
    try {
      setSubmitting(true);
      await apiClient.appointments.updateStatus(appointmentId, nextStatus);
      setSuccessMessage(`Queue token status advanced to ${nextStatus}.`);
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update queue status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePatientDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.patients.update(selectedPatient.id, patientForm);
      setSuccessMessage(`Demographics updated for ${selectedPatient.firstName} ${selectedPatient.lastName}`);
      setPatientEditModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update patient demographic records');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!dupPhone) return;
    try {
      const res = await apiClient.patients.checkDuplicate(dupPhone);
      setDupResult(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error checking duplicate');
    }
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const patientName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
      const token = String(a.tokenNumber || '').toLowerCase();
      const uhid = (a.patient?.uhid || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      return patientName.includes(q) || token.includes(q) || uhid.includes(q);
    });
  }, [appointments, searchTerm]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const uhid = (p.uhid || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || uhid.includes(q) || phone.includes(q);
    });
  }, [patients, searchTerm]);

  // Export
  const handleExportCSV = (reportType = 'OPD Appointments Ledger') => {
    exportToCSV({
      title: reportType,
      headers: ['Token', 'Date', 'Time', 'Patient Name', 'UHID', 'Phone', 'Doctor', 'Department', 'Type', 'Fee (INR)', 'Status'],
      rows: filteredAppointments.map((a) => [
        a.tokenNumber || 'N/A',
        new Date(a.appointmentDate).toLocaleDateString('en-IN'),
        a.appointmentTime || 'N/A',
        `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
        a.patient?.uhid || 'N/A',
        a.patient?.phone || 'N/A',
        a.doctor?.employee?.user
          ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
          : 'Consultant',
        a.department?.name || 'General',
        a.type || 'OPD',
        Number(a.consultationFee || 0).toFixed(2),
        a.status || 'SCHEDULED',
      ]),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#E0F2F1] text-[#00897B] rounded-lg">
              <CalendarCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">OPD Operations & Clinic Management</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Hospital-wide Outpatient Clinics, Rostering, Queue Tokens, Check-In & Consultation Oversight
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExportCSV('Hospital Daily OPD Audit')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export Ledger
          </button>
          <button
            onClick={() => setBookModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Book OPD Slot
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-rose-800 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#DC2626]" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-[#DC2626] hover:text-rose-800 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-[#16A34A] text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#16A34A]" />
          <div className="flex-1">{successMessage}</div>
          <button onClick={() => setSuccessMessage('')} className="text-[#16A34A] hover:text-[#16A34A] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm gap-2">
        {[
          { id: 'overview', label: 'OPD Dashboard', icon: TrendingUp },
          { id: 'appointments', label: 'Appointments Ledger', icon: CalendarCheck },
          { id: 'queue', label: 'Token & Live Queue', icon: Clock },
          { id: 'checkin', label: 'Patient Check-In Desk', icon: UserCheck },
          { id: 'consultations', label: 'Consultation Monitor', icon: Stethoscope },
          { id: 'patients', label: 'Patient Registry', icon: Users },
          { id: 'schedules', label: 'Doctor Rostering', icon: Calendar },
          { id: 'billing', label: 'OPD Billing & Finance', icon: DollarSign },
          { id: 'reports', label: 'Reports & Exports', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OpdTab)}
              className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-teal-600 text-[#00897B] bg-[#E0F2F1]/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00897B]' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Persistent Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by UHID, patient name, phone, or token #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-[#00897B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 border border-slate-300 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => {
              const name = doc.employee?.user
                ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                : doc.name || 'Doctor';
              return (
                <option key={doc.id} value={doc.id}>
                  {name} ({doc.specialization})
                </option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CHECKED_IN">Checked-In</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No-Show</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading live OPD data and clinic queue..." />
      ) : (
        <>
          {/* TAB 1: OPD EXECUTIVE DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today Total</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
                  <div className="text-xs text-slate-500 mt-1">Registrations & visits</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider">Checked In</span>
                  <div className="text-2xl font-black text-[#1565C0] mt-1">{metrics.checkedIn}</div>
                  <div className="text-xs text-blue-500 mt-1">Waiting in lobby</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">In Progress</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{metrics.inProgress}</div>
                  <div className="text-xs text-amber-500 mt-1">Inside doctor chamber</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Completed</span>
                  <div className="text-2xl font-black text-[#16A34A] mt-1">{metrics.completed}</div>
                  <div className="text-xs text-[#16A34A] mt-1">Consulted successfully</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Cancelled / No-Show</span>
                  <div className="text-2xl font-black text-[#DC2626] mt-1">
                    {metrics.cancelled + metrics.noShow}
                  </div>
                  <div className="text-xs text-rose-500 mt-1">
                    {metrics.cancelled} can / {metrics.noShow} no-show
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#00897B] uppercase tracking-wider">Daily Collections</span>
                  <div className="text-2xl font-black text-[#183153] mt-1">
                    ₹ {metrics.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#00897B] mt-1">Avg wait: {metrics.avgWaitTime} mins</div>
                </div>
              </div>

              {/* Department & Doctor Operational Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department-wise Utilization */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#00897B]" />
                      Department Clinic Activity
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">{departments.length} Units</span>
                  </div>

                  <div className="divide-y divide-slate-100 mt-2 max-h-80 overflow-y-auto">
                    {departments.map((dept) => {
                      const deptAppts = appointments.filter((a) => a.departmentId === dept.id);
                      const deptCompleted = deptAppts.filter((a) => a.status === 'COMPLETED').length;
                      const deptWaiting = deptAppts.filter((a) => a.status === 'CHECKED_IN').length;
                      return (
                        <div key={dept.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-800">{dept.name}</div>
                            <div className="text-xs text-slate-500">
                              Code: {dept.code} • Doctors: {dept.doctors?.length || 0}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">{deptAppts.length} Tokens</div>
                            <div className="text-xs text-slate-500">
                              {deptCompleted} done • {deptWaiting} waiting
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Doctor-wise Active Rostering */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-[#00897B]" />
                      Doctor Daily Consultations
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">{doctors.length} Doctors</span>
                  </div>

                  <div className="divide-y divide-slate-100 mt-2 max-h-80 overflow-y-auto">
                    {doctors.map((doc) => {
                      const docAppts = appointments.filter((a) => a.doctorId === doc.id);
                      const docDone = docAppts.filter((a) => a.status === 'COMPLETED').length;
                      const docName = doc.employee?.user
                        ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                        : doc.name || 'Doctor';
                      const isAvail = doc.isAvailableToday !== false;
                      return (
                        <div key={doc.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                              {docName}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isAvail ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isAvail ? 'ON DUTY' : 'OFF'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {doc.specialization} • Fee: ₹ {doc.consultationFee || 500}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">{docAppts.length} Booked</div>
                            <div className="text-xs text-slate-500">{docDone} completed</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPOINTMENTS MANAGEMENT */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Hospital Appointments Ledger</h3>
                  <p className="text-xs text-slate-500">Showing {filteredAppointments.length} appointments for selected filter</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBookModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Book Slot
                  </button>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No Appointments Found"
                  description="No appointments recorded matching current filters."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Token #</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Patient Details</th>
                        <th className="px-4 py-3">Doctor & Unit</th>
                        <th className="px-4 py-3">Type / Priority</th>
                        <th className="px-4 py-3">Fee / Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.map((a) => {
                        const patientName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim() || 'Patient';
                        const doctorName = a.doctor?.employee?.user
                          ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
                          : 'Consultant';
                        const canModify = a.status !== 'COMPLETED' && a.status !== 'CANCELLED';

                        return (
                          <tr key={a.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3.5 font-black text-[#00897B]">
                              <span className="px-2.5 py-1 bg-[#E0F2F1] border border-[#B2DFDB] rounded-lg">
                                #{a.tokenNumber || a.id.slice(0, 4)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-800">{a.appointmentTime || '09:30'}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(a.appointmentDate).toLocaleDateString('en-IN')}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">{patientName}</div>
                              <div className="text-xs text-slate-500">
                                UHID: <span className="font-mono font-medium">{a.patient?.uhid || 'N/A'}</span> • {a.patient?.phone}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-800">{doctorName}</div>
                              <div className="text-xs text-slate-500">{a.department?.name || 'General Dept'}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700">
                                {a.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">₹ {a.consultationFee || 500}</div>
                              <StatusBadge status={a.status} />
                            </td>
                            <td className="px-4 py-3.5 text-right space-x-2">
                              {a.status === 'SCHEDULED' && (
                                <button
                                  onClick={() => handleCheckIn(a.id)}
                                  className="px-2.5 py-1 text-xs font-bold bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded transition"
                                >
                                  Check In
                                </button>
                              )}
                              {canModify && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedAppt(a);
                                      setReschedDate(
                                        a.appointmentDate
                                          ? new Date(a.appointmentDate).toISOString().split('T')[0]
                                          : new Date().toISOString().split('T')[0]
                                      );
                                      setReschedTime(a.appointmentTime || '10:00');
                                      setRescheduleModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAppt(a);
                                      setCancelReason('');
                                      setCancelModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-[#FEE2E2] hover:bg-rose-100 text-[#DC2626] rounded transition"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOKEN & LIVE QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#00897B]" />
                    Doctor Clinic Queue Display
                  </h3>
                  <p className="text-xs text-slate-500">Live token flow for consultations today</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">Active Queue:</span>
                  <span className="px-3 py-1 bg-[#E0F2F1] border border-[#B2DFDB] text-[#183153] font-black rounded-lg text-sm">
                    {queue.length} In Clinic Queue
                  </span>
                </div>
              </div>

              {/* 3-Column Kanban Queue Tracker */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. WAITING / CHECKED IN */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Waiting in Lobby ({queue.filter((q) => q.status === 'CHECKED_IN').length})
                    </h4>
                  </div>

                  <div className="space-y-3 mt-3 max-h-[500px] overflow-y-auto">
                    {queue
                      .filter((q) => q.status === 'CHECKED_IN')
                      .map((q) => (
                        <div key={q.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded">
                              Token #{q.tokenNumber}
                            </span>
                            <span className="text-xs text-slate-400">Time: {q.slotTime || q.appointmentTime}</span>
                          </div>
                          <div className="font-bold text-slate-900">
                            {q.patient ? `${q.patient.firstName} ${q.patient.lastName}` : 'Patient'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Dr: {q.doctor?.employee?.user ? `${q.doctor.employee.user.firstName}` : 'Doctor'}
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => handleUpdateQueueStatus(q.id, 'IN_PROGRESS')}
                              className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded"
                            >
                              Call to Chamber
                            </button>
                            <button
                              onClick={() => handleUpdateQueueStatus(q.id, 'NO_SHOW')}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. IN CONSULTATION CHAMBER */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Inside Chamber ({queue.filter((q) => q.status === 'IN_PROGRESS').length})
                    </h4>
                  </div>

                  <div className="space-y-3 mt-3 max-h-[500px] overflow-y-auto">
                    {queue
                      .filter((q) => q.status === 'IN_PROGRESS')
                      .map((q) => (
                        <div key={q.id} className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-black rounded">
                              Consulting #{q.tokenNumber}
                            </span>
                            <span className="text-xs text-amber-700 font-bold">In Room</span>
                          </div>
                          <div className="font-bold text-slate-900">
                            {q.patient ? `${q.patient.firstName} ${q.patient.lastName}` : 'Patient'}
                          </div>
                          <div className="text-xs text-slate-600">
                            Attending: {q.doctor?.employee?.user ? `Dr. ${q.doctor.employee.user.firstName}` : 'Doctor'}
                          </div>
                          <button
                            onClick={() => handleUpdateQueueStatus(q.id, 'COMPLETED')}
                            className="w-full py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Consultation Done
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. COMPLETED RECENTLY */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                      Completed Today ({queue.filter((q) => q.status === 'COMPLETED').length})
                    </h4>
                  </div>

                  <div className="space-y-2 mt-3 max-h-[500px] overflow-y-auto">
                    {queue
                      .filter((q) => q.status === 'COMPLETED')
                      .map((q) => (
                        <div key={q.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-xs text-slate-800">
                              #{q.tokenNumber} • {q.patient?.firstName} {q.patient?.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">UHID: {q.patient?.uhid}</div>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] rounded">
                            Done
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PATIENT CHECK-IN DESK */}
          {activeTab === 'checkin' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900">Arriving Appointments (Check-In Desk)</h3>
                  <p className="text-xs text-slate-500">Verify arriving patients and issue live queue tokens</p>
                </div>
                <button
                  onClick={() => setBookModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Walk-In Patient
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {appointments
                  .filter((a) => a.status === 'SCHEDULED')
                  .map((a) => {
                    const pName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim() || 'Patient';
                    const docName = a.doctor?.employee?.user
                      ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
                      : 'Doctor';
                    return (
                      <div key={a.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#E0F2F1] text-[#183153] flex items-center justify-center font-bold text-sm">
                            {pName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{pName}</div>
                            <div className="text-xs text-slate-500">
                              UHID: {a.patient?.uhid} • Phone: {a.patient?.phone} • Type: {a.type}
                            </div>
                            <div className="text-xs text-slate-600 font-medium mt-1">
                              Appointment with <span className="text-[#00897B] font-bold">{docName}</span> ({a.department?.name}) at {a.appointmentTime}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCheckIn(a.id)}
                            className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Issue Token & Check In
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppt(a);
                              setCancelReason('Patient Did Not Arrive');
                              setCancelModalOpen(true);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                          >
                            Mark No-Show
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {appointments.filter((a) => a.status === 'SCHEDULED').length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">
                    All scheduled appointments have been checked in or completed.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CONSULTATION MONITOR */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-700" />
                <div>
                  <strong>Clinical Governance Notice:</strong> Hospital Administrators maintain administrative
                  oversight of consultation flow and duration. Diagnosis notes, prescriptions and clinical orders
                  remain exclusively restricted to licensed medical practitioners.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doc) => {
                  const docAppts = appointments.filter((a) => a.doctorId === doc.id);
                  const activeConsult = docAppts.find((a) => a.status === 'IN_PROGRESS');
                  const waitingCount = docAppts.filter((a) => a.status === 'CHECKED_IN').length;
                  const doneCount = docAppts.filter((a) => a.status === 'COMPLETED').length;
                  const docName = doc.employee?.user
                    ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                    : doc.name || 'Doctor';

                  return (
                    <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{docName}</h4>
                          <p className="text-xs text-slate-500">{doc.specialization}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            activeConsult
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {activeConsult ? 'OCCUPIED' : 'CHAMBER IDLE'}
                        </span>
                      </div>

                      {activeConsult ? (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-amber-700">Currently Consulting</span>
                          <div className="font-bold text-sm text-slate-900">
                            {activeConsult.patient?.firstName} {activeConsult.patient?.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Token #{activeConsult.tokenNumber} • In chamber since {activeConsult.appointmentTime}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center text-xs text-slate-400">
                          Chamber ready for next patient call
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-100">
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="font-bold text-slate-900">{waitingCount}</div>
                          <div className="text-[10px] text-slate-500">Waiting in Lobby</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="font-bold text-slate-900">{doneCount}</div>
                          <div className="text-[10px] text-slate-500">Completed Today</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: PATIENT REGISTRATION OVERVIEW */}
          {activeTab === 'patients' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900">Patient Master Registry</h3>
                  <p className="text-xs text-slate-500">Search patient demographics, identify duplicates and perform authorized corrections</p>
                </div>

                {/* Duplicate Phone Quick Check */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Check duplicate phone..."
                    value={dupPhone}
                    onChange={(e) => setDupPhone(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleCheckDuplicate}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Check
                  </button>
                </div>
              </div>

              {dupResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border ${
                    dupResult.isDuplicate
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
                  }`}
                >
                  {dupResult.isDuplicate
                    ? `Duplicate Match: Record exists under UHID: ${dupResult.existingPatient?.uhid} (${dupResult.existingPatient?.firstName} ${dupResult.existingPatient?.lastName})`
                    : 'No duplicate found. Phone number is unique in this hospital branch.'}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">UHID</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Gender / Age</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Emergency Contact</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-[#00897B]">{p.uhid}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{p.city || 'Chennai'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.gender} • {p.dateOfBirth ? `${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} yrs` : 'Adult'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800 font-medium">{p.phone}</div>
                          <div className="text-xs text-slate-400">{p.email || 'No email registered'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {p.emergencyContactName ? (
                            <>
                              <div className="font-semibold text-slate-800">{p.emergencyContactName} ({p.emergencyContactRelation || 'Contact'})</div>
                              <div>{p.emergencyContactPhone}</div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Not recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientForm({
                                phone: p.phone || '',
                                email: p.email || '',
                                addressLine1: p.addressLine1 || '',
                                city: p.city || '',
                                emergencyContactName: p.emergencyContactName || '',
                                emergencyContactPhone: p.emergencyContactPhone || '',
                                emergencyContactRelation: p.emergencyContactRelation || '',
                              });
                              setPatientEditModalOpen(true);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                          >
                            Correct Demographics
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: DOCTOR ROSTERING & SCHEDULING */}
          {activeTab === 'schedules' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Doctor Clinical Rostering & OPD Shifts</h3>
                <p className="text-xs text-slate-500">Monitor daily consulting availability and department coverage</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc) => {
                  const docName = doc.employee?.user
                    ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                    : doc.name || 'Doctor';
                  const isAvail = doc.isAvailableToday !== false;

                  return (
                    <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{docName}</div>
                          <div className="text-xs text-slate-500">{doc.specialization}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            isAvail ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isAvail ? 'ON DUTY' : 'OFF DUTY'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div><strong>Department:</strong> {doc.department?.name || 'General'}</div>
                        <div><strong>Shift:</strong> {doc.shift || 'MORNING (09:00 - 13:00)'}</div>
                        <div><strong>Consultation Fee:</strong> ₹ {doc.consultationFee || 500}</div>
                        <div><strong>Reg No:</strong> {doc.licenseNumber || 'TMC-98765'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: OPD BILLING OVERVIEW */}
          {activeTab === 'billing' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900">OPD Consultation Billing & Collections</h3>
                  <p className="text-xs text-slate-500">Daily collections and consultation payment statuses</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500">Total Billed:</span>
                  <div className="text-xl font-black text-[#183153]">₹ {metrics.totalRevenue.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Token #</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Fee Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-bold text-[#00897B]">#{a.tokenNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {a.patient?.firstName} {a.patient?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">UHID: {a.patient?.uhid}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {a.doctor?.employee?.user
                            ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
                            : 'Consultant'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          ₹ {Number(a.consultationFee || 500).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded ${
                              a.isPaid ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {a.isPaid ? 'PAID' : 'SETTLED AT COUNTER'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS & EXPORTS HUB */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900">OPD Management Reports & Analytics</h3>
                <p className="text-xs text-slate-500">Download formatted operational and financial audit reports</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Daily OPD Activity Ledger', desc: 'Complete breakdown of appointments, check-ins, tokens & visits.' },
                  { title: 'Doctor Consultations Summary', desc: 'Doctor-wise patient volumes, consult durations and fees.' },
                  { title: 'Department Utilization Report', desc: 'Patient flow per clinical unit with average wait times.' },
                  { title: 'Cancellation & No-Show Audit', desc: 'Missed and cancelled appointments with reasons logged.' },
                  { title: 'OPD Financial Revenue Ledger', desc: 'Consultation fee collections, invoice numbers and totals.' },
                  { title: 'Patient Waiting-Time Analysis', desc: 'Intervals from lobby arrival to doctor chamber entry.' },
                ].map((rep, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{rep.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => handleExportCSV(rep.title)}
                        className="flex-1 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV / Excel
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded"
                        title="Print Report"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Book OPD Clinic Appointment"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient *</label>
            <select
              required
              value={bookForm.patientId}
              onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">-- Choose Patient (UHID) --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} (UHID: {p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Department *</label>
              <select
                required
                value={bookForm.departmentId}
                onChange={(e) => setBookForm({ ...bookForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attending Doctor *</label>
              <select
                required
                value={bookForm.doctorId}
                onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors
                  .filter((doc) => !bookForm.departmentId || doc.departmentId === bookForm.departmentId)
                  .map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.employee?.user
                        ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                        : doc.name} ({doc.specialization})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={bookForm.appointmentDate}
                onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
              <input
                type="text"
                required
                placeholder="09:30"
                value={bookForm.appointmentTime}
                onChange={(e) => setBookForm({ ...bookForm, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Visit Type</label>
              <select
                value={bookForm.appointmentType}
                onChange={(e) => setBookForm({ ...bookForm, appointmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="OPD">Standard OPD</option>
                <option value="FOLLOW_UP">Follow-Up Consultation</option>
                <option value="EMERGENCY">Emergency Walk-In</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={bookForm.priority}
                onChange={(e) => setBookForm({ ...bookForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent Care</option>
                <option value="STAT_EMERGENCY">STAT Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit</label>
            <input
              type="text"
              value={bookForm.reasonForVisit}
              onChange={(e) => setBookForm({ ...bookForm, reasonForVisit: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Symptoms, clinical referral notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBookModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Booking Slot...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title={`Reschedule Appointment #${selectedAppt?.tokenNumber}`}
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Date (YYYY-MM-DD) *</label>
            <input
              type="date"
              required
              value={reschedDate}
              onChange={(e) => setReschedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Time Slot (HH:MM) *</label>
            <input
              type="text"
              required
              placeholder="10:00"
              value={reschedTime}
              onChange={(e) => setReschedTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-bold rounded-lg"
            >
              {submitting ? 'Rescheduling...' : 'Save New Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Appointment #${selectedAppt?.tokenNumber}`}
      >
        <form onSubmit={handleCancelAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason *</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Patient emergency / Doctor leave / Schedule conflict"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-bold rounded-lg"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Demographic Correction Modal */}
      <Modal
        isOpen={patientEditModalOpen}
        onClose={() => setPatientEditModalOpen(false)}
        title={`Demographic Correction: ${selectedPatient?.firstName} ${selectedPatient?.lastName} (${selectedPatient?.uhid})`}
      >
        <form onSubmit={handleSavePatientDemographics} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone *</label>
              <input
                type="text"
                required
                value={patientForm.phone}
                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={patientForm.addressLine1}
                onChange={(e) => setPatientForm({ ...patientForm, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={patientForm.city}
                onChange={(e) => setPatientForm({ ...patientForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={patientForm.emergencyContactName}
                onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone</label>
              <input
                type="text"
                value={patientForm.emergencyContactPhone}
                onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                placeholder="Spouse, Parent..."
                value={patientForm.emergencyContactRelation}
                onChange={(e) => setPatientForm({ ...patientForm, emergencyContactRelation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPatientEditModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Saving...' : 'Save Corrections'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

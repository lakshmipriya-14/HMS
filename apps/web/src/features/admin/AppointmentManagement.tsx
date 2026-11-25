import React, { useState, useEffect } from 'react';
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
  XCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'upcoming' | 'all'>('today');

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [apptRes, deptRes] = await Promise.all([
        apiClient.appointments.list({
          date: dateFilter === 'today' ? today : undefined,
          departmentId: departmentFilter || undefined,
          status: statusFilter || undefined,
        }),
        apiClient.hospitalAdmin.getDepartments(),
      ]);
      if (apptRes.data) setAppointments(apptRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setErrorMessage(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, departmentFilter, statusFilter]);

  const handleCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.appointments.cancel(selectedAppt.id, cancelReason || 'Cancelled by hospital admin');
      setSuccessMessage(`Appointment #${selectedAppt.tokenNumber || selectedAppt.id.slice(0, 8)} cancelled.`);
      setCancelModalOpen(false);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const patientName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
    const token = (a.tokenNumber || '').toLowerCase();
    const uhid = (a.patient?.uhid || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return patientName.includes(q) || token.includes(q) || uhid.includes(q);
  });

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Hospital OPD Appointments Ledger',
      headers: ['Token', 'Date & Time', 'Patient Name', 'UHID', 'Doctor', 'Department', 'Type', 'Status'],
      rows: filteredAppointments.map((a) => [
        a.tokenNumber || 'N/A',
        new Date(a.appointmentDate).toLocaleString('en-IN'),
        `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
        a.patient?.uhid || 'N/A',
        a.doctor?.employee?.user ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}` : 'N/A',
        a.department?.name || 'General',
        a.type || 'OPD',
        a.status,
      ]),
      fileName: 'opd_appointments_ledger',
    });
  };

  if (loading) return <LoadingState message="Loading hospital OPD appointment queues..." />;

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
          <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <CalendarCheck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">OPD Appointments & Token Queues</h1>
            <p className="text-xs text-slate-500">
              Live outpatient tokens, consultation queues, and department scheduling
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search token, patient name, UHID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setDateFilter('today')}
            className={`flex-1 py-1 rounded text-center transition-all ${
              dateFilter === 'today' ? 'bg-white text-teal-700 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            Today's OPD
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`flex-1 py-1 rounded text-center transition-all ${
              dateFilter === 'all' ? 'bg-white text-teal-700 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            All Dates
          </button>
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No appointments found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                      #{a.tokenNumber || a.id.slice(0, 6)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>
                        {new Date(a.appointmentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.appointmentDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{a.patient?.uhid}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {a.doctor?.employee?.user
                        ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
                        : 'Doctor Assigned'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{a.department?.name || 'General OPD'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => {
                            setSelectedAppt(a);
                            setCancelReason('');
                            setCancelModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCEL MODAL */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Appointment #${selectedAppt?.tokenNumber || selectedAppt?.id.slice(0, 8)}`}
      >
        <form onSubmit={handleCancelAppointment} className="space-y-4">
          <p className="text-xs text-slate-500">
            Cancelling this appointment will release the doctor's consultation slot and notify the patient.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
            <input
              type="text"
              required
              placeholder="e.g. Patient requested, Doctor emergency leave"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  CalendarCheck,
  Search,
  Plus,
  Clock,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Form States
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [cancelReason, setCancelReason] = useState('Patient request');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [aptRes, docRes] = await Promise.all([
        apiClient.departmentAdmin.getAppointments({
          date: dateFilter || undefined,
          doctorId: doctorFilter || undefined,
          status: statusFilter || undefined,
        }),
        apiClient.departmentAdmin.getDoctors(),
      ]);

      if (aptRes.data) setAppointments(aptRes.data);
      if (docRes.data) setDoctors(docRes.data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError(err.message || 'Failed to load department appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, doctorFilter, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.departmentAdmin.updateAppointmentStatus(id, status);
      setSuccess(`Appointment status updated to ${status}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.rescheduleAppointment(selectedAppointment.id, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });
      setSuccess('Appointment rescheduled successfully.');
      setIsRescheduleOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.cancelAppointment(selectedAppointment.id, cancelReason);
      setSuccess('Appointment cancelled successfully.');
      setIsCancelOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setSaving(false);
    }
  };

  const openReschedule = (apt: any) => {
    setSelectedAppointment(apt);
    setRescheduleDate(new Date(apt.appointmentDate).toISOString().split('T')[0]);
    setRescheduleTime(apt.appointmentTime || '10:00');
    setIsRescheduleOpen(true);
  };

  const openCancel = (apt: any) => {
    setSelectedAppointment(apt);
    setCancelReason('Patient request');
    setIsCancelOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-teal-600" />
            Department Appointments & Token Scheduling
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department consultation queues, status updates, rescheduling, and doctor allocations.
          </p>
        </div>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
            >
              <option value="">All Department Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.employee?.user?.firstName} {d.employee?.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CHECKED_IN">Checked-In</option>
              <option value="IN_PROGRESS">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <LoadingState message="Loading department appointments queue..." />
      ) : appointments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Token</th>
                  <th className="py-3.5 px-4 font-bold">Patient</th>
                  <th className="py-3.5 px-4 font-bold">Doctor</th>
                  <th className="py-3.5 px-4 font-bold">Date & Time</th>
                  <th className="py-3.5 px-4 font-bold">Reason</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const pat = apt.patient;
                  const doc = apt.doctor?.employee?.user;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-teal-700 text-sm">
                        #{apt.tokenNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{pat?.firstName} {pat?.lastName}</p>
                        <p className="font-mono text-[11px] text-slate-400">{pat?.uhid}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Dr. {doc?.firstName} {doc?.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(apt.appointmentDate).toLocaleDateString()} • {apt.appointmentTime}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {apt.reasonForVisit}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {apt.status === 'SCHEDULED' && (
                            <button
                              onClick={() => handleStatusChange(apt.id, 'CHECKED_IN')}
                              className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold hover:bg-sky-100"
                            >
                              Check-In
                            </button>
                          )}
                          {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => openReschedule(apt)}
                                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-200"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => openCancel(apt)}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
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
          No appointments found matching the current criteria.
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Appointment"
        subtitle={`Token #${selectedAppointment?.tokenNumber} — ${selectedAppointment?.patient?.firstName} ${selectedAppointment?.patient?.lastName}`}
        maxWidth="md"
      >
        <form onSubmit={handleReschedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Appointment Date</label>
            <input
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Appointment Time</label>
            <input
              type="time"
              required
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-md shadow-teal-900/20 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Appointment"
        subtitle="Please document the cancellation reason."
        maxWidth="md"
      >
        <form onSubmit={handleCancel} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Patient requested reschedule, doctor emergency leave..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCancelOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-md shadow-rose-900/20 disabled:opacity-50"
            >
              {saving ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

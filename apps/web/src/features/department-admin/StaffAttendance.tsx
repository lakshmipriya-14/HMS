import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Filter,
  Users,
  Search,
} from 'lucide-react';

export const StaffAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getAttendance(selectedDate);
      if (res.data) setAttendance(res.data);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setError(err.message || 'Failed to load department attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const handleStatusChange = (index: number, newStatus: string) => {
    setAttendance((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.saveAttendance(attendance);
      setSuccess('Department staff attendance saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredAttendance = attendance.filter((a) => {
    if (!search) return true;
    return (
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.designation?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const leaveCount = attendance.filter((a) => a.status === 'ON_LEAVE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-teal-600" />
            Staff Daily Attendance & Duty Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily check-in, late reporting, on-leave statuses, and shift validations.
          </p>
        </div>
        <button
          onClick={handleSaveAttendance}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-900/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Daily Records'}
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

      {/* Date Filter & Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Present</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          <span className="text-[10px] text-slate-500">On duty today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Late Arrivals</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{lateCount}</p>
          <span className="text-[10px] text-slate-500">Grace period</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Absent</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
          <span className="text-[10px] text-slate-500">Unexcused</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">On Approved Leave</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{leaveCount}</p>
          <span className="text-[10px] text-slate-500">Documented</span>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search staff by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <LoadingState message="Loading department attendance..." />
      ) : filteredAttendance.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">Staff Member</th>
                  <th className="py-3.5 px-4 font-bold">Code</th>
                  <th className="py-3.5 px-4 font-bold">Designation</th>
                  <th className="py-3.5 px-4 font-bold">Shift</th>
                  <th className="py-3.5 px-4 font-bold">Check-In</th>
                  <th className="py-3.5 px-4 font-bold">Check-Out</th>
                  <th className="py-3.5 px-4 font-bold">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((row, index) => (
                  <tr key={row.employeeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {row.employeeCode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {row.designation}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {row.shift}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {row.checkIn || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {row.checkOut || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={row.status}
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-none ${
                          row.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : row.status === 'LATE'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : row.status === 'ON_LEAVE'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="PRESENT">PRESENT</option>
                        <option value="LATE">LATE</option>
                        <option value="HALF_DAY">HALF DAY</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="ABSENT">ABSENT</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No staff records available for attendance tracking on this date.
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const DoctorScheduling: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Weekly Schedule Grid State for the selected doctor
  const [weeklySchedule, setWeeklySchedule] = useState<
    Array<{ dayOfWeek: string; startTime: string; endTime: string; maxPatients: number; isActive: boolean }>
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [docRes, schedRes] = await Promise.all([
        apiClient.departmentAdmin.getDoctors(),
        apiClient.departmentAdmin.getDoctorSchedules(),
      ]);

      if (docRes.data) {
        setDoctors(docRes.data);
        if (docRes.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docRes.data[0].id);
        }
      }
      if (schedRes.data) {
        setSchedules(schedRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load scheduling data:', err);
      setError(err.message || 'Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync selected doctor's schedule into editor state
  useEffect(() => {
    if (!selectedDoctorId) return;
    const docSchedules = schedules.filter((s) => s.doctorId === selectedDoctorId);

    const initial = DAYS.map((day) => {
      const existing = docSchedules.find((s) => s.dayOfWeek === day);
      if (existing) {
        return {
          dayOfWeek: day,
          startTime: existing.startTime || '09:00',
          endTime: existing.endTime || '13:00',
          maxPatients: existing.maxPatients || 25,
          isActive: existing.isActive !== undefined ? existing.isActive : true,
        };
      }
      return {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '13:00',
        maxPatients: 25,
        isActive: day !== 'SUNDAY',
      };
    });

    setWeeklySchedule(initial);
  }, [selectedDoctorId, schedules]);

  const handleSaveSchedule = async () => {
    if (!selectedDoctorId) return;
    try {
      setSaving(true);
      setError('');
      await apiClient.departmentAdmin.saveDoctorSchedule(selectedDoctorId, weeklySchedule);
      setSuccess('Doctor duty schedules updated successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor schedules');
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (day: string, field: string, value: any) => {
    setWeeklySchedule((prev) =>
      prev.map((item) => (item.dayOfWeek === day ? { ...item, [field]: value } : item))
    );
  };

  if (loading) {
    return <LoadingState message="Loading doctor duty schedules & roster..." />;
  }

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[#00897B]" />
            Doctor Duty Scheduling & Shift Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure consultation timings, shift limits, and patient quotas for department physicians.
          </p>
        </div>
        <button
          onClick={handleSaveSchedule}
          disabled={saving}
          className="px-4 py-2 bg-[#1565C0] hover:bg-[#00897B] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-900/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-[#16A34A] hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Doctor Selector Sidebar (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Select Department Doctor
          </p>
          <div className="space-y-1">
            {doctors.map((doc) => {
              const user = doc.employee?.user;
              const isSelected = doc.id === selectedDoctorId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-[#E0F2F1] border border-teal-300 text-teal-900 font-bold shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-semibold">
                      Dr. {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-normal truncate">{doc.specialization}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#00897B]' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Weekly Schedule Editor (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Weekly Duty Schedule — Dr. {currentDoctor?.employee?.user?.firstName} {currentDoctor?.employee?.user?.lastName}
              </h2>
              <p className="text-xs text-slate-500">
                {currentDoctor?.designation?.replace(/_/g, ' ')} • {currentDoctor?.specialization}
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
              Shift: {currentDoctor?.shift || 'MORNING'}
            </span>
          </div>

          {/* Schedule Table / Grid */}
          <div className="divide-y divide-slate-100 text-xs">
            {weeklySchedule.map((s) => (
              <div key={s.dayOfWeek} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="w-32 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={s.isActive}
                    onChange={(e) => updateDaySchedule(s.dayOfWeek, 'isActive', e.target.checked)}
                    className="w-4 h-4 text-[#00897B] rounded focus:ring-teal-500 border-slate-300"
                  />
                  <span className={`font-bold ${s.isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s.dayOfWeek}
                  </span>
                </div>

                <div className="flex-1 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Start:</span>
                    <input
                      type="time"
                      disabled={!s.isActive}
                      value={s.startTime}
                      onChange={(e) => updateDaySchedule(s.dayOfWeek, 'startTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00897B] disabled:opacity-40"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">End:</span>
                    <input
                      type="time"
                      disabled={!s.isActive}
                      value={s.endTime}
                      onChange={(e) => updateDaySchedule(s.dayOfWeek, 'endTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00897B] disabled:opacity-40"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Max Patients:</span>
                    <input
                      type="number"
                      disabled={!s.isActive}
                      value={s.maxPatients}
                      onChange={(e) => updateDaySchedule(s.dayOfWeek, 'maxPatients', Number(e.target.value))}
                      className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00897B] font-bold disabled:opacity-40"
                    />
                  </div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    s.isActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s.isActive ? 'Active Duty' : 'Off'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#E0F2F1]/60 border border-[#B2DFDB] rounded-xl text-teal-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00897B] shrink-0" />
              <span>Schedules automatically restrict appointment token limits and validate consultation availability.</span>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="px-3.5 py-1.5 bg-[#1565C0] hover:bg-[#00897B] text-white rounded-lg font-bold text-xs shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

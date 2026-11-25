import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Building2,
  Users,
  UserCheck,
  HeartPulse,
  CalendarCheck,
  DoorOpen,
  BedDouble,
  FlaskConical,
  Scan,
  Wrench,
  Pill,
  CalendarOff,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Bell,
  RefreshCw,
  Layers,
} from 'lucide-react';
import type { DepartmentAdminDashboardDto } from '@multispeciality-hms/contracts';

export const DepartmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DepartmentAdminDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await apiClient.departmentAdmin.getDashboard({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load department dashboard:', err);
      setError(err.message || 'Failed to load department dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  if (loading) {
    return <LoadingState message="Loading department command telemetry and operational metrics..." />;
  }

  const dept = data?.department;
  const metrics = data?.metrics || {
    totalPatients: 0,
    todayOpdRegistrations: 0,
    currentIpdPatients: 0,
    todayAppointments: 0,
    completedConsultations: 0,
    pendingConsultations: 0,
    availableDoctors: 0,
    totalDoctors: 0,
    availableStaff: 0,
    totalStaff: 0,
    bedOccupancyRate: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    pendingAdmissions: 0,
    pendingDischarges: 0,
    pendingLabRequests: 0,
    pendingRadiologyRequests: 0,
    pendingDiagnosticRequests: 0,
    pendingInventoryRequests: 0,
    pendingLeaveRequests: 0,
    pendingMaintenanceRequests: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-bold rounded-full uppercase tracking-wider border border-teal-500/30">
                Department Operations Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Code: {dept?.code || 'DEPT'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-teal-400" />
              {dept?.name || 'Assigned Department'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              {dept?.description || 'Dedicated administrative management and operational oversight for clinical workflows.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Head of Dept:</span>
                <span className="font-semibold text-teal-300">{dept?.headOfDepartment?.name || 'Not Designated'}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Branch:</span>
                <span className="font-semibold text-slate-200">{dept?.branchName || 'Main Hospital'}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Department Admin:</span>
                <span className="font-semibold text-emerald-400">{dept?.departmentAdmin?.name || 'Current Admin'}</span>
              </div>
            </div>
          </div>

          {/* Quick Date Filters & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 px-2 py-1 outline-none border-0"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 px-2 py-1 outline-none border-0"
              />
            </div>
            <button
              onClick={fetchDashboard}
              disabled={refreshing}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-900/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Telemetry Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => navigate('/department-admin/patients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Dept Patients</span>
            <HeartPulse className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.totalPatients}</div>
          <div className="text-[11px] text-teal-600 mt-1 flex items-center gap-1 font-semibold">
            <span>View directory</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Today's OPD */}
        <div
          onClick={() => navigate('/department-admin/opd')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today OPD</span>
            <Activity className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.todayOpdRegistrations}</div>
          <div className="text-[11px] text-slate-500 mt-1">Registrations today</div>
        </div>

        {/* Current IPD */}
        <div
          onClick={() => navigate('/department-admin/ipd')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current IPD</span>
            <DoorOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.currentIpdPatients}</div>
          <div className="text-[11px] text-slate-500 mt-1">Admitted Inpatients</div>
        </div>

        {/* Appointments Today */}
        <div
          onClick={() => navigate('/department-admin/appointments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Appointments</span>
            <CalendarCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.todayAppointments}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.completedConsultations} Done • {metrics.pendingConsultations} Pending
          </div>
        </div>

        {/* Available Doctors */}
        <div
          onClick={() => navigate('/department-admin/doctors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Doctors On Duty</span>
            <UserCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {metrics.availableDoctors} <span className="text-sm font-normal text-slate-400">/ {metrics.totalDoctors}</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {metrics.totalDoctors > 0 ? `${Math.round((metrics.availableDoctors / metrics.totalDoctors) * 100)}% available` : 'No doctors'}
          </div>
        </div>

        {/* Bed Occupancy */}
        <div
          onClick={() => navigate('/department-admin/wards-beds')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bed Occupancy</span>
            <BedDouble className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.bedOccupancyRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.availableBeds} beds available
          </div>
        </div>
      </div>

      {/* Operational Watch & Request Hub Tiles */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Department Operational Watch & Pending Items
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => navigate('/department-admin/admissions')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Pending Admissions</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingAdmissions}</p>
            </div>
            <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
              IPD
            </span>
          </div>

          <div
            onClick={() => navigate('/department-admin/lab-requests')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Pending Lab Orders</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingLabRequests}</p>
            </div>
            <FlaskConical className="w-5 h-5 text-amber-500" />
          </div>

          <div
            onClick={() => navigate('/department-admin/radiology-requests')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Pending Radiology</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingRadiologyRequests}</p>
            </div>
            <Scan className="w-5 h-5 text-purple-500" />
          </div>

          <div
            onClick={() => navigate('/department-admin/leaves')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-rose-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Pending Leaves</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingLeaveRequests}</p>
            </div>
            <CalendarOff className="w-5 h-5 text-rose-500" />
          </div>

          <div
            onClick={() => navigate('/department-admin/equipment')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Maintenance Alert</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingMaintenanceRequests}</p>
            </div>
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>

          <div
            onClick={() => navigate('/department-admin/inventory')}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-teal-400 cursor-pointer flex items-center justify-between transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Stock Requests</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5">{metrics.pendingInventoryRequests}</p>
            </div>
            <Pill className="w-5 h-5 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activities & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Department Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Department Activity Trail</h3>
              <p className="text-xs text-slate-500">Live immutable logs for department operations</p>
            </div>
            <Link
              to="/department-admin/activity-history"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
            >
              <span>View full log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.recentActivities && data.recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold">
                      {act.action}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {act.resource}: {act.userName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {act.id.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recent audit activity records found for this department.
            </div>
          )}
        </div>

        {/* Notifications & Department Alerts (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Alerts & Broadcasts</h3>
            </div>
            <Link
              to="/department-admin/notifications"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              All Alerts
            </Link>
          </div>

          {data?.notifications && data.notifications.length > 0 ? (
            <div className="space-y-3">
              {data.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    notif.isRead
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-teal-50/60 border-teal-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span>{notif.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No pending alerts or notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

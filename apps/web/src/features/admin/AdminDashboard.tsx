import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../services/api';
import {
  Users,
  CalendarCheck,
  BedDouble,
  DollarSign,
  Activity,
  AlertTriangle,
  Ambulance,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  CheckSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.hospitalAdmin.getDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load executive dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  if (loading) {
    return <LoadingState message="Loading live executive hospital metrics and PostgreSQL telemetry..." />;
  }

  const overview = data?.overview || {};
  const departmentStats = data?.departmentStats || [];
  const recentActivities = data?.recentActivities || [];
  const pendingApprovals = data?.pendingApprovals || {};
  const criticalAlerts = data?.criticalAlerts || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
              Live PostgreSQL Feed
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Kizuna Apex Medical Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Executive Command & Hospital Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multispeciality operations, clinical bed census, and revenue telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 border border-slate-200">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'today' ? 'bg-white text-teal-700 font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'week' ? 'bg-white text-teal-700 font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'month' ? 'bg-white text-teal-700 font-semibold shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alert Bar (if any alerts) */}
      {(criticalAlerts.lowStockMedicines > 0 || criticalAlerts.abnormalVitalsToday > 0) && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Immediate Clinical & Inventory Notifications</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {criticalAlerts.lowStockMedicines > 0 && `${criticalAlerts.lowStockMedicines} medicines below reorder threshold (≤50 units). `}
                {criticalAlerts.abnormalVitalsToday > 0 && `${criticalAlerts.abnormalVitalsToday} abnormal patient vitals flagged today for attending review.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/pharmacy"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Inspect Stock
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Registered Patients"
          value={overview.totalPatients ?? 0}
          subtitle="Unique UHID census records"
          icon={Users}
          colorScheme="teal"
          trend={{ value: 'Active Database', isPositive: true }}
        />
        <MetricCard
          title="Today's OPD Queue"
          value={overview.todayOpdPatients ?? 0}
          subtitle="Outpatient appointments booked"
          icon={CalendarCheck}
          colorScheme="blue"
        />
        <MetricCard
          title="Current Inpatients (IPD)"
          value={overview.currentIpdPatients ?? 0}
          subtitle={`${overview.emergencyPatients ?? 0} emergency trauma admissions`}
          icon={BedDouble}
          colorScheme="rose"
        />
        <MetricCard
          title="Bed Occupancy Rate"
          value={`${overview.bedOccupancyPercentage ?? 0}%`}
          subtitle={`${overview.occupiedBeds ?? 0} occupied / ${overview.availableBeds ?? 0} available`}
          icon={Activity}
          colorScheme="emerald"
        />
        <MetricCard
          title="Clinical Doctors"
          value={overview.totalDoctors ?? 0}
          subtitle={`${overview.availableDoctors ?? 0} doctors on duty today`}
          icon={UserCheck}
          colorScheme="teal"
        />
        <MetricCard
          title="Total Hospital Staff"
          value={overview.totalStaff ?? 0}
          subtitle={`${overview.activeStaff ?? 0} active employees on shift`}
          icon={Users}
          colorScheme="blue"
        />
        <MetricCard
          title="Today's Total Collections"
          value={`₹${(overview.dailyRevenue ?? 0).toLocaleString('en-IN')}`}
          subtitle="OPD, Labs, Pharmacy & IPD Cashier"
          icon={DollarSign}
          colorScheme="amber"
          trend={{ value: '+14% target', isPositive: true }}
        />
        <MetricCard
          title="30-Day Hospital Revenue"
          value={`₹${(overview.monthlyRevenue ?? 0).toLocaleString('en-IN')}`}
          subtitle={`₹${(overview.weeklyRevenue ?? 0).toLocaleString('en-IN')} in last 7 days`}
          icon={TrendingUp}
          colorScheme="emerald"
        />
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/admin/departments"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <Building2 className="w-5 h-5 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Departments</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage & assign HODs</p>
        </Link>
        <Link
          to="/admin/doctors"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <UserCheck className="w-5 h-5 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Doctors</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Rosters & duty timings</p>
        </Link>
        <Link
          to="/admin/wards"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <BedDouble className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Wards & Beds</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Floor layout & census</p>
        </Link>
        <Link
          to="/admin/staff"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <Users className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Hospital Staff</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Nurses, lab & admin</p>
        </Link>
        <Link
          to="/admin/billing"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <DollarSign className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Finance & Invoices</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Daily cash & TPA claims</p>
        </Link>
        <Link
          to="/admin/reports"
          className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-teal-500 hover:shadow-md transition-all text-left group"
        >
          <ArrowUpRight className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-slate-800">Generate Report</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Export CSV & printable</p>
        </Link>
      </div>

      {/* Main Operational Section: Department Performance & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-Wise Overview (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Department Status & Administrative Coverage</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring active staff, assigned Department Admins, and patient loads across clinical units
              </p>
            </div>
            <Link
              to="/admin/departments"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All ({departmentStats.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Department Admin</th>
                  <th className="py-2.5 px-3 text-center">Doctors</th>
                  <th className="py-2.5 px-3 text-center">Appointments</th>
                  <th className="py-2.5 px-3 text-center">Wards</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentStats.map((dept: any) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <div>{dept.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{dept.code}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {dept.departmentAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {dept.departmentAdmin.firstName} {dept.departmentAdmin.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Needs Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">{dept.doctorCount}</td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">{dept.appointmentsCount}</td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">{dept.wardsCount}</td>
                    <td className="py-3 px-3 text-right">
                      <StatusBadge status={dept.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approvals & Action Items (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              Pending Approvals & Actions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tasks requiring executive sign-off</p>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-800">Public Appointment Requests</h5>
                  <p className="text-[11px] text-slate-500">Awaiting triage & token issue</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                  {pendingApprovals.appointmentRequests ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-800">Unassigned Department Admins</h5>
                  <p className="text-[11px] text-slate-500">Departments missing assigned admin</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold">
                  {pendingApprovals.unassignedDepartments ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-slate-800">Active 108 Emergency Fleet</h5>
                  <p className="text-[11px] text-slate-500">Ambulances currently dispatched</p>
                </div>
                <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-bold">
                  {criticalAlerts.activeAmbulanceTrips ?? 0}
                </span>
              </div>
            </div>

            <Link
              to="/admin/approvals"
              className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              Open Approvals Hub
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Facility Overview */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              Campus Command
            </div>
            <h4 className="text-base font-bold text-white mt-1">Kizuna Apex Medical Center</h4>
            <p className="text-xs text-slate-300 mt-1">Madurai Apex Campus • Emergency Level 1 Trauma Center</p>
            <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Emergency 24x7</p>
                <p className="font-semibold text-white">Dial 108 / +91 452 258000</p>
              </div>
              <div>
                <p className="text-slate-400">NABH Accreditation</p>
                <p className="font-semibold text-emerald-400">Verified & Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity & Audit Trail (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Live Hospital Operational Stream (Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable PostgreSQL ledger recording real-time clinical and administrative actions
            </p>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Full Audit Logs
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent activities recorded.</p>
          ) : (
            recentActivities.map((act: any) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{act.action}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-600 font-mono text-[11px]">{act.resource}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Initiated by: <span className="font-medium text-slate-700">{act.userEmail}</span> ({act.userRole})
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  {new Date(act.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

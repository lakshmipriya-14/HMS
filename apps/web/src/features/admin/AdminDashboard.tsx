import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { LoadingState } from '../../components/LoadingState';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.admin.getDashboardStats();
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingState message="Loading hospital organizational analytics..." />;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Hospital Administration & Executive Command
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multispeciality operations overview for Aalayam Apex Medical Center
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Registered Patients"
          value={stats?.totalPatients || 1240}
          subtitle="Unique UHID records"
          icon={Users}
          colorScheme="teal"
          trend={{ value: '+8%', isPositive: true }}
        />
        <MetricCard
          title="Today's OPD Queue"
          value={stats?.todayAppointments || 48}
          subtitle="Tokens booked & active"
          icon={CalendarCheck}
          colorScheme="blue"
          trend={{ value: '+12%', isPositive: true }}
        />
        <MetricCard
          title="Inpatient Bed Occupancy"
          value={`${stats?.bedOccupancyPercentage || 74}%`}
          subtitle={`${stats?.occupiedBeds || 37} / ${stats?.totalBeds || 50} beds filled`}
          icon={BedDouble}
          colorScheme="emerald"
        />
        <MetricCard
          title="Today's Revenue Collected"
          value={`₹${(stats?.todayRevenue || 45200).toLocaleString('en-IN')}`}
          subtitle="OPD, Labs, Pharmacy & IPD"
          icon={DollarSign}
          colorScheme="amber"
          trend={{ value: '+15%', isPositive: true }}
        />
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h3>Center Information</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Hospital Legal Name</span>
              <span className="font-semibold text-slate-800">Aalayam Multispeciality Hospital</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Tamil Identity</span>
              <span className="font-semibold text-slate-800">ஆலயம் பன்னோக்கு மருத்துவமனை</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">License Number</span>
              <span className="font-mono text-slate-800">TN-HOSP-MDU-2026-0042</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Emergency Hotlines</span>
              <span className="font-mono text-rose-600 font-bold">108 / +91 452 258 9911</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
            <Activity className="w-5 h-5 text-sky-600" />
            <h3>Departmental Workloads</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-700">Cardiology & Cath Lab</span>
                <span className="text-teal-600 font-bold">88% Capacity</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-700">ICCU & Critical Care</span>
                <span className="text-rose-600 font-bold">90% Capacity</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 font-medium">
                <span className="text-slate-700">General Medicine & Diabetology</span>
                <span className="text-sky-600 font-bold">65% Capacity</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3>Live Clinical Alerts</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
              <div>
                <p className="font-semibold text-rose-800">Critical Troponin I Alert</p>
                <p className="text-rose-600 text-[11px] mt-0.5">ICCU Bed 1 - Stat review needed</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
              <div>
                <p className="font-semibold text-amber-800">Pharmacy Low Stock</p>
                <p className="text-amber-700 text-[11px] mt-0.5">Ecosprin 75mg approaching reorder level</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

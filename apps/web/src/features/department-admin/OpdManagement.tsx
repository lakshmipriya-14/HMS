import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ClipboardList,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const OpdManagement: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOpd = async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await apiClient.departmentAdmin.getOpdMonitoring();
      if (res.data) setData(res.data);
    } catch (err: any) {
      console.error('Failed to load OPD monitoring:', err);
      setError(err.message || 'Failed to load OPD monitoring status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOpd();
  }, []);

  if (loading) {
    return <LoadingState message="Loading live OPD queue and patient flow monitoring..." />;
  }

  const waiting = data?.waiting || [];
  const inConsultation = data?.inConsultation || [];
  const completed = data?.completed || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-[#00897B]" />
            OPD Flow & Consultation Queue Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time outpatient consultation queues, patient wait times, and physician throughput.
          </p>
        </div>
        <button
          onClick={loadOpd}
          disabled={refreshing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Live Stream
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-Time Queue Stage KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Today</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{data?.totalToday || 0}</p>
          <span className="text-[10px] text-slate-500">Scheduled OPD</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Waiting Patients</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{data?.waitingCount || 0}</p>
          <span className="text-[10px] text-amber-700/80">In waiting lounge</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#BFDBFE] bg-[#E8F1FC]/30 shadow-sm">
          <span className="text-[11px] font-bold text-[#1565C0] uppercase">In Consultation</span>
          <p className="text-2xl font-black text-[#1565C0] mt-1">{data?.inConsultationCount || 0}</p>
          <span className="text-[10px] text-[#1565C0]/80">Active with doctor</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7]/30 shadow-sm">
          <span className="text-[11px] font-bold text-[#16A34A] uppercase">Completed</span>
          <p className="text-2xl font-black text-[#16A34A] mt-1">{data?.completedCount || 0}</p>
          <span className="text-[10px] text-[#16A34A]/80">Consultations concluded</span>
        </div>
      </div>

      {/* Active Consultations & Waiting Lounges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Lounge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">Waiting Patients Queue ({waiting.length})</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">By Token Order</span>
          </div>

          {waiting.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {waiting.map((apt: any) => (
                <div key={apt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 font-mono font-black text-[#183153] flex items-center justify-center text-sm">
                      #{apt.tokenNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-[11px] text-slate-400">
                        {apt.patient?.uhid} • Dr. {apt.doctor?.employee?.user?.lastName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No patients currently in waiting lounge.</p>
          )}
        </div>

        {/* In Consultation & Completed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">Completed Consultations Today ({completed.length})</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Recent Completed</span>
          </div>

          {completed.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {completed.slice(0, 8).map((apt: any) => (
                <div key={apt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#16A34A] font-mono font-black flex items-center justify-center text-sm">
                      #{apt.tokenNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-[11px] text-slate-400">
                        Consultant: Dr. {apt.doctor?.employee?.user?.firstName} {apt.doctor?.employee?.user?.lastName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#16A34A] font-bold bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No consultations concluded yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
};

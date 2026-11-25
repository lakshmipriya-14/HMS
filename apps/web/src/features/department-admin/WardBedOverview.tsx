import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  BedDouble,
  Building2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

export const WardBedOverview: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [error, setError] = useState('');

  const loadWards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getWardsAndBeds();
      if (res.data) {
        setWards(res.data);
        if (res.data.length > 0 && !selectedWardId) {
          setSelectedWardId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load wards and beds:', err);
      setError(err.message || 'Failed to load department beds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  if (loading) {
    return <LoadingState message="Loading department wards and bed occupancy maps..." />;
  }

  const currentWard = wards.find((w) => w.id === selectedWardId) || wards[0];
  const allBeds = wards.flatMap((w) => w.beds || []);
  const occupiedCount = allBeds.filter((b) => b.status === 'OCCUPIED').length;
  const availableCount = allBeds.filter((b) => b.status === 'AVAILABLE').length;
  const maintenanceCount = allBeds.filter((b) => b.status === 'MAINTENANCE' || b.status === 'CLEANING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <BedDouble className="w-6 h-6 text-teal-600" />
            Wards & Bed Utilization Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department inpatient ward bed status, occupancy levels, and turnover monitoring.
          </p>
        </div>
        <button
          onClick={loadWards}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Bed Status
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Bed Utilization KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Ward Beds</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{allBeds.length}</p>
          <span className="text-[10px] text-slate-500">Across {wards.length} wards</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Available Beds</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{availableCount}</p>
          <span className="text-[10px] text-emerald-700/80">Ready for admission</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-sky-600 uppercase">Occupied Beds</span>
          <p className="text-2xl font-black text-sky-600 mt-1">{occupiedCount}</p>
          <span className="text-[10px] text-sky-700/80">Active inpatients</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Maintenance / Cleaning</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{maintenanceCount}</p>
          <span className="text-[10px] text-amber-700/80">Turnover in progress</span>
        </div>
      </div>

      {/* Ward Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {wards.map((w) => {
          const isSelected = w.id === selectedWardId;
          const wBeds = w.beds || [];
          const occ = wBeds.filter((b: any) => b.status === 'OCCUPIED').length;
          return (
            <button
              key={w.id}
              onClick={() => setSelectedWardId(w.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-900/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{w.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-500'}`}>
                {occ}/{wBeds.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bed Map Grid */}
      {currentWard ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">{currentWard.name}</h2>
              <p className="text-xs text-slate-500">Floor {currentWard.floorNumber} • Code: {currentWard.code}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Maintenance</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentWard.beds?.map((bed: any) => {
              const admission = bed.admissions?.[0];
              const pat = admission?.patient;
              const isOccupied = bed.status === 'OCCUPIED';
              const isAvailable = bed.status === 'AVAILABLE';

              return (
                <div
                  key={bed.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isAvailable
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:border-emerald-400'
                      : isOccupied
                      ? 'bg-sky-50/40 border-sky-200 text-sky-950 hover:border-sky-400'
                      : 'bg-amber-50/40 border-amber-200 text-amber-950 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-black">Bed {bed.bedNumber}</span>
                      <span className="text-[10px] font-bold uppercase">{bed.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Room {bed.roomNumber}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/50">
                    {isOccupied && pat ? (
                      <div>
                        <p className="text-xs font-bold truncate">{pat.firstName} {pat.lastName}</p>
                        <p className="font-mono text-[10px] text-slate-500">{pat.uhid}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-emerald-700">Available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No ward beds found in this department.
        </div>
      )}
    </div>
  );
};

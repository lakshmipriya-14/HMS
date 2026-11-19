import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import {
  User,
  Calendar,
  Pill,
  FlaskConical,
  CreditCard,
  FileText,
  Clock,
  HeartPulse,
} from 'lucide-react';

export const PatientPortalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await apiClient.reception.searchPatients(user?.email || 'patient@aalayamhospital.com');
        if (res.data?.[0]) {
          const detailRes = await apiClient.reception.searchPatients(res.data[0].uhid);
          setPatientRecord(detailRes.data?.[0]);
        }
      } catch (err) {
        console.error('Failed to load patient records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [user]);

  if (loading) return <LoadingState message="Loading your health records & portal..." />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* UHID Digital Health Card */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-teal-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-48 h-48 bg-teal-600/20 rounded-full blur-2xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-xl font-bold">
              {patientRecord?.firstName?.[0] || 'M'}
            </div>
            <div>
              <p className="text-teal-300 text-xs font-semibold tracking-wider uppercase">
                Aalayam Digital Health Card (ஆலயம்)
              </p>
              <h2 className="text-xl font-bold mt-0.5">
                {patientRecord?.firstName || 'Muthuvel'} {patientRecord?.lastName || 'Karuppiah'}
              </h2>
              <p className="text-xs text-teal-200 mt-0.5">
                Blood Group: {patientRecord?.bloodGroup?.replace('_', ' ') || 'O Positive'} | DOB:{' '}
                {new Date(patientRecord?.dateOfBirth || '1978-06-15').toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-white/20 sm:pl-6">
            <p className="text-[10px] text-teal-300 uppercase tracking-widest font-mono">
              Unique Hospital ID
            </p>
            <p className="text-lg font-bold font-mono tracking-wider text-white">
              {patientRecord?.uhid || 'ALY-2026-0001'}
            </p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-semibold">
              Verified Inpatient
            </span>
          </div>
        </div>
      </div>

      {/* Health History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Prescriptions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm mb-4">
            <Pill className="w-4 h-4 text-teal-600" />
            <h3>My Active Prescribed Medicines</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Ecosprin 75mg</p>
                <p className="text-slate-500 text-[11px]">0-1-0 (After Lunch) • 30 Days</p>
                <p className="text-teal-700 text-[11px] font-medium mt-0.5">Advice: Take with water</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
                Dispensed
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Atorva 20mg</p>
                <p className="text-slate-500 text-[11px]">0-0-1 (Bedtime) • 30 Days</p>
                <p className="text-teal-700 text-[11px] font-medium mt-0.5">Advice: Night after dinner</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
                Dispensed
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Pan 40mg</p>
                <p className="text-slate-500 text-[11px]">1-0-0 (Morning) • 14 Days</p>
                <p className="text-teal-700 text-[11px] font-medium mt-0.5">Advice: 30 mins before breakfast</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">
                Dispensed
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Reports */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm mb-4">
            <FlaskConical className="w-4 h-4 text-sky-600" />
            <h3>Laboratory & Diagnostic Reports</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Cardiac Troponin I (High Sensitivity)</p>
                <p className="text-slate-500 text-[11px]">Assay Date: Today • Specimen: Serum</p>
                <p className="text-rose-600 font-semibold text-[11px] mt-0.5">
                  Result: 0.12 ng/mL (Ref: 0.0 - 0.04)
                </p>
              </div>
              <button className="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-xs font-semibold border border-teal-200">
                Download PDF
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Complete Blood Count (CBC)</p>
                <p className="text-slate-500 text-[11px]">Assay Date: Today • Automated Counter</p>
                <p className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                  All parameters within normal reference limits
                </p>
              </div>
              <button className="px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-xs font-semibold border border-teal-200">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

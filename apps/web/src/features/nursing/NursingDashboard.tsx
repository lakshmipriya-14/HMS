import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Clock,
  Plus,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

export const NursingDashboard: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

  // Vitals Form State
  const [temperature, setTemperature] = useState('98.6');
  const [systolicBp, setSystolicBp] = useState('120');
  const [diastolicBp, setDiastolicBp] = useState('80');
  const [pulseRate, setPulseRate] = useState('72');
  const [respiratoryRate, setRespiratoryRate] = useState('18');
  const [oxygenSaturation, setOxygenSaturation] = useState('99');
  const [bloodSugar, setBloodSugar] = useState('110');
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await apiClient.nursing.getAssignedPatients();
      if (res.data) setAdmissions(res.data);
    } catch (err) {
      console.error('Failed to load inpatients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.nursing.recordVitals({
        patientId: selectedAdmission.patientId,
        admissionId: selectedAdmission.id,
        temperature: parseFloat(temperature),
        systolicBp: parseInt(systolicBp, 10),
        diastolicBp: parseInt(diastolicBp, 10),
        pulseRate: parseInt(pulseRate, 10),
        respiratoryRate: parseInt(respiratoryRate, 10),
        oxygenSaturation: parseInt(oxygenSaturation, 10),
        bloodSugarMgDl: parseInt(bloodSugar, 10),
        notes: vitalsNotes,
      });

      setFeedbackMessage(res.message);
      setTimeout(() => {
        setSelectedAdmission(null);
        setFeedbackMessage('');
        fetchPatients();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error recording vitals');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading inpatient monitoring board..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Nursing Inpatient Care & Ward Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time vital signs charting, nursing task checklist, and medication administration (MAR)
          </p>
        </div>
      </div>

      {/* Inpatient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {admissions.map((adm) => {
          const latestVitals = adm.vitals?.[0];
          return (
            <div
              key={adm.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {adm.bed?.bedNumber || 'Bed Assigned'}
                  </span>
                  <StatusBadge status={adm.status} />
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {adm.patient?.firstName} {adm.patient?.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">UHID: {adm.patient?.uhid}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-500">Ward:</span> {adm.ward?.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Diagnosis:</span>{' '}
                    {adm.initialDiagnosis}
                  </p>
                </div>

                {/* Vitals Summary Box */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                    <span>Latest Vitals</span>
                    {latestVitals?.isAbnormal && (
                      <span className="text-rose-600 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Abnormal</span>
                      </span>
                    )}
                  </div>
                  {latestVitals ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">BP</span>
                        <span className="font-bold text-slate-700">
                          {latestVitals.systolicBp}/{latestVitals.diastolicBp}
                        </span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Pulse</span>
                        <span className="font-bold text-slate-700">{latestVitals.pulseRate} bpm</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">SpO2</span>
                        <span className="font-bold text-slate-700">{latestVitals.oxygenSaturation}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-1">No vitals charted yet</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedAdmission(adm)}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Thermometer className="w-4 h-4" />
                  <span>Chart Vitals</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Vitals Modal */}
      <Modal
        isOpen={!!selectedAdmission}
        onClose={() => setSelectedAdmission(null)}
        title={`Chart Vitals — ${selectedAdmission?.patient?.firstName} ${selectedAdmission?.patient?.lastName}`}
        subtitle={`Ward: ${selectedAdmission?.ward?.name} | Bed: ${selectedAdmission?.bed?.bedNumber}`}
      >
        {feedbackMessage ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">{feedbackMessage}</h4>
          </div>
        ) : (
          <form onSubmit={handleRecordVitals} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pulse Rate (bpm)
                </label>
                <input
                  type="number"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Pressure (Systolic)
                </label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Pressure (Diastolic)
                </label>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Oxygen Saturation (SpO2 %)
                </label>
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nursing Notes & Observations
              </label>
              <textarea
                rows={2}
                value={vitalsNotes}
                onChange={(e) => setVitalsNotes(e.target.value)}
                placeholder="Patient symptoms, pain score, fluid intake..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {isSubmitting ? 'Recording Vitals...' : 'Save & Verify'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

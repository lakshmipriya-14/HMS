import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  Stethoscope,
  CalendarCheck,
  User,
  AlertCircle,
  FileText,
  Pill,
  FlaskConical,
  Scan,
  BedDouble,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfIllness, setHistoryOfIllness] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [admissionRecommended, setAdmissionRecommended] = useState(false);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<
    { medicineId: string; medicineName: string; dosage: string; frequency: string; durationDays: number; instructions: string }[]
  >([]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await apiClient.doctor.getAppointments(user?.doctorProfileId);
      if (res.data) setAppointments(res.data);
    } catch (err) {
      console.error('Failed to load appointments queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [user]);

  const openConsultation = (apt: any) => {
    setSelectedAppointment(apt);
    setChiefComplaint(apt.reasonForVisit || '');
    setHistoryOfIllness('');
    setExaminationNotes('');
    setDiagnosisNotes('');
    setTreatmentPlan('');
    setAdmissionRecommended(false);
    setPrescriptions([
      {
        medicineId: 'med-1',
        medicineName: 'Ecosprin 75mg',
        dosage: '75mg',
        frequency: '0-1-0 (After Lunch)',
        durationDays: 30,
        instructions: 'Take with plenty of water',
      },
    ]);
    setSuccessMessage('');
  };

  const addPrescriptionItem = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medicineId: `med-${Date.now()}`,
        medicineName: 'Pan 40mg',
        dosage: '40mg',
        frequency: '1-0-0 (Before Food)',
        durationDays: 14,
        instructions: 'Take 30 mins before breakfast',
      },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setIsSubmitting(true);
    try {
      // 1. Save Consultation
      await apiClient.doctor.createConsultation({
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        chiefComplaint,
        historyOfPresentIllness: historyOfIllness,
        physicalExaminationNotes: examinationNotes,
        diagnosisNotes,
        treatmentPlan,
        admissionRecommended,
      });

      // 2. Save Prescription if items exist
      if (prescriptions.length > 0) {
        await apiClient.doctor.createPrescription({
          patientId: selectedAppointment.patientId,
          doctorId: selectedAppointment.doctorId,
          appointmentId: selectedAppointment.id,
          items: prescriptions,
        });
      }

      setSuccessMessage('Consultation and prescriptions saved and synchronized with Pharmacy!');
      setTimeout(() => {
        setSelectedAppointment(null);
        fetchQueue();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading today's OPD consultation queue..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Doctor Clinical Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Outpatient queue, live clinical encounter notes, digital prescriptions, and diagnostics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold text-slate-700">Duty Status: Active In Clinic</span>
        </div>
      </div>

      {/* OPD Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-800">Today's Appointment Queue</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {appointments.length} patients registered for consultation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name & UHID</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Chief Complaint / Reason</th>
                <th className="py-3 px-4">Allergies</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700 text-sm">
                    #{apt.tokenNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      UHID: {apt.patient?.uhid}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">
                    {apt.appointmentTime}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {apt.reasonForVisit}
                  </td>
                  <td className="py-3.5 px-4">
                    {apt.patient?.allergies?.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {apt.patient.allergies.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No known allergies</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={apt.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {apt.status === 'COMPLETED' ? (
                      <span className="text-emerald-600 font-semibold text-[11px]">
                        Consulted
                      </span>
                    ) : (
                      <button
                        onClick={() => openConsultation(apt)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center space-x-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consultation Encounter Modal */}
      <Modal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title={`Clinical Encounter — ${selectedAppointment?.patient?.firstName} ${selectedAppointment?.patient?.lastName}`}
        subtitle={`UHID: ${selectedAppointment?.patient?.uhid} | Token #${selectedAppointment?.tokenNumber}`}
        maxWidth="4xl"
      >
        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-lg font-bold text-slate-800">{successMessage}</h4>
            <p className="text-xs text-slate-500">Updating OPD queue...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveConsultation} className="space-y-6">
            {/* Allergies Notice Banner */}
            {selectedAppointment?.patient?.allergies?.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">
                  Patient Allergies Alert: {selectedAppointment.patient.allergies.join(', ')}
                </span>
              </div>
            )}

            {/* Clinical Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chief Complaints & History
                </label>
                <textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Patient presenting symptoms, duration..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Examination & Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={examinationNotes}
                  onChange={(e) => setExaminationNotes(e.target.value)}
                  placeholder="General condition, systemic exam, vitals review..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Diagnosis & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Provisional / Final Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  placeholder="e.g. Unstable Angina Pectoris / CAD"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Treatment Plan & Advice
                </label>
                <input
                  type="text"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="e.g. Bed rest, dietary restrictions, follow up in 7 days"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Inpatient Admission Recommendation Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Recommend Inpatient Admission (IPD)</h5>
                <p className="text-[11px] text-slate-500">
                  Flags this patient for admission registration and bed assignment in Wards / ICCU
                </p>
              </div>
              <input
                type="checkbox"
                checked={admissionRecommended}
                onChange={(e) => setAdmissionRecommended(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
            </div>

            {/* Digital Prescription Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Prescribed Medicines
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={addPrescriptionItem}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="space-y-2">
                {prescriptions.map((rx, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={rx.medicineName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, medicineName: val } : item))
                          );
                        }}
                        placeholder="Medicine name"
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={rx.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, dosage: val } : item))
                          );
                        }}
                        placeholder="Dose (e.g. 500mg)"
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={rx.frequency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, frequency: val } : item))
                          );
                        }}
                        placeholder="Frequency (e.g. 1-0-1)"
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={rx.durationDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, durationDays: val } : item))
                          );
                        }}
                        placeholder="Days"
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={rx.instructions}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, instructions: val } : item))
                          );
                        }}
                        placeholder="Instructions"
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removePrescriptionItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Encounter...' : 'Complete & Sign Consultation'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

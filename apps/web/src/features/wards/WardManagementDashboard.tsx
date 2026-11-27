import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import { BedDouble, Users, Sparkles, Wrench, ShieldAlert, CheckCircle } from 'lucide-react';

export const WardManagementDashboard: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admit modal
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [admitPatientUhid, setAdmitPatientUhid] = useState('');
  const [admitDoctorId, setAdmitDoctorId] = useState('');
  const [admitReason, setAdmitReason] = useState('Inpatient Clinical Observation');
  const [initialDiagnosis, setInitialDiagnosis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWards = async () => {
    try {
      const res = await apiClient.wards.getWards();
      if (res.data) {
        setWards(res.data);
        if (res.data.length > 0 && !selectedWard) {
          setSelectedWard(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async (wardId: string) => {
    try {
      const res = await apiClient.wards.getBeds(wardId);
      if (res.data) setBeds(res.data);
    } catch (err) {
      console.error('Failed to load beds:', err);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      fetchBeds(selectedWard.id);
    }
  }, [selectedWard]);

  const handleBedClick = (bed: any) => {
    if (bed.status === 'AVAILABLE') {
      setSelectedBed(bed);
      setIsAdmitModalOpen(true);
    } else if (bed.status === 'OCCUPIED') {
      alert(`Bed ${bed.bedNumber} is currently occupied by: ${bed.currentPatientName || 'Patient'}`);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedWard) return;

    setIsSubmitting(true);
    try {
      // Find patient by search/uhid
      const searchRes = await apiClient.reception.searchPatients(admitPatientUhid);
      const patient = searchRes.data?.[0];
      if (!patient) {
        throw new Error('Patient with this UHID or name not found');
      }

      const docRes = await apiClient.admin.getUsers({ role: 'DOCTOR' });
      const doctor = docRes.data?.[0]?.employee?.doctor?.id || docRes.data?.[0]?.id;

      await apiClient.wards.admitPatient({
        patientId: patient.id,
        admittingDoctorId: doctor,
        wardId: selectedWard.id,
        bedId: selectedBed.id,
        admissionReason: admitReason,
        initialDiagnosis: initialDiagnosis || 'Acute clinical admission',
      });

      alert(`Patient successfully admitted to ${selectedBed.bedNumber}!`);
      setIsAdmitModalOpen(false);
      fetchBeds(selectedWard.id);
      fetchWards();
    } catch (err: any) {
      alert(err.message || 'Admission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading hospital inpatient wards & bed layout..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Inpatient Wards & Bed Occupancy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual bed census, patient allocation, turnover housekeeping, and ICU telemetry
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs bg-white p-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600">Occupied</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">Cleaning</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-600">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Ward Selector Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {wards.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedWard(w)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedWard?.id === w.id
                ? 'bg-[#1565C0] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <div>{w.name}</div>
            <div className="text-[10px] opacity-80 mt-0.5 font-normal">
              Floor {w.floorNumber} | {w.occupiedBeds}/{w.totalBeds} Occupied
            </div>
          </button>
        ))}
      </div>

      {/* Bed Grid Visual Layout */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2">
            <BedDouble className="w-5 h-5 text-[#00897B]" />
            <h3 className="font-bold text-slate-800 text-sm">
              Bed Layout Map — {selectedWard?.name}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Click on any green AVAILABLE bed to admit patient
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {beds.map((bed) => {
            const isAvailable = bed.status === 'AVAILABLE';
            const isOccupied = bed.status === 'OCCUPIED';
            const isCleaning = bed.status === 'CLEANING';

            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  isAvailable
                    ? 'bg-[#DCFCE7]/60 border-[#BBF7D0] hover:border-emerald-500 hover:shadow-md'
                    : isOccupied
                    ? 'bg-[#FEE2E2]/60 border-[#FECACA]'
                    : isCleaning
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <BedDouble
                    className={`w-7 h-7 ${
                      isAvailable
                        ? 'text-[#16A34A]'
                        : isOccupied
                        ? 'text-[#DC2626]'
                        : isCleaning
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
                <h4 className="font-bold text-slate-800 text-xs font-mono">{bed.bedNumber}</h4>
                <p className="text-[10px] text-slate-500">{bed.type}</p>

                <div className="mt-2 pt-2 border-t border-slate-200/50">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAvailable
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : isOccupied
                        ? 'bg-rose-100 text-rose-800'
                        : isCleaning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {bed.status}
                  </span>
                </div>

                {isOccupied && bed.currentPatientName && (
                  <p className="text-[10px] text-slate-700 font-semibold truncate mt-1">
                    {bed.currentPatientName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title={`Admit Patient to Bed ${selectedBed?.bedNumber}`}
        subtitle={`Ward: ${selectedWard?.name} (Daily Rate: ₹${selectedBed?.dailyRate})`}
      >
        <form onSubmit={handleAdmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient UHID or Search Name *
            </label>
            <input
              type="text"
              required
              value={admitPatientUhid}
              onChange={(e) => setAdmitPatientUhid(e.target.value)}
              placeholder="e.g. ALY-2026-0001 or Muthuvel"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Admission *
            </label>
            <input
              type="text"
              required
              value={admitReason}
              onChange={(e) => setAdmitReason(e.target.value)}
              placeholder="Clinical indication for inpatient admission..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Admitting Diagnosis *
            </label>
            <input
              type="text"
              required
              value={initialDiagnosis}
              onChange={(e) => setInitialDiagnosis(e.target.value)}
              placeholder="e.g. Acute Coronary Syndrome"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdmitModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Allocating Bed...' : 'Confirm Admission & Occupy Bed'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

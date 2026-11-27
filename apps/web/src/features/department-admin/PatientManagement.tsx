import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  HeartPulse,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Eye,
  FileText,
  DoorOpen,
} from 'lucide-react';

export const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [error, setError] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getPatients({ query: query || undefined });
      if (res.data) setPatients(res.data);
    } catch (err: any) {
      console.error('Failed to load patients:', err);
      setError(err.message || 'Failed to load department patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [query]);

  const openDetails = (pat: any) => {
    setSelectedPatient(pat);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-[#00897B]" />
            Department Patient Directory & Care History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Patients who have active or past clinical engagements with this department.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by UHID, patient name, phone number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00897B]"
          />
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <LoadingState message="Loading department patient census..." />
      ) : patients.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">UHID</th>
                  <th className="py-3.5 px-4 font-bold">Patient Name</th>
                  <th className="py-3.5 px-4 font-bold">Gender / DOB</th>
                  <th className="py-3.5 px-4 font-bold">Phone Number</th>
                  <th className="py-3.5 px-4 font-bold">Blood Group</th>
                  <th className="py-3.5 px-4 font-bold">Latest Dept Visit</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((pat) => {
                  const lastApt = pat.appointments?.[0];
                  return (
                    <tr key={pat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">
                        {pat.uhid}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {pat.firstName} {pat.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {pat.gender} • {new Date(pat.dateOfBirth).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {pat.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                          {pat.bloodGroup?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {lastApt ? new Date(lastApt.appointmentDate).toLocaleDateString() : 'Admitted Record'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openDetails(pat)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#E0F2F1] hover:text-[#00897B] text-slate-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No patients found associated with this department.
        </div>
      )}

      {/* Patient Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Patient Record — ${selectedPatient?.uhid}`}
        subtitle={`${selectedPatient?.firstName} ${selectedPatient?.lastName}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
            <div>
              <span className="text-slate-400 block font-medium">Unique Hospital ID (UHID)</span>
              <span className="font-mono font-bold text-[#183153] text-sm mt-0.5 block">{selectedPatient?.uhid}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Contact Phone</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{selectedPatient?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Gender & Age</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {selectedPatient?.gender} • DOB: {selectedPatient?.dateOfBirth && new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Blood Group</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{selectedPatient?.bloodGroup?.replace(/_/g, ' ') || 'Unknown'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 block font-medium">Address</span>
            <p className="text-slate-700 font-medium">
              {selectedPatient?.addressLine1}, {selectedPatient?.city}, {selectedPatient?.state} - {selectedPatient?.postalCode}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 block font-medium">Emergency Contact</span>
            <p className="text-slate-700 font-medium">
              {selectedPatient?.emergencyContactName} ({selectedPatient?.emergencyContactRelation}) • {selectedPatient?.emergencyContactPhone}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <span className="font-bold block mb-1">Known Allergies:</span>
            <p className="text-[11px] font-medium">
              {selectedPatient?.allergies && selectedPatient.allergies.length > 0
                ? selectedPatient.allergies.join(', ')
                : 'No known drug or environmental allergies recorded.'}
            </p>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Close Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

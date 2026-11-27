import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV } from '../../utils/exportReport';
import {
  DoorOpen,
  Plus,
  Search,
  BedDouble,
  ArrowRightLeft,
  LogOut,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';

export const AdmissionManagement: React.FC = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ADMITTED');

  // Modals
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      const [admRes, wardRes, docRes] = await Promise.all([
        apiClient.hospitalAdmin.getAdmissions({ status: statusFilter || undefined }),
        apiClient.hospitalAdmin.getWards(),
        apiClient.hospitalAdmin.getDoctors(),
      ]);
      if (admRes.data) setAdmissions(admRes.data);
      if (wardRes.data) setWards(wardRes.data);
      if (docRes.data) setDoctors(docRes.data);
    } catch (err: any) {
      console.error('Failed to load admissions:', err);
      setErrorMessage(err.message || 'Failed to load inpatient admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, [statusFilter]);

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.wards.dischargePatient(selectedAdmission.id, {
        dischargeSummary: dischargeSummary || 'Patient clinically stable for discharge',
        dischargedAt: new Date().toISOString(),
      });
      setSuccessMessage(`Patient discharged successfully. Bed released for housekeeping.`);
      setDischargeModalOpen(false);
      setDischargeSummary('');
      await loadAdmissions();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmissions = admissions.filter((a) => {
    const pName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
    const admNo = (a.admissionNumber || '').toLowerCase();
    const uhid = (a.patient?.uhid || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return pName.includes(q) || admNo.includes(q) || uhid.includes(q);
  });

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Inpatient Admissions & Bed Census Ledger',
      headers: ['Admission No', 'UHID', 'Patient Name', 'Ward', 'Bed', 'Admitting Doctor', 'Admitted At', 'Status'],
      rows: filteredAdmissions.map((a) => [
        a.admissionNumber,
        a.patient?.uhid || 'N/A',
        `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
        a.ward?.name || 'N/A',
        a.bed ? `${a.bed.bedNumber} (${a.bed.roomNumber})` : 'N/A',
        a.admittingDoctor?.employee?.user
          ? `Dr. ${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`
          : 'N/A',
        new Date(a.admittedAt).toLocaleDateString('en-IN'),
        a.status,
      ]),
      fileName: 'inpatient_admissions_ledger',
    });
  };

  if (loading) return <LoadingState message="Loading hospital inpatient admissions & IPD census..." />;

  return (
    <div className="space-y-6 pb-12">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-[#16A34A] hover:text-emerald-900">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-[#DC2626] hover:text-rose-900">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-xl border border-[#FECACA]">
            <DoorOpen className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inpatient Admissions & IPD Tracking</h1>
            <p className="text-xs text-slate-500">
              Hospital admissions census, bed allocations, and clinical discharge clearances
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export IPD Census
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search admission #, patient name, UHID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ADMITTED">Admitted (Active Inpatients)</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="">All Admissions</option>
          </select>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Admission #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Ward & Bed</th>
                <th className="py-3 px-4">Admitting Doctor</th>
                <th className="py-3 px-4">Admission Reason & Diagnosis</th>
                <th className="py-3 px-4">Admitted Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No admission records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">{a.admissionNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{a.patient?.uhid}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{a.ward?.name || 'General Ward'}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Bed {a.bed?.bedNumber || 'N/A'} (Room {a.bed?.roomNumber || 'N/A'})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {a.admittingDoctor?.employee?.user
                        ? `Dr. ${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`
                        : 'Attending Doctor'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1">{a.initialDiagnosis}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{a.admissionReason}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(a.admittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {a.status === 'ADMITTED' ? (
                        <button
                          onClick={() => {
                            setSelectedAdmission(a);
                            setDischargeSummary('');
                            setErrorMessage('');
                            setDischargeModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[#DC2626] hover:text-rose-800 hover:bg-[#FEE2E2] rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Discharge
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISCHARGE MODAL */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title={`Discharge Patient: ${selectedAdmission?.patient?.firstName} ${selectedAdmission?.patient?.lastName}`}
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Confirming discharge will mark Admission #{selectedAdmission?.admissionNumber} as completed, release Bed{' '}
            <span className="font-bold">{selectedAdmission?.bed?.bedNumber}</span>, and flag the bed for housekeeping
            turnover cleaning.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Discharge Summary *</label>
            <textarea
              rows={3}
              required
              placeholder="Treatment given, patient condition at discharge, and follow-up clinical instructions..."
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDischargeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-sm"
            >
              {submitting ? 'Discharging...' : 'Confirm Discharge & Release Bed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

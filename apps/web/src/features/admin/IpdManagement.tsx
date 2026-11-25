import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV } from '../../utils/exportReport';
import {
  DoorOpen,
  BedDouble,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Building,
  Layers,
  Wrench,
  Sparkles,
  DollarSign,
  Filter,
  Download,
  Printer,
  Eye,
  FileText,
  CheckSquare,
  Square,
  Activity,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type IpdTab =
  | 'overview'
  | 'admissions'
  | 'census'
  | 'wards'
  | 'transfer'
  | 'discharge'
  | 'turnover'
  | 'rounds'
  | 'billing'
  | 'reports';

export const IpdManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IpdTab>('overview');
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [wardBeds, setWardBeds] = useState<any[]>([]);
  const [allHospitalBeds, setAllHospitalBeds] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [extendedStayOnly, setExtendedStayOnly] = useState(false);

  // Modals
  const [newAdmissionModalOpen, setNewAdmissionModalOpen] = useState(false);
  const [admissionDetailModalOpen, setAdmissionDetailModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTargetWardId, setTransferTargetWardId] = useState('');
  const [transferTargetBedId, setTransferTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('Medical necessity');

  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [clearanceBilling, setClearanceBilling] = useState(true);
  const [clearancePharmacy, setClearancePharmacy] = useState(true);
  const [clearanceDiagnostics, setClearanceDiagnostics] = useState(true);
  const [clearanceMedical, setClearanceMedical] = useState(true);

  const [addWardModalOpen, setAddWardModalOpen] = useState(false);
  const [editWardModalOpen, setEditWardModalOpen] = useState(false);
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [editBedModalOpen, setEditBedModalOpen] = useState(false);
  const [selectedBedForEdit, setSelectedBedForEdit] = useState<any>(null);

  const [wardForm, setWardForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    floorNumber: 1,
    genderAllowed: 'ANY',
  });

  const [bedForm, setBedForm] = useState({
    roomNumber: '101',
    bedNumber: '1',
    type: 'STANDARD',
    dailyRate: 1500,
    status: 'AVAILABLE',
  });

  // Admission form state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientForAdmission, setSelectedPatientForAdmission] = useState<any>(null);
  const [admissionWardId, setAdmissionWardId] = useState('');
  const [admissionBedId, setAdmissionBedId] = useState('');
  const [admissionDoctorId, setAdmissionDoctorId] = useState('');
  const [admissionReason, setAdmissionReason] = useState('Inpatient medical observation & care');
  const [initialDiagnosis, setInitialDiagnosis] = useState('');

  // Turnover selection
  const [selectedTurnoverBeds, setSelectedTurnoverBeds] = useState<string[]>([]);

  // Load All Hospital IPD Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [admRes, wRes, dRes, deptRes, pRes] = await Promise.all([
        apiClient.hospitalAdmin.getAdmissions(),
        apiClient.hospitalAdmin.getWards(),
        apiClient.hospitalAdmin.getDoctors(),
        apiClient.hospitalAdmin.getDepartments(),
        apiClient.hospitalAdmin.getPatients({ limit: 100 }),
      ]);

      if (admRes.data) setAdmissions(admRes.data);
      if (wRes.data) {
        setWards(wRes.data);
        if (wRes.data.length > 0 && !selectedWard) {
          setSelectedWard(wRes.data[0]);
        }
      }
      if (dRes.data) setDoctors(dRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (pRes.data) setPatients(pRes.data);

      // Load all beds across wards for global bed turnover / metrics
      if (wRes.data && wRes.data.length > 0) {
        const bedsPromises = wRes.data.map((w: any) => apiClient.wards.getBeds(w.id).catch(() => ({ data: [] })));
        const allBedsResults = await Promise.all(bedsPromises);
        const aggregatedBeds = allBedsResults.flatMap((res: any, idx: number) => {
          const ward = wRes.data[idx];
          return (res.data || []).map((b: any) => ({ ...b, wardName: ward.name, wardCode: ward.code }));
        });
        setAllHospitalBeds(aggregatedBeds);
      }
    } catch (err: any) {
      console.error('Failed to load IPD management data:', err);
      setErrorMessage(err.message || 'Failed to load IPD data');
    } finally {
      setLoading(false);
    }
  };

  const loadWardBeds = async (wardId: string) => {
    try {
      setBedsLoading(true);
      const res = await apiClient.wards.getBeds(wardId);
      if (res.data) {
        setWardBeds(res.data);
      }
    } catch (err) {
      console.error('Failed to load ward beds:', err);
    } finally {
      setBedsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      loadWardBeds(selectedWard.id);
    }
  }, [selectedWard]);

  // Derived Metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const activeInpatients = useMemo(() => {
    return admissions.filter((a) => a.status === 'ADMITTED');
  }, [admissions]);

  const admissionsToday = useMemo(() => {
    return admissions.filter((a) => {
      const date = a.admittedAt ? new Date(a.admittedAt).toISOString().split('T')[0] : '';
      return date === todayStr;
    });
  }, [admissions, todayStr]);

  const dischargesToday = useMemo(() => {
    return admissions.filter((a) => {
      const date = a.dischargedAt ? new Date(a.dischargedAt).toISOString().split('T')[0] : '';
      return a.status === 'DISCHARGED' && date === todayStr;
    });
  }, [admissions, todayStr]);

  const totalBedsCount = allHospitalBeds.length;
  const occupiedBedsCount = allHospitalBeds.filter((b) => b.status === 'OCCUPIED').length;
  const availableBedsCount = allHospitalBeds.filter((b) => b.status === 'AVAILABLE').length;
  const cleaningBedsCount = allHospitalBeds.filter(
    (b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING'
  ).length;
  const maintenanceBedsCount = allHospitalBeds.filter((b) => b.status === 'MAINTENANCE').length;

  const icuBeds = allHospitalBeds.filter((b) => b.type === 'ICU' || b.type === 'CCU');
  const icuOccupied = icuBeds.filter((b) => b.status === 'OCCUPIED').length;
  const icuOccupancyRate = icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;

  // Length of stay calculation helper
  const calculateLos = (admittedAt: string, dischargedAt?: string) => {
    const start = new Date(admittedAt).getTime();
    const end = dischargedAt ? new Date(dischargedAt).getTime() : Date.now();
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const extendedStayPatients = useMemo(() => {
    return activeInpatients.filter((a) => calculateLos(a.admittedAt) > 7);
  }, [activeInpatients]);

  const averageLos = useMemo(() => {
    if (activeInpatients.length === 0) return 0;
    const totalDays = activeInpatients.reduce((sum, a) => sum + calculateLos(a.admittedAt), 0);
    return Math.round((totalDays / activeInpatients.length) * 10) / 10;
  }, [activeInpatients]);

  // Filtered Admissions
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((a) => {
      const q = searchTerm.toLowerCase();
      const pName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
      const uhid = (a.patient?.uhid || '').toLowerCase();
      const admNo = (a.admissionNumber || '').toLowerCase();
      const docName = a.admittingDoctor?.employee?.user
        ? `${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`.toLowerCase()
        : '';

      const matchesSearch = pName.includes(q) || uhid.includes(q) || admNo.includes(q) || docName.includes(q);
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchesWard = wardFilter === 'ALL' || a.wardId === wardFilter;
      const matchesExtended = !extendedStayOnly || (a.status === 'ADMITTED' && calculateLos(a.admittedAt) > 7);

      return matchesSearch && matchesStatus && matchesWard && matchesExtended;
    });
  }, [admissions, searchTerm, statusFilter, wardFilter, extendedStayOnly]);

  // Filtered Census Patients
  const filteredCensus = useMemo(() => {
    return activeInpatients.filter((a) => {
      const q = searchTerm.toLowerCase();
      const pName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
      const uhid = (a.patient?.uhid || '').toLowerCase();
      const docName = a.admittingDoctor?.employee?.user
        ? `${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`.toLowerCase()
        : '';
      const wardName = (a.ward?.name || '').toLowerCase();

      const matchesSearch = pName.includes(q) || uhid.includes(q) || docName.includes(q) || wardName.includes(q);
      const matchesWard = wardFilter === 'ALL' || a.wardId === wardFilter;
      const matchesExtended = !extendedStayOnly || calculateLos(a.admittedAt) > 7;

      return matchesSearch && matchesWard && matchesExtended;
    });
  }, [activeInpatients, searchTerm, wardFilter, extendedStayOnly]);

  // Patients for Admission Filter
  const searchedPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients.slice(0, 10);
    const q = patientSearchQuery.toLowerCase();
    return patients.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const uhid = (p.uhid || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || uhid.includes(q) || phone.includes(q);
    });
  }, [patients, patientSearchQuery]);

  // Available beds in selected admission ward
  const availableBedsInAdmissionWard = useMemo(() => {
    if (!admissionWardId) return [];
    return allHospitalBeds.filter((b) => b.wardId === admissionWardId && b.status === 'AVAILABLE');
  }, [allHospitalBeds, admissionWardId]);

  // Available beds in selected transfer target ward
  const availableBedsInTransferWard = useMemo(() => {
    if (!transferTargetWardId) return [];
    return allHospitalBeds.filter((b) => b.wardId === transferTargetWardId && b.status === 'AVAILABLE');
  }, [allHospitalBeds, transferTargetWardId]);

  // Handle Admission Submission
  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForAdmission) {
      setErrorMessage('Please search and select a patient for admission.');
      return;
    }
    if (!admissionWardId) {
      setErrorMessage('Please select a destination ward.');
      return;
    }
    if (!admissionBedId) {
      setErrorMessage('Please select an available bed.');
      return;
    }
    if (!admissionDoctorId) {
      setErrorMessage('Please select an admitting doctor.');
      return;
    }

    // Conflict Check: Check if patient is already admitted
    const existingActive = activeInpatients.find((a) => a.patientId === selectedPatientForAdmission.id);
    if (existingActive) {
      setErrorMessage(
        `Conflict: Patient ${selectedPatientForAdmission.firstName} is already admitted in ${existingActive.ward?.name || 'a ward'} (Bed ${existingActive.bed?.bedNumber || ''}). Multiple concurrent admissions are disallowed.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.admitPatient({
        patientId: selectedPatientForAdmission.id,
        wardId: admissionWardId,
        bedId: admissionBedId,
        admittingDoctorId: admissionDoctorId,
        admissionReason,
        initialDiagnosis,
        admittedAt: new Date().toISOString(),
      });

      setSuccessMessage(
        `Patient ${selectedPatientForAdmission.firstName} ${selectedPatientForAdmission.lastName} admitted successfully!`
      );
      setNewAdmissionModalOpen(false);
      setSelectedPatientForAdmission(null);
      setPatientSearchQuery('');
      setAdmissionWardId('');
      setAdmissionBedId('');
      setAdmissionDoctorId('');
      setInitialDiagnosis('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process admission');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bed Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    if (!transferTargetWardId || !transferTargetBedId) {
      setErrorMessage('Please select target ward and target bed for transfer.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.transferBed(selectedAdmission.id, {
        targetWardId: transferTargetWardId,
        targetBedId: transferTargetBedId,
        reason: transferReason,
      });

      setSuccessMessage(
        `Inpatient ${selectedAdmission.patient?.firstName} transferred successfully. Previous bed marked for housekeeping sanitation.`
      );
      setTransferModalOpen(false);
      setSelectedAdmission(null);
      setTransferTargetWardId('');
      setTransferTargetBedId('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to transfer patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Discharge
  const handleExecuteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    if (!clearanceBilling || !clearancePharmacy || !clearanceDiagnostics || !clearanceMedical) {
      setErrorMessage(
        'All clearance requirements (Billing, Pharmacy, Diagnostics, and Medical) must be signed off prior to inpatient discharge.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.dischargePatient(selectedAdmission.id, {
        dischargeSummary: dischargeSummary || 'Patient clinically stable for discharge and follow-up.',
        dischargedAt: new Date().toISOString(),
      });

      setSuccessMessage(
        `Patient ${selectedAdmission.patient?.firstName} ${selectedAdmission.patient?.lastName} discharged successfully. Bed released to housekeeping.`
      );
      setDischargeModalOpen(false);
      setSelectedAdmission(null);
      setDischargeSummary('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Admission
  const handleCancelAdmission = async (admission: any) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel admission ${admission.admissionNumber} for patient ${admission.patient?.firstName}? This will release bed ${admission.bed?.bedNumber || ''} back to AVAILABLE.`
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.cancelAdmission(admission.id, 'Administrative cancellation');
      setSuccessMessage(`Admission ${admission.admissionNumber} cancelled and bed released.`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel admission');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Ward CRUD
  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createWard(wardForm);
      setSuccessMessage(`Ward "${wardForm.name}" created successfully.`);
      setAddWardModalOpen(false);
      setWardForm({
        name: '',
        code: '',
        departmentId: '',
        floorNumber: 1,
        genderAllowed: 'ANY',
      });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create ward');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateWard(selectedWard.id, {
        name: selectedWard.name,
        code: selectedWard.code,
        floorNumber: Number(selectedWard.floorNumber),
        genderAllowed: selectedWard.genderAllowed,
      });
      setSuccessMessage(`Ward "${selectedWard.name}" updated successfully.`);
      setEditWardModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update ward');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bed CRUD
  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.createBed(selectedWard.id, bedForm);
      setSuccessMessage(`Bed ${bedForm.bedNumber} added to room ${bedForm.roomNumber}.`);
      setAddBedModalOpen(false);
      await loadWardBeds(selectedWard.id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedForEdit) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.updateBed(selectedBedForEdit.id, {
        roomNumber: selectedBedForEdit.roomNumber,
        bedNumber: selectedBedForEdit.bedNumber,
        type: selectedBedForEdit.type,
        dailyRate: Number(selectedBedForEdit.dailyRate),
      });
      setSuccessMessage(`Bed ${selectedBedForEdit.bedNumber} updated successfully.`);
      setEditBedModalOpen(false);
      setSelectedBedForEdit(null);
      if (selectedWard) await loadWardBeds(selectedWard.id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = async (bed: any) => {
    if (bed.status === 'OCCUPIED') {
      setErrorMessage(`Cannot delete Bed ${bed.bedNumber}: Bed is currently occupied by an inpatient.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete Bed ${bed.bedNumber} from Room ${bed.roomNumber}?`)) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.hospitalAdmin.deleteBed(bed.id);
      setSuccessMessage(`Bed ${bed.bedNumber} removed from inventory.`);
      if (selectedWard) await loadWardBeds(selectedWard.id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickBedStatusUpdate = async (bedId: string, status: string) => {
    try {
      setSubmitting(true);
      await apiClient.hospitalAdmin.updateBedStatus(bedId, status);
      setSuccessMessage(`Bed status updated to ${status}.`);
      if (selectedWard) await loadWardBeds(selectedWard.id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Bed Turnover
  const handleBulkTurnoverComplete = async () => {
    if (selectedTurnoverBeds.length === 0) return;
    try {
      setSubmitting(true);
      await apiClient.hospitalAdmin.bulkUpdateBedStatus(selectedTurnoverBeds, 'AVAILABLE');
      setSuccessMessage(`Successfully sanitized and released ${selectedTurnoverBeds.length} beds to AVAILABLE.`);
      setSelectedTurnoverBeds([]);
      await loadData();
      if (selectedWard) await loadWardBeds(selectedWard.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to bulk update beds');
    } finally {
      setSubmitting(false);
    }
  };

  // Reports Exports
  const handleExportCensus = () => {
    exportToCSV({
      title: 'Active Inpatient Census Ledger',
      headers: [
        'Admission No',
        'UHID',
        'Patient Name',
        'Age/Gender',
        'Ward',
        'Room',
        'Bed',
        'Admitting Doctor',
        'Admitted At',
        'Length of Stay (Days)',
        'Initial Diagnosis',
      ],
      rows: activeInpatients.map((a) => [
        a.admissionNumber,
        a.patient?.uhid || 'N/A',
        `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
        `${a.patient?.age || 'N/A'} / ${a.patient?.gender || 'N/A'}`,
        a.ward?.name || 'N/A',
        a.bed?.roomNumber || 'N/A',
        a.bed?.bedNumber || 'N/A',
        a.admittingDoctor?.employee?.user
          ? `Dr. ${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`
          : 'N/A',
        new Date(a.admittedAt).toLocaleString('en-IN'),
        calculateLos(a.admittedAt),
        a.initialDiagnosis || a.admissionReason || 'N/A',
      ]),
      fileName: 'active_inpatient_census',
    });
  };

  const handleExportAdmissions = () => {
    exportToCSV({
      title: 'Inpatient Admissions Ledger',
      headers: [
        'Admission No',
        'UHID',
        'Patient Name',
        'Ward',
        'Bed',
        'Admitting Doctor',
        'Admitted At',
        'Discharged At',
        'Status',
        'Reason',
      ],
      rows: filteredAdmissions.map((a) => [
        a.admissionNumber,
        a.patient?.uhid || 'N/A',
        `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
        a.ward?.name || 'N/A',
        a.bed?.bedNumber || 'N/A',
        a.admittingDoctor?.employee?.user
          ? `Dr. ${a.admittingDoctor.employee.user.firstName} ${a.admittingDoctor.employee.user.lastName}`
          : 'N/A',
        new Date(a.admittedAt).toLocaleDateString('en-IN'),
        a.dischargedAt ? new Date(a.dischargedAt).toLocaleDateString('en-IN') : 'Active',
        a.status,
        a.admissionReason || 'N/A',
      ]),
      fileName: 'ipd_admissions_ledger',
    });
  };

  const handleExportWardUtilization = () => {
    exportToCSV({
      title: 'Ward Capacity & Utilization Report',
      headers: [
        'Ward Code',
        'Ward Name',
        'Floor',
        'Total Beds',
        'Occupied Beds',
        'Available Beds',
        'Cleaning Beds',
        'Occupancy Rate (%)',
      ],
      rows: wards.map((w) => {
        const beds = allHospitalBeds.filter((b) => b.wardId === w.id);
        const total = beds.length;
        const occ = beds.filter((b) => b.status === 'OCCUPIED').length;
        const avail = beds.filter((b) => b.status === 'AVAILABLE').length;
        const clean = beds.filter((b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING').length;
        const rate = total > 0 ? Math.round((occ / total) * 100) : 0;
        return [w.code, w.name, w.floorNumber, total, occ, avail, clean, `${rate}%`];
      }),
      fileName: 'ward_utilization_report',
    });
  };

  if (loading) {
    return <LoadingState message="Loading hospital IPD operations, inpatient census & ward matrix..." />;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">
            ×
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 shadow-sm">
              <DoorOpen className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Inpatient Department (IPD) Management</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded-md uppercase tracking-wider">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete hospital admissions desk, bed census matrix, clinical transfers, clearance & turnover operations
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedPatientForAdmission(null);
                setPatientSearchQuery('');
                setNewAdmissionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Inpatient Admission
            </button>
            <button
              onClick={() => setActiveTab('turnover')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Housekeeping Desk ({cleaningBedsCount})
            </button>
            <button
              onClick={handleExportCensus}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Census
            </button>
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 mt-4 pt-3 scrollbar-thin">
          {[
            { id: 'overview', label: 'IPD Dashboard', icon: Activity },
            { id: 'admissions', label: 'Admissions Ledger', icon: DoorOpen, count: admissions.length },
            { id: 'census', label: 'Inpatient Census', icon: BedDouble, count: activeInpatients.length },
            { id: 'wards', label: 'Wards & Beds Matrix', icon: Layers, count: wards.length },
            { id: 'transfer', label: 'Bed Transfer Desk', icon: ArrowRightLeft },
            { id: 'discharge', label: 'Discharge & Clearance', icon: LogOut },
            { id: 'turnover', label: 'Turnover & Housekeeping', icon: Sparkles, count: cleaningBedsCount },
            { id: 'rounds', label: 'Doctor Ward Oversight', icon: Users },
            { id: 'billing', label: 'IPD Daily Charges', icon: DollarSign },
            { id: 'reports', label: 'Reports & Analytics', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as IpdTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-teal-200/80 text-teal-900 font-bold' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE IPD DASHBOARD                                           */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Inpatient Census</span>
                <BedDouble className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{activeInpatients.length}</div>
              <div className="text-[11px] text-teal-700 font-medium mt-1">Currently Admitted</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Admissions Today</span>
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{admissionsToday.length}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">New Inpatients Today</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Discharges Today</span>
                <LogOut className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{dischargesToday.length}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Completed Discharges</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Available Beds</span>
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-teal-700">{availableBedsCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                of {totalBedsCount} Total Beds ({totalBedsCount > 0 ? Math.round((availableBedsCount / totalBedsCount) * 100) : 0}%)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">ICU Occupancy</span>
                <HeartPulse className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{icuOccupancyRate}%</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {icuOccupied} / {icuBeds.length} ICU Beds
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Avg Length of Stay</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{averageLos} <span className="text-xs font-normal text-slate-500">days</span></div>
              <div className="text-[11px] text-indigo-700 font-medium mt-1">Hospital ALOS Metric</div>
            </div>
          </div>

          {/* Extended Stay Warning Banner */}
          {extendedStayPatients.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-amber-900">
                    Extended Inpatient Stay Alert ({extendedStayPatients.length} Patients &gt; 7 Days)
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Clinical administrative oversight recommended for long-stay inpatients to review discharge plans and insurance limits.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setExtendedStayOnly(true);
                  setActiveTab('census');
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap self-start md:self-auto transition-all"
              >
                Review Extended Stays ({extendedStayPatients.length})
              </button>
            </div>
          )}

          {/* Operational Bed State Summary & Ward Occupancy Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bed Status Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Live Bed Inventory Breakdown</h3>
                <span className="text-xs font-semibold text-slate-500">{totalBedsCount} Total Beds</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
                    </span>
                    <span className="font-bold text-slate-900">{availableBedsCount} beds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${totalBedsCount > 0 ? (availableBedsCount / totalBedsCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied
                    </span>
                    <span className="font-bold text-slate-900">{occupiedBedsCount} beds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${totalBedsCount > 0 ? (occupiedBedsCount / totalBedsCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Housekeeping / Cleaning
                    </span>
                    <span className="font-bold text-slate-900">{cleaningBedsCount} beds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${totalBedsCount > 0 ? (cleaningBedsCount / totalBedsCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Maintenance
                    </span>
                    <span className="font-bold text-slate-900">{maintenanceBedsCount} beds</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-slate-500 h-2 rounded-full"
                      style={{ width: `${totalBedsCount > 0 ? (maintenanceBedsCount / totalBedsCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Overall Occupancy Rate:</span>
                <span className="font-bold text-teal-700 text-sm">
                  {totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Ward-wise Utilization */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ward Capacity & Utilization</h3>
                  <p className="text-xs text-slate-500">Real-time bed allocation across hospital wards</p>
                </div>
                <button
                  onClick={() => setActiveTab('wards')}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  Manage Wards <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {wards.map((ward) => {
                  const bedsInWard = allHospitalBeds.filter((b) => b.wardId === ward.id);
                  const total = bedsInWard.length;
                  const occ = bedsInWard.filter((b) => b.status === 'OCCUPIED').length;
                  const avail = bedsInWard.filter((b) => b.status === 'AVAILABLE').length;
                  const clean = bedsInWard.filter((b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING').length;
                  const percent = total > 0 ? Math.round((occ / total) * 100) : 0;

                  return (
                    <div key={ward.id} className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{ward.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                            {ward.code}
                          </span>
                          <span className="text-[11px] text-slate-500">Floor {ward.floorNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-700 font-semibold">{avail} avail</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-rose-700 font-semibold">{occ} occ</span>
                          {clean > 0 && (
                            <>
                              <span className="text-slate-400">|</span>
                              <span className="text-amber-700 font-semibold">{clean} clean</span>
                            </>
                          )}
                          <span className="font-bold text-slate-900 ml-2">{percent}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200/80 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percent > 85 ? 'bg-rose-500' : percent > 60 ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}

                {wards.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No wards registered in this hospital.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADMISSIONS LEDGER & REGISTRATION WORKFLOW                          */}
      {/* ========================================================================= */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search admission no, patient, UHID, doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ADMITTED">Admitted (Active)</option>
                <option value="DISCHARGED">Discharged</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Ward Filter */}
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
              >
                <option value="ALL">All Wards</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAdmissions}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Ledger
              </button>
              <button
                onClick={() => {
                  setSelectedPatientForAdmission(null);
                  setNewAdmissionModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Admit Patient
              </button>
            </div>
          </div>

          {/* Admissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Admission No</th>
                    <th className="py-3.5 px-4">Patient & UHID</th>
                    <th className="py-3.5 px-4">Ward & Bed</th>
                    <th className="py-3.5 px-4">Admitting Doctor</th>
                    <th className="py-3.5 px-4">Admitted Date</th>
                    <th className="py-3.5 px-4">Length of Stay</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAdmissions.map((adm) => {
                    const los = calculateLos(adm.admittedAt, adm.dischargedAt);
                    const isLongStay = adm.status === 'ADMITTED' && los > 7;

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                          {adm.admissionNumber || 'ADM-PENDING'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {adm.patient?.firstName} {adm.patient?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">UHID: {adm.patient?.uhid || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{adm.ward?.name || 'Unassigned'}</div>
                          <div className="text-[11px] text-slate-500">
                            Bed {adm.bed?.bedNumber || 'N/A'} (Rm {adm.bed?.roomNumber || 'N/A'})
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">
                            {adm.admittingDoctor?.employee?.user
                              ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`
                              : 'Staff Physician'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {adm.admittingDoctor?.department?.name || 'General Medicine'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{new Date(adm.admittedAt).toLocaleDateString('en-IN')}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(adm.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isLongStay ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {los} {los === 1 ? 'day' : 'days'}
                            {isLongStay && ' ⚠️'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={adm.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setAdmissionDetailModalOpen(true);
                              }}
                              title="View Details"
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {adm.status === 'ADMITTED' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAdmission(adm);
                                    setTransferTargetWardId('');
                                    setTransferTargetBedId('');
                                    setTransferModalOpen(true);
                                  }}
                                  title="Transfer Bed"
                                  className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAdmission(adm);
                                    setDischargeSummary('');
                                    setDischargeModalOpen(true);
                                  }}
                                  title="Initiate Discharge"
                                  className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <LogOut className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelAdmission(adm)}
                                  title="Cancel Admission"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <EmptyState
                          icon={DoorOpen}
                          title="No admission records found"
                          description="No hospital inpatient admissions matching your search criteria."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INPATIENT CENSUS TABLE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'census' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search active census by patient, UHID, doctor, ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
              >
                <option value="ALL">All Wards</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extendedStayOnly}
                  onChange={(e) => setExtendedStayOnly(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Extended Stay (&gt; 7 Days) Only</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCensus}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Census CSV
              </button>
            </div>
          </div>

          {/* Census Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Patient & Demographics</th>
                    <th className="py-3.5 px-4">Admission Details</th>
                    <th className="py-3.5 px-4">Ward Location</th>
                    <th className="py-3.5 px-4">Bed & Type</th>
                    <th className="py-3.5 px-4">Attending Doctor</th>
                    <th className="py-3.5 px-4">Initial Diagnosis</th>
                    <th className="py-3.5 px-4">Length of Stay</th>
                    <th className="py-3.5 px-4 text-right">Care Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCensus.map((adm) => {
                    const los = calculateLos(adm.admittedAt);
                    const isLongStay = los > 7;

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {adm.patient?.firstName} {adm.patient?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">UHID: {adm.patient?.uhid}</div>
                          <div className="text-[11px] text-slate-400">
                            {adm.patient?.gender} • {adm.patient?.age || 'N/A'} yrs
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-teal-800 font-semibold">{adm.admissionNumber}</div>
                          <div className="text-[11px] text-slate-500">
                            Admitted {new Date(adm.admittedAt).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{adm.ward?.name}</div>
                          <div className="text-[11px] text-slate-400">Floor {adm.ward?.floorNumber || 1}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">
                            Room {adm.bed?.roomNumber} • Bed {adm.bed?.bedNumber}
                          </span>
                          <div className="text-[10px] text-teal-700 font-medium">{adm.bed?.type || 'STANDARD'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {adm.admittingDoctor?.employee?.user
                              ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`
                              : 'Staff Physician'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {adm.admittingDoctor?.department?.name || 'Department'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px] truncate" title={adm.initialDiagnosis || adm.admissionReason}>
                          <span className="text-slate-800 font-medium">
                            {adm.initialDiagnosis || adm.admissionReason || 'Clinical Observation'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isLongStay ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-teal-50 text-teal-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{los} {los === 1 ? 'day' : 'days'}</span>
                            {isLongStay && <span title="Extended stay > 7 days">⚠️</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setTransferTargetWardId('');
                                setTransferTargetBedId('');
                                setTransferModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              Transfer
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setDischargeSummary('');
                                setDischargeModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <LogOut className="w-3 h-3" />
                              Discharge
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCensus.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <EmptyState
                          icon={BedDouble}
                          title="No inpatients currently in census"
                          description="All hospital inpatient beds in this selection are currently vacant."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WARDS & BEDS MATRIX                                                */}
      {/* ========================================================================= */}
      {activeTab === 'wards' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Ward Selection Sidebar */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hospital Wards</h3>
              <button
                onClick={() => setAddWardModalOpen(true)}
                className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ward
              </button>
            </div>

            <div className="space-y-2">
              {wards.map((ward) => {
                const isSelected = selectedWard?.id === ward.id;
                const beds = allHospitalBeds.filter((b) => b.wardId === ward.id);
                const occ = beds.filter((b) => b.status === 'OCCUPIED').length;

                return (
                  <div
                    key={ward.id}
                    onClick={() => setSelectedWard(ward)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-300 shadow-xs'
                        : 'bg-white border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{ward.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ward.code}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>Floor {ward.floorNumber}</span>
                      <span className="font-semibold text-slate-700">
                        {occ} / {beds.length} occupied
                      </span>
                    </div>
                  </div>
                );
              })}

              {wards.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No wards created yet.</p>
              )}
            </div>
          </div>

          {/* Bed Matrix Grid for Selected Ward */}
          <div className="lg:col-span-3 space-y-4">
            {selectedWard ? (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{selectedWard.name}</h2>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono font-semibold">
                        {selectedWard.code}
                      </span>
                      <span className="text-xs text-slate-500">Floor {selectedWard.floorNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gender Allowed: {selectedWard.genderAllowed} • Total Beds: {wardBeds.length}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditWardModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Ward
                    </button>
                    <button
                      onClick={() => {
                        setBedForm({
                          roomNumber: '101',
                          bedNumber: `${wardBeds.length + 1}`,
                          type: 'STANDARD',
                          dailyRate: 1500,
                          status: 'AVAILABLE',
                        });
                        setAddBedModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Bed
                    </button>
                  </div>
                </div>

                {/* Bed Status Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700 font-medium">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-slate-700 font-medium">Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700 font-medium">Housekeeping / Cleaning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                    <span className="text-slate-700 font-medium">Maintenance</span>
                  </div>
                </div>

                {/* Beds Grid Grouped by Room */}
                {bedsLoading ? (
                  <LoadingState message="Loading beds for selected ward..." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wardBeds.map((bed) => {
                      const isOccupied = bed.status === 'OCCUPIED';
                      const isAvailable = bed.status === 'AVAILABLE';
                      const isCleaning = bed.status === 'HOUSEKEEPING' || bed.status === 'CLEANING';
                      const isMaintenance = bed.status === 'MAINTENANCE';

                      return (
                        <div
                          key={bed.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isOccupied
                              ? 'bg-rose-50/40 border-rose-200'
                              : isAvailable
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isCleaning
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-500">Room {bed.roomNumber}</span>
                              <div className="text-base font-bold text-slate-900 flex items-center gap-1">
                                <BedDouble className="w-4 h-4 text-slate-600" />
                                Bed {bed.bedNumber}
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isOccupied
                                  ? 'bg-rose-100 text-rose-800'
                                  : isAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCleaning
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {bed.status}
                            </span>
                          </div>

                          <div className="mt-3 text-xs space-y-1">
                            <div className="text-slate-500 flex justify-between">
                              <span>Type:</span>
                              <span className="font-semibold text-slate-800">{bed.type}</span>
                            </div>
                            <div className="text-slate-500 flex justify-between">
                              <span>Daily Rate:</span>
                              <span className="font-semibold text-slate-800">₹{bed.dailyRate || 1000}</span>
                            </div>
                            {isOccupied && bed.currentPatientName && (
                              <div className="pt-2 border-t border-rose-100 text-rose-900 font-semibold truncate">
                                👤 {bed.currentPatientName}
                              </div>
                            )}
                          </div>

                          {/* Quick Bed Controls */}
                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              {isCleaning && (
                                <button
                                  onClick={() => handleQuickBedStatusUpdate(bed.id, 'AVAILABLE')}
                                  className="p-1 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded text-[11px] font-semibold"
                                  title="Mark Cleaned -> Available"
                                >
                                  Cleaned ✓
                                </button>
                              )}
                              {isAvailable && (
                                <button
                                  onClick={() => handleQuickBedStatusUpdate(bed.id, 'HOUSEKEEPING')}
                                  className="p-1 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded text-[11px] font-semibold"
                                  title="Mark for Cleaning"
                                >
                                  Sanitize
                                </button>
                              )}
                              {!isOccupied && (
                                <button
                                  onClick={() =>
                                    handleQuickBedStatusUpdate(
                                      bed.id,
                                      isMaintenance ? 'AVAILABLE' : 'MAINTENANCE'
                                    )
                                  }
                                  className="p-1 text-slate-600 bg-slate-200 hover:bg-slate-300 rounded text-[11px]"
                                  title={isMaintenance ? 'Release from Maintenance' : 'Mark Maintenance'}
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedBedForEdit(bed);
                                  setEditBedModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="Edit Bed"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isOccupied && (
                                <button
                                  onClick={() => handleDeleteBed(bed)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Delete Bed"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {wardBeds.length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400">
                        <EmptyState
                          icon={BedDouble}
                          title="No beds configured for this ward"
                          description="Click 'Add Bed' above to configure rooms and beds."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
                Please select a ward from the list on the left.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BED TRANSFER MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'transfer' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Bed Transfer Operations Desk</h2>
                <p className="text-xs text-slate-500">
                  Coordinate inter-ward patient bed relocations with atomic turnover and housekeeping release
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Inpatients Available for Transfer ({activeInpatients.length})
              </h3>
              <span className="text-xs text-slate-500">Source bed will automatically transition to Housekeeping</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Current Ward</th>
                    <th className="py-3 px-4">Current Room & Bed</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeInpatients.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {adm.patient?.firstName} {adm.patient?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">UHID: {adm.patient?.uhid}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-teal-800">{adm.admissionNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{adm.ward?.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        Room {adm.bed?.roomNumber} • Bed {adm.bed?.bedNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {adm.admittingDoctor?.employee?.user
                          ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`
                          : 'Staff Physician'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setTransferTargetWardId('');
                            setTransferTargetBedId('');
                            setTransferModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Initiate Transfer
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeInpatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active inpatients currently admitted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DISCHARGE MANAGEMENT & CLEARANCE HUB                               */}
      {/* ========================================================================= */}
      {activeTab === 'discharge' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                <LogOut className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Inpatient Discharge & Clearance Hub</h2>
                <p className="text-xs text-slate-500">
                  4-Point multi-department clinical, pharmacy, diagnostics and billing clearance prior to bed release
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Inpatients Pending Clearance ({activeInpatients.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Patient & UHID</th>
                    <th className="py-3 px-4">Ward & Bed</th>
                    <th className="py-3 px-4">Admitted Date</th>
                    <th className="py-3 px-4">Days Admitted</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4 text-right">Clearance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeInpatients.map((adm) => {
                    const los = calculateLos(adm.admittedAt);

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {adm.patient?.firstName} {adm.patient?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">UHID: {adm.patient?.uhid}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{adm.ward?.name}</span>
                          <div className="text-[11px] text-slate-500">
                            Rm {adm.bed?.roomNumber} • Bed {adm.bed?.bedNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{new Date(adm.admittedAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{los} days</td>
                        <td className="py-3.5 px-4">
                          {adm.admittingDoctor?.employee?.user
                            ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`
                            : 'Staff Physician'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAdmission(adm);
                              setDischargeSummary('');
                              setClearanceBilling(true);
                              setClearancePharmacy(true);
                              setClearanceDiagnostics(true);
                              setClearanceMedical(true);
                              setDischargeModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Sign Clearance & Discharge
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {activeInpatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active inpatients in hospital census.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: BED TURNOVER & HOUSEKEEPING                                        */}
      {/* ========================================================================= */}
      {activeTab === 'turnover' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Bed Turnover & Housekeeping Desk</h2>
                <p className="text-xs text-slate-500">
                  Track sanitation, terminal cleaning, and release vacated beds back to active hospital inventory
                </p>
              </div>
            </div>

            {selectedTurnoverBeds.length > 0 && (
              <button
                onClick={handleBulkTurnoverComplete}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Sanitize & Release Selected ({selectedTurnoverBeds.length}) Beds
              </button>
            )}
          </div>

          {/* Cleaning Beds Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Beds Undergoing Housekeeping / Maintenance (
                {
                  allHospitalBeds.filter(
                    (b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING' || b.status === 'MAINTENANCE'
                  ).length
                }
                )
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedTurnoverBeds.length > 0 &&
                          selectedTurnoverBeds.length ===
                            allHospitalBeds.filter(
                              (b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING'
                            ).length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTurnoverBeds(
                              allHospitalBeds
                                .filter((b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING')
                                .map((b) => b.id)
                            );
                          } else {
                            setSelectedTurnoverBeds([]);
                          }
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                    </th>
                    <th className="py-3 px-4">Ward</th>
                    <th className="py-3 px-4">Room & Bed</th>
                    <th className="py-3 px-4">Bed Type</th>
                    <th className="py-3 px-4">Daily Rate</th>
                    <th className="py-3 px-4">Current State</th>
                    <th className="py-3 px-4 text-right">Terminal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allHospitalBeds
                    .filter(
                      (b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING' || b.status === 'MAINTENANCE'
                    )
                    .map((bed) => {
                      const isSelected = selectedTurnoverBeds.includes(bed.id);

                      return (
                        <tr key={bed.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTurnoverBeds([...selectedTurnoverBeds, bed.id]);
                                } else {
                                  setSelectedTurnoverBeds(selectedTurnoverBeds.filter((id) => id !== bed.id));
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{bed.wardName}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">
                              Room {bed.roomNumber} • Bed {bed.bedNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{bed.type}</td>
                          <td className="py-3.5 px-4">₹{bed.dailyRate}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                bed.status === 'MAINTENANCE'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {bed.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleQuickBedStatusUpdate(bed.id, 'AVAILABLE')}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                            >
                              Mark Cleaned & Available
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                  {allHospitalBeds.filter(
                    (b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING' || b.status === 'MAINTENANCE'
                  ).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600">All hospital beds are in ready state!</p>
                        <p className="text-[11px] text-slate-400">No beds currently pending sanitation or maintenance.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: DOCTOR WARD OVERSIGHT                                              */}
      {/* ========================================================================= */}
      {activeTab === 'rounds' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Attending Doctor Rounds & Inpatient Coverage</h2>
            <p className="text-xs text-slate-500">Active inpatient patient load grouped by attending physician</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              const docName = doc.employee?.user
                ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                : 'Doctor';
              const docInpatients = activeInpatients.filter((a) => a.admittingDoctorId === doc.id);

              return (
                <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{docName}</h4>
                      <p className="text-[11px] text-slate-500">{doc.department?.name || 'General Medicine'}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        docInpatients.length > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {docInpatients.length} Inpatients
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {docInpatients.slice(0, 3).map((a) => (
                      <div key={a.id} className="text-[11px] flex justify-between items-center text-slate-700 bg-slate-50 p-1.5 rounded">
                        <span>
                          {a.patient?.firstName} {a.patient?.lastName}
                        </span>
                        <span className="font-medium text-slate-500">
                          {a.ward?.name} (Bed {a.bed?.bedNumber})
                        </span>
                      </div>
                    ))}
                    {docInpatients.length > 3 && (
                      <div className="text-[10px] text-teal-700 font-semibold text-center">
                        +{docInpatients.length - 3} more inpatients under care
                      </div>
                    )}
                    {docInpatients.length === 0 && (
                      <div className="text-[11px] text-slate-400 italic text-center py-1">No active inpatients currently assigned.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: IPD DAILY CHARGES & BILLING ESTIMATES                              */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Inpatient Daily Room Charges & Estimated Billables</h2>
            <p className="text-xs text-slate-500">Calculated bed accommodation charges based on length of stay</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Ward & Bed</th>
                    <th className="py-3 px-4">Bed Type</th>
                    <th className="py-3 px-4">Daily Rate</th>
                    <th className="py-3 px-4">Length of Stay</th>
                    <th className="py-3 px-4 font-bold text-teal-900">Est. Accumulated Room Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeInpatients.map((adm) => {
                    const los = calculateLos(adm.admittedAt);
                    const rate = adm.bed?.dailyRate || 1500;
                    const totalRoomCharge = los * rate;

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {adm.patient?.firstName} {adm.patient?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">UHID: {adm.patient?.uhid}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {adm.ward?.name} • Bed {adm.bed?.bedNumber}
                        </td>
                        <td className="py-3.5 px-4">{adm.bed?.type || 'STANDARD'}</td>
                        <td className="py-3.5 px-4 font-mono">₹{rate}/day</td>
                        <td className="py-3.5 px-4 font-semibold">{los} days</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-teal-800 text-sm">₹{totalRoomCharge}</td>
                      </tr>
                    );
                  })}

                  {activeInpatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active inpatients to calculate charges.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: REPORTS & EXPORT HUB                                              */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl w-fit">
              <BedDouble className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Active Inpatient Census Report</h3>
            <p className="text-xs text-slate-500">
              Download comprehensive ledger of all currently admitted inpatients, length of stay, and bed allocations.
            </p>
            <button
              onClick={handleExportCensus}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Census CSV
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl w-fit">
              <DoorOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Admissions & Discharges Ledger</h3>
            <p className="text-xs text-slate-500">
              Complete historical record of all patient admissions, discharges, and reasons for hospitalization.
            </p>
            <button
              onClick={handleExportAdmissions}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Admissions CSV
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Ward Utilization & Capacity Report</h3>
            <p className="text-xs text-slate-500">
              Detailed breakdown of ward occupancy rates, bed status distribution, and capacity analysis.
            </p>
            <button
              onClick={handleExportWardUtilization}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Ward Utilization CSV
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW INPATIENT ADMISSION WORKFLOW                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={newAdmissionModalOpen}
        onClose={() => setNewAdmissionModalOpen(false)}
        title="New Inpatient Admission Desk"
      >
        <form onSubmit={handleCreateAdmission} className="space-y-4">
          {/* Step 1: Search & Select Patient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient <span className="text-rose-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient by name, UHID, or phone..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {selectedPatientForAdmission ? (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-teal-900">
                    {selectedPatientForAdmission.firstName} {selectedPatientForAdmission.lastName}
                  </div>
                  <div className="text-[11px] text-teal-700 font-mono">
                    UHID: {selectedPatientForAdmission.uhid} • Phone: {selectedPatientForAdmission.phone || 'N/A'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatientForAdmission(null)}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {searchedPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientForAdmission(p)}
                    className="p-2.5 hover:bg-teal-50 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        UHID: {p.uhid} • {p.phone || 'No phone'}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700">Select</span>
                  </div>
                ))}
                {searchedPatients.length === 0 && (
                  <p className="p-3 text-center text-xs text-slate-400">No matching patients found.</p>
                )}
              </div>
            )}
          </div>

          {/* Admitting Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admitting Physician <span className="text-rose-500">*</span>
            </label>
            <select
              value={admissionDoctorId}
              onChange={(e) => setAdmissionDoctorId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Choose Admitting Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.employee?.user
                    ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`
                    : 'Doctor'}{' '}
                  ({doc.department?.name || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Ward & Available Bed Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Ward <span className="text-rose-500">*</span>
              </label>
              <select
                value={admissionWardId}
                onChange={(e) => {
                  setAdmissionWardId(e.target.value);
                  setAdmissionBedId('');
                }}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Choose Ward --</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Fl {w.floorNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Bed <span className="text-rose-500">*</span>
              </label>
              <select
                value={admissionBedId}
                onChange={(e) => setAdmissionBedId(e.target.value)}
                required
                disabled={!admissionWardId}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
              >
                <option value="">-- Choose Available Bed --</option>
                {availableBedsInAdmissionWard.map((b) => (
                  <option key={b.id} value={b.id}>
                    Rm {b.roomNumber} - Bed {b.bedNumber} ({b.type} • ₹{b.dailyRate}/d)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason for Admission & Initial Diagnosis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Diagnosis / Clinical Indication</label>
            <input
              type="text"
              placeholder="e.g. Acute Gastroenteritis with dehydration, Post-Op recovery..."
              value={initialDiagnosis}
              onChange={(e) => setInitialDiagnosis(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Reason & Notes</label>
            <textarea
              rows={2}
              value={admissionReason}
              onChange={(e) => setAdmissionReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewAdmissionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              {submitting ? 'Admitting...' : 'Confirm Inpatient Admission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW ADMISSION DETAILS DRAWER                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={admissionDetailModalOpen}
        onClose={() => setAdmissionDetailModalOpen(false)}
        title="Inpatient Admission Record Details"
      >
        {selectedAdmission && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Admission Number</span>
                <p className="font-mono font-bold text-teal-900">{selectedAdmission.admissionNumber}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                <div>
                  <StatusBadge status={selectedAdmission.status} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>
                <p className="font-semibold text-slate-800">
                  {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">UHID: {selectedAdmission.patient?.uhid}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Admitting Doctor</span>
                <p className="font-semibold text-slate-800">
                  {selectedAdmission.admittingDoctor?.employee?.user
                    ? `Dr. ${selectedAdmission.admittingDoctor.employee.user.firstName} ${selectedAdmission.admittingDoctor.employee.user.lastName}`
                    : 'Staff Doctor'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Ward & Bed</span>
                <p className="font-semibold text-slate-800">{selectedAdmission.ward?.name}</p>
                <p className="text-[11px] text-slate-500">
                  Room {selectedAdmission.bed?.roomNumber} • Bed {selectedAdmission.bed?.bedNumber}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Admitted At</span>
                <p className="font-semibold text-slate-800">
                  {new Date(selectedAdmission.admittedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Initial Diagnosis</span>
              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                {selectedAdmission.initialDiagnosis || 'None recorded'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Admission Notes & Reason</span>
              <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                {selectedAdmission.admissionReason || 'Inpatient medical observation.'}
              </p>
            </div>

            {selectedAdmission.dischargeSummary && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Discharge Summary</span>
                <p className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  {selectedAdmission.dischargeSummary}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setAdmissionDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: BED TRANSFER MODAL                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Execute Inpatient Bed Transfer"
      >
        {selectedAdmission && (
          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1 text-indigo-900">
              <div className="font-bold">
                Patient: {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
              </div>
              <div>
                Current Location: <span className="font-semibold">{selectedAdmission.ward?.name}</span> (Room{' '}
                {selectedAdmission.bed?.roomNumber}, Bed {selectedAdmission.bed?.bedNumber})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Ward <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferTargetWardId}
                  onChange={(e) => {
                    setTransferTargetWardId(e.target.value);
                    setTransferTargetBedId('');
                  }}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Target Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Floor {w.floorNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Bed <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferTargetBedId}
                  onChange={(e) => setTransferTargetBedId(e.target.value)}
                  required
                  disabled={!transferTargetWardId}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                >
                  <option value="">-- Select Available Bed --</option>
                  {availableBedsInTransferWard.map((b) => (
                    <option key={b.id} value={b.id}>
                      Rm {b.roomNumber} - Bed {b.bedNumber} ({b.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason</label>
              <select
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Medical necessity">Medical necessity</option>
                <option value="Step-down from ICU">Step-down from ICU</option>
                <option value="Step-up to ICU / Critical care">Step-up to ICU / Critical care</option>
                <option value="Patient room upgrade request">Patient room upgrade request</option>
                <option value="Infection control / Isolation protocol">Infection control / Isolation protocol</option>
                <option value="Ward maintenance relocation">Ward maintenance relocation</option>
              </select>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              ⚡ Notice: Upon transfer execution, the source bed (Bed {selectedAdmission.bed?.bedNumber}) will
              automatically transition to Housekeeping status for terminal sanitation.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                {submitting ? 'Transferring...' : 'Execute Bed Transfer'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DISCHARGE & 4-POINT CLEARANCE CHECKLIST                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={dischargeModalOpen}
        onClose={() => setDischargeModalOpen(false)}
        title="4-Point Inpatient Discharge Clearance"
      >
        {selectedAdmission && (
          <form onSubmit={handleExecuteDischarge} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1 text-rose-900">
              <div className="font-bold">
                Patient: {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
              </div>
              <div>
                Location: {selectedAdmission.ward?.name} (Bed {selectedAdmission.bed?.bedNumber})
              </div>
              <div>Length of Stay: {calculateLos(selectedAdmission.admittedAt)} days</div>
            </div>

            {/* 4-Point Clearance Checklist */}
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Department Clearance Checklist
              </h4>

              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearanceBilling}
                  onChange={(e) => setClearanceBilling(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>1. Billing Clearance: Inpatient stay charges invoiced / settled.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearancePharmacy}
                  onChange={(e) => setClearancePharmacy(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>2. Pharmacy Clearance: Discharge medication dispensed, unused returned.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearanceDiagnostics}
                  onChange={(e) => setClearanceDiagnostics(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>3. Diagnostics Clearance: Laboratory & Radiology reports reviewed.</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearanceMedical}
                  onChange={(e) => setClearanceMedical(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>4. Medical Discharge Clearance: Attending physician approved discharge.</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discharge Summary & Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                placeholder="Patient clinically stable. Discharge instructions given. Follow up in 7 days..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDischargeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                {submitting ? 'Discharging...' : 'Approve Clearances & Discharge'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ADD WARD MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal isOpen={addWardModalOpen} onClose={() => setAddWardModalOpen(false)} title="Create New Hospital Ward">
        <form onSubmit={handleCreateWard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ward Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Male Medical Ward, Post-Op Surgical ICU"
              value={wardForm.name}
              onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ward Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MMW-01"
                value={wardForm.code}
                onChange={(e) => setWardForm({ ...wardForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number</label>
              <input
                type="number"
                min="0"
                value={wardForm.floorNumber}
                onChange={(e) => setWardForm({ ...wardForm, floorNumber: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={wardForm.departmentId}
                onChange={(e) => setWardForm({ ...wardForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- General / Hospital-wide --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender Allowed</label>
              <select
                value={wardForm.genderAllowed}
                onChange={(e) => setWardForm({ ...wardForm, genderAllowed: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ANY">Any / Co-ed</option>
                <option value="MALE">Male Only</option>
                <option value="FEMALE">Female Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddWardModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Ward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT WARD MODAL                                                  */}
      {/* ========================================================================= */}
      <Modal isOpen={editWardModalOpen} onClose={() => setEditWardModalOpen(false)} title="Edit Ward Configuration">
        {selectedWard && (
          <form onSubmit={handleUpdateWard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name</label>
              <input
                type="text"
                required
                value={selectedWard.name}
                onChange={(e) => setSelectedWard({ ...selectedWard, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Code</label>
                <input
                  type="text"
                  required
                  value={selectedWard.code}
                  onChange={(e) => setSelectedWard({ ...selectedWard, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number</label>
                <input
                  type="number"
                  min="0"
                  value={selectedWard.floorNumber}
                  onChange={(e) => setSelectedWard({ ...selectedWard, floorNumber: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender Restriction</label>
              <select
                value={selectedWard.genderAllowed}
                onChange={(e) => setSelectedWard({ ...selectedWard, genderAllowed: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ANY">Any / Co-ed</option>
                <option value="MALE">Male Only</option>
                <option value="FEMALE">Female Only</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditWardModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Ward Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: ADD BED MODAL                                                    */}
      {/* ========================================================================= */}
      <Modal isOpen={addBedModalOpen} onClose={() => setAddBedModalOpen(false)} title="Add Bed to Ward Inventory">
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 204"
                value={bedForm.roomNumber}
                onChange={(e) => setBedForm({ ...bedForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bed Number / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1, 2, A, B"
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Type</label>
              <select
                value={bedForm.type}
                onChange={(e) => setBedForm({ ...bedForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="STANDARD">Standard Ward Bed</option>
                <option value="SEMI_PRIVATE">Semi-Private Bed</option>
                <option value="PRIVATE">Private Room Bed</option>
                <option value="DELUXE">Deluxe Suite Bed</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="CCU">Cardiac Care Unit (CCU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Accommodation Rate (₹)</label>
              <input
                type="number"
                min="0"
                value={bedForm.dailyRate}
                onChange={(e) => setBedForm({ ...bedForm, dailyRate: parseInt(e.target.value) || 1000 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddBedModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
            >
              {submitting ? 'Adding...' : 'Add Bed to Ward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 8: EDIT BED MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal isOpen={editBedModalOpen} onClose={() => setEditBedModalOpen(false)} title="Edit Bed Details">
        {selectedBedForEdit && (
          <form onSubmit={handleUpdateBed} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={selectedBedForEdit.roomNumber}
                  onChange={(e) => setSelectedBedForEdit({ ...selectedBedForEdit, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Number</label>
                <input
                  type="text"
                  required
                  value={selectedBedForEdit.bedNumber}
                  onChange={(e) => setSelectedBedForEdit({ ...selectedBedForEdit, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Type</label>
                <select
                  value={selectedBedForEdit.type}
                  onChange={(e) => setSelectedBedForEdit({ ...selectedBedForEdit, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="STANDARD">Standard Ward Bed</option>
                  <option value="SEMI_PRIVATE">Semi-Private Bed</option>
                  <option value="PRIVATE">Private Room Bed</option>
                  <option value="DELUXE">Deluxe Suite Bed</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="CCU">Cardiac Care Unit (CCU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={selectedBedForEdit.dailyRate}
                  onChange={(e) =>
                    setSelectedBedForEdit({ ...selectedBedForEdit, dailyRate: parseInt(e.target.value) || 1000 })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditBedModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

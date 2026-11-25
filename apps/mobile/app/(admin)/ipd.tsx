import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  DoorOpen,
  BedDouble,
  Search,
  Plus,
  ArrowRightLeft,
  LogOut,
  Clock,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Building,
  HeartPulse,
  Sparkles,
  Wrench,
  X,
  CheckSquare,
  Square,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

type IpdTab = 'census' | 'admissions' | 'beds' | 'transfer' | 'discharge' | 'turnover';

export default function AdminIpdScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<IpdTab>('census');
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [extendedStayOnly, setExtendedStayOnly] = useState(false);

  // New Admission Modal
  const [newAdmissionModalOpen, setNewAdmissionModalOpen] = useState(false);
  const [admPatientId, setAdmPatientId] = useState('');
  const [admDoctorId, setAdmDoctorId] = useState('');
  const [admWardId, setAdmWardId] = useState('');
  const [admBedId, setAdmBedId] = useState('');
  const [admDiagnosis, setAdmDiagnosis] = useState('');
  const [admReason, setAdmReason] = useState('Inpatient clinical care');

  // Transfer Modal
  const [transferModal, setTransferModal] = useState<any>(null);
  const [targetWardId, setTargetWardId] = useState('');
  const [targetBedId, setTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('Medical necessity');

  // Discharge Modal
  const [dischargeModal, setDischargeModal] = useState<any>(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [clearanceBilling, setClearanceBilling] = useState(true);
  const [clearancePharmacy, setClearancePharmacy] = useState(true);
  const [clearanceDiagnostics, setClearanceDiagnostics] = useState(true);
  const [clearanceMedical, setClearanceMedical] = useState(true);

  // Bed Status Modal
  const [bedStatusModal, setBedStatusModal] = useState<any>(null);

  // Details Modal
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [admRes, wardRes, docRes, patRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getAdmissions(),
        mobileApiClient.hospitalAdmin.getWards(),
        mobileApiClient.hospitalAdmin.getDoctors().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getPatients({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      if (admRes.data) setAdmissions(admRes.data);
      if (wardRes.data) setWards(wardRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (patRes.data) setPatients(patRes.data);
    } catch (err: any) {
      console.error('Failed to load IPD data:', err);
      Alert.alert('Load Error', err.message || 'Failed to load IPD data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: calculate Length of Stay (LOS)
  const calculateLos = (admittedAt: string, dischargedAt?: string) => {
    const start = new Date(admittedAt).getTime();
    const end = dischargedAt ? new Date(dischargedAt).getTime() : Date.now();
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  // Derived Metrics
  const activeInpatients = useMemo(() => {
    return admissions.filter((a) => a.status === 'ADMITTED');
  }, [admissions]);

  const allBeds = useMemo(() => {
    return wards.flatMap((w) => (w.beds || []).map((b: any) => ({ ...b, wardName: w.name, wardCode: w.code })));
  }, [wards]);

  const totalBedsCount = allBeds.length;
  const occupiedBedsCount = allBeds.filter((b) => b.status === 'OCCUPIED').length;
  const availableBedsCount = allBeds.filter((b) => b.status === 'AVAILABLE').length;
  const cleaningBedsCount = allBeds.filter((b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING').length;
  const icuBeds = allBeds.filter((b) => b.type === 'ICU' || b.type === 'CCU');
  const icuOccupied = icuBeds.filter((b) => b.status === 'OCCUPIED').length;
  const icuOccupancyRate = icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;

  const extendedStayPatients = useMemo(() => {
    return activeInpatients.filter((a) => calculateLos(a.admittedAt) > 7);
  }, [activeInpatients]);

  const averageLos = useMemo(() => {
    if (activeInpatients.length === 0) return 0;
    const totalDays = activeInpatients.reduce((sum, a) => sum + calculateLos(a.admittedAt), 0);
    return Math.round((totalDays / activeInpatients.length) * 10) / 10;
  }, [activeInpatients]);

  // Filtered Census
  const filteredCensus = useMemo(() => {
    return activeInpatients.filter((adm) => {
      const q = searchQuery.toLowerCase();
      const pName = `${adm.patient?.firstName || ''} ${adm.patient?.lastName || ''}`.toLowerCase();
      const uhid = (adm.patient?.uhid || '').toLowerCase();
      const docName = adm.admittingDoctor?.employee?.user
        ? `${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`.toLowerCase()
        : '';
      const wardName = (adm.ward?.name || '').toLowerCase();

      const matchesSearch = pName.includes(q) || uhid.includes(q) || docName.includes(q) || wardName.includes(q);
      const matchesWard = wardFilter === 'ALL' || adm.wardId === wardFilter;
      const matchesExtended = !extendedStayOnly || calculateLos(adm.admittedAt) > 7;

      return matchesSearch && matchesWard && matchesExtended;
    });
  }, [activeInpatients, searchQuery, wardFilter, extendedStayOnly]);

  // Available beds for selected ward
  const availableBedsForWard = (wardId: string) => {
    const ward = wards.find((w) => w.id === wardId);
    return (ward?.beds || []).filter((b: any) => b.status === 'AVAILABLE');
  };

  // Actions
  const handleAdmitPatient = async () => {
    if (!admPatientId || !admDoctorId || !admWardId || !admBedId) {
      Alert.alert('Incomplete Form', 'Please choose patient, doctor, ward, and bed.');
      return;
    }

    // Double-booking check
    const existing = activeInpatients.find((a) => a.patientId === admPatientId);
    if (existing) {
      Alert.alert(
        'Concurrent Admission Disallowed',
        `This patient is already admitted in ${existing.ward?.name || 'a ward'} (Bed ${existing.bed?.bedNumber || ''}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.admitPatient({
        patientId: admPatientId,
        admittingDoctorId: admDoctorId,
        wardId: admWardId,
        bedId: admBedId,
        admissionReason: admReason || 'Inpatient medical observation',
        initialDiagnosis: admDiagnosis || 'Clinical observation',
        admittedAt: new Date().toISOString(),
      });

      setNewAdmissionModalOpen(false);
      setAdmPatientId('');
      setAdmDiagnosis('');
      setAdmBedId('');
      Alert.alert('Success', 'Inpatient admission completed.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Admission Error', err.message || 'Failed to admit patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferBed = async () => {
    if (!transferModal || !targetWardId || !targetBedId) {
      Alert.alert('Required', 'Please select destination ward and available bed.');
      return;
    }

    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.transferBed(transferModal.id, {
        targetWardId,
        targetBedId,
        reason: transferReason,
      });

      setTransferModal(null);
      setTargetWardId('');
      setTargetBedId('');
      Alert.alert('Transferred', 'Patient transferred. Prior bed moved to housekeeping for sanitation.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Transfer Error', err.message || 'Failed to transfer bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargePatient = async () => {
    if (!dischargeModal) return;

    if (!clearanceBilling || !clearancePharmacy || !clearanceDiagnostics || !clearanceMedical) {
      Alert.alert('Clearance Incomplete', 'All 4 clearances must be confirmed prior to discharge.');
      return;
    }

    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.dischargePatient(dischargeModal.id, {
        dischargeSummary: dischargeSummary || 'Patient clinically stable for discharge',
        dischargedAt: new Date().toISOString(),
      });

      setDischargeModal(null);
      setDischargeSummary('');
      Alert.alert('Discharged', 'Patient discharged successfully. Bed released to housekeeping.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Discharge Error', err.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAdmission = (adm: any) => {
    Alert.alert(
      'Cancel Admission',
      `Cancel admission ${adm.admissionNumber}? Bed will be returned to AVAILABLE.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.cancelAdmission(adm.id, 'Administrative cancellation');
              Alert.alert('Cancelled', 'Admission cancelled and bed released.');
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel admission');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateBedStatus = async (status: string) => {
    if (!bedStatusModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateBedStatus(bedStatusModal.id, status);
      setBedStatusModal(null);
      Alert.alert('Status Updated', `Bed marked as ${status}.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="IPD Management" subtitle="Inpatient Census, Admissions & Beds" />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'census', label: 'Census', icon: BedDouble },
          { id: 'admissions', label: 'Admissions', icon: DoorOpen },
          { id: 'beds', label: 'Wards & Beds', icon: Building },
          { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
          { id: 'discharge', label: 'Discharge', icon: LogOut },
          { id: 'turnover', label: 'Housekeeping', icon: Sparkles },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id as IpdTab)}
            >
              <Icon size={14} color={isActive ? '#0F766E' : '#64748B'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading IPD inpatient census & ward matrix...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#0F766E" />}
        >
          {/* Header Action Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              setAdmPatientId(patients[0]?.id || '');
              setAdmDoctorId(doctors[0]?.id || '');
              setAdmWardId(wards[0]?.id || '');
              setNewAdmissionModalOpen(true);
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>New Inpatient Admission</Text>
          </TouchableOpacity>

          {/* Extended Stay Warning */}
          {extendedStayPatients.length > 0 && (
            <View style={styles.alertBanner}>
              <AlertTriangle size={16} color="#B45309" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.alertTitle}>Extended Stay Alert ({extendedStayPatients.length} Inpatients)</Text>
                <Text style={styles.alertSub}>Patients hospitalized &gt; 7 days require clinical review.</Text>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: INPATIENT CENSUS                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'census' && (
            <View>
              {/* Quick Metrics Matrix */}
              <View style={styles.kpiRow}>
                <View style={styles.kpiMiniCard}>
                  <Text style={styles.kpiMiniNum}>{activeInpatients.length}</Text>
                  <Text style={styles.kpiMiniLabel}>Inpatients</Text>
                </View>
                <View style={styles.kpiMiniCard}>
                  <Text style={[styles.kpiMiniNum, { color: '#0F766E' }]}>{availableBedsCount}</Text>
                  <Text style={styles.kpiMiniLabel}>Avail Beds</Text>
                </View>
                <View style={styles.kpiMiniCard}>
                  <Text style={[styles.kpiMiniNum, { color: '#E11D48' }]}>{icuOccupancyRate}%</Text>
                  <Text style={styles.kpiMiniLabel}>ICU Occ</Text>
                </View>
                <View style={styles.kpiMiniCard}>
                  <Text style={styles.kpiMiniNum}>{averageLos}d</Text>
                  <Text style={styles.kpiMiniLabel}>ALOS</Text>
                </View>
              </View>

              {/* Search & Extended Filter */}
              <View style={styles.searchBox}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search census by patient, UHID, doctor..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {filteredCensus.length === 0 ? (
                <Text style={styles.emptyText}>No inpatients currently in census.</Text>
              ) : (
                filteredCensus.map((adm) => {
                  const pName = adm.patient
                    ? `${adm.patient.firstName || ''} ${adm.patient.lastName || ''}`.trim()
                    : 'Patient';
                  const docName = adm.admittingDoctor?.employee?.user
                    ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`
                    : 'Attending Physician';
                  const los = calculateLos(adm.admittedAt);
                  const isLongStay = los > 7;

                  return (
                    <View key={adm.id} style={styles.card}>
                      <View style={styles.censusHead}>
                        <View>
                          <Text style={styles.patientName}>{pName}</Text>
                          <Text style={styles.uhidText}>UHID: {adm.patient?.uhid || 'N/A'}</Text>
                        </View>
                        <View
                          style={[
                            styles.losBadge,
                            isLongStay && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                          ]}
                        >
                          <Clock size={11} color={isLongStay ? '#B45309' : '#0F766E'} />
                          <Text
                            style={[
                              styles.losBadgeText,
                              isLongStay && { color: '#B45309' },
                            ]}
                          >
                            {los} {los === 1 ? 'day' : 'days'}
                            {isLongStay && ' ⚠️'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailText}>
                          🛏️ {adm.ward?.name} • Room {adm.bed?.roomNumber} • Bed {adm.bed?.bedNumber} ({adm.bed?.type || 'STD'})
                        </Text>
                        <Text style={styles.detailText}>👨‍⚕️ {docName}</Text>
                        <Text style={styles.detailText}>
                          📋 Diagnosis: {adm.initialDiagnosis || adm.admissionReason || 'Clinical Evaluation'}
                        </Text>
                        <Text style={styles.detailText}>
                          💰 Daily Rate: ₹{adm.bed?.dailyRate || 1000}/day (Est. ₹{(adm.bed?.dailyRate || 1000) * los})
                        </Text>
                      </View>

                      {/* Care Actions */}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => {
                            setTransferModal(adm);
                            setTargetWardId(wards[0]?.id || '');
                            setTargetBedId('');
                          }}
                        >
                          <ArrowRightLeft size={13} color="#4F46E5" />
                          <Text style={[styles.actionBtnText, { color: '#4F46E5' }]}>Transfer Bed</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: '#FECDD3' }]}
                          onPress={() => {
                            setDischargeModal(adm);
                            setDischargeSummary('');
                          }}
                        >
                          <LogOut size={13} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Discharge</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: '#E2E8F0' }]}
                          onPress={() => handleCancelAdmission(adm)}
                        >
                          <Text style={[styles.actionBtnText, { color: '#64748B' }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ADMISSIONS LEDGER                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'admissions' && (
            <View>
              {admissions.map((adm) => {
                const pName = adm.patient
                  ? `${adm.patient.firstName || ''} ${adm.patient.lastName || ''}`.trim()
                  : 'Patient';
                const isAdmitted = adm.status === 'ADMITTED';

                return (
                  <View key={adm.id} style={styles.card}>
                    <View style={styles.censusHead}>
                      <View>
                        <Text style={styles.patientName}>{pName}</Text>
                        <Text style={styles.uhidText}>
                          Adm No: {adm.admissionNumber} • UHID: {adm.patient?.uhid || 'N/A'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isAdmitted ? '#CCFBF1' : '#F1F5F9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isAdmitted ? '#0F766E' : '#64748B' },
                          ]}
                        >
                          {adm.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailBox}>
                      <Text style={styles.detailText}>
                        Ward: {adm.ward?.name} (Bed {adm.bed?.bedNumber})
                      </Text>
                      <Text style={styles.detailText}>
                        Admitted: {new Date(adm.admittedAt).toLocaleDateString('en-IN')}
                      </Text>
                      {adm.dischargedAt && (
                        <Text style={styles.detailText}>
                          Discharged: {new Date(adm.dischargedAt).toLocaleDateString('en-IN')}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: WARDS & BEDS MATRIX                                                */}
          {/* ========================================================================= */}
          {activeTab === 'beds' && (
            <View>
              {wards.map((ward) => {
                const total = ward.beds?.length || ward.totalBeds || 0;
                const occ = ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0;
                const rate = total > 0 ? Math.round((occ / total) * 100) : 0;

                return (
                  <View key={ward.id} style={styles.card}>
                    <View style={styles.censusHead}>
                      <View>
                        <Text style={styles.patientName}>{ward.name}</Text>
                        <Text style={styles.uhidText}>Code: {ward.code} • Floor {ward.floorNumber}</Text>
                      </View>
                      <View style={styles.occBadge}>
                        <Text style={styles.occBadgeText}>{rate}% Occ</Text>
                      </View>
                    </View>

                    {/* Bed Chips with Status Action */}
                    <View style={styles.bedGrid}>
                      {(ward.beds || []).map((bed: any) => {
                        const isOcc = bed.status === 'OCCUPIED';
                        const isClean = bed.status === 'HOUSEKEEPING' || bed.status === 'CLEANING';
                        const isMaint = bed.status === 'MAINTENANCE';

                        return (
                          <TouchableOpacity
                            key={bed.id}
                            onPress={() => setBedStatusModal(bed)}
                            style={[
                              styles.bedChip,
                              isOcc && styles.bedChipOcc,
                              isClean && styles.bedChipClean,
                              isMaint && styles.bedChipMaint,
                            ]}
                          >
                            <Text
                              style={[
                                styles.bedChipText,
                                isOcc && styles.bedChipTextOcc,
                                isClean && styles.bedChipTextClean,
                                isMaint && styles.bedChipTextMaint,
                              ]}
                            >
                              Bed {bed.bedNumber}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BED TRANSFER DESK                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'transfer' && (
            <View>
              <Text style={styles.sectionHeader}>Inpatients Eligible for Transfer</Text>
              {activeInpatients.map((adm) => (
                <View key={adm.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.patientName}>
                        {adm.patient?.firstName} {adm.patient?.lastName}
                      </Text>
                      <Text style={styles.uhidText}>
                        Current: {adm.ward?.name} (Bed {adm.bed?.bedNumber})
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', paddingVertical: 8, paddingHorizontal: 12 }]}
                      onPress={() => {
                        setTransferModal(adm);
                        setTargetWardId(wards[0]?.id || '');
                        setTargetBedId('');
                      }}
                    >
                      <ArrowRightLeft size={13} color="#4F46E5" />
                      <Text style={[styles.actionBtnText, { color: '#4F46E5' }]}>Transfer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DISCHARGE & 4-POINT CLEARANCE                                      */}
          {/* ========================================================================= */}
          {activeTab === 'discharge' && (
            <View>
              <Text style={styles.sectionHeader}>Inpatients Pending Discharge Clearance</Text>
              {activeInpatients.map((adm) => (
                <View key={adm.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.patientName}>
                        {adm.patient?.firstName} {adm.patient?.lastName}
                      </Text>
                      <Text style={styles.uhidText}>
                        {adm.ward?.name} (Bed {adm.bed?.bedNumber}) • {calculateLos(adm.admittedAt)} days
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', paddingVertical: 8, paddingHorizontal: 12 }]}
                      onPress={() => {
                        setDischargeModal(adm);
                        setDischargeSummary('');
                        setClearanceBilling(true);
                        setClearancePharmacy(true);
                        setClearanceDiagnostics(true);
                        setClearanceMedical(true);
                      }}
                    >
                      <LogOut size={13} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Clear & Discharge</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: BED TURNOVER & HOUSEKEEPING                                        */}
          {/* ========================================================================= */}
          {activeTab === 'turnover' && (
            <View>
              <Text style={styles.sectionHeader}>Beds Under Sanitation / Maintenance ({cleaningBedsCount})</Text>
              {allBeds
                .filter((b) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING' || b.status === 'MAINTENANCE')
                .map((bed) => (
                  <View key={bed.id} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={styles.patientName}>
                          {bed.wardName} - Bed {bed.bedNumber} (Rm {bed.roomNumber})
                        </Text>
                        <Text style={styles.uhidText}>Status: {bed.status} • Type: {bed.type}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', paddingVertical: 8, paddingHorizontal: 12 }]}
                        onPress={async () => {
                          try {
                            setSubmitting(true);
                            await mobileApiClient.hospitalAdmin.updateBedStatus(bed.id, 'AVAILABLE');
                            Alert.alert('Sanitized', `Bed ${bed.bedNumber} released to AVAILABLE.`);
                            await loadData();
                          } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to update bed');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        <CheckCircle size={13} color="#16A34A" />
                        <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Release Available</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

              {cleaningBedsCount === 0 && (
                <View style={styles.emptyCard}>
                  <CheckCircle size={32} color="#10B981" />
                  <Text style={styles.emptyTitle}>All Beds Ready</Text>
                  <Text style={styles.emptySub}>No hospital beds currently pending housekeeping or maintenance.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW ADMISSION                                                      */}
      {/* ========================================================================= */}
      <Modal visible={newAdmissionModalOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Inpatient Admission</Text>
              <TouchableOpacity onPress={() => setNewAdmissionModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Patient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {patients.slice(0, 8).map((p) => {
                const isSelected = admPatientId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setAdmPatientId(p.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {p.firstName} {p.lastName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Admitting Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {doctors.map((d) => {
                const isSelected = admDoctorId === d.id;
                const name = d.employee?.user
                  ? `Dr. ${d.employee.user.firstName} ${d.employee.user.lastName}`
                  : 'Doctor';
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setAdmDoctorId(d.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Destination Ward</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {wards.map((w) => {
                const isSelected = admWardId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setAdmWardId(w.id);
                      setAdmBedId('');
                    }}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Available Bed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {availableBedsForWard(admWardId).map((b: any) => {
                const isSelected = admBedId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setAdmBedId(b.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      Rm {b.roomNumber} - Bed {b.bedNumber} (₹{b.dailyRate}/d)
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {availableBedsForWard(admWardId).length === 0 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', padding: 4 }}>No available beds in this ward</Text>
              )}
            </ScrollView>

            <Text style={styles.fieldLabel}>Initial Diagnosis</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Acute Appendicitis, Severe Dengue..."
              value={admDiagnosis}
              onChangeText={setAdmDiagnosis}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAdmitPatient} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Admission</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: TRANSFER BED                                                       */}
      {/* ========================================================================= */}
      <Modal visible={!!transferModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Transfer Inpatient Bed</Text>
              <TouchableOpacity onPress={() => setTransferModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#0F766E', fontWeight: '700', marginBottom: 10 }}>
              Patient: {transferModal?.patient?.firstName} {transferModal?.patient?.lastName}
            </Text>

            <Text style={styles.fieldLabel}>Select Destination Ward</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {wards.map((w) => {
                const isSelected = targetWardId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setTargetWardId(w.id);
                      setTargetBedId('');
                    }}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Available Bed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {availableBedsForWard(targetWardId).map((b: any) => {
                const isSelected = targetBedId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setTargetBedId(b.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      Bed {b.bedNumber} (Rm {b.roomNumber})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Transfer Reason</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Medical necessity / ICU stepdown"
              value={transferReason}
              onChangeText={setTransferReason}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#4F46E5' }]}
              onPress={handleTransferBed}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Bed Transfer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DISCHARGE & 4-POINT CLEARANCE                                      */}
      {/* ========================================================================= */}
      <Modal visible={!!dischargeModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>4-Point Discharge Clearance</Text>
              <TouchableOpacity onPress={() => setDischargeModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700', marginBottom: 10 }}>
              Patient: {dischargeModal?.patient?.firstName} {dischargeModal?.patient?.lastName} ({dischargeModal?.ward?.name})
            </Text>

            {/* Checklist */}
            <View style={{ gap: 6, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 10 }}>
              <TouchableOpacity style={styles.checkRow} onPress={() => setClearanceBilling(!clearanceBilling)}>
                {clearanceBilling ? <CheckSquare size={16} color="#0F766E" /> : <Square size={16} color="#94A3B8" />}
                <Text style={styles.checkText}>1. Billing Clearance: Room & care settled</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkRow} onPress={() => setClearancePharmacy(!clearancePharmacy)}>
                {clearancePharmacy ? <CheckSquare size={16} color="#0F766E" /> : <Square size={16} color="#94A3B8" />}
                <Text style={styles.checkText}>2. Pharmacy Clearance: Meds dispensed/cleared</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkRow} onPress={() => setClearanceDiagnostics(!clearanceDiagnostics)}>
                {clearanceDiagnostics ? <CheckSquare size={16} color="#0F766E" /> : <Square size={16} color="#94A3B8" />}
                <Text style={styles.checkText}>3. Diagnostics Clearance: Lab results reviewed</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkRow} onPress={() => setClearanceMedical(!clearanceMedical)}>
                {clearanceMedical ? <CheckSquare size={16} color="#0F766E" /> : <Square size={16} color="#94A3B8" />}
                <Text style={styles.checkText}>4. Medical Clearance: Doctor approved</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Discharge Summary / Instructions</Text>
            <TextInput
              style={[styles.fieldInput, { height: 70 }]}
              placeholder="Patient clinically stable. Follow-up in 7 days."
              multiline
              value={dischargeSummary}
              onChangeText={setDischargeSummary}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleDischargePatient}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Sign Clearance & Discharge</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: BED STATUS UPDATE                                                  */}
      {/* ========================================================================= */}
      <Modal visible={!!bedStatusModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                Bed {bedStatusModal?.bedNumber} (Rm {bedStatusModal?.roomNumber})
              </Text>
              <TouchableOpacity onPress={() => setBedStatusModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
              Current State: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{bedStatusModal?.status}</Text>
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={() => handleUpdateBedStatus('AVAILABLE')}
              >
                <CheckCircle size={16} color="#059669" />
                <Text style={[styles.quickStatusBtnText, { color: '#059669' }]}>Mark AVAILABLE (Cleaned)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                onPress={() => handleUpdateBedStatus('HOUSEKEEPING')}
              >
                <Sparkles size={16} color="#D97706" />
                <Text style={[styles.quickStatusBtnText, { color: '#D97706' }]}>Mark HOUSEKEEPING (Cleaning)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}
                onPress={() => handleUpdateBedStatus('MAINTENANCE')}
              >
                <Wrench size={16} color="#475569" />
                <Text style={[styles.quickStatusBtnText, { color: '#475569' }]}>Mark MAINTENANCE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, color: '#64748B', marginTop: 8 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F766E',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F766E',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  alertSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  kpiMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiMiniNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiMiniLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  censusHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  uhidText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  losBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  losBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  occBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 3,
  },
  detailText: {
    fontSize: 11,
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  bedChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bedChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bedChipOcc: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  bedChipTextOcc: {
    color: '#E11D48',
  },
  bedChipClean: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bedChipTextClean: {
    color: '#D97706',
  },
  bedChipMaint: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  bedChipTextMaint: {
    color: '#475569',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  chipSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSelectActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  chipSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipSelectTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  checkText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  quickStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

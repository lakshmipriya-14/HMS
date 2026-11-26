import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  User,
  BedDouble,
  Pill,
  FlaskConical,
  HeartPulse,
  CreditCard,
  Printer,
  ChevronRight,
  ShieldAlert,
  X,
  Search,
} from 'lucide-react-native';

interface ClearancePatient {
  id: string;
  uhid: string;
  admissionId: string;
  name: string;
  age: number;
  gender: string;
  ward: string;
  bed: string;
  admittedOn: string;
  attendingDoctor: string;
  diagnosis: string;
  financials: {
    totalCharges: number;
    advancePaid: number;
    insuranceApproved: number;
    balancePayable: number;
  };
  clearances: {
    pharmacy: { signed: boolean; officer?: string; time?: string; note?: string };
    laboratory: { signed: boolean; officer?: string; time?: string; note?: string };
    nursing: { signed: boolean; officer?: string; time?: string; note?: string };
    billing: { signed: boolean; officer?: string; time?: string; note?: string };
  };
  dischargeApproved: boolean;
  gatePassNo?: string;
}

const INITIAL_CLEARANCE_PATIENTS: ClearancePatient[] = [
  {
    id: 'clr-01',
    uhid: 'KZN-2026-0042',
    admissionId: 'ADM-2026-091',
    name: 'Meenakshi Sundaram',
    age: 58,
    gender: 'Female',
    ward: 'Cardiology ICCU',
    bed: 'Bed 04',
    admittedOn: '21 Nov 2026',
    attendingDoctor: 'Dr. Rajesh Kannan (Cardiothoracic)',
    diagnosis: 'Unstable Angina s/p PTCA Stenting',
    financials: {
      totalCharges: 145000,
      advancePaid: 25000,
      insuranceApproved: 110000,
      balancePayable: 10000,
    },
    clearances: {
      pharmacy: {
        signed: true,
        officer: 'Pharm. K. Sundar',
        time: 'Today 09:15 AM',
        note: 'All unused vials returned & reconciled',
      },
      laboratory: {
        signed: true,
        officer: 'Path. Dr. Malathi',
        time: 'Today 09:40 AM',
        note: 'Final post-op Troponin & CBC verified',
      },
      nursing: {
        signed: true,
        officer: 'Nurse Priya K.',
        time: 'Today 10:05 AM',
        note: 'Femoral sheath removed, vitals stable (BP 124/82)',
      },
      billing: {
        signed: false,
        note: 'Co-pay balance ₹10,000 pending settlement',
      },
    },
    dischargeApproved: false,
  },
  {
    id: 'clr-02',
    uhid: 'KZN-2026-0019',
    admissionId: 'ADM-2026-088',
    name: 'Suresh Kumar',
    age: 44,
    gender: 'Male',
    ward: 'Orthopaedic General Ward',
    bed: 'Bed 12',
    admittedOn: '19 Nov 2026',
    attendingDoctor: 'Dr. Anitha Varma (Orthopaedics)',
    diagnosis: 'Closed Fracture Right Tibia - ORIF Implantation',
    financials: {
      totalCharges: 82000,
      advancePaid: 40000,
      insuranceApproved: 42000,
      balancePayable: 0,
    },
    clearances: {
      pharmacy: {
        signed: true,
        officer: 'Pharm. A. Kumar',
        time: '23 Nov 04:30 PM',
        note: 'Discharge kit dispensed',
      },
      laboratory: {
        signed: true,
        officer: 'Lab Tech. Vignesh',
        time: '23 Nov 05:00 PM',
        note: 'All pre/post blood panels complete',
      },
      nursing: {
        signed: true,
        officer: 'Nurse Deepa S.',
        time: 'Today 08:30 AM',
        note: 'Cast check normal, mobility trained with crutches',
      },
      billing: {
        signed: true,
        officer: 'Cashier Senthil',
        time: 'Today 09:00 AM',
        note: '100% Settled via Star Health TPA + Advance',
      },
    },
    dischargeApproved: true,
    gatePassNo: 'GP-2026-0442',
  },
  {
    id: 'clr-03',
    uhid: 'KZN-2026-0077',
    admissionId: 'ADM-2026-094',
    name: 'Gopalakrishnan V.',
    age: 67,
    gender: 'Male',
    ward: 'General Medical Ward - 2nd Floor',
    bed: 'Bed 22',
    admittedOn: '22 Nov 2026',
    attendingDoctor: 'Dr. Kavitha Mohan (Internal Med)',
    diagnosis: 'Community Acquired Pneumonia - Resolved',
    financials: {
      totalCharges: 38500,
      advancePaid: 15000,
      insuranceApproved: 0,
      balancePayable: 23500,
    },
    clearances: {
      pharmacy: {
        signed: true,
        officer: 'Pharm. K. Sundar',
        time: 'Today 10:15 AM',
        note: 'Oral antibiotics transitioned',
      },
      laboratory: {
        signed: false,
        note: 'Sputum culture sensitivity report pending',
      },
      nursing: {
        signed: true,
        officer: 'Nurse R. Stella',
        time: 'Today 10:30 AM',
        note: 'IV cannula removed, O2 sat 99% on room air',
      },
      billing: {
        signed: false,
        note: 'Awaiting lab clearance before final bill audit',
      },
    },
    dischargeApproved: false,
  },
];

export default function DischargeClearanceScreen() {
  const [patients, setPatients] = useState<ClearancePatient[]>(INITIAL_CLEARANCE_PATIENTS);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<ClearancePatient | null>(null);
  const [slipModalVisible, setSlipModalVisible] = useState(false);

  // Toggle specific clearance sign-off
  const toggleClearance = (
    patientId: string,
    dept: 'pharmacy' | 'laboratory' | 'nursing' | 'billing'
  ) => {
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id !== patientId) return pat;

        const current = pat.clearances[dept];
        const nextSigned = !current.signed;
        const updatedDept = {
          ...current,
          signed: nextSigned,
          officer: nextSigned ? 'Cashier / Desk Officer' : undefined,
          time: nextSigned ? 'Just now' : undefined,
          note: nextSigned ? 'Digitally authorized at station' : 'Sign-off revoked',
        };

        const newClearances = { ...pat.clearances, [dept]: updatedDept };

        // Check if all 4 are signed
        const allSigned =
          newClearances.pharmacy.signed &&
          newClearances.laboratory.signed &&
          newClearances.nursing.signed &&
          newClearances.billing.signed;

        const updatedPatient: ClearancePatient = {
          ...pat,
          clearances: newClearances,
          dischargeApproved: allSigned,
          gatePassNo: allSigned && !pat.gatePassNo ? `GP-2026-${Math.floor(1000 + Math.random() * 9000)}` : pat.gatePassNo,
        };

        if (selectedPatient?.id === patientId) {
          setSelectedPatient(updatedPatient);
        }

        return updatedPatient;
      })
    );
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.uhid.toLowerCase().includes(search.toLowerCase()) ||
        p.bed.toLowerCase().includes(search.toLowerCase())
    );
  }, [patients, search]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>IPD Discharge Clearance Hub</Text>
        <Text style={styles.sub}>
          4-Way Multi-Department Sign-off & Official Gate Pass Generation
        </Text>

        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Patient name, UHID, or Bed No..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Patient Clearance Cards */}
      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredPatients.map((pat) => {
          const signedCount = [
            pat.clearances.pharmacy.signed,
            pat.clearances.laboratory.signed,
            pat.clearances.nursing.signed,
            pat.clearances.billing.signed,
          ].filter(Boolean).length;

          return (
            <View key={pat.id} style={styles.patientCard}>
              {/* Header Info */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.patientName}>{pat.name}</Text>
                  <Text style={styles.patientMeta}>
                    {pat.uhid} • {pat.gender}, {pat.age} yrs • {pat.bed} ({pat.ward})
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    pat.dischargeApproved ? styles.statusApproved : styles.statusProgress,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      pat.dischargeApproved ? styles.textApproved : styles.textProgress,
                    ]}
                  >
                    {pat.dischargeApproved ? 'GATE PASS READY' : `${signedCount}/4 SIGNED`}
                  </Text>
                </View>
              </View>

              <Text style={styles.diagText}>
                <Text style={{ fontWeight: '700' }}>Dx: </Text>
                {pat.diagnosis}
              </Text>
              <Text style={styles.docText}>Consultant: {pat.attendingDoctor}</Text>

              {/* 4-Way Digital Clearance Checklist */}
              <View style={styles.checklistSection}>
                <Text style={styles.checklistTitle}>4-Way Departmental Sign-off Verification</Text>

                {/* 1. Pharmacy */}
                <TouchableOpacity
                  style={[styles.checkRow, pat.clearances.pharmacy.signed && styles.checkRowSigned]}
                  onPress={() => toggleClearance(pat.id, 'pharmacy')}
                >
                  <View style={styles.checkLeft}>
                    <Pill size={16} color={pat.clearances.pharmacy.signed ? '#38845A' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>1. Pharmacy Clearance</Text>
                      <Text style={styles.checkDesc}>
                        Dispensed meds reconciled, unused returns processed
                      </Text>
                      {pat.clearances.pharmacy.note && (
                        <Text style={styles.signNote}>
                          {pat.clearances.pharmacy.officer} • {pat.clearances.pharmacy.note}
                        </Text>
                      )}
                    </View>
                  </View>
                  <CheckCircle2
                    size={20}
                    color={pat.clearances.pharmacy.signed ? '#38845A' : '#CBD5E1'}
                  />
                </TouchableOpacity>

                {/* 2. Laboratory */}
                <TouchableOpacity
                  style={[styles.checkRow, pat.clearances.laboratory.signed && styles.checkRowSigned]}
                  onPress={() => toggleClearance(pat.id, 'laboratory')}
                >
                  <View style={styles.checkLeft}>
                    <FlaskConical
                      size={16}
                      color={pat.clearances.laboratory.signed ? '#38845A' : '#64748B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>2. Laboratory Clearance</Text>
                      <Text style={styles.checkDesc}>All diagnostic test reports authorized & finalized</Text>
                      {pat.clearances.laboratory.note && (
                        <Text style={styles.signNote}>
                          {pat.clearances.laboratory.officer || 'Pending'} • {pat.clearances.laboratory.note}
                        </Text>
                      )}
                    </View>
                  </View>
                  <CheckCircle2
                    size={20}
                    color={pat.clearances.laboratory.signed ? '#38845A' : '#CBD5E1'}
                  />
                </TouchableOpacity>

                {/* 3. Nursing Ward Handover */}
                <TouchableOpacity
                  style={[styles.checkRow, pat.clearances.nursing.signed && styles.checkRowSigned]}
                  onPress={() => toggleClearance(pat.id, 'nursing')}
                >
                  <View style={styles.checkLeft}>
                    <HeartPulse
                      size={16}
                      color={pat.clearances.nursing.signed ? '#38845A' : '#64748B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>3. Nursing Ward Handover Clearance</Text>
                      <Text style={styles.checkDesc}>
                        Catheters & lines removed, discharge vitals documented
                      </Text>
                      {pat.clearances.nursing.note && (
                        <Text style={styles.signNote}>
                          {pat.clearances.nursing.officer} • {pat.clearances.nursing.note}
                        </Text>
                      )}
                    </View>
                  </View>
                  <CheckCircle2
                    size={20}
                    color={pat.clearances.nursing.signed ? '#38845A' : '#CBD5E1'}
                  />
                </TouchableOpacity>

                {/* 4. Billing & Financial Settlement */}
                <TouchableOpacity
                  style={[styles.checkRow, pat.clearances.billing.signed && styles.checkRowSigned]}
                  onPress={() => toggleClearance(pat.id, 'billing')}
                >
                  <View style={styles.checkLeft}>
                    <CreditCard
                      size={16}
                      color={pat.clearances.billing.signed ? '#38845A' : '#64748B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkLabel}>4. Final Billing Settlement</Text>
                      <Text style={styles.checkDesc}>
                        Advance deducted, TPA approved, balance paid in full
                      </Text>
                      {pat.clearances.billing.note && (
                        <Text style={styles.signNote}>
                          {pat.clearances.billing.officer || 'Desk'} • {pat.clearances.billing.note}
                        </Text>
                      )}
                    </View>
                  </View>
                  <CheckCircle2
                    size={20}
                    color={pat.clearances.billing.signed ? '#38845A' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              </View>

              {/* Financial Calculation Bar */}
              <View style={styles.financeBox}>
                <View style={styles.financeItem}>
                  <Text style={styles.finLabel}>Total IPD Bill</Text>
                  <Text style={styles.finVal}>₹{pat.financials.totalCharges.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.financeItem}>
                  <Text style={styles.finLabel}>Advance Paid</Text>
                  <Text style={styles.finVal}>-₹{pat.financials.advancePaid.toLocaleString('en-IN')}</Text>
                </View>
                {pat.financials.insuranceApproved > 0 && (
                  <View style={styles.financeItem}>
                    <Text style={styles.finLabel}>TPA Covered</Text>
                    <Text style={styles.finVal}>
                      -₹{pat.financials.insuranceApproved.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
                <View style={styles.financeItem}>
                  <Text style={styles.finLabel}>Net Payable</Text>
                  <Text
                    style={[
                      styles.finVal,
                      { color: pat.financials.balancePayable > 0 ? '#DC2626' : '#38845A' },
                    ]}
                  >
                    ₹{pat.financials.balancePayable.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {pat.dischargeApproved ? (
                  <TouchableOpacity
                    style={styles.gatePassBtn}
                    onPress={() => {
                      setSelectedPatient(pat);
                      setSlipModalVisible(true);
                    }}
                  >
                    <FileCheck size={16} color="#fff" />
                    <Text style={styles.gatePassBtnText}>
                      View Official Discharge Slip & Gate Pass
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.pendingActionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Clearance in Progress',
                        'Tap the departmental sign-off rows above to complete the digital checklist.'
                      );
                    }}
                  >
                    <ShieldAlert size={16} color="#D97706" />
                    <Text style={styles.pendingActionText}>
                      Complete all 4 sign-offs to issue Gate Pass
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Official Discharge Clearance Slip Modal */}
      <Modal visible={slipModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.slipHospital}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
                <Text style={styles.slipSub}>Official Inpatient Discharge Clearance Slip & Gate Pass</Text>
              </View>
              <TouchableOpacity onPress={() => setSlipModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Gate Pass Code Banner */}
              <View style={styles.gatePassBanner}>
                <Text style={styles.gatePassLabel}>SECURITY GATE PASS NO</Text>
                <Text style={styles.gatePassCode}>{selectedPatient?.gatePassNo || 'GP-2026-9041'}</Text>
                <Text style={styles.gatePassSub}>Valid for Patient Ward Departure</Text>
              </View>

              {/* Patient Admission Details */}
              <View style={styles.slipTable}>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Patient Name:</Text>
                  <Text style={styles.slipColVal}>{selectedPatient?.name}</Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>UHID:</Text>
                  <Text style={styles.slipColVal}>{selectedPatient?.uhid}</Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Admission ID:</Text>
                  <Text style={styles.slipColVal}>{selectedPatient?.admissionId}</Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Ward / Bed:</Text>
                  <Text style={styles.slipColVal}>
                    {selectedPatient?.ward} • {selectedPatient?.bed}
                  </Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Admitted On:</Text>
                  <Text style={styles.slipColVal}>{selectedPatient?.admittedOn}</Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Discharged On:</Text>
                  <Text style={styles.slipColVal}>24 Nov 2026, 11:00 AM</Text>
                </View>
                <View style={styles.slipRow}>
                  <Text style={styles.slipColLabel}>Attending Doctor:</Text>
                  <Text style={styles.slipColVal}>{selectedPatient?.attendingDoctor}</Text>
                </View>
              </View>

              {/* Verified Clearances Badge Matrix */}
              <Text style={styles.sectionHeading}>4-Way Clearance Verification Audit</Text>
              <View style={styles.auditGrid}>
                <View style={styles.auditItem}>
                  <CheckCircle2 size={14} color="#38845A" />
                  <Text style={styles.auditText}>Pharmacy: Reconciled & Billed</Text>
                </View>
                <View style={styles.auditItem}>
                  <CheckCircle2 size={14} color="#38845A" />
                  <Text style={styles.auditText}>Laboratory: All Tests Verified</Text>
                </View>
                <View style={styles.auditItem}>
                  <CheckCircle2 size={14} color="#38845A" />
                  <Text style={styles.auditText}>Nursing: Lines Removed & Vitals Logged</Text>
                </View>
                <View style={styles.auditItem}>
                  <CheckCircle2 size={14} color="#38845A" />
                  <Text style={styles.auditText}>Billing: Zero Balance Settled</Text>
                </View>
              </View>

              {/* Settlement Summary */}
              <View style={styles.settleSummary}>
                <Text style={styles.settleTitle}>Financial Settlement Certification</Text>
                <View style={styles.settleRow}>
                  <Text style={styles.settleLabel}>Total Hospital Bill:</Text>
                  <Text style={styles.settleVal}>
                    ₹{selectedPatient?.financials.totalCharges.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.settleRow}>
                  <Text style={styles.settleLabel}>Advance Deposit Deducted:</Text>
                  <Text style={styles.settleVal}>
                    -₹{selectedPatient?.financials.advancePaid.toLocaleString('en-IN')}
                  </Text>
                </View>
                {(selectedPatient?.financials.insuranceApproved || 0) > 0 && (
                  <View style={styles.settleRow}>
                    <Text style={styles.settleLabel}>TPA Insurance Settled:</Text>
                    <Text style={styles.settleVal}>
                      -₹{selectedPatient?.financials.insuranceApproved.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
                <View style={[styles.settleRow, { borderTopWidth: 1, borderColor: '#CBD5E1', paddingTop: 6 }]}>
                  <Text style={styles.settleGrandLabel}>Final Balance Dues:</Text>
                  <Text style={styles.settleGrandVal}>₹ 0.00 (PAID IN FULL)</Text>
                </View>
              </View>

              {/* Authorized Signatures */}
              <View style={styles.signatureRow}>
                <View style={styles.signBox}>
                  <Text style={styles.signTitle}>Hospital Medical Admin</Text>
                  <Text style={styles.signSub}>Digitally Signed</Text>
                </View>
                <View style={styles.signBox}>
                  <Text style={styles.signTitle}>Chief Cashier Desk</Text>
                  <Text style={styles.signSub}>Authorized Stamp</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.printSlipBtn}
              onPress={() => {
                Alert.alert(
                  'Discharge Slip Generated',
                  `Gate Pass ${selectedPatient?.gatePassNo} printed. Ward Bed ${selectedPatient?.bed} marked for housekeeping turnover.`
                );
                setSlipModalVisible(false);
              }}
            >
              <Printer size={16} color="#fff" />
              <Text style={styles.printSlipBtnText}>Print Official Discharge Gate Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  listContainer: { padding: 16 },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  patientMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusApproved: { backgroundColor: '#D1FAE5' },
  statusProgress: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textApproved: { color: '#065F46' },
  textProgress: { color: '#92400E' },
  diagText: { fontSize: 12, color: '#334155', marginTop: 8 },
  docText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  checklistSection: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  checklistTitle: { fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 8 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  checkRowSigned: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  checkLeft: { flexDirection: 'row', gap: 10, flex: 1, alignItems: 'center' },
  checkLabel: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  checkDesc: { fontSize: 10, color: '#64748B', marginTop: 1 },
  signNote: { fontSize: 10, color: '#38845A', fontWeight: '600', marginTop: 2 },
  financeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  financeItem: { alignItems: 'center' },
  finLabel: { fontSize: 10, color: '#64748B' },
  finVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  actionRow: { marginTop: 12 },
  gatePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  gatePassBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  pendingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  pendingActionText: { color: '#92400E', fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  slipHospital: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  slipSub: { fontSize: 10, color: '#64748B' },
  gatePassBanner: {
    backgroundColor: '#38845A',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginVertical: 10,
  },
  gatePassLabel: { color: '#D1FAE5', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  gatePassCode: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 2, fontFamily: 'monospace' },
  gatePassSub: { color: '#A7F3D0', fontSize: 11, marginTop: 2 },
  slipTable: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, gap: 5, marginBottom: 12 },
  slipRow: { flexDirection: 'row', justifyContent: 'space-between' },
  slipColLabel: { fontSize: 11, color: '#64748B' },
  slipColVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  sectionHeading: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 6 },
  auditGrid: { backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8, gap: 4, marginBottom: 12 },
  auditItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  auditText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
  settleSummary: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 8, marginBottom: 12 },
  settleTitle: { fontSize: 11, fontWeight: '800', color: '#334155', marginBottom: 6 },
  settleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  settleLabel: { fontSize: 11, color: '#64748B' },
  settleVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  settleGrandLabel: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  settleGrandVal: { fontSize: 12, fontWeight: '900', color: '#38845A' },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 10 },
  signBox: { alignItems: 'center' },
  signTitle: { fontSize: 11, fontWeight: '700', color: '#334155' },
  signSub: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  printSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  printSlipBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

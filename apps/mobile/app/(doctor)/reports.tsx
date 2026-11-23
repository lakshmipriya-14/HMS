import React, { useState } from 'react';
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
  FileText,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Activity,
  ArrowRight,
  Plus,
  X,
  Search,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

interface ReportItem {
  id: string;
  orderNumber: string;
  type: 'LAB' | 'RADIOLOGY';
  testName: string;
  patientName: string;
  uhid: string;
  date: string;
  status: 'AUTHORIZED' | 'CRITICAL_ALERT';
  summary: string;
  parameters?: { name: string; value: string; unit: string; range: string; critical: boolean }[];
  impression?: string;
  reportedBy: string;
}

const SAMPLE_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    orderNumber: 'LAB-2026-0042',
    type: 'LAB',
    testName: 'Cardiac Biomarker Panel & Electrolytes',
    patientName: 'Ramasamy Kuppusamy',
    uhid: 'KZN-2026-0001',
    date: '2026-11-23 11:30 AM',
    status: 'CRITICAL_ALERT',
    summary: 'High-sensitivity Troponin-I significantly elevated above ischemic threshold.',
    parameters: [
      { name: 'hs-Troponin I', value: '2.45', unit: 'ng/mL', range: '< 0.04', critical: true },
      { name: 'Serum Potassium (K+)', value: '5.8', unit: 'mmol/L', range: '3.5 - 5.1', critical: true },
      { name: 'Serum Sodium (Na+)', value: '138', unit: 'mmol/L', range: '136 - 145', critical: false },
      { name: 'Serum Creatinine', value: '1.2', unit: 'mg/dL', range: '0.7 - 1.3', critical: false },
    ],
    reportedBy: 'Dr. M. Geetha, MD (Pathologist)',
  },
  {
    id: 'rep-2',
    orderNumber: 'RAD-2026-0018',
    type: 'RADIOLOGY',
    testName: 'Chest X-Ray PA View',
    patientName: 'Devi Palaniyappan',
    uhid: 'KZN-2026-0015',
    date: '2026-11-23 09:15 AM',
    status: 'AUTHORIZED',
    summary: 'Cardiomegaly with bilateral pulmonary vascular congestion consistent with congestive heart failure.',
    impression: '1. Moderate cardiomegaly (CTR > 55%). 2. Bilateral prominent hilar vascularity with Kerley B lines. No pneumothorax.',
    reportedBy: 'Dr. P. Rajesh, MD (Radiology)',
  },
  {
    id: 'rep-3',
    orderNumber: 'LAB-2026-0039',
    type: 'LAB',
    testName: 'Complete Blood Count (CBC) with Platelets',
    patientName: 'Muthukumar Thyagarajan',
    uhid: 'KZN-2026-0019',
    date: '2026-11-22 04:45 PM',
    status: 'AUTHORIZED',
    summary: 'Normal hemogram. Platelet count adequate for planned coronary angiogram.',
    parameters: [
      { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', range: '13.0 - 17.0', critical: false },
      { name: 'Total WBC Count', value: '7,800', unit: '/cu.mm', range: '4,000 - 11,000', critical: false },
      { name: 'Platelet Count', value: '240,000', unit: '/cu.mm', range: '150,000 - 450,000', critical: false },
    ],
    reportedBy: 'Dr. M. Geetha, MD (Pathologist)',
  },
];

export default function DoctorReportsScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>(SAMPLE_REPORTS);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'LAB' | 'RADIOLOGY'>('ALL');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Referral Modal State
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [refUhid, setRefUhid] = useState('KZN-2026-0001');
  const [refPatientName, setRefPatientName] = useState('Ramasamy Kuppusamy');
  const [targetDept, setTargetDept] = useState('Nephrology');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'PRIORITY' | 'IMMEDIATE'>('PRIORITY');
  const [clinicalReason, setClinicalReason] = useState('Hyperkalemia (K+ 5.8) and persistent hypertension. Requesting renal consult.');

  const handleCreateReferral = () => {
    if (!refUhid || !clinicalReason.trim()) {
      Alert.alert('Required', 'Please complete the UHID and clinical reason.');
      return;
    }
    setReferModalOpen(false);
    Alert.alert(
      'Specialist Referral Sent',
      `Inter-department referral transmitted to ${targetDept} Department for ${refPatientName} (${refUhid}).`
    );
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'CRITICAL') return r.status === 'CRITICAL_ALERT';
    if (filter === 'LAB') return r.type === 'LAB';
    if (filter === 'RADIOLOGY') return r.type === 'RADIOLOGY';
    return true;
  });

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Diagnostic Reports & Referrals</Text>
          <TouchableOpacity onPress={() => setReferModalOpen(true)} style={styles.referBtn}>
            <Share2 size={13} color="#0F766E" />
            <Text style={styles.referBtnText}>Refer Patient</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerSub}>
          Real-time validated pathology values & diagnostic imaging reports
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}>
            <Text style={[styles.statNum, { color: '#FCA5A5' }]}>
              {reports.filter((r) => r.status === 'CRITICAL_ALERT').length}
            </Text>
            <Text style={styles.statLabel}>Panic Criticals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {reports.filter((r) => r.type === 'RADIOLOGY').length}
            </Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['ALL', 'CRITICAL', 'LAB', 'RADIOLOGY'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterChipText, filter === tab && styles.filterChipTextActive]}>
              {tab === 'CRITICAL' ? '⚠️ Critical Panic' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Report Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authorized Clinical Reports ({filteredReports.length})</Text>

        {filteredReports.map((r) => {
          const isCritical = r.status === 'CRITICAL_ALERT';
          return (
            <View key={r.id} style={[styles.card, isCritical && styles.cardCritical]}>
              <View style={styles.cardTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{r.type}</Text>
                  <Text style={styles.orderNumText}>• {r.orderNumber}</Text>
                </View>

                {isCritical ? (
                  <View style={styles.panicBadge}>
                    <AlertTriangle size={13} color="#DC2626" />
                    <Text style={styles.panicBadgeText}>CRITICAL PANIC</Text>
                  </View>
                ) : (
                  <View style={styles.okBadge}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.okBadgeText}>Authorized</Text>
                  </View>
                )}
              </View>

              <Text style={styles.testName}>{r.testName}</Text>
              <Text style={styles.patientMeta}>
                {r.patientName} • UHID: {r.uhid} • {r.date}
              </Text>

              <Text style={styles.summaryText}>{r.summary}</Text>

              {/* Lab Parameters Table Preview */}
              {r.parameters && (
                <View style={styles.paramTable}>
                  {r.parameters.map((p, idx) => (
                    <View key={idx} style={[styles.paramRow, p.critical && styles.paramRowCritical]}>
                      <Text style={[styles.paramName, p.critical && styles.paramNameCritical]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.paramVal, p.critical && styles.paramValCritical]}>
                        {p.value} {p.unit}
                      </Text>
                      <Text style={styles.paramRange}>Ref: {p.range}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Radiology Impression */}
              {r.impression && (
                <View style={styles.impressionBox}>
                  <Text style={styles.impressionHeading}>Radiologist Impression:</Text>
                  <Text style={styles.impressionText}>{r.impression}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.reportedBy}>Verified by: {r.reportedBy}</Text>
                <TouchableOpacity
                  style={styles.referFromRepBtn}
                  onPress={() => {
                    setRefUhid(r.uhid);
                    setRefPatientName(r.patientName);
                    setClinicalReason(`Follow-up on ${r.testName}: ${r.summary}`);
                    setReferModalOpen(true);
                  }}
                >
                  <Text style={styles.referFromRepText}>Refer Specialist</Text>
                  <ArrowRight size={13} color="#0F766E" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* SPECIALIST REFERRAL MODAL */}
      <Modal visible={referModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Specialist Department Referral</Text>
            <TouchableOpacity onPress={() => setReferModalOpen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              <Text style={styles.label}>Patient UHID *</Text>
              <TextInput style={styles.input} value={refUhid} onChangeText={setRefUhid} />

              <Text style={styles.label}>Patient Name</Text>
              <TextInput style={styles.input} value={refPatientName} onChangeText={setRefPatientName} />

              <Text style={styles.label}>Referred Department *</Text>
              <TextInput
                style={styles.input}
                value={targetDept}
                onChangeText={setTargetDept}
                placeholder="e.g. Nephrology, Neurology, Oncology"
              />

              <Text style={styles.label}>Urgency Level</Text>
              <View style={styles.urgencyRow}>
                {(['ROUTINE', 'PRIORITY', 'IMMEDIATE'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.urgencyPill, urgency === u && styles.urgencyPillActive]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text style={[styles.urgencyText, urgency === u && styles.urgencyTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Clinical Reason & Summary for Specialist *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={clinicalReason}
                onChangeText={setClinicalReason}
                multiline
                placeholder="Reason for consultation, current clinical findings, medication regimen..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateReferral}>
              <Share2 size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Dispatch Specialist Referral Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: '#0F766E', padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSub: { color: '#99F6E4', fontSize: 12, marginTop: 4 },
  referBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  referBtnText: { color: '#0F766E', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#CCFBF1', fontSize: 11, marginTop: 2 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#0F766E' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardCritical: { borderWidth: 1.5, borderColor: '#FCA5A5' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  orderNumText: { fontSize: 11, color: '#64748B', marginLeft: 4 },
  panicBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  panicBadgeText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  okBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  okBadgeText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  testName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  patientMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  summaryText: { fontSize: 13, color: '#334155', marginTop: 8 },
  paramTable: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 10, gap: 6 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  paramRowCritical: { backgroundColor: '#FEE2E2', borderRadius: 4, paddingHorizontal: 6 },
  paramName: { fontSize: 12, color: '#334155', flex: 1.5 },
  paramNameCritical: { color: '#991B1B', fontWeight: '700' },
  paramVal: { fontSize: 12, fontWeight: '700', color: '#0F172A', flex: 1 },
  paramValCritical: { color: '#DC2626' },
  paramRange: { fontSize: 11, color: '#64748B', flex: 1, textAlign: 'right' },
  impressionBox: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 8, padding: 10, marginTop: 10 },
  impressionHeading: { fontSize: 12, fontWeight: '700', color: '#0F766E', marginBottom: 2 },
  impressionText: { fontSize: 12, color: '#334155' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  reportedBy: { fontSize: 11, color: '#64748B', fontStyle: 'italic' },
  referFromRepBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  referFromRepText: { fontSize: 12, color: '#0F766E', fontWeight: '700' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: '#0F766E', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalScroll: { flex: 1 },
  formPadding: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  urgencyRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  urgencyPill: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#E2E8F0' },
  urgencyPillActive: { backgroundColor: '#0F766E' },
  urgencyText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  urgencyTextActive: { color: '#fff' },
  modalFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

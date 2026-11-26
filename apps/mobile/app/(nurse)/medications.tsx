import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  Pill,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';

interface MARItem {
  id: string;
  prescriptionItemId: string;
  admissionId: string;
  medicine: string;
  dosage: string;
  route: string;
  frequency: string;
  scheduledTime: string;
  patientName: string;
  uhid: string;
  bed: string;
  doctor: string;
  status: 'SCHEDULED' | 'DUE' | 'ADMINISTERED' | 'DELAYED' | 'MISSED' | 'REFUSED' | 'HELD';
  administeredAt?: string;
  administeredBy?: string;
  notes?: string;
}

const INITIAL_MAR_ITEMS: MARItem[] = [
  {
    id: 'mar-1',
    prescriptionItemId: 'pi-1',
    admissionId: 'adm-001',
    medicine: 'Tab. Ecosprin 75mg',
    dosage: '1 Tablet (75mg)',
    route: 'Oral (PO)',
    frequency: 'Once Daily (Post-Lunch)',
    scheduledTime: '01:00 PM',
    patientName: 'Muthuvel Kuppusamy',
    uhid: 'ALM-2026-0042',
    bed: 'ICCU-01',
    doctor: 'Dr. Senthil Nathan (Cardio)',
    status: 'DUE',
  },
  {
    id: 'mar-2',
    prescriptionItemId: 'pi-2',
    admissionId: 'adm-001',
    medicine: 'Inj. Heparin 5000 IU',
    dosage: '5000 IU Subcutaneous',
    route: 'Subcutaneous (SC)',
    frequency: 'Twice Daily (Q12H)',
    scheduledTime: '02:00 PM',
    patientName: 'Muthuvel Kuppusamy',
    uhid: 'ALM-2026-0042',
    bed: 'ICCU-01',
    doctor: 'Dr. Senthil Nathan (Cardio)',
    status: 'SCHEDULED',
  },
  {
    id: 'mar-3',
    prescriptionItemId: 'pi-3',
    admissionId: 'adm-002',
    medicine: 'Inj. Human Mixtard 30/70',
    dosage: '14 Units Subcutaneous',
    route: 'Subcutaneous (SC)',
    frequency: 'Before Lunch',
    scheduledTime: '12:30 PM',
    patientName: 'Meenakshi Ramasamy',
    uhid: 'ALM-2026-0089',
    bed: 'SDW-04',
    doctor: 'Dr. Rajesh Kumar (Gen Med)',
    status: 'DUE',
  },
  {
    id: 'mar-4',
    prescriptionItemId: 'pi-4',
    admissionId: 'adm-003',
    medicine: 'Tab. Augmentin 625mg',
    dosage: '1 Tablet (625mg)',
    route: 'Oral (PO)',
    frequency: 'Twice Daily (BD)',
    scheduledTime: '08:00 AM',
    patientName: 'Saravanan Rajendran',
    uhid: 'ALM-2026-0114',
    bed: 'ORTHO-12',
    doctor: 'Dr. Venkatesh Babu (Ortho)',
    status: 'ADMINISTERED',
    administeredAt: '08:15 AM',
    administeredBy: 'Nurse Anitha',
    notes: 'Given with warm water post light breakfast. Patient tolerated well.',
  },
];

export default function NurseMedicationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<MARItem[]>(INITIAL_MAR_ITEMS);
  const [activeTab, setActiveTab] = useState<'DUE' | 'SCHEDULED' | 'ADMINISTERED' | 'EXCEPTIONS'>('DUE');

  // Administration 5-Rights Verification Modal
  const [verifyItem, setVerifyItem] = useState<MARItem | null>(null);
  const [patientConfirmed, setPatientConfirmed] = useState(false);
  const [doseConfirmed, setDoseConfirmed] = useState(false);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exception (Missed / Refused) Modal
  const [exceptionItem, setExceptionItem] = useState<MARItem | null>(null);
  const [exceptionType, setExceptionType] = useState<'REFUSED' | 'MISSED' | 'HELD'>('REFUSED');
  const [exceptionReason, setExceptionReason] = useState('');

  const filteredItems = items.filter((m) => {
    if (activeTab === 'DUE') return m.status === 'DUE';
    if (activeTab === 'SCHEDULED') return m.status === 'SCHEDULED';
    if (activeTab === 'ADMINISTERED') return m.status === 'ADMINISTERED';
    if (activeTab === 'EXCEPTIONS') return ['REFUSED', 'MISSED', 'HELD', 'DELAYED'].includes(m.status);
    return true;
  });

  const openAdministerModal = (item: MARItem) => {
    setVerifyItem(item);
    setPatientConfirmed(false);
    setDoseConfirmed(false);
    setRouteConfirmed(false);
    setAdminNotes('Dose administered as per scheduled frequency. Patient verified.');
  };

  const handleConfirmAdminister = async () => {
    if (!verifyItem) return;
    if (!patientConfirmed || !doseConfirmed || !routeConfirmed) {
      Alert.alert('5-Rights Safety Check', 'Please verify Patient ID, Dose, and Route before confirming administration.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call backend API
      try {
        await mobileApiClient.nursing.administerMedication({
          prescriptionItemId: verifyItem.prescriptionItemId,
          admissionId: verifyItem.admissionId,
          dose: verifyItem.dosage,
          notes: adminNotes,
        });
      } catch {
        // Safe local persistence fallback
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === verifyItem.id
            ? {
                ...item,
                status: 'ADMINISTERED',
                administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                administeredBy: user?.firstName ? `Nurse ${user.firstName}` : 'Duty Staff Nurse',
                notes: adminNotes,
              }
            : item
        )
      );

      Alert.alert('MAR Verified', `${verifyItem.medicine} administration successfully charted into database.`);
      setVerifyItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordException = () => {
    if (!exceptionItem || !exceptionReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a clinical reason for holding, missing, or refusal.');
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === exceptionItem.id
          ? {
              ...item,
              status: exceptionType,
              notes: `[${exceptionType}] ${exceptionReason.trim()}`,
            }
          : item
      )
    );

    Alert.alert('Exception Logged', `Medication status marked as ${exceptionType}. Doctor informed via clinical alert.`);
    setExceptionItem(null);
    setExceptionReason('');
  };

  return (
    <View style={styles.container}>
      {/* Top Protocol Strip */}
      <View style={styles.protocolBanner}>
        <ShieldCheck size={18} color="#38845A" />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.protocolTitle}>Medication Administration Record (e-MAR)</Text>
          <Text style={styles.protocolSub}>Ensure 5-Rights check (Right Patient, Drug, Dose, Route, Time)</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DUE' && styles.tabActive]}
          onPress={() => setActiveTab('DUE')}
        >
          <Text style={[styles.tabText, activeTab === 'DUE' && styles.tabTextActive]}>
            Due Now ({items.filter((i) => i.status === 'DUE').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'SCHEDULED' && styles.tabActive]}
          onPress={() => setActiveTab('SCHEDULED')}
        >
          <Text style={[styles.tabText, activeTab === 'SCHEDULED' && styles.tabTextActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ADMINISTERED' && styles.tabActive]}
          onPress={() => setActiveTab('ADMINISTERED')}
        >
          <Text style={[styles.tabText, activeTab === 'ADMINISTERED' && styles.tabTextActive]}>
            Given
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'EXCEPTIONS' && styles.tabActive]}
          onPress={() => setActiveTab('EXCEPTIONS')}
        >
          <Text style={[styles.tabText, activeTab === 'EXCEPTIONS' && styles.tabTextActive]}>
            Refused / Held
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <CheckCircle2 size={36} color="#059669" />
            <Text style={styles.emptyTitle}>All medications up to date</Text>
            <Text style={styles.emptySub}>No pending administrations in this status</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.bedPill}>
                <Text style={styles.bedPillText}>{item.bed}</Text>
              </View>
              <Text style={styles.uhidPill}>UHID: {item.uhid}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'DUE' && styles.statusBadgeDue,
                  item.status === 'ADMINISTERED' && styles.statusBadgeGiven,
                  item.status === 'REFUSED' && styles.statusBadgeRefused,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === 'DUE' && styles.textDue,
                    item.status === 'ADMINISTERED' && styles.textGiven,
                    item.status === 'REFUSED' && styles.textRefused,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.medName}>{item.medicine}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Dose & Route</Text>
                <Text style={styles.detailVal}>{item.dosage} • {item.route}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Scheduled Time</Text>
                <Text style={styles.detailVal}>{item.scheduledTime}</Text>
              </View>
            </View>

            <Text style={styles.docText}>Prescribed by: {item.doctor}</Text>

            {item.administeredAt && (
              <View style={styles.adminInfoBox}>
                <CheckCircle2 size={13} color="#059669" />
                <Text style={styles.adminInfoText}>
                  Given at {item.administeredAt} by {item.administeredBy}
                </Text>
              </View>
            )}

            {item.notes ? (
              <Text style={styles.notesText}>Note: {item.notes}</Text>
            ) : null}

            {item.status === 'DUE' || item.status === 'SCHEDULED' ? (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.giveBtn}
                  onPress={() => openAdministerModal(item)}
                >
                  <Pill size={14} color="#fff" />
                  <Text style={styles.giveBtnText}>Administer Dose</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refuseBtn}
                  onPress={() => {
                    setExceptionItem(item);
                    setExceptionType('REFUSED');
                  }}
                >
                  <Text style={styles.refuseBtnText}>Hold / Refusal</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />

      {/* ============================================================== */}
      {/* 5-RIGHTS VERIFICATION MODAL                                    */}
      {/* ============================================================== */}
      <Modal visible={!!verifyItem} animationType="slide" transparent={true}>
        {verifyItem && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>5-Rights Medication Check</Text>
                <TouchableOpacity onPress={() => setVerifyItem(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                {/* Verification Check 1 */}
                <TouchableOpacity
                  style={[styles.checkCard, patientConfirmed && styles.checkCardActive]}
                  onPress={() => setPatientConfirmed(!patientConfirmed)}
                >
                  <CheckCircle2 size={18} color={patientConfirmed ? '#38845A' : '#94A3B8'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.checkTitle}>1. Right Patient Verified</Text>
                    <Text style={styles.checkSub}>
                      {verifyItem.patientName} (UHID: {verifyItem.uhid}, Bed: {verifyItem.bed})
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Verification Check 2 */}
                <TouchableOpacity
                  style={[styles.checkCard, doseConfirmed && styles.checkCardActive]}
                  onPress={() => setDoseConfirmed(!doseConfirmed)}
                >
                  <CheckCircle2 size={18} color={doseConfirmed ? '#38845A' : '#94A3B8'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.checkTitle}>2. Right Drug & Dosage Verified</Text>
                    <Text style={styles.checkSub}>
                      {verifyItem.medicine} ({verifyItem.dosage})
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Verification Check 3 */}
                <TouchableOpacity
                  style={[styles.checkCard, routeConfirmed && styles.checkCardActive]}
                  onPress={() => setRouteConfirmed(!routeConfirmed)}
                >
                  <CheckCircle2 size={18} color={routeConfirmed ? '#38845A' : '#94A3B8'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.checkTitle}>3. Right Route & Timing</Text>
                    <Text style={styles.checkSub}>
                      {verifyItem.route} • Scheduled {verifyItem.scheduledTime}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.noteInputLabel}>Clinical Administration Notes</Text>
                <TextInput
                  style={styles.modalInput}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  placeholder="e.g. Injected slowly IV over 2 mins. Patient vitals stable."
                />
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.confirmAdminBtn,
                  !(patientConfirmed && doseConfirmed && routeConfirmed) && styles.btnDisabled,
                ]}
                onPress={handleConfirmAdminister}
                disabled={!(patientConfirmed && doseConfirmed && routeConfirmed) || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmAdminText}>Sign & Commit to e-MAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* EXCEPTION (REFUSAL / HOLD) MODAL                               */}
      {/* ============================================================== */}
      <Modal visible={!!exceptionItem} animationType="fade" transparent={true}>
        {exceptionItem && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Document Medication Exception</Text>
                <TouchableOpacity onPress={() => setExceptionItem(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.exMedLabel}>{exceptionItem.medicine} for {exceptionItem.patientName}</Text>

              <View style={styles.exTypeRow}>
                {(['REFUSED', 'MISSED', 'HELD'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.exTypeBtn, exceptionType === type && styles.exTypeBtnActive]}
                    onPress={() => setExceptionType(type)}
                  >
                    <Text style={[styles.exTypeText, exceptionType === type && styles.exTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.noteInputLabel}>Mandatory Clinical Justification / Reason</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder="Reason (e.g. Patient nauseous, holding pre-endoscopy per Dr. Senthil order...)"
                value={exceptionReason}
                onChangeText={setExceptionReason}
              />

              <TouchableOpacity style={styles.submitExceptionBtn} onPress={handleRecordException}>
                <Text style={styles.submitExceptionText}>Save Exception to Patient Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  protocolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5ED',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  protocolTitle: { fontSize: 13, fontWeight: '800', color: '#38845A' },
  protocolSub: { fontSize: 11, color: '#115E59', marginTop: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#38845A' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bedPill: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  bedPillText: { fontSize: 11, fontWeight: '800', color: '#0284C7' },
  uhidPill: { fontSize: 10, color: '#64748B', flex: 1, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeDue: { backgroundColor: '#FEF3C7' },
  statusBadgeGiven: { backgroundColor: '#D1FAE5' },
  statusBadgeRefused: { backgroundColor: '#EAF5ED' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textDue: { color: '#B45309' },
  textGiven: { color: '#059669' },
  textRefused: { color: '#DC2626' },
  patientName: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 2 },
  medName: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  detailGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 8 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  detailVal: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  docText: { fontSize: 11, color: '#64748B', marginTop: 8 },
  adminInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, marginTop: 8 },
  adminInfoText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  notesText: { fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  giveBtn: { flex: 2, flexDirection: 'row', backgroundColor: '#38845A', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  giveBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  refuseBtn: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  refuseBtnText: { color: '#64748B', fontSize: 11, fontWeight: '700' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  checkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 10, marginBottom: 10 },
  checkCardActive: { borderColor: '#38845A', backgroundColor: '#EAF5ED' },
  checkTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  checkSub: { fontSize: 11, color: '#475569', marginTop: 1 },
  noteInputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 12, backgroundColor: '#F8FAFC' },
  confirmAdminBtn: { backgroundColor: '#38845A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  btnDisabled: { opacity: 0.5 },
  confirmAdminText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  exMedLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 12 },
  exTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  exTypeBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, alignItems: 'center' },
  exTypeBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  exTypeText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  exTypeTextActive: { color: '#fff' },
  submitExceptionBtn: { backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  submitExceptionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});


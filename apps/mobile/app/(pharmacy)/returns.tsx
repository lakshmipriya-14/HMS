import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Plus,
  X,
  FileText,
  ShieldCheck,
  Calendar,
  Package,
} from 'lucide-react-native';

export interface ReturnMemo {
  id: string;
  memoNumber: string;
  uhid?: string;
  patientName?: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  type: 'PATIENT_RETURN' | 'EXPIRED_WASTAGE' | 'DAMAGED_DISPOSAL';
  reason: string;
  disposition: 'QUARANTINE' | 'BIO_WASTE_INCINERATION' | 'VENDOR_CREDIT';
  recordedBy: string;
  date: string;
}

const FALLBACK_MEMOS: ReturnMemo[] = [
  {
    id: 'memo-1',
    memoNumber: 'MEMO-2026-0041',
    uhid: 'KZN-2026-0001',
    patientName: 'Ramasamy K.',
    medicineName: 'Amlodipine 5mg Norvasc',
    batchNumber: 'BT-AML-2025A',
    quantity: 10,
    type: 'PATIENT_RETURN',
    reason: 'Physician switched to Telmisartan due to ankle edema',
    disposition: 'QUARANTINE',
    recordedBy: 'Karthik Raja, RPh',
    date: 'Today, 11:20 AM',
  },
  {
    id: 'memo-2',
    memoNumber: 'MEMO-2026-0040',
    medicineName: 'Ceftriaxone 1g Injection Monocef',
    batchNumber: 'BT-CEF-2024Z',
    quantity: 12,
    type: 'EXPIRED_WASTAGE',
    reason: 'Reached 30-day pre-expiry quarantine threshold',
    disposition: 'BIO_WASTE_INCINERATION',
    recordedBy: 'Karthik Raja, RPh',
    date: 'Yesterday, 04:45 PM',
  },
  {
    id: 'memo-3',
    memoNumber: 'MEMO-2026-0039',
    medicineName: 'Amoxicillin + Clav 625mg',
    batchNumber: 'BT-AMX-2025C',
    quantity: 6,
    type: 'DAMAGED_DISPOSAL',
    reason: 'Blister pack punctured in transit carton',
    disposition: 'VENDOR_CREDIT',
    recordedBy: 'Karthik Raja, RPh',
    date: '21 Nov 2026',
  },
];

export default function PharmacyReturnsScreen() {
  const [memos, setMemos] = useState<ReturnMemo[]>(FALLBACK_MEMOS);
  const [filterType, setFilterType] = useState<'ALL' | 'RETURNS' | 'WASTAGE'>('ALL');
  const [modalVisible, setModalVisible] = useState(false);

  // New Memo Form State
  const [uhid, setUhid] = useState('KZN-2026-0014');
  const [patientName, setPatientName] = useState('Deepa Thirunavukarasu');
  const [medicineName, setMedicineName] = useState('Pantoprazole 40mg');
  const [batchNumber, setBatchNumber] = useState('BT-PAN-2025X');
  const [quantity, setQuantity] = useState('5');
  const [memoType, setMemoType] = useState<'PATIENT_RETURN' | 'EXPIRED_WASTAGE' | 'DAMAGED_DISPOSAL'>('PATIENT_RETURN');
  const [reason, setReason] = useState('Dose reduced by consulting physician');
  const [disposition, setDisposition] = useState<'QUARANTINE' | 'BIO_WASTE_INCINERATION' | 'VENDOR_CREDIT'>('QUARANTINE');

  const handleSaveMemo = () => {
    if (!medicineName.trim() || !batchNumber.trim() || !quantity.trim()) {
      Alert.alert('Required Fields', 'Please fill medicine name, batch number, and quantity.');
      return;
    }

    const newMemo: ReturnMemo = {
      id: `memo-${Date.now()}`,
      memoNumber: `MEMO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      uhid: memoType === 'PATIENT_RETURN' ? uhid : undefined,
      patientName: memoType === 'PATIENT_RETURN' ? patientName : undefined,
      medicineName,
      batchNumber,
      quantity: parseInt(quantity, 10) || 1,
      type: memoType,
      reason,
      disposition,
      recordedBy: 'Hospital Pharmacist',
      date: 'Just now',
    };

    setMemos((prev) => [newMemo, ...prev]);
    Alert.alert('Memo Logged', `Audit voucher ${newMemo.memoNumber} created and filed for inventory control.`);
    setModalVisible(false);
  };

  const filteredMemos = memos.filter((m) => {
    if (filterType === 'RETURNS') return m.type === 'PATIENT_RETURN';
    if (filterType === 'WASTAGE') return m.type !== 'PATIENT_RETURN';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Returns & Wastage Ledger</Text>
            <Text style={styles.sub}>Reconciliation, Quarantine & Bio-Waste Memos</Text>
          </View>
          <TouchableOpacity style={styles.newMemoBtn} onPress={() => setModalVisible(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.newMemoBtnText}>Log Memo</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilterType('ALL')}
          >
            <Text style={[styles.filterText, filterType === 'ALL' && styles.filterTextActive]}>
              All Audit Vouchers ({memos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'RETURNS' && styles.filterPillActive]}
            onPress={() => setFilterType('RETURNS')}
          >
            <RotateCcw size={12} color={filterType === 'RETURNS' ? '#fff' : '#64748B'} />
            <Text style={[styles.filterText, filterType === 'RETURNS' && styles.filterTextActive]}>
              Patient Returns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'WASTAGE' && styles.filterPillActive]}
            onPress={() => setFilterType('WASTAGE')}
          >
            <AlertOctagon size={12} color={filterType === 'WASTAGE' ? '#fff' : '#64748B'} />
            <Text style={[styles.filterText, filterType === 'WASTAGE' && styles.filterTextActive]}>
              Expired & Wastage
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      <ScrollView style={styles.scroll}>
        {filteredMemos.map((memo) => {
          const isReturn = memo.type === 'PATIENT_RETURN';

          return (
            <View key={memo.id} style={styles.memoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.memoIdBadge}>
                  <Text style={styles.memoIdText}>{memo.memoNumber}</Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    isReturn ? styles.typeReturn : styles.typeWastage,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      isReturn ? styles.typeReturnText : styles.typeWastageText,
                    ]}
                  >
                    {memo.type.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.drugTitle}>{memo.medicineName}</Text>
              <Text style={styles.batchSub}>
                Batch: <Text style={styles.batchBold}>{memo.batchNumber}</Text> · Qty: <Text style={styles.batchBold}>{memo.quantity} units</Text>
              </Text>

              {memo.patientName && (
                <Text style={styles.patientLine}>
                  Patient: {memo.patientName} ({memo.uhid})
                </Text>
              )}

              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Clinical / Audit Justification:</Text>
                <Text style={styles.reasonText}>{memo.reason}</Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.dispositionPill}>
                  <ShieldCheck size={12} color="#38845A" />
                  <Text style={styles.dispositionText}>{memo.disposition.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.dateMeta}>{memo.date} · {memo.recordedBy}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ======================================================== */}
      {/* LOG RETURN / WASTAGE MODAL                               */}
      {/* ======================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Stock Return or Wastage</Text>
                <Text style={styles.modalSub}>Official Pharmacy Audit Voucher Protocol</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Select */}
              <Text style={styles.inputLabel}>Classification Type:</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeSelectBtn, memoType === 'PATIENT_RETURN' && styles.typeSelectBtnActive]}
                  onPress={() => setMemoType('PATIENT_RETURN')}
                >
                  <Text style={[styles.typeSelectText, memoType === 'PATIENT_RETURN' && styles.typeSelectTextActive]}>
                    Patient Return
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeSelectBtn, memoType === 'EXPIRED_WASTAGE' && styles.typeSelectBtnActive]}
                  onPress={() => setMemoType('EXPIRED_WASTAGE')}
                >
                  <Text style={[styles.typeSelectText, memoType === 'EXPIRED_WASTAGE' && styles.typeSelectTextActive]}>
                    Expired Stock
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeSelectBtn, memoType === 'DAMAGED_DISPOSAL' && styles.typeSelectBtnActive]}
                  onPress={() => setMemoType('DAMAGED_DISPOSAL')}
                >
                  <Text style={[styles.typeSelectText, memoType === 'DAMAGED_DISPOSAL' && styles.typeSelectTextActive]}>
                    Damaged / Broken
                  </Text>
                </TouchableOpacity>
              </View>

              {memoType === 'PATIENT_RETURN' && (
                <>
                  <Text style={styles.inputLabel}>Patient UHID:</Text>
                  <TextInput
                    style={styles.input}
                    value={uhid}
                    onChangeText={setUhid}
                    placeholder="KZN-YYYY-XXXX"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.inputLabel}>Patient Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Drug Name & Strength:</Text>
              <TextInput
                style={styles.input}
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder="e.g. Amlodipine 5mg"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Batch Number:</Text>
                  <TextInput
                    style={styles.input}
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                    placeholder="BT-XXXX-XX"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Units Count:</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="Qty"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Disposal / Disposition Route:</Text>
              <View style={styles.dispRow}>
                {[
                  { key: 'QUARANTINE', label: 'Quarantine Stash' },
                  { key: 'BIO_WASTE_INCINERATION', label: 'Bio-Hazard Incineration' },
                  { key: 'VENDOR_CREDIT', label: 'Vendor Credit Claim' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.dispPill, disposition === item.key && styles.dispPillActive]}
                    onPress={() => setDisposition(item.key as any)}
                  >
                    <Text style={[styles.dispText, disposition === item.key && styles.dispTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Reason / Remarks:</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                multiline
                value={reason}
                onChangeText={setReason}
                placeholder="Describe reason for return or destruction..."
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveMemo}>
                <CheckCircle2 size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>File Audit Memo</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  newMemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38845A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  newMemoBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  filterPillActive: { backgroundColor: '#38845A' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff', fontWeight: '800' },
  scroll: { flex: 1, padding: 14 },
  memoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memoIdBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  memoIdText: { fontSize: 11, fontWeight: '800', color: '#38845A' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeReturn: { backgroundColor: '#EAF5ED' },
  typeReturnText: { color: '#6D28D9', fontSize: 10, fontWeight: '800' },
  typeWastage: { backgroundColor: '#EAF5ED' },
  typeWastageText: { color: '#DC2626', fontSize: 10, fontWeight: '800' },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  drugTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  batchSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  batchBold: { fontWeight: '700', color: '#1E293B' },
  patientLine: { fontSize: 12, color: '#334155', marginTop: 4, fontWeight: '500' },
  reasonBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, marginVertical: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  reasonLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  reasonText: { fontSize: 12, color: '#334155', marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dispositionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF5ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dispositionText: { fontSize: 10, fontWeight: '700', color: '#38845A' },
  dateMeta: { fontSize: 11, color: '#94A3B8' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 24 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 18 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 5 },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  typeRow: { flexDirection: 'row', gap: 6 },
  typeSelectBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center' },
  typeSelectBtnActive: { borderColor: '#38845A', backgroundColor: '#FAF5FF' },
  typeSelectText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  typeSelectTextActive: { color: '#38845A', fontWeight: '800' },
  twoCol: { flexDirection: 'row' },
  dispRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dispPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  dispPillActive: { borderColor: '#38845A', backgroundColor: '#EAF5ED' },
  dispText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  dispTextActive: { color: '#38845A', fontWeight: '800' },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

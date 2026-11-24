import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Calculator,
  IndianRupee,
  FileCheck,
  Building,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

interface InsuranceClaim {
  id: string;
  claimNo: string;
  uhid: string;
  patientName: string;
  tpaName: string;
  policyNo: string;
  admissionType: 'Planned IPD' | 'Emergency IPD' | 'Day Care';
  requestedAmount: number;
  initialSanctionedAmount: number;
  finalSettledAmount?: number;
  copayPercent: number; // e.g. 10%
  deductible: number;
  patientCoPayShare: number;
  status:
    | 'Pre-Auth Requested'
    | 'Initial Sanction Issued'
    | 'Query Raised'
    | 'Cashless Approved'
    | 'Settled';
  submittedDate: string;
  queryDetails?: string;
  remarks?: string;
}

const FALLBACK_CLAIMS: InsuranceClaim[] = [
  {
    id: 'clm-01',
    claimNo: 'CLM-TPA-2026-081',
    uhid: 'KZN-2026-0042',
    patientName: 'Meenakshi Sundaram',
    tpaName: 'Star Health & Allied Insurance',
    policyNo: 'STAR-IND-8849204',
    admissionType: 'Emergency IPD',
    requestedAmount: 145000,
    initialSanctionedAmount: 110000,
    copayPercent: 10,
    deductible: 2000,
    patientCoPayShare: 13000,
    status: 'Cashless Approved',
    submittedDate: '21 Nov 2026',
    remarks: 'Initial authorization granted for Stent procedure up to ₹1,10,000.',
  },
  {
    id: 'clm-02',
    claimNo: 'CLM-TPA-2026-082',
    uhid: 'KZN-2026-0019',
    patientName: 'Suresh Kumar',
    tpaName: 'Medi Assist TPA / ICICI Lombard',
    policyNo: 'MED-CORP-948271',
    admissionType: 'Planned IPD',
    requestedAmount: 82000,
    initialSanctionedAmount: 50000,
    finalSettledAmount: 82000,
    copayPercent: 0,
    deductible: 0,
    patientCoPayShare: 0,
    status: 'Settled',
    submittedDate: '19 Nov 2026',
    remarks: 'Final settlement voucher received and adjusted against bill.',
  },
  {
    id: 'clm-03',
    claimNo: 'CLM-TPA-2026-083',
    uhid: 'KZN-2026-0155',
    patientName: 'Karthikeyan Pillai',
    tpaName: 'HDFC ERGO General Insurance',
    policyNo: 'HDFC-HEALTH-44021',
    admissionType: 'Planned IPD',
    requestedAmount: 65000,
    initialSanctionedAmount: 45000,
    copayPercent: 15,
    deductible: 1500,
    patientCoPayShare: 8250,
    status: 'Query Raised',
    submittedDate: '23 Nov 2026',
    queryDetails: 'Requires previous 2 years prescription history for pre-existing hypertension.',
  },
  {
    id: 'clm-04',
    claimNo: 'CLM-TPA-2026-084',
    uhid: 'KZN-2026-0208',
    patientName: 'Anitha Rajendran',
    tpaName: 'Care Health Insurance',
    policyNo: 'CARE-FLOATER-33921',
    admissionType: 'Day Care',
    requestedAmount: 32000,
    initialSanctionedAmount: 0,
    copayPercent: 10,
    deductible: 1000,
    patientCoPayShare: 4200,
    status: 'Pre-Auth Requested',
    submittedDate: '24 Nov 2026',
    remarks: 'Pre-auth documentation submitted via TPA Portal. Awaiting scrutiny.',
  },
];

export default function InsuranceDeskScreen() {
  const [claims, setClaims] = useState<InsuranceClaim[]>(FALLBACK_CLAIMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  // Co-pay Calculator Modal
  const [calcVisible, setCalcVisible] = useState(false);
  const [estBill, setEstBill] = useState('100000');
  const [copayInput, setCopayInput] = useState('10');
  const [deductibleInput, setDeductibleInput] = useState('1500');

  // New Pre-Auth Modal
  const [newPreAuthVisible, setNewPreAuthVisible] = useState(false);
  const [newPatient, setNewPatient] = useState('');
  const [newUhid, setNewUhid] = useState('');
  const [newTpa, setNewTpa] = useState('Star Health & Allied Insurance');
  const [newPolicy, setNewPolicy] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any[]>('/billing/insurance-claims');
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setClaims(res.data);
      }
    } catch {
      // Keep fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePreAuth = () => {
    if (!newPatient || !newPolicy || !newAmount) {
      Alert.alert('Required Fields', 'Please fill in Patient Name, Policy Number, and Estimated Amount.');
      return;
    }

    const est = Number(newAmount) || 50000;
    const copay = 10;
    const ded = 1000;
    const patientShare = (est * copay) / 100 + ded;

    const newClaim: InsuranceClaim = {
      id: `clm-${Date.now()}`,
      claimNo: `CLM-TPA-2026-${Math.floor(100 + Math.random() * 900)}`,
      uhid: newUhid || 'KZN-2026-0299',
      patientName: newPatient,
      tpaName: newTpa,
      policyNo: newPolicy,
      admissionType: 'Planned IPD',
      requestedAmount: est,
      initialSanctionedAmount: Math.round(est * 0.8),
      copayPercent: copay,
      deductible: ded,
      patientCoPayShare: patientShare,
      status: 'Pre-Auth Requested',
      submittedDate: 'Today',
      remarks: 'Pre-auth documentation submitted via electronic desk.',
    };

    setClaims([newClaim, ...claims]);
    setNewPreAuthVisible(false);
    setNewPatient('');
    setNewPolicy('');
    setNewAmount('');
    Alert.alert('Pre-Auth Submitted', `Pre-Authorization claim ${newClaim.claimNo} submitted successfully.`);
  };

  // Calculator computations
  const billNum = Number(estBill) || 0;
  const copayPct = Number(copayInput) || 0;
  const dedNum = Number(deductibleInput) || 0;
  const patientCopayAmt = (billNum * copayPct) / 100;
  const totalPatientOutOfPocket = patientCopayAmt + dedNum;
  const insuranceSanctionShare = Math.max(0, billNum - totalPatientOutOfPocket);

  const filteredClaims = useMemo(() => {
    return claims.filter(
      (c) =>
        c.claimNo.toLowerCase().includes(search.toLowerCase()) ||
        c.patientName.toLowerCase().includes(search.toLowerCase()) ||
        c.tpaName.toLowerCase().includes(search.toLowerCase()) ||
        c.uhid.toLowerCase().includes(search.toLowerCase())
    );
  }, [claims, search]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Insurance & TPA Cashless Desk</Text>
            <Text style={styles.sub}>Pre-Auth Approval Tracker & Patient Co-Pay Calculator</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.calcHeaderBtn} onPress={() => setCalcVisible(true)}>
              <Calculator size={16} color="#059669" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setNewPreAuthVisible(true)}>
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Claim ID, TPA, UHID, or Patient..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Claims List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredClaims.map((c) => (
          <View key={c.id} style={styles.claimCard}>
            <View style={styles.claimCardHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.claimNo}>{c.claimNo}</Text>
                  <View style={styles.admBadge}>
                    <Text style={styles.admBadgeText}>{c.admissionType}</Text>
                  </View>
                </View>
                <Text style={styles.patientName}>{c.patientName}</Text>
                <Text style={styles.uhidText}>UHID: {c.uhid}</Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  c.status === 'Cashless Approved' || c.status === 'Settled'
                    ? styles.pillApproved
                    : c.status === 'Query Raised'
                    ? styles.pillQuery
                    : styles.pillPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    c.status === 'Cashless Approved' || c.status === 'Settled'
                      ? styles.textGreen
                      : c.status === 'Query Raised'
                      ? styles.textRed
                      : styles.textAmber,
                  ]}
                >
                  {c.status}
                </Text>
              </View>
            </View>

            {/* Policy & TPA Details */}
            <View style={styles.policyRow}>
              <Building size={14} color="#059669" />
              <Text style={styles.tpaText}>{c.tpaName}</Text>
            </View>
            <Text style={styles.policyNoText}>Policy #: {c.policyNo}</Text>

            {/* Financials & Co-Pay Breakdown */}
            <View style={styles.amountGrid}>
              <View style={styles.amountBox}>
                <Text style={styles.amtLabel}>Requested Bill</Text>
                <Text style={styles.amtVal}>₹{c.requestedAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amtLabel}>Sanctioned Amount</Text>
                <Text style={[styles.amtVal, { color: '#059669' }]}>
                  ₹{c.initialSanctionedAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.amountBox}>
                <Text style={styles.amtLabel}>Patient Co-Pay ({c.copayPercent}%)</Text>
                <Text style={[styles.amtVal, { color: '#DC2626' }]}>
                  ₹{c.patientCoPayShare.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Query or Remarks */}
            {c.queryDetails && (
              <View style={styles.queryBox}>
                <ShieldAlert size={14} color="#DC2626" />
                <Text style={styles.queryText}>{c.queryDetails}</Text>
              </View>
            )}

            {c.remarks && !c.queryDetails && (
              <Text style={styles.remarksText}>Note: {c.remarks}</Text>
            )}

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.openCalcBtn}
                onPress={() => {
                  setEstBill(String(c.requestedAmount));
                  setCopayInput(String(c.copayPercent));
                  setDeductibleInput(String(c.deductible));
                  setCalcVisible(true);
                }}
              >
                <Calculator size={13} color="#059669" />
                <Text style={styles.openCalcBtnText}>Co-Pay Audit</Text>
              </TouchableOpacity>

              {c.status === 'Cashless Approved' && (
                <View style={styles.approvedTag}>
                  <CheckCircle2 size={13} color="#059669" />
                  <Text style={styles.approvedTagText}>Cashless Sanction Ready</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Patient Co-Pay Calculator Modal */}
      <Modal visible={calcVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Patient Co-Pay & Cashless Calculator</Text>
                <Text style={styles.modalSub}>IRDAI Cashless & Deductible Splitter</Text>
              </View>
              <TouchableOpacity onPress={() => setCalcVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.calcForm}>
              <Text style={styles.inputLabel}>Total Estimated Hospital Bill (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={estBill}
                onChangeText={setEstBill}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Co-Pay Policy (%)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={copayInput}
                    onChangeText={setCopayInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Deductible / Non-Medical (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={deductibleInput}
                    onChangeText={setDeductibleInput}
                  />
                </View>
              </View>
            </View>

            {/* Calculated Breakdown Display */}
            <View style={styles.calcResultsBox}>
              <Text style={styles.calcResultsTitle}>Computed Liability Split</Text>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Insurance Sanction Share:</Text>
                <Text style={styles.splitTpaVal}>
                  ₹ {insuranceSanctionShare.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Co-Pay Amount ({copayPct}%):</Text>
                <Text style={styles.splitVal}>₹ {patientCopayAmt.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Policy Deductible:</Text>
                <Text style={styles.splitVal}>₹ {dedNum.toLocaleString('en-IN')}</Text>
              </View>

              <View style={[styles.splitRow, styles.splitTotalRow]}>
                <Text style={styles.splitTotalLabel}>Total Patient Out-of-Pocket:</Text>
                <Text style={styles.splitTotalVal}>
                  ₹ {totalPatientOutOfPocket.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setCalcVisible(false)}>
              <Text style={styles.closeModalBtnText}>Apply to Billing Worksheet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Pre-Auth Submission Modal */}
      <Modal visible={newPreAuthVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Pre-Authorization Request</Text>
                <Text style={styles.modalSub}>Submit Electronic Cashless Claim to TPA</Text>
              </View>
              <TouchableOpacity onPress={() => setNewPreAuthVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={styles.inputLabel}>Patient Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ramasamy K."
                value={newPatient}
                onChangeText={setNewPatient}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Patient UHID</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. KZN-2026-0001"
                value={newUhid}
                onChangeText={setNewUhid}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Insurance / TPA Provider</Text>
              <View style={styles.tpaPillRow}>
                {['Star Health', 'Medi Assist', 'HDFC ERGO', 'Care Health'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tpaPill, newTpa.includes(t) && styles.tpaPillActive]}
                    onPress={() => setNewTpa(t)}
                  >
                    <Text style={[styles.tpaPillText, newTpa.includes(t) && styles.tpaPillTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Policy / TPA Member ID</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. POL-9928172"
                value={newPolicy}
                onChangeText={setNewPolicy}
              />

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Estimated Treatment Cost (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="e.g. 75000"
                value={newAmount}
                onChangeText={setNewAmount}
              />
            </ScrollView>

            <TouchableOpacity style={styles.submitClaimBtn} onPress={handleCreatePreAuth}>
              <ShieldCheck size={18} color="#fff" />
              <Text style={styles.submitClaimBtnText}>Transmit Pre-Auth to TPA Gateway</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  calcHeaderBtn: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addBtn: {
    backgroundColor: '#059669',
    padding: 8,
    borderRadius: 8,
  },
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
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  claimCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  claimNo: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  admBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  admBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  uhidText: { fontSize: 11, color: '#64748B' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillApproved: { backgroundColor: '#D1FAE5' },
  pillQuery: { backgroundColor: '#FEE2E2' },
  pillPending: { backgroundColor: '#FEF3C7' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  textGreen: { color: '#065F46' },
  textRed: { color: '#DC2626' },
  textAmber: { color: '#92400E' },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  tpaText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  policyNoText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountBox: { alignItems: 'center' },
  amtLabel: { fontSize: 10, color: '#64748B' },
  amtVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  queryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  queryText: { fontSize: 11, color: '#991B1B', flex: 1 },
  remarksText: { fontSize: 11, color: '#64748B', marginTop: 8, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  openCalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  openCalcBtnText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  approvedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  approvedTagText: { fontSize: 11, color: '#059669', fontWeight: '700' },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  calcForm: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  calcResultsBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  calcResultsTitle: { fontSize: 12, fontWeight: '800', color: '#065F46', marginBottom: 4 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  splitLabel: { fontSize: 11, color: '#047857' },
  splitTpaVal: { fontSize: 13, fontWeight: '800', color: '#059669' },
  splitVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  splitTotalRow: { borderTopWidth: 1, borderTopColor: '#A7F3D0', paddingTop: 6, marginTop: 4 },
  splitTotalLabel: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  splitTotalVal: { fontSize: 15, fontWeight: '900', color: '#DC2626' },
  closeModalBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  tpaPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tpaPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tpaPillActive: { backgroundColor: '#ECFDF5', borderColor: '#059669' },
  tpaPillText: { fontSize: 11, color: '#475569' },
  tpaPillTextActive: { color: '#059669', fontWeight: '700' },
  submitClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 14,
    gap: 8,
  },
  submitClaimBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

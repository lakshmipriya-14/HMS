import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  QrCode,
  Building,
  Printer,
  ChevronRight,
  Receipt,
  Download,
  AlertCircle,
  X,
  Stethoscope,
  Pill,
  FlaskConical,
  Scan,
  BedDouble,
} from 'lucide-react-native';
import { downloadFile } from '../../services/downloadHelper';

interface PatientInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  type: 'OPD Consultation' | 'IPD Stay & Surgery' | 'Pharmacy' | 'Diagnostics';
  department: string;
  doctor: string;
  breakdown: {
    consultation: number;
    pharmacy: number;
    laboratory: number;
    radiology: number;
    ward: number;
  };
  totalAmount: number;
  advanceDeducted: number;
  tpaApproved: number;
  netPayable: number;
  status: 'Pending' | 'Paid';
  paymentMode?: string;
  transactionRef?: string;
}

interface PatientClaim {
  id: string;
  claimId: string;
  tpaName: string;
  policyNo: string;
  hospitalAdmissionNo: string;
  totalClaimAmount: number;
  sanctionedAmount: number;
  patientCopayShare: number;
  currentStage: 1 | 2 | 3 | 4; // 1: Pre-Auth Requested, 2: Under Scrutiny, 3: Cashless Sanctioned, 4: Final Settlement
  stageTitle: string;
  statusBadge: 'Approved' | 'In Progress' | 'Query';
  lastUpdate: string;
  tpaHelpline: string;
}

const INVOICES: PatientInvoice[] = [
  {
    id: 'p-inv-1',
    invoiceNo: 'INV-2026-081',
    date: 'Today, 24 Nov 2026',
    type: 'OPD Consultation',
    department: 'Cardiology',
    doctor: 'Dr. Senthil Nathan',
    breakdown: {
      consultation: 600,
      pharmacy: 450,
      laboratory: 350,
      radiology: 400,
      ward: 0,
    },
    totalAmount: 1800,
    advanceDeducted: 0,
    tpaApproved: 0,
    netPayable: 1800,
    status: 'Pending',
  },
  {
    id: 'p-inv-2',
    invoiceNo: 'INV-2026-064',
    date: '20 Nov 2026',
    type: 'Pharmacy',
    department: 'Outpatient Pharmacy',
    doctor: 'Dr. Meenakshi Sundaram',
    breakdown: {
      consultation: 0,
      pharmacy: 1250,
      laboratory: 0,
      radiology: 0,
      ward: 0,
    },
    totalAmount: 1250,
    advanceDeducted: 0,
    tpaApproved: 0,
    netPayable: 1250,
    status: 'Paid',
    paymentMode: 'UPI (GPay)',
    transactionRef: 'UPI-894028472910',
  },
  {
    id: 'p-inv-3',
    invoiceNo: 'INV-2026-042',
    date: '19 Nov 2026',
    type: 'IPD Stay & Surgery',
    department: 'Cardiothoracic Surgery',
    doctor: 'Dr. Rajesh Kannan',
    breakdown: {
      consultation: 15000,
      pharmacy: 38000,
      laboratory: 12000,
      radiology: 25000,
      ward: 55000,
    },
    totalAmount: 145000,
    advanceDeducted: 25000,
    tpaApproved: 110000,
    netPayable: 10000,
    status: 'Paid',
    paymentMode: 'Credit Card',
    transactionRef: 'CARD-TXN-402911',
  },
];

const CLAIMS: PatientClaim[] = [
  {
    id: 'clm-01',
    claimId: 'CLM-STAR-2026-904',
    tpaName: 'Star Health & Allied Insurance',
    policyNo: 'STAR-IND-8849204',
    hospitalAdmissionNo: 'ADM-2026-091',
    totalClaimAmount: 145000,
    sanctionedAmount: 110000,
    patientCopayShare: 10000,
    currentStage: 3,
    stageTitle: 'Cashless Sanction Issued (Pre-Auth Approved)',
    statusBadge: 'Approved',
    lastUpdate: 'Today 09:30 AM',
    tpaHelpline: '1800 425 2255',
  },
  {
    id: 'clm-02',
    claimId: 'CLM-MEDI-2026-118',
    tpaName: 'Medi Assist TPA / ICICI Lombard',
    policyNo: 'MED-CORP-948271',
    hospitalAdmissionNo: 'ADM-2026-052',
    totalClaimAmount: 82000,
    sanctionedAmount: 82000,
    patientCopayShare: 0,
    currentStage: 4,
    stageTitle: 'Final Cashless Settlement Voucher Received',
    statusBadge: 'Approved',
    lastUpdate: '23 Nov 2026',
    tpaHelpline: '1800 419 1155',
  },
];

export default function PatientBillingScreen() {
  const [activeTab, setActiveTab] = useState<'BILLS' | 'CLAIMS'>('BILLS');
  const [invoices, setInvoices] = useState<PatientInvoice[]>(INVOICES);

  // Online Pay Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoice | null>(null);
  const [payMode, setPayMode] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [upiVpa, setUpiVpa] = useState('muthuvel@okhdfcbank');
  const [paying, setPaying] = useState(false);

  // Receipt Modal
  const [receiptInv, setReceiptInv] = useState<PatientInvoice | null>(null);

  const handlePayNow = () => {
    if (!selectedInvoice) return;
    setPaying(true);

    setTimeout(() => {
      const ref =
        payMode === 'UPI'
          ? `UPI-PAY-${Math.floor(100000000000 + Math.random() * 900000000000)}`
          : `CARD-ONLINE-${Math.floor(100000 + Math.random() * 900000)}`;

      const updated: PatientInvoice = {
        ...selectedInvoice,
        status: 'Paid',
        paymentMode: payMode,
        transactionRef: ref,
      };

      setInvoices((prev) => prev.map((i) => (i.id === selectedInvoice.id ? updated : i)));
      setPaying(false);
      setSelectedInvoice(null);
      setReceiptInv(updated);
    }, 1200);
  };

  const handleDownloadReceipt = (inv: PatientInvoice) => {
    downloadFile({
      filename: `Receipt_${inv.invoiceNo}.txt`,
      content: `KIZUNA MULTISPECIALITY HOSPITALS\nOFFICIAL PAYMENT RECEIPT\nInvoice No: ${inv.invoiceNo}\nAmount Settled: Rs. ${inv.netPayable}\nPayment Mode: ${inv.paymentMode || 'Online'}\nTransaction Ref: ${inv.transactionRef || 'N/A'}\nDate: ${inv.date}\nStatus: PAID IN FULL`,
      mimeType: 'text/plain',
    });
    Alert.alert('Receipt Downloaded', `Receipt for invoice ${inv.invoiceNo} saved.`);
  };

  return (
    <View style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BILLS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('BILLS')}
        >
          <CreditCard size={16} color={activeTab === 'BILLS' ? '#38845A' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'BILLS' && styles.tabTextActive]}>
            Hospital Bills (P10)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CLAIMS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('CLAIMS')}
        >
          <ShieldCheck size={16} color={activeTab === 'CLAIMS' ? '#38845A' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'CLAIMS' && styles.tabTextActive]}>
            TPA Insurance Tracker (P11)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ================= P10: ONLINE BILL PAYMENT PORTAL ================= */}
        {activeTab === 'BILLS' && (
          <View>
            <Text style={styles.sectionHeading}>Online Bill Payments & Receipts</Text>
            <Text style={styles.sectionSub}>Review itemized hospital service charges and settle securely</Text>

            {invoices.map((inv) => (
              <View key={inv.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
                    <Text style={styles.invType}>{inv.type}</Text>
                  </View>
                  <Text style={styles.invAmount}>₹{inv.netPayable.toLocaleString('en-IN')}</Text>
                </View>

                <Text style={styles.invMeta}>
                  {inv.doctor} • {inv.department} • {inv.date}
                </Text>

                {/* Service Itemized Breakdown */}
                <View style={styles.breakdownBox}>
                  <Text style={styles.breakdownTitle}>Service Breakup</Text>
                  <View style={styles.breakdownGrid}>
                    {inv.breakdown.consultation > 0 && (
                      <View style={styles.chargeRow}>
                        <Text style={styles.chargeName}>Doctor Consultation</Text>
                        <Text style={styles.chargeAmt}>₹{inv.breakdown.consultation}</Text>
                      </View>
                    )}
                    {inv.breakdown.pharmacy > 0 && (
                      <View style={styles.chargeRow}>
                        <Text style={styles.chargeName}>Pharmacy Medicines</Text>
                        <Text style={styles.chargeAmt}>₹{inv.breakdown.pharmacy}</Text>
                      </View>
                    )}
                    {inv.breakdown.laboratory > 0 && (
                      <View style={styles.chargeRow}>
                        <Text style={styles.chargeName}>Pathology / Lab Tests</Text>
                        <Text style={styles.chargeAmt}>₹{inv.breakdown.laboratory}</Text>
                      </View>
                    )}
                    {inv.breakdown.radiology > 0 && (
                      <View style={styles.chargeRow}>
                        <Text style={styles.chargeName}>Radiology & Scans</Text>
                        <Text style={styles.chargeAmt}>₹{inv.breakdown.radiology}</Text>
                      </View>
                    )}
                    {inv.breakdown.ward > 0 && (
                      <View style={styles.chargeRow}>
                        <Text style={styles.chargeName}>Ward Bed & Nursing</Text>
                        <Text style={styles.chargeAmt}>₹{inv.breakdown.ward}</Text>
                      </View>
                    )}
                  </View>

                  {(inv.advanceDeducted > 0 || inv.tpaApproved > 0) && (
                    <View style={styles.creditsRow}>
                      {inv.advanceDeducted > 0 && (
                        <Text style={styles.creditText}>Adv Deducted: -₹{inv.advanceDeducted}</Text>
                      )}
                      {inv.tpaApproved > 0 && (
                        <Text style={styles.creditText}>TPA Approved: -₹{inv.tpaApproved}</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Status & Actions */}
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusPill,
                      inv.status === 'Paid' ? styles.pillPaid : styles.pillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        inv.status === 'Paid' ? styles.textPaid : styles.textPending,
                      ]}
                    >
                      {inv.status}
                    </Text>
                  </View>

                  {inv.status === 'Paid' ? (
                    <TouchableOpacity
                      style={styles.receiptActionBtn}
                      onPress={() => setReceiptInv(inv)}
                    >
                      <Receipt size={14} color="#38845A" />
                      <Text style={styles.receiptActionText}>View Receipt</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.payActionBtn}
                      onPress={() => setSelectedInvoice(inv)}
                    >
                      <CreditCard size={14} color="#fff" />
                      <Text style={styles.payActionText}>Pay Online Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= P11: TPA INSURANCE CASHLESS TRACKER ================= */}
        {activeTab === 'CLAIMS' && (
          <View>
            <Text style={styles.sectionHeading}>TPA Insurance Cashless Claim Tracker</Text>
            <Text style={styles.sectionSub}>Live status of electronic pre-auth approvals and cashless hospital settlements</Text>

            {CLAIMS.map((clm) => (
              <View key={clm.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.claimIdText}>{clm.claimId}</Text>
                    <Text style={styles.tpaNameText}>{clm.tpaName}</Text>
                    <Text style={styles.policyNoText}>Policy #: {clm.policyNo}</Text>
                  </View>
                  <View style={styles.pillApproved}>
                    <Text style={styles.textApproved}>{clm.statusBadge}</Text>
                  </View>
                </View>

                {/* 4-Stage Stepper */}
                <View style={styles.claimStepperBox}>
                  <Text style={styles.stepperTitle}>{clm.stageTitle}</Text>
                  <View style={styles.stepperRow}>
                    <View style={[styles.stepCircle, clm.currentStage >= 1 && styles.stepCircleActive]}>
                      <Text style={styles.stepNum}>1</Text>
                    </View>
                    <View style={[styles.stepLine, clm.currentStage >= 2 && styles.stepLineActive]} />
                    <View style={[styles.stepCircle, clm.currentStage >= 2 && styles.stepCircleActive]}>
                      <Text style={styles.stepNum}>2</Text>
                    </View>
                    <View style={[styles.stepLine, clm.currentStage >= 3 && styles.stepLineActive]} />
                    <View style={[styles.stepCircle, clm.currentStage >= 3 && styles.stepCircleActive]}>
                      <Text style={styles.stepNum}>3</Text>
                    </View>
                    <View style={[styles.stepLine, clm.currentStage >= 4 && styles.stepLineActive]} />
                    <View style={[styles.stepCircle, clm.currentStage >= 4 && styles.stepCircleActive]}>
                      <Text style={styles.stepNum}>4</Text>
                    </View>
                  </View>
                  <View style={styles.stageLabelRow}>
                    <Text style={styles.stageLabel}>Pre-Auth</Text>
                    <Text style={styles.stageLabel}>Scrutiny</Text>
                    <Text style={styles.stageLabel}>Sanctioned</Text>
                    <Text style={styles.stageLabel}>Settled</Text>
                  </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.claimFinanceGrid}>
                  <View style={styles.claimFinItem}>
                    <Text style={styles.cFinLabel}>Claim Amount</Text>
                    <Text style={styles.cFinVal}>₹{clm.totalClaimAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.claimFinItem}>
                    <Text style={styles.cFinLabel}>TPA Sanctioned</Text>
                    <Text style={[styles.cFinVal, { color: '#059669' }]}>
                      ₹{clm.sanctionedAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.claimFinItem}>
                    <Text style={styles.cFinLabel}>Patient Co-Pay</Text>
                    <Text style={[styles.cFinVal, { color: '#DC2626' }]}>
                      ₹{clm.patientCopayShare.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.claimFooterRow}>
                  <Text style={styles.updateText}>Last updated: {clm.lastUpdate}</Text>
                  <Text style={styles.helplineText}>TPA Helpline: {clm.tpaHelpline}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pay Online Modal (P10) */}
      <Modal visible={!!selectedInvoice} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Online Hospital Payment</Text>
                <Text style={styles.modalSub}>{selectedInvoice?.invoiceNo} • {selectedInvoice?.type}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.payAmountBanner}>
              <Text style={styles.payAmountLabel}>Total Amount Due</Text>
              <Text style={styles.payAmountVal}>
                ₹ {selectedInvoice?.netPayable.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Mode Selector */}
            <Text style={styles.modalInputLabel}>Select Payment Method</Text>
            <View style={styles.payModeRow}>
              {(['UPI', 'Card', 'NetBanking'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.payModePill, payMode === m && styles.payModePillActive]}
                  onPress={() => setPayMode(m)}
                >
                  <Text style={[styles.payModeText, payMode === m && styles.payModeTextActive]}>
                    {m === 'UPI' ? 'UPI / GPay' : m === 'Card' ? 'Credit/Debit Card' : 'Net Banking'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {payMode === 'UPI' && (
              <View style={styles.modeFormBox}>
                <View style={styles.upiQrBox}>
                  <QrCode size={55} color="#0F172A" />
                  <Text style={styles.upiQrText}>Scan with any UPI App or Enter VPA</Text>
                </View>
                <Text style={styles.fieldLabel}>Your UPI ID</Text>
                <TextInput style={styles.modalInput} value={upiVpa} onChangeText={setUpiVpa} />
              </View>
            )}

            {payMode === 'Card' && (
              <View style={styles.modeFormBox}>
                <Text style={styles.fieldLabel}>Card Number</Text>
                <TextInput style={styles.modalInput} placeholder="4111 2222 3333 4444" keyboardType="numeric" />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="MM/YY" />
                  <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="CVV" secureTextEntry />
                </View>
              </View>
            )}

            {payMode === 'NetBanking' && (
              <View style={styles.modeFormBox}>
                <Text style={styles.fieldLabel}>Choose Bank</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['HDFC', 'SBI', 'ICICI', 'Axis'].map((b) => (
                    <TouchableOpacity key={b} style={styles.bankPill}>
                      <Text style={styles.bankPillText}>{b} Bank</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.confirmPayBtn} onPress={handlePayNow} disabled={paying}>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={styles.confirmPayBtnText}>
                {paying ? 'Processing Payment...' : `Pay ₹${selectedInvoice?.netPayable.toLocaleString('en-IN')} Securely`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Official Receipt Modal */}
      <Modal visible={!!receiptInv} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.receiptHospital}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
                <Text style={styles.receiptSub}>Patient Payment Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptInv(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptStampBox}>
              <CheckCircle2 size={24} color="#059669" />
              <Text style={styles.receiptStampText}>PAID & SETTLED</Text>
            </View>

            <View style={styles.receiptDetailsTable}>
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Invoice Number:</Text>
                <Text style={styles.rVal}>{receiptInv?.invoiceNo}</Text>
              </View>
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Description:</Text>
                <Text style={styles.rVal}>{receiptInv?.type}</Text>
              </View>
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Payment Method:</Text>
                <Text style={styles.rVal}>{receiptInv?.paymentMode || 'Online Payment'}</Text>
              </View>
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Transaction Ref:</Text>
                <Text style={styles.rVal}>{receiptInv?.transactionRef || 'N/A'}</Text>
              </View>
              <View style={styles.rRow}>
                <Text style={styles.rLabel}>Amount Settled:</Text>
                <Text style={[styles.rVal, { color: '#059669', fontWeight: '900' }]}>
                  ₹{receiptInv?.netPayable.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadReceiptBtn}
              onPress={() => receiptInv && handleDownloadReceipt(receiptInv)}
            >
              <Download size={16} color="#fff" />
              <Text style={styles.downloadReceiptBtnText}>Download Receipt File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabBtnActive: { backgroundColor: '#EAF5ED' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#38845A', fontWeight: '800' },
  contentScroll: { padding: 16 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceNo: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  invType: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  invAmount: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  invMeta: { fontSize: 11, color: '#64748B', marginTop: 4 },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  breakdownTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  breakdownGrid: { gap: 4 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeName: { fontSize: 11, color: '#475569' },
  chargeAmt: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  creditsRow: { flexDirection: 'row', gap: 12, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  creditText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillPending: { backgroundColor: '#FEF3C7' },
  pillPaid: { backgroundColor: '#D1FAE5' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  textPending: { color: '#B45309' },
  textPaid: { color: '#047857' },
  receiptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  receiptActionText: { color: '#38845A', fontSize: 11, fontWeight: '700' },
  payActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38845A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  payActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  claimIdText: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  tpaNameText: { fontSize: 13, fontWeight: '700', color: '#38845A', marginTop: 2 },
  policyNoText: { fontSize: 11, color: '#64748B', marginTop: 1 },
  pillApproved: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  textApproved: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  claimStepperBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 12 },
  stepperTitle: { fontSize: 11, fontWeight: '800', color: '#334155', marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#059669' },
  stepNum: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stepLine: { flex: 1, height: 3, backgroundColor: '#E2E8F0' },
  stepLineActive: { backgroundColor: '#059669' },
  stageLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  stageLabel: { fontSize: 9, color: '#64748B', fontWeight: '600' },
  claimFinanceGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10, marginTop: 10 },
  claimFinItem: { alignItems: 'center' },
  cFinLabel: { fontSize: 10, color: '#64748B' },
  cFinVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  claimFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  updateText: { fontSize: 10, color: '#94A3B8' },
  helplineText: { fontSize: 10, color: '#38845A', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  payAmountBanner: { backgroundColor: '#38845A', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  payAmountLabel: { color: '#EAF5ED', fontSize: 11, fontWeight: '600' },
  payAmountVal: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
  modalInputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  payModeRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  payModePill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC' },
  payModePillActive: { borderColor: '#38845A', backgroundColor: '#EAF5ED' },
  payModeText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  payModeTextActive: { color: '#38845A', fontWeight: '800' },
  modeFormBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 16 },
  upiQrBox: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  upiQrText: { fontSize: 11, color: '#64748B' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 4 },
  modalInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  bankPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1' },
  bankPillText: { fontSize: 11, color: '#334155' },
  confirmPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38845A', borderRadius: 10, paddingVertical: 14, gap: 8 },
  confirmPayBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  receiptHospital: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  receiptSub: { fontSize: 10, color: '#64748B' },
  receiptStampBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6, marginVertical: 10 },
  receiptStampText: { color: '#059669', fontWeight: '900', fontSize: 12 },
  receiptDetailsTable: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, gap: 6 },
  rRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rLabel: { fontSize: 11, color: '#64748B' },
  rVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  downloadReceiptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 6 },
  downloadReceiptBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

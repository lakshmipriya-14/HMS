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
  CreditCard,
  CheckCircle2,
  Search,
  Filter,
  IndianRupee,
  Receipt,
  QrCode,
  Smartphone,
  Building,
  RefreshCw,
  X,
  Printer,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Scan,
  BedDouble,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

interface ServiceItem {
  name: string;
  category: 'Consultation' | 'Pharmacy' | 'Laboratory' | 'Radiology' | 'Ward';
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  patientName: string;
  uhid: string;
  encounterType: 'OPD' | 'IPD' | 'Emergency';
  date: string;
  doctorName: string;
  department: string;
  wardInfo?: string;
  breakdown: {
    consultation: number;
    pharmacy: number;
    laboratory: number;
    radiology: number;
    ward: number;
  };
  totalAmount: number;
  advancePaid: number;
  insuranceCovered: number;
  netPayable: number;
  status: 'Pending' | 'Paid' | 'Partially Paid' | 'Insurance Approved' | 'Cancelled';
  paidAt?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Card' | 'Net Banking';
  transactionRef?: string;
}

export default function BillingCashierScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SETTLED' | 'INSURANCE'>('ALL');

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Net Banking'>('UPI');
  const [cashTendered, setCashTendered] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setInvoiceError(false);
    try {
      const res = await apiRequest<any[]>('/billing/invoices');
      if (!Array.isArray(res.data)) throw new Error('Invalid invoice response');
      const statuses = { PENDING: 'Pending', PAID: 'Paid', PARTIALLY_PAID: 'Partially Paid', CANCELLED: 'Cancelled' } as const;
      const modes = { CASH: 'Cash', UPI: 'UPI', CARD: 'Card', NET_BANKING: 'Net Banking' } as const;
      setInvoices(res.data.map((inv) => {
        const doctor = inv.appointment?.doctor ?? inv.admission?.admittingDoctor;
        const clinician = doctor?.employee?.user;
        const payment = (inv.payments ?? []).filter((row: any) => row.paymentStatus === 'SUCCESS')
          .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))[0];
        const approvedClaim = inv.claims?.find((claim: { status: string }) => claim.status === 'APPROVED');
        const charges = (category: string) => (inv.items ?? []).filter((item: any) => item.category === category)
          .reduce((total: number, item: any) => total + Number(item.totalPrice), 0);
        return {
          id: inv.id, invoiceNo: inv.invoiceNumber,
          patientName: `${inv.patient.firstName} ${inv.patient.lastName}`, uhid: inv.patient.uhid,
          encounterType: inv.admission ? 'IPD' : inv.appointment?.type === 'EMERGENCY' ? 'Emergency' : 'OPD',
          date: new Date(inv.createdAt).toLocaleString(),
          doctorName: clinician ? `${clinician.firstName} ${clinician.lastName}` : 'No clinician linked',
          department: doctor?.department.name ?? '',
          breakdown: { consultation: charges('CONSULTATION'), pharmacy: charges('PHARMACY'),
            laboratory: charges('LAB'), radiology: charges('RADIOLOGY'), ward: charges('ROOM') },
          totalAmount: Number(inv.totalAmount), advancePaid: Number(inv.paidAmount),
          insuranceCovered: Number(approvedClaim?.approvedAmount ?? 0), netPayable: Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
          status: approvedClaim && ['PENDING', 'PARTIALLY_PAID'].includes(inv.status) ? 'Insurance Approved'
            : statuses[inv.status as keyof typeof statuses] ?? inv.status,
          paidAt: payment ? new Date(payment.createdAt).toLocaleString() : undefined,
          paymentMode: modes[payment?.paymentMethod as keyof typeof modes], transactionRef: payment?.transactionReference,
        };
      }));
    } catch {
      setInvoices([]);
      setInvoiceError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCashTendered(String(inv.netPayable));
    setPaymentMode('Cash');
    setPaymentReference('');
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setProcessingPayment(true);

    if (selectedInvoice.netPayable <= 0 || (paymentMode === 'Cash' && Number(cashTendered) < selectedInvoice.netPayable)
      || (paymentMode !== 'Cash' && !paymentReference.trim())) {
      setProcessingPayment(false);
      Alert.alert('Payment details required', 'Enter the cash received or the verified transaction reference.');
      return;
    }
    const methods = { Cash: 'CASH', UPI: 'UPI', Card: 'CARD', 'Net Banking': 'NET_BANKING' } as const;
    try {
      const response = await apiRequest<any>(`/billing/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        body: {
          invoiceId: selectedInvoice.id, amount: selectedInvoice.netPayable,
          paymentMethod: methods[paymentMode], transactionReference: paymentReference.trim() || undefined,
        },
      });
      const saved = response.data;
      if (saved?.status !== 'PAID') throw new Error('The API did not confirm a fully paid invoice.');
      const updatedInvoice: Invoice = { ...selectedInvoice, status: 'Paid',
        advancePaid: Number(saved.paidAmount), netPayable: 0, paymentMode,
        paidAt: new Date(saved.updatedAt).toLocaleString(), transactionRef: paymentReference.trim() || undefined };
      setSelectedInvoice(null);
      setReceiptInvoice(updatedInvoice);
      await fetchInvoices();
    } catch (error) {
      setSelectedInvoice(null);
      Alert.alert('Payment could not be confirmed', error instanceof Error ? error.message : 'Refresh the invoice before retrying.');
      await fetchInvoices();
    } finally {
      setProcessingPayment(false);
    }

  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.uhid.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (activeTab === 'PENDING') return inv.status === 'Pending';
      if (activeTab === 'SETTLED') return inv.status === 'Paid';
      if (activeTab === 'INSURANCE') return inv.status === 'Insurance Approved';
      return true;
    });
  }, [invoices, search, activeTab]);

  return (
    <View style={styles.container}>
      {/* Top Header & Metrics */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Hospital Billing & Cashier Desk</Text>
            <Text style={styles.sub}>Central Revenue, Multi-Mode POS & Discharge Billing</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchInvoices}>
            <RefreshCw size={16} color="#1565C0" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Invoice No, UHID, or Patient name..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {(['ALL', 'PENDING', 'SETTLED', 'INSURANCE'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'ALL'
                  ? `All (${invoices.length})`
                  : tab === 'PENDING'
                  ? `Pending (${invoices.filter((i) => i.status === 'Pending').length})`
                  : tab === 'SETTLED'
                  ? `Settled (${invoices.filter((i) => i.status === 'Paid').length})`
                  : `TPA (${invoices.filter((i) => i.status === 'Insurance Approved').length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List of Invoices */}
      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 30 }}>
        {loading && <ActivityIndicator size="small" color="#1565C0" style={{ marginVertical: 12 }} />}
        {invoiceError && <Text accessibilityRole="alert" onPress={() => void fetchInvoices()}>Could not load invoices. Tap to retry.</Text>}
        {loading && <ActivityIndicator size="small" color="#00897B" style={{ marginVertical: 12 }} />}

        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySub}>No bills match your active filters or search keyword.</Text>
          </View>
        ) : (
          filteredInvoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.invoiceIdBadge}>
                  <Text style={styles.invoiceIdText}>{inv.invoiceNo}</Text>
                  <View style={[styles.encBadge, inv.encounterType === 'IPD' ? styles.encIpd : styles.encOpd]}>
                    <Text style={styles.encBadgeText}>{inv.encounterType}</Text>
                  </View>
                </View>
                <Text style={styles.netAmount}>₹ {inv.netPayable.toLocaleString('en-IN')}</Text>
              </View>

              {/* Patient and Doctor info */}
              <View style={styles.metaRow}>
                <Text style={styles.patientName}>{inv.patientName}</Text>
                <Text style={styles.uhidText}>{inv.uhid}</Text>
              </View>
              <Text style={styles.doctorInfo}>
                {inv.doctorName} • {inv.department}
                {inv.wardInfo ? ` • ${inv.wardInfo}` : ''}
              </Text>
              <Text style={styles.dateInfo}>{inv.date}</Text>

              {/* Consolidated 5-Category Charge Breakdown */}
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownTitle}>Consolidated Service Charges</Text>
                <View style={styles.breakdownGrid}>
                  <View style={styles.chargeItem}>
                    <Stethoscope size={13} color="#1565C0" />
                    <Text style={styles.chargeLabel}>Consultation</Text>
                    <Text style={styles.chargeVal}>₹{inv.breakdown.consultation}</Text>
                  </View>
                  <View style={styles.chargeItem}>
                    <Pill size={13} color="#1565C0" />
                    <Text style={styles.chargeLabel}>Pharmacy</Text>
                    <Text style={styles.chargeVal}>₹{inv.breakdown.pharmacy}</Text>
                  </View>
                  <View style={styles.chargeItem}>
                    <FlaskConical size={13} color="#8B5CF6" />
                    <Text style={styles.chargeLabel}>Lab Tests</Text>
                    <Text style={styles.chargeVal}>₹{inv.breakdown.laboratory}</Text>
                  </View>
                  <View style={styles.chargeItem}>
                    <Scan size={13} color="#F59E0B" />
                    <Text style={styles.chargeLabel}>Radiology</Text>
                    <Text style={styles.chargeVal}>₹{inv.breakdown.radiology}</Text>
                  </View>
                  {inv.breakdown.ward > 0 && (
                    <View style={styles.chargeItem}>
                      <BedDouble size={13} color="#DC2626" />
                      <Text style={styles.chargeLabel}>Ward & Nursing</Text>
                      <Text style={styles.chargeVal}>₹{inv.breakdown.ward}</Text>
                    </View>
                  )}
                </View>

                {/* Financial Summary */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Gross: ₹{inv.totalAmount.toLocaleString('en-IN')}</Text>
                  {inv.advancePaid > 0 && (
                    <Text style={styles.summaryCredit}>Adv: -₹{inv.advancePaid.toLocaleString('en-IN')}</Text>
                  )}
                  {inv.insuranceCovered > 0 && (
                    <Text style={styles.summaryTpa}>TPA: -₹{inv.insuranceCovered.toLocaleString('en-IN')}</Text>
                  )}
                </View>
              </View>

              {/* Action and Status Footer */}
              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.statusPill,
                    inv.status === 'Paid'
                      ? styles.statusPaid
                      : inv.status === 'Insurance Approved'
                      ? styles.statusInsurance
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      inv.status === 'Paid'
                        ? styles.textPaid
                        : inv.status === 'Insurance Approved'
                        ? styles.textInsurance
                        : styles.textPending,
                    ]}
                  >
                    {inv.status}
                  </Text>
                </View>

                <View style={styles.actionsGroup}>
                  {inv.status === 'Paid' ? (
                    <TouchableOpacity style={styles.receiptBtn} onPress={() => setReceiptInvoice(inv)}>
                      <Receipt size={14} color="#1565C0" />
                      <Text style={styles.receiptBtnText}>View Receipt</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.payBtn} onPress={() => handleOpenPayment(inv)}>
                      <CreditCard size={14} color="#FFFFFF" />
                      <Text style={styles.payBtnText}>
                        Collect Payment
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Multi-Mode Payment Collection Modal */}
      <Modal visible={!!selectedInvoice} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Multi-Mode Payment Collection</Text>
                <Text style={styles.modalSub}>
                  Invoice: {selectedInvoice?.invoiceNo} • {selectedInvoice?.patientName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Total Payable Banner */}
            <View style={styles.payableBanner}>
              <Text style={styles.payableLabel}>Net Amount Due</Text>
              <Text style={styles.payableValue}>
                ₹ {selectedInvoice?.netPayable.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.inputGroupTitle}>Select Payment Channel</Text>
            <View style={styles.modeGrid}>
              {(['UPI', 'Cash', 'Card', 'Net Banking'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeCard, paymentMode === mode && styles.modeCardSelected]}
                  onPress={() => setPaymentMode(mode)}
                >
                  {mode === 'UPI' && <QrCode size={18} color={paymentMode === mode ? '#1565C0' : '#64748B'} />}
                  {mode === 'Cash' && <IndianRupee size={18} color={paymentMode === mode ? '#1565C0' : '#64748B'} />}
                  {mode === 'Card' && <CreditCard size={18} color={paymentMode === mode ? '#1565C0' : '#64748B'} />}
                  {mode === 'Net Banking' && <Building size={18} color={paymentMode === mode ? '#1565C0' : '#64748B'} />}
                  <Text style={[styles.modeText, paymentMode === mode && styles.modeTextSelected]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mode-specific Fields */}
            {paymentMode !== 'Cash' && (
              <View style={styles.paymentBox}>
                <Text style={styles.fieldLabel}>Verified transaction reference</Text>
                <TextInput style={styles.textInput} value={paymentReference} onChangeText={setPaymentReference} />
              </View>
            )}

            {paymentMode === 'Cash' && (
              <View style={styles.paymentBox}>
                <Text style={styles.fieldLabel}>Cash Tendered by Patient (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={cashTendered}
                  onChangeText={setCashTendered}
                />
                {Number(cashTendered) >= (selectedInvoice?.netPayable || 0) && (
                  <View style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Change to Return:</Text>
                    <Text style={styles.changeVal}>
                      ₹ {Number(cashTendered) - (selectedInvoice?.netPayable || 0)}
                    </Text>
                  </View>
                )}
              </View>
            )}



            {/* Confirm Payment Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleProcessPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>
                    Confirm & Record ₹{selectedInvoice?.netPayable.toLocaleString('en-IN')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Official Receipt Modal */}
      <Modal visible={!!receiptInvoice} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.receiptHospital}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
                <Text style={styles.receiptSub}>Official Tax Invoice & Cash Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptInvoice(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.receiptStamp}>
                <CheckCircle2 size={24} color="#1565C0" />
                <Text style={styles.receiptStampText}>PAYMENT SETTLED</Text>
              </View>

              <View style={styles.receiptInfoGrid}>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Invoice No:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.invoiceNo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Patient UHID:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.uhid}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Patient Name:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.patientName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Attending Doctor:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.doctorName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Payment Mode:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.paymentMode || 'UPI'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Transaction Ref:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.transactionRef || 'N/A'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.recLabel}>Paid At:</Text>
                  <Text style={styles.recVal}>{receiptInvoice?.paidAt || 'Just now'}</Text>
                </View>
              </View>

              {/* Service itemized summary */}
              <View style={styles.receiptBreakdownBox}>
                <Text style={styles.recSectionHeader}>Service Breakup</Text>
                <View style={styles.recItemRow}>
                  <Text style={styles.recItemName}>Doctor Consultation</Text>
                  <Text style={styles.recItemAmt}>₹{receiptInvoice?.breakdown.consultation}</Text>
                </View>
                <View style={styles.recItemRow}>
                  <Text style={styles.recItemName}>Pharmacy Dispensing</Text>
                  <Text style={styles.recItemAmt}>₹{receiptInvoice?.breakdown.pharmacy}</Text>
                </View>
                <View style={styles.recItemRow}>
                  <Text style={styles.recItemName}>Clinical Pathology / Lab</Text>
                  <Text style={styles.recItemAmt}>₹{receiptInvoice?.breakdown.laboratory}</Text>
                </View>
                <View style={styles.recItemRow}>
                  <Text style={styles.recItemName}>Diagnostic Radiology</Text>
                  <Text style={styles.recItemAmt}>₹{receiptInvoice?.breakdown.radiology}</Text>
                </View>
                {(receiptInvoice?.breakdown.ward || 0) > 0 && (
                  <View style={styles.recItemRow}>
                    <Text style={styles.recItemName}>Ward Bed & Nursing</Text>
                    <Text style={styles.recItemAmt}>₹{receiptInvoice?.breakdown.ward}</Text>
                  </View>
                )}
                <View style={[styles.recItemRow, styles.recTotalRow]}>
                  <Text style={styles.recTotalText}>Total Settled</Text>
                  <Text style={styles.recTotalAmt}>
                    ₹{receiptInvoice?.netPayable.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => {
                Alert.alert('Print Receipt', `Receipt ${receiptInvoice?.invoiceNo} sent to Counter Thermal Printer 02`);
                setReceiptInvoice(null);
              }}
            >
              <Printer size={16} color="#FFFFFF" />
              <Text style={styles.printBtnText}>Print Official Receipt</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#183153' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E0F2F1',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#183153' },
  tabsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: { backgroundColor: '#1565C0' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  listContainer: { padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptySub: { fontSize: 12, color: '#94A3B8', textAlign: 'center', maxWidth: 260 },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invoiceIdText: { fontSize: 14, fontWeight: '800', color: '#183153' },
  encBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  encOpd: { backgroundColor: '#E8F1FC' },
  encIpd: { backgroundColor: '#E8F1FC' },
  encBadgeText: { fontSize: 10, fontWeight: '800', color: '#0D47A1' },
  netAmount: { fontSize: 18, fontWeight: '900', color: '#183153' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#183153' },
  uhidText: { fontSize: 12, fontWeight: '700', color: '#1565C0', fontFamily: 'monospace' },
  doctorInfo: { fontSize: 12, color: '#475569', marginTop: 2 },
  dateInfo: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  breakdownBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  breakdownTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chargeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  chargeLabel: { fontSize: 11, color: '#475569' },
  chargeVal: { fontSize: 11, fontWeight: '700', color: '#183153' },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  summaryCredit: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  summaryTpa: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
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
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusInsurance: { backgroundColor: '#E8F1FC' },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  textPending: { color: '#F59E0B' },
  textPaid: { color: '#00897B' },
  textInsurance: { color: '#0D47A1' },
  actionsGroup: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#B2DFDB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  receiptBtnText: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#183153' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  payableBanner: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  payableLabel: { color: '#B2DFDB', fontSize: 12, fontWeight: '600' },
  payableValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 2 },
  inputGroupTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  modeGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
  },
  modeCardSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#E0F2F1',
  },
  modeText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  modeTextSelected: { color: '#1565C0', fontWeight: '800' },
  paymentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  qrPlaceholder: { alignItems: 'center', paddingVertical: 10, gap: 6 },
  qrPrompt: { fontSize: 12, fontWeight: '600', color: '#1565C0' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#183153',
  },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  changeLabel: { fontSize: 12, color: '#64748B' },
  changeVal: { fontSize: 14, fontWeight: '800', color: '#1565C0' },
  helperText: { fontSize: 11, color: '#64748B', marginTop: 6 },
  bankOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bankPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankPillActive: { borderColor: '#1565C0', backgroundColor: '#E0F2F1' },
  bankPillText: { fontSize: 11, color: '#475569' },
  bankPillTextActive: { color: '#1565C0', fontWeight: '700' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  receiptHospital: { fontSize: 14, fontWeight: '900', color: '#183153' },
  receiptSub: { fontSize: 11, color: '#64748B' },
  receiptStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E0F2F1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  receiptStampText: { color: '#1565C0', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  receiptInfoGrid: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, gap: 6 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  recLabel: { fontSize: 11, color: '#64748B' },
  recVal: { fontSize: 11, fontWeight: '700', color: '#183153' },
  receiptBreakdownBox: { marginTop: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10 },
  recSectionHeader: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 },
  recItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  recItemName: { fontSize: 11, color: '#64748B' },
  recItemAmt: { fontSize: 11, fontWeight: '600', color: '#183153' },
  recTotalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 6, paddingTop: 6 },
  recTotalText: { fontSize: 13, fontWeight: '800', color: '#183153' },
  recTotalAmt: { fontSize: 15, fontWeight: '900', color: '#1565C0' },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#183153',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  printBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});


import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  CreditCard,
  Download,
  Hash,
  MapPin,
  Receipt,
  Search,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { downloadPatientReceiptPdf } from '../../services/downloadHelper';

type StatusFilter = 'ALL' | 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

interface PaymentHistoryEntry {
  id: string;
  paymentId: string;
  transactionId: string;
  invoiceId: string;
  invoiceNumber: string;
  relatedRef: string;
  hospitalName: string;
  branchName: string;
  branchLocation: string;
  branchPhone?: string;
  dateStr: string;
  timestamp: number;
  amount: string;
  invoiceTotal: string;
  invoicePaid: string;
  paymentMethod: string;
  normalizedStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  statusLabel: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  badgeStatus: string;
  hasReceipt: boolean;
  items: { description: string; quantity?: number; totalPrice: string }[];
}

function normalizePaymentStatus(rawStatus?: string): {
  normalizedStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  statusLabel: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  badgeStatus: string;
} {
  const s = String(rawStatus || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'PAID') {
    return { normalizedStatus: 'PAID', statusLabel: 'Paid', badgeStatus: 'PAID' };
  }
  if (s === 'FAILED' || s === 'CANCELLED') {
    return { normalizedStatus: 'FAILED', statusLabel: 'Failed', badgeStatus: 'FAILED' };
  }
  if (s === 'REFUNDED') {
    return { normalizedStatus: 'REFUNDED', statusLabel: 'Refunded', badgeStatus: 'INFO' };
  }
  return { normalizedStatus: 'PENDING', statusLabel: 'Pending', badgeStatus: 'PENDING' };
}

function formatPaymentDate(value?: string): { label: string; timestamp: number } {
  if (!value) return { label: 'Date unavailable', timestamp: 0 };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { label: String(value).slice(0, 10), timestamp: 0 };
  }
  const datePart = parsed.toISOString().slice(0, 10);
  const timePart = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { label: `${datePart} · ${timePart}`, timestamp: parsed.getTime() };
}

export default function PatientPaymentHistoryScreen() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-billing', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  // Build real payment transaction entries from the authenticated patient's database records
  const transactions = useMemo<PaymentHistoryEntry[]>(() => {
    const invoices = data?.invoices || [];
    const defaultHospitalName = data?.patient?.hospital?.name;
    const defaultBranch = data?.patient?.registrationBranch;

    const formatBranchLoc = (branchObj: any) =>
      [branchObj?.address, branchObj?.city, branchObj?.state].filter(Boolean).join(', ');

    const entries: PaymentHistoryEntry[] = [];

    for (const inv of invoices) {
      const invoiceNumber = inv.invoiceNumber || `INV-${String(inv.id).slice(0, 8)}`;
      const appointmentRef = inv.appointment?.appointmentNumber || inv.appointmentId;
      const admissionRef = inv.admission?.admissionNumber || inv.admissionId;
      const relatedRef = appointmentRef
        ? `Appt: ${appointmentRef}`
        : admissionRef
        ? `Admission: ${admissionRef}`
        : `Invoice: ${invoiceNumber}`;

      const items = (inv.items || []).map((it: any) => ({
        description: it.description || 'Hospital Service',
        quantity: it.quantity,
        totalPrice: String(it.totalPrice ?? inv.totalAmount ?? '0.00'),
      }));

      const invPayments = Array.isArray(inv.payments) ? inv.payments : [];

      if (invPayments.length > 0) {
        for (const p of invPayments) {
          const branchObj = p.branch || inv.branch || defaultBranch;
          const hospitalName = branchObj?.hospital?.name || defaultHospitalName || 'Hospital';
          const { label: dateStr, timestamp } = formatPaymentDate(p.createdAt || inv.createdAt);
          const { normalizedStatus, statusLabel, badgeStatus } = normalizePaymentStatus(p.paymentStatus);

          entries.push({
            id: p.id,
            paymentId: p.id,
            transactionId: p.transactionReference || p.id,
            invoiceId: inv.id,
            invoiceNumber,
            relatedRef,
            hospitalName,
            branchName: branchObj?.name || 'Branch unavailable',
            branchLocation: formatBranchLoc(branchObj),
            branchPhone: branchObj?.phone || defaultBranch?.phone,
            dateStr,
            timestamp,
            amount: String(p.amount ?? inv.paidAmount ?? inv.totalAmount ?? '0.00'),
            invoiceTotal: String(inv.totalAmount ?? p.amount ?? '0.00'),
            invoicePaid: String(inv.paidAmount ?? p.amount ?? '0.00'),
            paymentMethod: p.paymentMethod || 'Counter Payment',
            normalizedStatus,
            statusLabel,
            badgeStatus,
            hasReceipt: normalizedStatus === 'PAID' || normalizedStatus === 'REFUNDED',
            items:
              items.length > 0
                ? items
                : [{ description: relatedRef, totalPrice: String(p.amount ?? inv.totalAmount ?? '0.00') }],
          });
        }
      } else {
        const branchObj = inv.branch || defaultBranch;
        const hospitalName = branchObj?.hospital?.name || defaultHospitalName || 'Hospital';
        const { label: dateStr, timestamp } = formatPaymentDate(inv.createdAt);
        const { normalizedStatus, statusLabel, badgeStatus } = normalizePaymentStatus(inv.status);

        entries.push({
          id: `inv-${inv.id}`,
          paymentId: invoiceNumber,
          transactionId: invoiceNumber,
          invoiceId: inv.id,
          invoiceNumber,
          relatedRef,
          hospitalName,
          branchName: branchObj?.name || 'Branch unavailable',
          branchLocation: formatBranchLoc(branchObj),
          branchPhone: branchObj?.phone || defaultBranch?.phone,
          dateStr,
          timestamp,
          amount: String(inv.totalAmount ?? '0.00'),
          invoiceTotal: String(inv.totalAmount ?? '0.00'),
          invoicePaid: String(inv.paidAmount ?? '0.00'),
          paymentMethod: normalizedStatus === 'PENDING' ? 'Awaiting Payment' : 'Counter Payment',
          normalizedStatus,
          statusLabel,
          badgeStatus,
          hasReceipt: normalizedStatus === 'PAID' || Number(inv.paidAmount || 0) > 0,
          items:
            items.length > 0
              ? items
              : [{ description: relatedRef, totalPrice: String(inv.totalAmount ?? '0.00') }],
        });
      }
    }

    // Latest transactions first
    entries.sort((a, b) => b.timestamp - a.timestamp);
    return entries;
  }, [data]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((entry) => {
      if (statusFilter !== 'ALL' && entry.normalizedStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [
          entry.transactionId,
          entry.paymentId,
          entry.invoiceNumber,
          entry.relatedRef,
          entry.hospitalName,
          entry.branchName,
          entry.paymentMethod,
          entry.statusLabel,
          ...entry.items.map((it) => it.description),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const downloadReceipt = async (entry: PaymentHistoryEntry) => {
    const receiptId = entry.invoiceNumber || entry.transactionId;
    const filename = `Patient_Receipt_${receiptId}`;
    const patient = data?.patient;
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`.trim()
      : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const balance = Math.max(0, Number(entry.invoiceTotal || 0) - Number(entry.invoicePaid || 0)).toFixed(2);

    setDownloadError('');
    setDownloadingId(entry.id);
    try {
      await downloadPatientReceiptPdf({
        filename,
        receiptId,
        documentTitle: 'OFFICIAL PATIENT PAYMENT RECEIPT',
        hospitalName: entry.hospitalName,
        branchName: entry.branchName,
        branchLocation: entry.branchLocation,
        branchPhone: entry.branchPhone,
        date: entry.dateStr,
        status: entry.statusLabel.toUpperCase(),
        patientName: patientName || 'Patient',
        patientUhid: patient?.uhid,
        patientEmail: patient?.email || patient?.user?.email || user?.email,
        patientPhone: patient?.phone,
        department: entry.relatedRef,
        paymentMethod: entry.paymentMethod,
        items: entry.items.map((i) => ({
          description: i.description,
          detail: i.quantity ? `Qty: ${i.quantity}` : entry.relatedRef,
          amount: `INR ${i.totalPrice}`,
        })),
        summaryLines: [
          { label: 'Transaction Amount', value: `INR ${entry.amount}` },
          { label: 'Invoice Total', value: `INR ${entry.invoiceTotal}` },
          { label: 'Paid Amount', value: `INR ${entry.invoicePaid}`, highlight: true },
          { label: 'Balance Due', value: `INR ${balance}` },
        ],
        notes: `Transaction ID: ${entry.transactionId}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not download receipt PDF.';
      setDownloadError(msg);
      Alert.alert('Receipt Download Failed', msg);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading your payment history..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load payment history"
        message={error instanceof Error ? error.message : 'Please check connection.'}
        onRetry={() => refetch()}
      />
    );
  }

  const countByStatus = (status: Exclude<StatusFilter, 'ALL'>) =>
    transactions.filter((t) => t.normalizedStatus === status).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[UyirinaiTheme.colors.primary]}
          tintColor={UyirinaiTheme.colors.primary}
        />
      }
    >
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Receipt size={24} color={UyirinaiTheme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment History</Text>
          <Text style={styles.headerSub}>
            View your hospital transactions, payment methods, and downloadable receipts.
          </Text>
        </View>
      </View>

      {!!downloadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{downloadError}</Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Search size={16} color={UyirinaiTheme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by transaction ID, invoice #, branch, method..."
          placeholderTextColor={UyirinaiTheme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <X size={16} color={UyirinaiTheme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipRow}
      >
        {(
          [
            { key: 'ALL', label: `All (${transactions.length})` },
            { key: 'PAID', label: `Paid (${countByStatus('PAID')})` },
            { key: 'PENDING', label: `Pending (${countByStatus('PENDING')})` },
            { key: 'FAILED', label: `Failed (${countByStatus('FAILED')})` },
            { key: 'REFUNDED', label: `Refunded (${countByStatus('REFUNDED')})` },
          ] as { key: StatusFilter; label: string }[]
        ).map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Payment Transactions List */}
      {filteredTransactions.length > 0 ? (
        <View style={styles.list}>
          {filteredTransactions.map((entry) => (
            <View key={entry.id} style={styles.invoiceCard}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircle}>
                  <CreditCard size={20} color={UyirinaiTheme.colors.primaryDark} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.invNumber} numberOfLines={1}>
                    {entry.invoiceNumber}
                  </Text>
                  <Text style={styles.refText} numberOfLines={1}>
                    {entry.relatedRef}
                  </Text>
                  <View style={styles.metaInlineRow}>
                    <Calendar size={12} color={UyirinaiTheme.colors.textSecondary} />
                    <Text style={styles.invDate}>{entry.dateStr}</Text>
                  </View>
                </View>
                <StatusBadge status={entry.badgeStatus} label={entry.statusLabel} />
              </View>

              {/* Transaction ID & Hospital Branch */}
              <View style={styles.infoPanel}>
                <View style={styles.infoPanelRow}>
                  <Hash size={13} color={UyirinaiTheme.colors.primary} />
                  <Text style={styles.infoPanelLabel}>Transaction ID:</Text>
                  <Text style={styles.infoPanelValue} numberOfLines={1}>
                    {entry.transactionId}
                  </Text>
                </View>
                <View style={styles.infoPanelRow}>
                  <Building2 size={13} color={UyirinaiTheme.colors.primaryDark} />
                  <Text style={styles.infoPanelValue} numberOfLines={2}>
                    {entry.hospitalName} · {entry.branchName}
                  </Text>
                </View>
                {entry.branchLocation ? (
                  <View style={styles.infoPanelRow}>
                    <MapPin size={13} color={UyirinaiTheme.colors.primary} />
                    <Text style={styles.infoPanelSub} numberOfLines={2}>
                      {entry.branchLocation}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Itemized charges */}
              {entry.items.length > 0 && (
                <View style={styles.itemsBox}>
                  {entry.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                      <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Payment Method & Amount */}
              <View style={styles.totalRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.metaLabel}>Payment Method</Text>
                  <Text style={styles.metaVal}>{entry.paymentMethod}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>
                    {entry.normalizedStatus === 'PAID'
                      ? 'Amount Paid'
                      : entry.normalizedStatus === 'REFUNDED'
                      ? 'Refunded Amount'
                      : 'Amount'}
                  </Text>
                  <Text
                    style={[
                      styles.totalVal,
                      entry.normalizedStatus === 'FAILED' && { color: UyirinaiTheme.colors.error },
                      entry.normalizedStatus === 'PENDING' && { color: UyirinaiTheme.colors.warning },
                    ]}
                  >
                    ₹{entry.amount}
                  </Text>
                </View>
              </View>

              {/* Print / Download Receipt Button */}
              {entry.hasReceipt && (
                <Pressable
                  style={styles.downloadBtn}
                  onPress={() => downloadReceipt(entry)}
                  disabled={downloadingId === entry.id}
                  accessibilityRole="button"
                  accessibilityLabel="Print Receipt"
                >
                  <Download size={15} color={UyirinaiTheme.colors.primaryDark} />
                  <Text style={styles.downloadBtnText}>
                    {downloadingId === entry.id ? 'Generating PDF...' : 'Print Receipt'}
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <CreditCard size={36} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.emptyTitle}>No Payment History</Text>
          <Text style={styles.emptySub}>
            {transactions.length === 0
              ? 'You do not have any payment transactions recorded yet.'
              : 'No payment transactions match your current search or status filter.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  headerSub: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: UyirinaiTheme.colors.errorBg,
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: UyirinaiTheme.colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: UyirinaiTheme.borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: UyirinaiTheme.colors.white,
  },
  list: {
    gap: 12,
  },
  invoiceCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 2,
  },
  metaInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  invDate: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
  },
  infoPanel: {
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
    padding: 10,
    gap: 5,
    marginBottom: 12,
  },
  infoPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoPanelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  infoPanelValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
    flex: 1,
  },
  infoPanelSub: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    flex: 1,
  },
  itemsBox: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    gap: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemDesc: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 2,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.lg,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 30,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

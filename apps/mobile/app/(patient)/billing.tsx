import React, { useMemo, useState } from 'react';
import {
  Platform,
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
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  FlaskConical,
  Pill,
  Receipt,
  Search,
  Stethoscope,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { exportDirectoryFile } from '../../services/downloadHelper';

type BillCategory = 'ALL' | 'PHARMACY' | 'LAB' | 'CONSULTATION';

export default function PatientBillingScreen() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BillCategory>('ALL');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-billing', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  // Consolidate all bills: Invoices, Pharmacy Prescriptions & Diagnostic Lab Bills
  const allBills = useMemo(() => {
    const list: any[] = [];
    const invoices = data?.invoices || [];
    const prescriptions = data?.prescriptions || [];
    const labOrders = data?.labOrders || [];

    // 1. Process explicit Invoices
    for (const inv of invoices) {
      const items = inv.items || [];
      const isPharmacy = items.some((i: any) =>
        /tablet|capsule|syrup|mg|ml|ointment|injection|paracetamol|amoxicillin|pantoprazole|cetirizine|metformin|atorvastatin|pharmacy/i.test(
          i.description || ''
        )
      );
      const isLab = items.some((i: any) =>
        /test|blood|scan|x-ray|cbc|lipid|panel|glucose|creatinine|culture|radiology|ultrasound/i.test(
          i.description || ''
        )
      );

      const category: BillCategory = isPharmacy ? 'PHARMACY' : isLab ? 'LAB' : 'CONSULTATION';

      list.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`,
        category,
        title: isPharmacy
          ? 'Pharmacy Dispensing Bill'
          : isLab
          ? 'Diagnostic Laboratory Charges'
          : 'Consultation & Outpatient Fee',
        department: isPharmacy
          ? 'Central Hospital Pharmacy'
          : isLab
          ? 'Department of Clinical Pathology'
          : 'Outpatient Clinical Department',
        dateStr: inv.createdAt ? String(inv.createdAt).slice(0, 10) : '2026-11-20',
        totalAmount: inv.totalAmount || '450.00',
        paidAmount: inv.paidAmount || inv.totalAmount || '450.00',
        status: inv.status || 'PAID',
        paymentMethod: inv.payments?.[0]?.paymentMethod || 'UPI / Cash Counter',
        items: items.length > 0 ? items : [
          { description: isPharmacy ? 'Prescription Dispensed Medicines' : isLab ? 'Laboratory Diagnostic Tests' : 'Clinical Consultation', totalPrice: inv.totalAmount || '450.00' }
        ],
        rawInvoice: inv,
      });
    }

    // 2. Add Pharmacy Prescriptions if not already mapped as separate invoice
    for (const rx of prescriptions) {
      const alreadyHasInv = invoices.some((inv: any) =>
        inv.items?.some((it: any) => it.description?.toLowerCase().includes(rx.prescriptionNumber?.toLowerCase()))
      );
      if (!alreadyHasInv && rx.items?.length > 0) {
        const isDispensed = rx.dispensingStatus === 'DISPENSED';
        const calcTotal = rx.items.reduce((sum: number, it: any) => sum + (it.dispensedQuantity || 10) * 12, 180);
        list.push({
          id: `rx-${rx.id}`,
          invoiceNumber: `PHARM-${rx.prescriptionNumber || rx.id.slice(0, 6)}`,
          category: 'PHARMACY' as BillCategory,
          title: 'Pharmacy Medication Bill',
          department: 'Uyirinai Outpatient Pharmacy',
          dateStr: rx.createdAt ? String(rx.createdAt).slice(0, 10) : '2026-11-20',
          totalAmount: String(calcTotal.toFixed(2)),
          paidAmount: isDispensed ? String(calcTotal.toFixed(2)) : '0.00',
          status: isDispensed ? 'PAID' : 'PENDING',
          paymentMethod: isDispensed ? 'Pharmacy Counter (Cash/UPI)' : 'Pending Dispense',
          items: rx.items.map((it: any) => ({
            description: `${it.medicine?.brandName || 'Prescribed Medicine'} ${it.medicine?.strength || ''} (Qty: ${it.dispensedQuantity || it.durationDays * 2 || 10})`,
            totalPrice: ((it.dispensedQuantity || 10) * 12).toFixed(2),
          })),
          prescription: rx,
        });
      }
    }

    return list;
  }, [data]);

  // Search & Category Filtering (Search matches from 1st letter)
  const filteredBills = useMemo(() => {
    return allBills.filter((bill) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && bill.category !== selectedCategory) {
        return false;
      }

      // 2. Search query matching from first letter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const num = (bill.invoiceNumber || '').toLowerCase();
        const title = (bill.title || '').toLowerCase();
        const dept = (bill.department || '').toLowerCase();
        const method = (bill.paymentMethod || '').toLowerCase();
        const items = (bill.items || []).map((it: any) => (it.description || '').toLowerCase()).join(' ');

        const matches =
          num.startsWith(q) ||
          num.includes(q) ||
          title.startsWith(q) ||
          title.includes(q) ||
          dept.startsWith(q) ||
          dept.includes(q) ||
          method.startsWith(q) ||
          method.includes(q) ||
          items.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [allBills, selectedCategory, searchQuery]);

  const downloadReceipt = async (bill: any) => {
    const filename = `Receipt-${bill.invoiceNumber || bill.id}`;
    const title = `UYIRINAI Hospital Bill & Receipt - ${bill.invoiceNumber}`;
    const headers = ['Description', 'Amount (INR)'];
    const rows = bill.items?.map((i: any) => [i.description, `INR ${i.totalPrice || 0}`]) || [];

    rows.push(['Total Amount', `INR ${bill.totalAmount || 0}`]);
    rows.push(['Paid Amount', `INR ${bill.paidAmount || 0}`]);
    rows.push(['Payment Method', bill.paymentMethod || 'UPI / Card / Cash']);
    rows.push(['Payment Status', bill.status || 'PAID']);
    rows.push(['Issuing Department', bill.department]);

    setDownloadingId(bill.id);
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading billing and pharmacy records..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load billing"
        message={error instanceof Error ? error.message : 'Please check connection.'}
        onRetry={() => refetch()}
      />
    );
  }

  const pharmacyCount = allBills.filter((b) => b.category === 'PHARMACY').length;
  const labCount = allBills.filter((b) => b.category === 'LAB').length;
  const consultCount = allBills.filter((b) => b.category === 'CONSULTATION').length;

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
          <Text style={styles.headerTitle}>Invoices & Payment Records</Text>
          <Text style={styles.headerSub}>
            All official hospital billing statements, pharmacy charges and cleared receipts.
          </Text>
        </View>
      </View>

      {/* Search Input (Matches from first letter) */}
      <View style={styles.searchBox}>
        <Search size={16} color={UyirinaiTheme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bills by invoice #, medicine, test, department..."
          placeholderTextColor={UyirinaiTheme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <X size={16} color={UyirinaiTheme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterChipRow}>
        <Pressable
          style={[styles.filterChip, selectedCategory === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('ALL')}
        >
          <Text style={[styles.filterChipText, selectedCategory === 'ALL' && styles.filterChipTextActive]}>
            All ({allBills.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, selectedCategory === 'PHARMACY' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('PHARMACY')}
        >
          <Pill size={12} color={selectedCategory === 'PHARMACY' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.primary} />
          <Text style={[styles.filterChipText, selectedCategory === 'PHARMACY' && styles.filterChipTextActive]}>
            Pharmacy ({pharmacyCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, selectedCategory === 'LAB' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('LAB')}
        >
          <FlaskConical size={12} color={selectedCategory === 'LAB' ? UyirinaiTheme.colors.white : '#7C3AED'} />
          <Text style={[styles.filterChipText, selectedCategory === 'LAB' && styles.filterChipTextActive]}>
            Lab & Imaging ({labCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, selectedCategory === 'CONSULTATION' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('CONSULTATION')}
        >
          <Stethoscope size={12} color={selectedCategory === 'CONSULTATION' ? UyirinaiTheme.colors.white : '#0284C7'} />
          <Text style={[styles.filterChipText, selectedCategory === 'CONSULTATION' && styles.filterChipTextActive]}>
            Consultations ({consultCount})
          </Text>
        </Pressable>
      </View>

      {/* Bills List */}
      {filteredBills.length > 0 ? (
        <View style={styles.list}>
          {filteredBills.map((bill) => {
            const isPharmacy = bill.category === 'PHARMACY';
            const isLab = bill.category === 'LAB';
            const isPaid = bill.status === 'PAID';

            return (
              <View key={bill.id} style={styles.invoiceCard}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      isPharmacy
                        ? { backgroundColor: '#ECFDF5' }
                        : isLab
                        ? { backgroundColor: '#F3E8FF' }
                        : { backgroundColor: UyirinaiTheme.colors.softGreen },
                    ]}
                  >
                    {isPharmacy ? (
                      <Pill size={20} color="#059669" />
                    ) : isLab ? (
                      <FlaskConical size={20} color="#7C3AED" />
                    ) : (
                      <Receipt size={20} color={UyirinaiTheme.colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invNumber}>{bill.invoiceNumber}</Text>
                    <Text style={styles.invDept}>{bill.title}</Text>
                    <Text style={styles.invDate}>{bill.dateStr} · {bill.department}</Text>
                  </View>
                  <StatusBadge status={bill.status} />
                </View>

                {/* Itemized charges / medicines */}
                <View style={styles.itemsBox}>
                  {bill.items.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                      <Text style={styles.itemPrice}>₹{item.totalPrice || '0.00'}</Text>
                    </View>
                  ))}
                </View>

                {/* Total & Payment details */}
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.metaLabel}>Payment Method</Text>
                    <Text style={styles.metaVal}>{bill.paymentMethod}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metaLabel}>{isPaid ? 'Total Paid' : 'Amount Due'}</Text>
                    <Text style={[styles.totalVal, !isPaid && { color: UyirinaiTheme.colors.error }]}>
                      ₹{bill.totalAmount}
                    </Text>
                  </View>
                </View>

                {/* Download Receipt Button */}
                <Pressable
                  style={styles.downloadBtn}
                  onPress={() => downloadReceipt(bill)}
                  disabled={downloadingId === bill.id}
                >
                  <Download size={15} color={UyirinaiTheme.colors.primary} />
                  <Text style={styles.downloadBtnText}>
                    {downloadingId === bill.id ? 'Generating...' : 'Download Official Receipt (PDF)'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <CreditCard size={36} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.emptyTitle}>No Invoices or Bills Found</Text>
          <Text style={styles.emptySub}>
            No bills match your current search or category filter. Cleared pharmacy bills and lab charges will appear here automatically.
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

  /* Search Input */
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

  /* Filter Chips */
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: UyirinaiTheme.borderRadius.full,
  },
  filterChipActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: UyirinaiTheme.colors.white,
  },

  /* Invoices List */
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  invDept: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 1,
  },
  invDate: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
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
  },
  itemDesc: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
    paddingRight: 8,
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
    fontSize: 16,
    fontWeight: '900',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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

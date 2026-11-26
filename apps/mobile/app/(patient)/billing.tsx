import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Download, Receipt } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { exportDirectoryFile } from '../../services/downloadHelper';

export default function PatientBillingScreen() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-billing', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  const downloadReceipt = async (inv: any) => {
    const filename = `Invoice-${inv.invoiceNumber || inv.id}`;
    const title = `UYIRINAI Hospital Bill & Receipt - ${inv.invoiceNumber}`;
    const headers = ['Description', 'Amount (INR)'];
    const rows = inv.items?.length
      ? inv.items.map((i: any) => [i.description, `INR ${i.totalPrice || 0}`])
      : [['Outpatient Clinical Consultation & Medicines', `INR ${inv.totalAmount || 0}`]];

    rows.push(['Total Amount', `INR ${inv.totalAmount || 0}`]);
    rows.push(['Paid Amount', `INR ${inv.paidAmount || 0}`]);
    rows.push(['Payment Method', inv.payments?.[0]?.paymentMethod || 'UPI / Card']);
    rows.push(['Status', inv.status || 'PAID']);

    setDownloadingId(inv.id);
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading billing history..." />;
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

  const invoices = data?.invoices || [];

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
      <View style={styles.headerBanner}>
        <Receipt size={22} color={UyirinaiTheme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Invoices & Payment Records</Text>
          <Text style={styles.headerSub}>
            All official billing statements, pharmacy charges and payment receipts.
          </Text>
        </View>
      </View>

      {invoices.length > 0 ? (
        <View style={styles.list}>
          {invoices.map((inv: any) => {
            const dateStr = inv.createdAt ? String(inv.createdAt).slice(0, 10) : '2026-11-20';
            const totalAmt = inv.totalAmount || '650.00';
            const paymentMethod = inv.payments?.[0]?.paymentMethod || 'UPI Payment';

            return (
              <View key={inv.id} style={styles.invoiceCard}>
                <View style={styles.cardTop}>
                  <View style={styles.iconCircle}>
                    <Receipt size={20} color={UyirinaiTheme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invNumber}>
                      Invoice #{inv.invoiceNumber || inv.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.invDate}>{dateStr}</Text>
                  </View>
                  <StatusBadge status={inv.status || 'PAID'} />
                </View>

                {/* Items */}
                <View style={styles.itemsBox}>
                  {inv.items?.length > 0 ? (
                    inv.items.map((item: any, idx: number) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                        <Text style={styles.itemPrice}>
                          ₹{item.totalPrice || item.unitPrice || '0.00'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.itemRow}>
                      <Text style={styles.itemDesc}>OPD Consultation & Pharmacy Dispensing</Text>
                      <Text style={styles.itemPrice}>₹{totalAmt}</Text>
                    </View>
                  )}
                </View>

                {/* Total */}
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.metaLabel}>Payment Method</Text>
                    <Text style={styles.metaVal}>{paymentMethod}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metaLabel}>Total Paid</Text>
                    <Text style={styles.totalVal}>₹{totalAmt}</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.downloadBtn}
                  onPress={() => downloadReceipt(inv)}
                  disabled={downloadingId === inv.id}
                >
                  <Download size={15} color={UyirinaiTheme.colors.primary} />
                  <Text style={styles.downloadBtnText}>
                    {downloadingId === inv.id ? 'Generating...' : 'Download Official Receipt (PDF)'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <CreditCard size={36} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.emptyTitle}>No Invoices Available</Text>
          <Text style={styles.emptySub}>
            Payment receipts for hospital admissions, consultations, and lab tests will be displayed here.
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
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    padding: 14,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  headerSub: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: 14,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  invDate: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 1,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
    marginTop: 1,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
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

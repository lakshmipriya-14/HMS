import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  BarChart3,
  ChevronLeft,
  Calendar,
  IndianRupee,
  Users,
  Pill,
  Shield,
  FileText,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

const REPORT_TYPES = [
  { id: 'REVENUE', label: 'Financial Revenue', icon: IndianRupee },
  { id: 'OPD', label: 'Outpatient Visits', icon: Users },
  { id: 'IPD', label: 'Inpatient Admissions', icon: Calendar },
  { id: 'PHARMACY', label: 'Pharmacy Formulary', icon: Pill },
  { id: 'AUDIT', label: 'Audit Trail', icon: Shield },
];

export default function AdminReportsScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('REVENUE');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.hospitalAdmin.getReports({ type: selectedType });
      if (res.data) setReportData(res.data);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Report Error', e.message || 'Failed to generate report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedType]);

  const summary = reportData?.summary || {};
  const rows = reportData?.rows || [];

  return (
    <View style={styles.container}>
      <AdminHeader title="Analytics & Reports" subtitle="Clinical & Financial Telemetry" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/more')}
        >
          <ChevronLeft size={20} color="#38845A" />
        </TouchableOpacity>
        <Text style={styles.actionTitle}>Hospital Reports Generator</Text>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {REPORT_TYPES.map((t) => {
          const Icon = t.icon;
          const isActive = selectedType === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.catChip, isActive && styles.catChipActive]}
              onPress={() => setSelectedType(t.id)}
            >
              <Icon size={14} color={isActive ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#38845A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchReport} tintColor="#38845A" />
          }
        >
          {/* Summary Box */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {reportData?.title || 'Report Telemetry Summary'}
            </Text>
            <View style={styles.summaryStatsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Records</Text>
                <Text style={styles.statVal}>{summary.totalRecords || rows.length || 0}</Text>
              </View>
              {summary.totalRevenue !== undefined && (
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                  <Text style={[styles.statVal, { color: '#38845A' }]}>
                    ₹ {(summary.totalRevenue || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              {summary.occupiedBeds !== undefined && (
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Occupied Beds</Text>
                  <Text style={styles.statVal}>{summary.occupiedBeds}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Record Rows */}
          <Text style={styles.sectionHeader}>Extracted Telemetry Rows ({rows.length})</Text>

          {rows.length === 0 ? (
            <Text style={styles.emptyText}>No records matching current period.</Text>
          ) : (
            rows.slice(0, 15).map((r: any, idx: number) => (
              <View key={idx} style={styles.recordCard}>
                <View style={styles.recordHead}>
                  <Text style={styles.recordMain}>
                    {r.patientName || r.medicineName || r.invoiceNumber || r.action || `Record #${idx + 1}`}
                  </Text>
                  {r.amount !== undefined && (
                    <Text style={styles.recordAmount}>₹ {r.amount}</Text>
                  )}
                  {r.stock !== undefined && (
                    <Text style={styles.recordAmount}>{r.stock} units</Text>
                  )}
                </View>
                <Text style={styles.recordSub}>
                  {r.doctor || r.department || r.resource || r.user || 'Uyirinai Hospital'} •{' '}
                  {r.date || r.timestamp ? new Date(r.date || r.timestamp).toLocaleDateString() : 'Live'}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  catScroll: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 50,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    gap: 6,
  },
  catChipActive: {
    backgroundColor: '#38845A',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF5ED',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  recordHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38845A',
  },
  recordSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

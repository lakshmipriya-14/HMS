import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { BarChart3, Calendar, FileSpreadsheet, TrendingUp, Users, BedDouble } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentReportsScreen() {
  const [reportType, setReportType] = useState('opd_census');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getReports({
        type: reportType,
      });
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const reportOptions = [
    { key: 'opd_census', label: 'OPD Census' },
    { key: 'ipd_census', label: 'IPD Admissions' },
    { key: 'doctor_workload', label: 'Doctor Workload' },
    { key: 'diagnostics_volume', label: 'Diagnostics' },
    { key: 'bed_turnover', label: 'Bed Turnover' },
  ];

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Analytics" subtitle="Throughput & Clinical Performance" />

      {/* Report Category Chips */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {reportOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, reportType === opt.key && styles.chipActive]}
              onPress={() => setReportType(opt.key)}
            >
              <Text style={[styles.chipText, reportType === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadReport} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : (
          <View>
            {/* Summary KPI Strip */}
            {data?.summary && (
              <View style={styles.summaryGrid}>
                {Object.entries(data.summary).map(([key, val]: [string, any]) => (
                  <View key={key} style={styles.sumCard}>
                    <Text style={styles.sumVal}>{String(val)}</Text>
                    <Text style={styles.sumLbl}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Breakdown Data</Text>

            {!data?.rows || data.rows.length === 0 ? (
              <View style={styles.emptyState}>
                <FileSpreadsheet size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No records logged for this report period</Text>
              </View>
            ) : (
              data.rows.map((row: any, idx: number) => (
                <View key={idx} style={styles.rowCard}>
                  {Object.entries(row).map(([k, v]: [string, any]) => (
                    <View key={k} style={styles.cellRow}>
                      <Text style={styles.cellKey}>{k.replace(/([A-Z])/g, ' $1')}:</Text>
                      <Text style={styles.cellVal}>
                        {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v ?? '—')}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  selectorBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#38845A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sumCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sumVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sumLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cellRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  cellKey: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cellVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  FileBarChart,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  TrendingUp,
  Download,
  AlertCircle,
} from 'lucide-react-native';

export default function ReceptionReportsScreen() {
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
    >
      {/* Header */}
      <View style={styles.banner}>
        <FileBarChart size={20} color="#0284C7" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.bannerTitle}>Daily Front Office & OPD Statistics</Text>
          <Text style={styles.bannerSub}>Daily patient flow, check-in conversion, and department workload</Text>
        </View>
      </View>

      {/* Date Filter Tabs */}
      <View style={styles.tabRow}>
        {(['TODAY', 'WEEK', 'MONTH'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, dateFilter === tab && styles.tabActive]}
            onPress={() => setDateFilter(tab)}
          >
            <Text style={[styles.tabText, dateFilter === tab && styles.tabTextActive]}>
              {tab === 'TODAY' ? 'Today (22 Nov)' : tab === 'WEEK' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.mNum}>32</Text>
          <Text style={styles.mLabel}>Total Registrations</Text>
          <Text style={styles.mSub}>24 New • 8 Follow-Up</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.mNum, { color: '#0284C7' }]}>58</Text>
          <Text style={styles.mLabel}>OPD Appointments</Text>
          <Text style={styles.mSub}>42 Pre-booked • 16 Walk-in</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.mNum, { color: '#38845A' }]}>91%</Text>
          <Text style={styles.mLabel}>Check-In Rate</Text>
          <Text style={styles.mSub}>48 Checked In • 4 Waiting</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.mNum, { color: '#D97706' }]}>14 min</Text>
          <Text style={styles.mLabel}>Avg. Waiting Time</Text>
          <Text style={styles.mSub}>Queue arrival to consult</Text>
        </View>
      </View>

      {/* Department Breakdown */}
      <Text style={styles.secTitle}>Department-Wise Outpatient Volume</Text>
      <View style={styles.card}>
        {[
          { dept: 'Cardiology & Cardiothoracic', count: 18, pct: '31%', color: '#DC2626' },
          { dept: 'Orthopedics & Joint Surgery', count: 15, pct: '26%', color: '#0284C7' },
          { dept: 'General & Internal Medicine', count: 14, pct: '24%', color: '#38845A' },
          { dept: 'Pediatrics & Neonatal Care', count: 7, pct: '12%', color: '#38845A' },
          { dept: 'Emergency & Trauma Triage', count: 4, pct: '7%', color: '#D97706' },
        ].map((item, idx) => (
          <View key={idx} style={styles.deptItem}>
            <View style={styles.deptLeft}>
              <View style={[styles.bullet, { backgroundColor: item.color }]} />
              <Text style={styles.deptName}>{item.dept}</Text>
            </View>
            <View style={styles.deptRight}>
              <Text style={styles.deptCount}>{item.count} pts</Text>
              <Text style={styles.deptPct}>({item.pct})</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Appointment Status Distribution */}
      <Text style={styles.secTitle}>Appointment Disposition Summary</Text>
      <View style={styles.card}>
        <View style={styles.dispRow}>
          <View style={styles.dispItem}>
            <CheckCircle2 size={16} color="#38845A" />
            <Text style={styles.dispNum}>46</Text>
            <Text style={styles.dispLabel}>Completed</Text>
          </View>

          <View style={styles.dispItem}>
            <Clock size={16} color="#D97706" />
            <Text style={styles.dispNum}>8</Text>
            <Text style={styles.dispLabel}>In Progress</Text>
          </View>

          <View style={styles.dispItem}>
            <XCircle size={16} color="#DC2626" />
            <Text style={styles.dispNum}>3</Text>
            <Text style={styles.dispLabel}>Cancelled</Text>
          </View>

          <View style={styles.dispItem}>
            <AlertCircle size={16} color="#64748B" />
            <Text style={styles.dispNum}>1</Text>
            <Text style={styles.dispLabel}>No Show</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#0284C7' },
  bannerSub: { fontSize: 11, color: '#0369A1', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#0284C7' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  mNum: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  mLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 3 },
  mSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  secTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 14 },
  deptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  deptLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  deptName: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  deptRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deptCount: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  deptPct: { fontSize: 10, color: '#64748B' },
  dispRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dispItem: { alignItems: 'center', flex: 1 },
  dispNum: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  dispLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 2 },
});


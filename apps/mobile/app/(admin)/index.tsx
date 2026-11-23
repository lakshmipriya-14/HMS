import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Users, BedDouble, AlertCircle, TrendingUp, IndianRupee } from 'lucide-react-native';

export default function AdminMobileDashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.hospitalName}>Kizuna Multispeciality Hospital</Text>
        <Text style={styles.bannerTitle}>Executive Hospital Command</Text>
        <Text style={styles.bannerSub}>Daily Census & Operational Metrics</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <BedDouble size={18} color="#0F766E" />
            <Text style={styles.metricTag}>85% Occ</Text>
          </View>
          <Text style={styles.metricVal}>425 / 500</Text>
          <Text style={styles.metricLabel}>Total Inpatient Beds Occupied</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Users size={18} color="#2563EB" />
            <Text style={[styles.metricTag, { color: '#2563EB', backgroundColor: '#DBEAFE' }]}>Today</Text>
          </View>
          <Text style={styles.metricVal}>348</Text>
          <Text style={styles.metricLabel}>OPD Patients Registered</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <TrendingUp size={18} color="#059669" />
            <Text style={[styles.metricTag, { color: '#059669', backgroundColor: '#D1FAE5' }]}>+12%</Text>
          </View>
          <Text style={styles.metricVal}>₹ 28.4 L</Text>
          <Text style={styles.metricLabel}>Today's Billing Collection</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={[styles.metricTag, { color: '#DC2626', backgroundColor: '#FEE2E2' }]}>Urgent</Text>
          </View>
          <Text style={styles.metricVal}>14</Text>
          <Text style={styles.metricLabel}>ICU Critical Cases</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Response Overview</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>• 108 Emergency Fleet: 8 / 10 Ambulances Available</Text>
          <Text style={styles.infoText}>• Active OTs: 6 Theatres In Surgery</Text>
          <Text style={styles.infoText}>• On-Duty Medical Staff: 48 Doctors, 112 Nurses</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: '#1E293B', padding: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  hospitalName: { color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  bannerSub: { color: '#CBD5E1', fontSize: 12, marginTop: 2 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { backgroundColor: '#fff', width: '48%', padding: 14, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricTag: { fontSize: 10, fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  infoBox: { backgroundColor: '#fff', padding: 14, borderRadius: 10, gap: 8 },
  infoText: { fontSize: 13, color: '#334155', fontWeight: '500' },
});

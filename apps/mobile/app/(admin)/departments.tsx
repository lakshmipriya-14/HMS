import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Building2 } from 'lucide-react-native';

const DEPTS = [
  { name: 'Cardiology', head: 'Dr. K. Senthil Nathan', beds: '45/50 Occupied', opd: '42 Today' },
  { name: 'Neurology', head: 'Dr. R. Meenakshi', beds: '28/30 Occupied', opd: '31 Today' },
  { name: 'Orthopedics & Trauma', head: 'Dr. V. Rajesh', beds: '38/40 Occupied', opd: '56 Today' },
  { name: 'Pediatrics & Neonatology', head: 'Dr. Ananya Sharma', beds: '22/25 Occupied', opd: '48 Today' },
  { name: 'General & Laparoscopic Surgery', head: 'Dr. P. Murugan', beds: '30/35 Occupied', opd: '29 Today' },
];

export default function AdminDepartmentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clinical Departments</Text>
        <Text style={styles.headerSub}>Live Occupancy and OPD Activity</Text>
      </View>
      <View style={styles.list}>
        {DEPTS.map((d, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Building2 size={16} color="#0F766E" />
              <Text style={styles.deptName}>{d.name}</Text>
            </View>
            <Text style={styles.deptHead}>HOD: {d.head}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statPill}>{d.beds}</Text>
              <Text style={[styles.statPill, { backgroundColor: '#DBEAFE', color: '#1E40AF' }]}>OPD: {d.opd}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  deptName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  deptHead: { fontSize: 12, color: '#64748B' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statPill: { fontSize: 11, fontWeight: '600', backgroundColor: '#CCFBF1', color: '#0F766E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});

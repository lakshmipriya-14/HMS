import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FlaskConical, CheckCircle2, ChevronRight } from 'lucide-react-native';

const ORDERS = [
  { id: '1', orderNo: 'LAB-501', patient: 'Ramasamy K.', test: 'Complete Blood Count (CBC) + ESR', priority: 'Routine', status: 'Processing' },
  { id: '2', orderNo: 'LAB-502', patient: 'Meenakshi S.', test: 'Cardiac Troponin I (High Sensitivity)', priority: 'STAT EMERGENCY', status: 'Sample Collected' },
  { id: '3', orderNo: 'LAB-503', patient: 'Karthik Raja', test: 'Lipid Profile & HbA1c', priority: 'Routine', status: 'Pending' },
];

export default function LabWorklistScreen() {
  const [orders, setOrders] = useState(ORDERS);

  const releaseReport = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'Report Released' } : o))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laboratory Active Worklist</Text>
        <Text style={styles.sub}>Central Pathology & Biochemistry Terminal</Text>
      </View>
      <View style={styles.list}>
        {orders.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{o.orderNo}</Text>
              </View>
              {o.priority.includes('STAT') && (
                <View style={styles.statBadge}>
                  <Text style={styles.statText}>STAT EMERGENCY</Text>
                </View>
              )}
            </View>

            <Text style={styles.patient}>{o.patient}</Text>
            <Text style={styles.test}>{o.test}</Text>

            <View style={styles.actionRow}>
              <Text style={[styles.statusTag, o.status === 'Report Released' ? styles.statusOk : styles.statusProgress]}>
                {o.status}
              </Text>
              {o.status !== 'Report Released' && (
                <TouchableOpacity style={styles.btn} onPress={() => releaseReport(o.id)}>
                  <Text style={styles.btnText}>Validate & Release</Text>
                </TouchableOpacity>
              )}
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
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#EA580C', fontWeight: '800', fontSize: 12 },
  statBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statText: { color: '#DC2626', fontSize: 10, fontWeight: '800' },
  patient: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  test: { fontSize: 13, color: '#475569', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusProgress: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusOk: { backgroundColor: '#D1FAE5', color: '#065F46' },
  btn: { backgroundColor: '#EA580C', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

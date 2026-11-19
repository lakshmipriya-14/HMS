import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Boxes, AlertTriangle } from 'lucide-react-native';

const STOCK = [
  { name: 'Paracetamol 650mg Tabs', batch: 'BT-2024-08', exp: '11/2027', qty: 2400, alert: false },
  { name: 'Amoxicillin 500mg Caps', batch: 'BT-2024-03', exp: '04/2026', qty: 42, alert: true },
  { name: 'Amlodipine 5mg Tabs', batch: 'BT-2024-11', exp: '08/2027', qty: 1850, alert: false },
  { name: 'Atorvastatin 20mg Tabs', batch: 'BT-2024-09', exp: '05/2027', qty: 920, alert: false },
  { name: 'Ceftriaxone 1g Injection', batch: 'BT-2024-01', exp: '12/2025', qty: 18, alert: true },
];

export default function PharmacyInventoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Formulary Stock & Batches</Text>
        <Text style={styles.sub}>FEFO Batch Surveillance Matrix</Text>
      </View>
      <View style={styles.list}>
        {STOCK.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              {item.alert && (
                <View style={styles.alertBadge}>
                  <AlertTriangle size={12} color="#DC2626" />
                  <Text style={styles.alertText}>Low Stock</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>Batch: {item.batch} • Expiry: {item.exp}</Text>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Current Inventory:</Text>
              <Text style={[styles.qtyVal, item.alert && styles.qtyAlert]}>{item.qty} units</Text>
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
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  alertText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  meta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  qtyLabel: { fontSize: 12, color: '#64748B' },
  qtyVal: { fontSize: 13, fontWeight: '800', color: '#0F766E' },
  qtyAlert: { color: '#DC2626' },
});

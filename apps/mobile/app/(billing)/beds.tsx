import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BedDouble } from 'lucide-react-native';

const WARDS = [
  { name: 'Intensive Coronary Care Unit (ICCU)', total: 15, occupied: 14, free: 1 },
  { name: 'Cardiology Male Ward - 3rd Floor', total: 30, occupied: 26, free: 4 },
  { name: 'Cardiology Female Ward - 3rd Floor', total: 30, occupied: 24, free: 6 },
  { name: 'Surgical ICU - 2nd Floor', total: 12, occupied: 10, free: 2 },
  { name: 'Deluxe Private Rooms - 4th Floor', total: 20, occupied: 18, free: 2 },
];

export default function WardBedsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ward & Bed Occupancy Census</Text>
        <Text style={styles.sub}>Real-Time Admission Bed Allocator</Text>
      </View>
      <View style={styles.list}>
        {WARDS.map((w, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <BedDouble size={18} color="#38845A" />
              <Text style={styles.name}>{w.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.pillTotal}>Total: {w.total}</Text>
              <Text style={styles.pillOcc}>Occupied: {w.occupied}</Text>
              <Text style={styles.pillFree}>Available: {w.free}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pillTotal: { fontSize: 11, fontWeight: '600', backgroundColor: '#F1F5F9', color: '#475569', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillOcc: { fontSize: 11, fontWeight: '600', backgroundColor: '#EAF5ED', color: '#DC2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillFree: { fontSize: 11, fontWeight: '700', backgroundColor: '#D1FAE5', color: '#38845A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});


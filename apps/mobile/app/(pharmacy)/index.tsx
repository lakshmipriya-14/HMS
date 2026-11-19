import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Pill, CheckCircle2, AlertCircle } from 'lucide-react-native';

const RX_QUEUE = [
  { id: '1', rx: 'RX-901', patient: 'Ramasamy K.', doctor: 'Dr. Senthil Nathan', drugs: 'Amlodipine 5mg (30 tabs), Atorvastatin 20mg (30 tabs)', status: 'Pending' },
  { id: '2', rx: 'RX-902', patient: 'Vijay S.', doctor: 'Dr. V. Rajesh', drugs: 'Paracetamol 650mg (10 tabs), Tramadol 50mg (5 tabs)', status: 'Verified' },
  { id: '3', rx: 'RX-903', patient: 'Deepa T.', doctor: 'Dr. Ananya Sharma', drugs: 'Amoxicillin Syrup 100ml, Cetirizine Drops', status: 'Pending' },
];

export default function PharmacyDispenseScreen() {
  const [queue, setQueue] = useState(RX_QUEUE);

  const handleDispense = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Dispensed' } : item))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prescription Dispense Queue</Text>
        <Text style={styles.sub}>Electronic orders from OPD & Wards</Text>
      </View>
      <View style={styles.list}>
        {queue.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.rx}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{item.patient}</Text>
                <Text style={styles.doc}>{item.doctor}</Text>
              </View>
            </View>

            <View style={styles.drugsBox}>
              <Text style={styles.drugsLabel}>Prescribed Formulation:</Text>
              <Text style={styles.drugsText}>{item.drugs}</Text>
            </View>

            <View style={styles.actionRow}>
              <Text style={[styles.statusTag, item.status === 'Dispensed' ? styles.statusOk : styles.statusPending]}>
                {item.status}
              </Text>
              {item.status !== 'Dispensed' && (
                <TouchableOpacity style={styles.dispenseBtn} onPress={() => handleDispense(item.id)}>
                  <Text style={styles.btnText}>Deduct Stock & Dispense</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 10 },
  badgeText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },
  headerText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  doc: { fontSize: 12, color: '#64748B' },
  drugsBox: { backgroundColor: '#FAF5FF', padding: 10, borderRadius: 8, marginVertical: 10 },
  drugsLabel: { fontSize: 10, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase' },
  drugsText: { fontSize: 13, color: '#1E293B', marginTop: 2, fontWeight: '500' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusOk: { backgroundColor: '#D1FAE5', color: '#065F46' },
  dispenseBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Pill, CheckCircle2 } from 'lucide-react-native';

const MEDICATIONS = [
  { id: '1', medicine: 'Ecosprin 75mg', dose: '1 Tab', route: 'Oral', patient: 'Muthuvel K (Bed ICCU-01)', time: 'Post-Lunch (01:00 PM)', status: 'Pending' },
  { id: '2', medicine: 'Atorva 20mg', dose: '1 Tab', route: 'Oral', patient: 'Muthuvel K (Bed ICCU-01)', time: 'Bedtime (09:00 PM)', status: 'Scheduled' },
  { id: '3', medicine: 'Pan 40mg', dose: '1 Tab', route: 'Oral', patient: 'Muthuvel K (Bed ICCU-01)', time: 'Morning (07:30 AM)', status: 'Administered' },
];

export default function NurseMedicationsScreen() {
  const [meds, setMeds] = useState(MEDICATIONS);

  const handleAdminister = (id: string, name: string) => {
    Alert.alert(
      'Confirm Medication Administration',
      `Did you verify patient ID and administer ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Administered',
          onPress: () => {
            setMeds((prev) =>
              prev.map((m) => (m.id === id ? { ...m, status: 'Administered' } : m))
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={meds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.badge}>
                <Pill size={12} color="#0F766E" />
                <Text style={styles.badgeText}>{item.route}</Text>
              </View>
              <Text style={[styles.status, item.status === 'Administered' && styles.statusDone]}>
                {item.status}
              </Text>
            </View>

            <Text style={styles.medName}>{item.medicine}</Text>
            <Text style={styles.sub}>Dose: {item.dose} • Schedule: {item.time}</Text>
            <Text style={styles.patient}>{item.patient}</Text>

            {item.status !== 'Administered' && (
              <TouchableOpacity
                style={styles.btn}
                onPress={() => handleAdminister(item.id, item.medicine)}
              >
                <Text style={styles.btnText}>Confirm Given</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#CCFBF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#0F766E' },
  status: { fontSize: 11, fontWeight: 'bold', color: '#D97706' },
  statusDone: { color: '#059669' },
  medName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  sub: { fontSize: 12, color: '#475569', marginTop: 2 },
  patient: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },
  btn: { backgroundColor: '#0F766E', marginTop: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

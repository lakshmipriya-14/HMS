import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { QrCode, Check } from 'lucide-react-native';

const SAMPLES = [
  { barcode: 'BAR-78210', type: 'EDTA Whole Blood', patient: 'Ramasamy K.', status: 'Received in Lab' },
  { barcode: 'BAR-78211', type: 'Serum (Yellow Top)', patient: 'Meenakshi S.', status: 'Collected at Bedside' },
  { barcode: 'BAR-78212', type: 'Fluoride Plasma', patient: 'Karthik Raja', status: 'Pending Collection' },
];

export default function LabSamplesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Specimen Barcode Accessioning</Text>
        <Text style={styles.sub}>Chain of Custody & Sample Validation</Text>
      </View>
      <View style={styles.list}>
        {SAMPLES.map((s, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.row}>
              <QrCode size={20} color="#EA580C" />
              <Text style={styles.barcode}>{s.barcode}</Text>
            </View>
            <Text style={styles.type}>{s.type}</Text>
            <Text style={styles.patient}>Patient: {s.patient}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{s.status}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barcode: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  type: { fontSize: 13, color: '#EA580C', fontWeight: '600', marginTop: 4 },
  patient: { fontSize: 12, color: '#64748B', marginTop: 2 },
  tag: { backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#EA580C' },
});


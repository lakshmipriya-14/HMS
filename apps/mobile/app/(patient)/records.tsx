import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FileText, Pill, FlaskConical, Download } from 'lucide-react-native';

export default function PatientRecordsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>My Medical Records</Text>
      <Text style={styles.sub}>Prescriptions, diagnostic lab results, and discharge summaries</Text>

      {/* Prescriptions */}
      <Text style={styles.sectionTitle}>Prescriptions</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Pill size={20} color="#0F766E" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>Rx #RX-2026-0001 (Dr. Senthil Nathan)</Text>
            <Text style={styles.desc}>Ecosprin 75mg, Atorva 20mg, Pan 40mg</Text>
            <Text style={styles.date}>Date: 19 Nov 2026 • Dispensed</Text>
          </View>
        </View>
      </View>

      {/* Lab Reports */}
      <Text style={styles.sectionTitle}>Laboratory Reports</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <FlaskConical size={20} color="#0284C7" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>Cardiac Troponin I (High Sensitivity)</Text>
            <Text style={styles.desc}>Result: 0.12 ng/mL (Ref: 0.0 - 0.04) • Critical</Text>
            <Text style={styles.date}>Validated by Central Pathology Lab</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <FlaskConical size={20} color="#0284C7" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>Complete Blood Count (CBC)</Text>
            <Text style={styles.desc}>All parameters normal reference range</Text>
            <Text style={styles.date}>Validated by Central Pathology Lab</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginTop: 10, marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  desc: { fontSize: 11, color: '#475569', marginTop: 2 },
  date: { fontSize: 10, color: '#0F766E', fontWeight: '600', marginTop: 4 },
});


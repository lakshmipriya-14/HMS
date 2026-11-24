import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Scan, CheckCircle2 } from 'lucide-react-native';

const SCANS = [
  { id: '1', scanNo: 'RAD-101', patient: 'Ramasamy K.', modality: 'CT Coronary Angiogram', machine: 'Siemens 128-Slice CT', status: 'Scan Completed' },
  { id: '2', scanNo: 'RAD-102', patient: 'Vijay S.', modality: 'MRI Right Knee Joint', machine: 'GE 3.0T MRI Scanner', status: 'In Progress' },
  { id: '3', scanNo: 'RAD-103', patient: 'Deepa T.', modality: 'Chest X-Ray PA View', machine: 'Digital X-Ray Room 1', status: 'Scheduled' },
];

export default function RadiologyScansScreen() {
  const [scans, setScans] = useState(SCANS);

  const signOff = (id: string) => {
    setScans((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Report Signed Off' } : s))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Radiology Modality Worklist</Text>
        <Text style={styles.sub}>CT, MRI, Ultrasound & Digital Radiography</Text>
      </View>
      <View style={styles.list}>
        {scans.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{s.scanNo}</Text>
              </View>
              <Text style={styles.modalityTag}>{s.modality.split(' ')[0]}</Text>
            </View>

            <Text style={styles.patient}>{s.patient}</Text>
            <Text style={styles.modality}>{s.modality}</Text>
            <Text style={styles.machine}>Equipment: {s.machine}</Text>

            <View style={styles.actionRow}>
              <Text style={[styles.statusTag, s.status === 'Report Signed Off' ? styles.statusOk : styles.statusProgress]}>
                {s.status}
              </Text>
              {s.status !== 'Report Signed Off' && (
                <TouchableOpacity style={styles.btn} onPress={() => signOff(s.id)}>
                  <Text style={styles.btnText}>Sign-Off PACS Report</Text>
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
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#334155', fontWeight: '800', fontSize: 12 },
  modalityTag: { backgroundColor: '#CCFBF1', color: '#0F766E', fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  patient: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  modality: { fontSize: 13, color: '#0F766E', fontWeight: '600', marginTop: 2 },
  machine: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusProgress: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusOk: { backgroundColor: '#D1FAE5', color: '#065F46' },
  btn: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});


import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BedDouble, Activity, AlertCircle } from 'lucide-react-native';

const INPATIENTS = [
  { id: '1', bed: 'ICU-Bed-02', name: 'Subramanian V.', age: 62, diagnosis: 'Acute STEMI - Day 2 Post PTCA', vitals: 'BP 125/82 • HR 76 • SpO2 98%', status: 'Stable' },
  { id: '2', bed: 'Cardio-304A', name: 'Devi P.', age: 54, diagnosis: 'Decompensated Heart Failure', vitals: 'BP 110/70 • HR 88 • SpO2 94%', status: 'Review Needed' },
  { id: '3', bed: 'Cardio-308B', name: 'Muthukumar T.', age: 49, diagnosis: 'Unstable Angina', vitals: 'BP 138/88 • HR 82 • SpO2 99%', status: 'Stable' },
];

export default function DoctorInpatientsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inpatient Ward Census</Text>
        <Text style={styles.headerSub}>3 Admitted Patients under Dr. Senthil Nathan</Text>
      </View>

      <View style={styles.list}>
        {INPATIENTS.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.bedBadge}>
                <BedDouble size={16} color="#0F766E" />
                <Text style={styles.bedText}>{p.bed}</Text>
              </View>
              <View style={[styles.statusBadge, p.status === 'Review Needed' ? styles.statusAlert : styles.statusOk]}>
                <Text style={[styles.statusText, p.status === 'Review Needed' ? styles.alertText : styles.okText]}>{p.status}</Text>
              </View>
            </View>

            <Text style={styles.patientName}>{p.name}, {p.age} yrs</Text>
            <Text style={styles.diagnosis}>{p.diagnosis}</Text>

            <View style={styles.vitalsBox}>
              <Activity size={14} color="#0F766E" />
              <Text style={styles.vitalsText}>{p.vitals}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.roundBtn}>
                <Text style={styles.roundBtnText}>Record Daily Round Note</Text>
              </TouchableOpacity>
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
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bedText: { color: '#0F766E', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusOk: { backgroundColor: '#D1FAE5' },
  statusAlert: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '600' },
  okText: { color: '#065F46' },
  alertText: { color: '#991B1B' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  diagnosis: { fontSize: 13, color: '#475569', marginTop: 2 },
  vitalsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 8, borderRadius: 8, marginTop: 10 },
  vitalsText: { fontSize: 12, color: '#334155', fontWeight: '500', marginLeft: 6 },
  actionRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  roundBtn: { backgroundColor: '#0F766E', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  roundBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

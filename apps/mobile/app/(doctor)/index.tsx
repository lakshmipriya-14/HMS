import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stethoscope, Clock, CheckCircle2, ChevronRight, Phone } from 'lucide-react-native';

const INITIAL_QUEUE = [
  { id: '1', token: 'T-101', name: 'Ramasamy K.', age: 58, gender: 'M', issue: 'Post-CABG Follow-up', status: 'Waiting' },
  { id: '2', token: 'T-102', name: 'Meenakshi Sundaram', age: 44, gender: 'F', issue: 'Chest pain & Dyspnea', status: 'In Progress' },
  { id: '3', token: 'T-103', name: 'Karthik Raja', age: 32, gender: 'M', issue: 'Hypertension evaluation', status: 'Waiting' },
  { id: '4', token: 'T-104', name: 'Selvi Anbarasu', age: 67, gender: 'F', issue: 'ECG Abnormal Rhythm', status: 'Waiting' },
];

export default function DoctorOPDQueueScreen() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);

  const callNextPatient = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'Completed' } : item
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>OPD Clinic — Room 204</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Clinic Live</Text>
          </View>
        </View>
        <Text style={styles.bannerSub}>Dr. K. Senthil Nathan, MD, DM (Cardiology)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>18</Text>
            <Text style={styles.statLabel}>Today's Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>7</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>11</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Patient Queue List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Patient Queue</Text>
        {queue.map((patient) => (
          <View key={patient.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenText}>{patient.token}</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientMeta}>
                  {patient.gender}, {patient.age} yrs • {patient.issue}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <View
                style={[
                  styles.statusTag,
                  patient.status === 'Completed'
                    ? styles.statusCompleted
                    : patient.status === 'In Progress'
                    ? styles.statusInProgress
                    : styles.statusWaiting,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    patient.status === 'Completed'
                      ? styles.textCompleted
                      : patient.status === 'In Progress'
                      ? styles.textInProgress
                      : styles.textWaiting,
                  ]}
                >
                  {patient.status}
                </Text>
              </View>

              {patient.status !== 'Completed' && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => callNextPatient(patient.id)}
                >
                  <Text style={styles.actionBtnText}>Consult</Text>
                  <ChevronRight size={16} color="#fff" />
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
  banner: { backgroundColor: '#0F766E', padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSub: { color: '#99F6E4', fontSize: 12, marginTop: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#134E4A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 5 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.1)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#CCFBF1', fontSize: 10, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  tokenBadge: { backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginRight: 12 },
  tokenText: { color: '#0F766E', fontWeight: '800', fontSize: 14 },
  nameBlock: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  patientMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusWaiting: { backgroundColor: '#FEF3C7' },
  statusInProgress: { backgroundColor: '#DBEAFE' },
  statusCompleted: { backgroundColor: '#D1FAE5' },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  textWaiting: { color: '#92400E' },
  textInProgress: { color: '#1E40AF' },
  textCompleted: { color: '#065F46' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginRight: 4 },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { HeartPulse, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';

export default function NurseDashboardScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.greeting}>Good day, {user?.firstName || 'Nurse'}</Text>
        <Text style={styles.shiftText}>Assigned Ward: Intensive Coronary Care Unit (ICCU)</Text>
        <Text style={styles.shiftBadge}>Day Shift: 08:00 AM - 04:00 PM</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>8</Text>
          <Text style={styles.statLabel}>Admitted Patients</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#E11D48' }]}>1</Text>
          <Text style={styles.statLabel}>Critical Vitals</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>5</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
      </View>

      {/* Urgent Alert */}
      <View style={styles.alertCard}>
        <AlertCircle color="#DC2626" size={20} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.alertTitle}>Abnormal Vitals Flagged</Text>
          <Text style={styles.alertDesc}>Bed ICCU-01 (Muthuvel K): BP 138/88 elevated. Advised doctor recheck.</Text>
        </View>
      </View>

      {/* Immediate Care Queue */}
      <Text style={styles.sectionTitle}>Immediate Care Schedule</Text>
      <View style={styles.card}>
        <View style={styles.taskItem}>
          <Clock color="#0F766E" size={16} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.taskTitle}>Check Vitals & SpO2</Text>
            <Text style={styles.taskSub}>Bed ICCU-01 • Due in 15 mins</Text>
          </View>
          <TouchableOpacity style={styles.recordBtn}>
            <Text style={styles.recordBtnText}>Chart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskItem}>
          <Clock color="#0F766E" size={16} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.taskTitle}>Administer Ecosprin 75mg</Text>
            <Text style={styles.taskSub}>Bed ICCU-01 • Post-lunch dose</Text>
          </View>
          <TouchableOpacity style={styles.recordBtn}>
            <Text style={styles.recordBtnText}>Log Dose</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  banner: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  greeting: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  shiftText: { fontSize: 12, color: '#CCFBF1', marginTop: 4 },
  shiftBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#0F766E' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: { fontSize: 12, fontWeight: 'bold', color: '#991B1B' },
  alertDesc: { fontSize: 11, color: '#B91C1C', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taskTitle: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  taskSub: { fontSize: 10, color: '#64748B', marginTop: 1 },
  recordBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  recordBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});

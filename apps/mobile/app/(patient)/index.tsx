import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Pill, FlaskConical, Stethoscope, ChevronRight } from 'lucide-react-native';

export default function PatientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* UHID Welcome Card */}
      <View style={styles.uhidCard}>
        <Text style={styles.hospital}>Uyirinai Multispeciality Hospital</Text>
        <Text style={styles.patientName}>{user?.firstName || 'Muthuvel'} {user?.lastName || 'Karuppiah'}</Text>
        <View style={styles.uhidRow}>
          <Text style={styles.uhidLabel}>UHID:</Text>
          <Text style={styles.uhidCode}>KZN-2026-0001</Text>
        </View>
      </View>

      {/* Quick Action Grid */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/appointments')}
        >
          <Calendar color="#0F766E" size={24} />
          <Text style={styles.actionText}>Book Doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/records')}
        >
          <Pill color="#0284C7" size={24} />
          <Text style={styles.actionText}>Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/records')}
        >
          <FlaskConical color="#10B981" size={24} />
          <Text style={styles.actionText}>Lab Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointment */}
      <Text style={styles.sectionTitle}>Upcoming OPD Visit</Text>
      <View style={styles.card}>
        <View style={styles.aptRow}>
          <View style={styles.iconBox}>
            <Stethoscope color="#0F766E" size={20} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.docName}>Dr. Senthil Nathan</Text>
            <Text style={styles.docDept}>Cardiology & Heart Care</Text>
            <Text style={styles.aptTime}>Today at 10:00 AM • Token #1</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  uhidCard: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  hospital: { color: '#CCFBF1', fontSize: 11, fontWeight: '600' },
  patientName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  uhidRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  uhidLabel: { color: '#99F6E4', fontSize: 11 },
  uhidCode: { color: '#fff', fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' },
  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  actionText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  aptRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  docDept: { fontSize: 12, color: '#64748B', marginTop: 1 },
  aptTime: { fontSize: 11, color: '#0F766E', fontWeight: 'bold', marginTop: 4 },
});


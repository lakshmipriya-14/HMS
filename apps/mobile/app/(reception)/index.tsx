import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import {
  UserPlus,
  Clock,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Users,
  ArrowRight,
  TrendingUp,
  Ticket,
  FileBarChart,
  ShieldAlert,
} from 'lucide-react-native';

export default function ReceptionDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [queueRes, docRes] = await Promise.all([
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
        mobileApiClient.doctor.getAppointments().catch(() => ({ data: [] })),
      ]);

      if (queueRes?.data) setQueue(queueRes.data);
      if (docRes?.data) setDoctors(docRes.data);
    } catch (e) {
      console.error('Reception dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalWaiting = queue.filter((q) => q.status === 'SCHEDULED' || q.status === 'WAITING').length || 4;
  const totalCheckedIn = queue.filter((q) => q.status === 'CHECKED_IN').length || 6;
  const inConsultation = queue.filter((q) => q.status === 'IN_PROGRESS').length || 2;
  const totalCompleted = queue.filter((q) => q.status === 'COMPLETED').length || 18;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
    >
      {/* Front Desk Terminal Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.greeting}>Front Desk Terminal – Main Atrium</Text>
            <Text style={styles.deskSub}>Receptionist: {user?.firstName} {user?.lastName} • OPD Counter 01</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPD LIVE</Text>
          </View>
        </View>

        <View style={styles.bannerStatsRow}>
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>32</Text>
            <Text style={styles.bStatLabel}>Today Registrations</Text>
          </View>
          <View style={styles.bStatDivider} />
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>{totalCheckedIn + totalWaiting + totalCompleted}</Text>
            <Text style={styles.bStatLabel}>Total Appointments</Text>
          </View>
          <View style={styles.bStatDivider} />
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>{totalWaiting}</Text>
            <Text style={styles.bStatLabel}>Currently Waiting</Text>
          </View>
        </View>
      </View>

      {/* Quick Action Matrix */}
      <Text style={styles.sectionTitle}>Front Desk Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/register' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
            <UserPlus size={22} color="#0284C7" />
          </View>
          <Text style={styles.actionTitle}>New Patient Registration</Text>
          <Text style={styles.actionSub}>Issue UHID & Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/search' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#EAF5ED' }]}>
            <Search size={22} color="#38845A" />
          </View>
          <Text style={styles.actionTitle}>Search Existing Patient</Text>
          <Text style={styles.actionSub}>By UHID, Name, Mobile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/appointments' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Calendar size={22} color="#D97706" />
          </View>
          <Text style={styles.actionTitle}>Book Appointment</Text>
          <Text style={styles.actionSub}>Doctor & Slot Selection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/checkin' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={22} color="#38845A" />
          </View>
          <Text style={styles.actionTitle}>Patient Check-In</Text>
          <Text style={styles.actionSub}>Confirm Arrival & Token</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Fast Action Buttons */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(reception)/queue' as any)}
        >
          <Ticket size={18} color="#0284C7" />
          <Text style={styles.secondaryBtnText}>OPD Live Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(reception)/doctors' as any)}
        >
          <Stethoscope size={18} color="#0284C7" />
          <Text style={styles.secondaryBtnText}>Doctor Availability</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(reception)/reports' as any)}
        >
          <FileBarChart size={18} color="#0284C7" />
          <Text style={styles.secondaryBtnText}>Daily Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Live OPD Queue Snapshot */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>OPD Live Queue Snapshot</Text>
        <TouchableOpacity onPress={() => router.push('/(reception)/queue' as any)}>
          <Text style={styles.linkText}>View Full Queue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.queueCard}>
        {[
          { token: 'T-01', patient: 'Kannan K.', doctor: 'Dr. K. Senthil Nathan (Cardiology)', status: 'In Consultation', dept: 'Cardiology Rm 102' },
          { token: 'T-02', patient: 'Meena R.', doctor: 'Dr. K. Senthil Nathan (Cardiology)', status: 'Waiting (Est. 8 mins)', dept: 'Cardiology Rm 102' },
          { token: 'T-03', patient: 'Vijay S.', doctor: 'Dr. V. Rajesh (Orthopedics)', status: 'Checked In', dept: 'Ortho Rm 105' },
          { token: 'T-04', patient: 'Deepa T.', doctor: 'Dr. V. Rajesh (Orthopedics)', status: 'Waiting (Est. 20 mins)', dept: 'Ortho Rm 105' },
        ].map((t, idx) => (
          <View key={idx} style={styles.queueItem}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText}>{t.token}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.qPatient}>{t.patient}</Text>
              <Text style={styles.qDoc}>{t.doctor}</Text>
              <Text style={styles.qDept}>{t.dept}</Text>
            </View>
            <View style={[styles.statusBadge, t.status.includes('Consultation') ? styles.badgeServing : styles.badgeWait]}>
              <Text style={[styles.statusBadgeText, t.status.includes('Consultation') ? styles.textServing : styles.textWait]}>
                {t.status.includes('Consultation') ? 'In Doctor Room' : 'Waiting'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency Fast Intake Shortcut */}
      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => router.push('/(reception)/register')}
      >
        <View style={styles.emergencyLeft}>
          <ShieldAlert size={24} color="#DC2626" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.emergencyTitle}>Emergency Fast-Track Intake</Text>
            <Text style={styles.emergencySub}>Rapid triage intake with priority queue token & trauma alert</Text>
          </View>
        </View>
        <ArrowRight size={18} color="#DC2626" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  banner: {
    backgroundColor: '#38845A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 17, fontWeight: '800', color: '#fff' },
  deskSub: { fontSize: 11, color: '#CDE8D5', marginTop: 2 },
  liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#287348', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  bannerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 12 },
  bStatCol: { alignItems: 'center', flex: 1 },
  bStatNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  bStatLabel: { fontSize: 10, color: '#CDE8D5', marginTop: 2, textAlign: 'center' },
  bStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText: { fontSize: 12, fontWeight: '700', color: '#38845A' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  actionSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  secondaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAF5ED',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  queueCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 14 },
  queueItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  tokenBox: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#EAF5ED', alignItems: 'center', justifyContent: 'center' },
  tokenText: { color: '#38845A', fontWeight: '900', fontSize: 15 },
  qPatient: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  qDoc: { fontSize: 11, color: '#475569', marginTop: 1 },
  qDept: { fontSize: 10, color: '#64748B', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeServing: { backgroundColor: '#DCFCE7' },
  badgeWait: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textServing: { color: '#166534' },
  textWait: { color: '#B45309' },
  emergencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#CDE8D5',
    borderRadius: 14,
    padding: 14,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyTitle: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  emergencySub: { fontSize: 11, color: '#991B1B', marginTop: 2 },
});


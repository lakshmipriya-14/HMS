import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import {
  UserPlus,
  Clock,
  Search,
  Calendar,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
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
  const [patientsCount, setPatientsCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [queueRes, patientsRes] = await Promise.all([
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
        mobileApiClient.patients.list().catch(() => ({ data: [] })),
      ]);

      if (Array.isArray(queueRes?.data)) setQueue(queueRes.data);
      if (Array.isArray(patientsRes?.data)) setPatientsCount(patientsRes.data.length);
    } catch (e) {
      console.error('Reception dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      const interval = setInterval(() => {
        void loadData();
      }, 15_000);
      return () => clearInterval(interval);
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const totalWaiting = queue.filter((q) => q.status === 'SCHEDULED' || q.status === 'WAITING').length;
  const totalCheckedIn = queue.filter((q) => q.status === 'CHECKED_IN').length;
  const inConsultation = queue.filter((q) => q.status === 'IN_PROGRESS').length;
  const activeAppointments = totalWaiting + totalCheckedIn + inConsultation;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
    >
      {/* Front Desk Terminal Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.greeting}>Front Desk Terminal</Text>
            <Text style={styles.deskSub}>
              Receptionist: {user?.firstName} {user?.lastName} · {user?.branchName || 'OPD Counter'}
            </Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPD LIVE</Text>
          </View>
        </View>

        <View style={styles.bannerStatsRow}>
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>{patientsCount}</Text>
            <Text style={styles.bStatLabel}>Branch Patients</Text>
          </View>
          <View style={styles.bStatDivider} />
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>{queue.length}</Text>
            <Text style={styles.bStatLabel}>Today Appointments</Text>
          </View>
          <View style={styles.bStatDivider} />
          <View style={styles.bStatCol}>
            <Text style={styles.bStatNum}>{activeAppointments}</Text>
            <Text style={styles.bStatLabel}>Active Queue</Text>
          </View>
        </View>
      </View>

      {/* Quick Action Matrix */}
      <Text style={styles.sectionTitle}>Front Desk Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push({ pathname: '/(reception)/appointments', params: { mode: 'walkin' } } as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Calendar size={22} color="#F59E0B" />
          </View>
          <Text style={styles.actionTitle}>Walk-in Appointment</Text>
          <Text style={styles.actionSub}>Patient, Doctor & Slot</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/register' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E8F1FC' }]}>
            <UserPlus size={22} color="#1565C0" />
          </View>
          <Text style={styles.actionTitle}>New Patient Registration</Text>
          <Text style={styles.actionSub}>Issue UHID & Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/search' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E8F1FC' }]}>
            <Search size={22} color="#1565C0" />
          </View>
          <Text style={styles.actionTitle}>Search Patient</Text>
          <Text style={styles.actionSub}>By UHID, Name, Mobile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(reception)/checkin' as any)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={22} color="#1565C0" />
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
          <Ticket size={18} color="#1565C0" />
          <Text style={styles.secondaryBtnText}>OPD Live Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(reception)/doctors' as any)}
        >
          <Stethoscope size={18} color="#1565C0" />
          <Text style={styles.secondaryBtnText}>Doctor Availability</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(reception)/reports' as any)}
        >
          <FileBarChart size={18} color="#1565C0" />
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
        {loading && queue.length === 0 ? (
          <ActivityIndicator style={{ paddingVertical: 16 }} color="#1565C0" />
        ) : queue.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', paddingVertical: 14 }}>
            No appointments scheduled for today yet. Use Walk-in Appointment to add patients.
          </Text>
        ) : (
          queue.slice(0, 5).map((item) => {
            const docUser = item.doctor?.employee?.user;
            const doctorName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Consultant Doctor';
            const isServing = item.status === 'IN_PROGRESS';
            return (
              <View key={item.id} style={styles.queueItem}>
                <View style={styles.tokenBox}>
                  <Text style={styles.tokenText}>T-{item.tokenNumber}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.qPatient}>
                    {item.patient?.firstName} {item.patient?.lastName} ({item.patient?.uhid})
                  </Text>
                  <Text style={styles.qDoc}>
                    {doctorName} ({item.department?.name || 'OPD'})
                  </Text>
                  <Text style={styles.qDept}>
                    {item.appointmentNumber} · {item.appointmentTime} IST ·{' '}
                    {item.source === 'RECEPTION_WALK_IN' ? 'Walk-in' : 'Online'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, isServing ? styles.badgeServing : styles.badgeWait]}>
                  <Text style={[styles.statusBadgeText, isServing ? styles.textServing : styles.textWait]}>
                    {String(item.status).replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
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
    backgroundColor: '#1565C0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  deskSub: { fontSize: 11, color: '#BFDBFE', marginTop: 2 },
  liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1565C0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  bannerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', padding: 12, borderRadius: 12 },
  bStatCol: { alignItems: 'center', flex: 1 },
  bStatNum: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  bStatLabel: { fontSize: 10, color: '#BFDBFE', marginTop: 2, textAlign: 'center' },
  bStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#183153', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
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
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#183153' },
  actionSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  secondaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8F1FC',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  queueCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 14 },
  queueItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  tokenBox: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  tokenText: { color: '#1565C0', fontWeight: '900', fontSize: 15 },
  qPatient: { fontSize: 14, fontWeight: '800', color: '#183153' },
  qDoc: { fontSize: 11, color: '#475569', marginTop: 1 },
  qDept: { fontSize: 10, color: '#64748B', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeServing: { backgroundColor: '#DCFCE7' },
  badgeWait: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textServing: { color: '#16A34A' },
  textWait: { color: '#F59E0B' },
  emergencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyTitle: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  emergencySub: { fontSize: 11, color: '#DC2626', marginTop: 2 },
});


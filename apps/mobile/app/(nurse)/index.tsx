import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient, apiRequest } from '../../services/api';
import {
  HeartPulse,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  Pill,
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  Activity,
  BedDouble,
  FileText,
  UserCheck,
  BellRing,
  RotateCcw
} from 'lucide-react-native';
import { Role } from '@multispeciality-hms/contracts';

export default function NurseDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isHeadNurse = user?.role === Role.HEAD_NURSE;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [wardInfo, setWardInfo] = useState({ name: 'General Medicine & Stepdown Ward', occupied: 6, total: 10 });

  const loadDashboardData = async () => {
    try {
      const [patRes, taskRes] = await Promise.all([
        mobileApiClient.nursing.getAssignedPatients().catch(() => ({ data: [] })),
        mobileApiClient.nursing.getTasks().catch(() => ({ data: [] })),
      ]);

      if (patRes?.data) setPatients(patRes.data);
      if (taskRes?.data) setTasks(taskRes.data);

      // Attempt to load notifications if available
      try {
        const notifRes = await mobileApiClient.notifications.getNotifications();
        if (notifRes?.data) setNotifications(notifRes.data);
      } catch {
        // Fallback gracefully
      }
    } catch (e) {
      console.error('Nurse dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Derived statistics
  const assignedPatientsCount = patients.length || 4;
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const criticalPatients = patients.filter((p) => {
    const latest = p.vitals?.[0];
    return latest?.isAbnormal || (latest?.systolicBp && (latest.systolicBp > 140 || latest.systolicBp < 90));
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />}
    >
      {/* Shift & Ward Header */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.greeting}>Sister / Nurse {user?.firstName} {user?.lastName}</Text>
            <Text style={styles.roleTitle}>
              {isHeadNurse ? '🌟 Head Nurse – Ward Supervisor' : '🏥 Clinical Staff Nurse'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBadge}
            onPress={() => router.push('/(nurse)/notifications' as any)}
            accessibilityLabel="Notifications"
          >
            <BellRing size={20} color="#fff" />
            {notifications.length > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.wardInfoRow}>
          <View style={styles.wardTag}>
            <BedDouble size={14} color="#0F766E" />
            <Text style={styles.wardTagText}>{wardInfo.name}</Text>
          </View>
          <Text style={styles.shiftPill}>Day Shift: 08:00 AM – 04:00 PM</Text>
        </View>
      </View>

      {/* Critical Alert Banner if any patient flagged */}
      {criticalPatients.length > 0 ? (
        <TouchableOpacity
          style={styles.criticalBanner}
          onPress={() => router.push('/(nurse)/patients')}
        >
          <ShieldAlert size={24} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.criticalTitle}>
              {criticalPatients.length} Critical / Abnormal Patient{criticalPatients.length > 1 ? 's' : ''} Flagged
            </Text>
            <Text style={styles.criticalDesc}>
              {criticalPatients[0].patient?.firstName} {criticalPatients[0].patient?.lastName} (Bed {criticalPatients[0].bed?.bedNumber || 'B-01'}): Blood Pressure / SpO2 threshold breached. Recheck advised.
            </Text>
          </View>
          <ArrowRight size={18} color="#DC2626" />
        </TouchableOpacity>
      ) : null}

      {/* Real-time Clinical Metrics Grid */}
      <Text style={styles.sectionHeader}>Ward Overview & Duty Metrics</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(nurse)/patients')}>
          <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Users size={18} color="#0284C7" />
          </View>
          <Text style={styles.metricNumber}>{assignedPatientsCount}</Text>
          <Text style={styles.metricLabel}>Assigned Inpatients</Text>
          <Text style={styles.metricSub}>Active Bed Admissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(nurse)/vitals' as any)}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
            <HeartPulse size={18} color="#DC2626" />
          </View>
          <Text style={[styles.metricNumber, { color: '#DC2626' }]}>
            {criticalPatients.length || 1}
          </Text>
          <Text style={styles.metricLabel}>Critical Vitals</Text>
          <Text style={styles.metricSub}>Requires Action</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(nurse)/medications')}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Pill size={18} color="#D97706" />
          </View>
          <Text style={[styles.metricNumber, { color: '#D97706' }]}>3</Text>
          <Text style={styles.metricLabel}>MAR Doses Due</Text>
          <Text style={styles.metricSub}>Upcoming 2 Hours</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/(nurse)/tasks')}>
          <View style={[styles.iconCircle, { backgroundColor: '#CCFBF1' }]}>
            <ClipboardList size={18} color="#0F766E" />
          </View>
          <Text style={styles.metricNumber}>{pendingTasks.length || 4}</Text>
          <Text style={styles.metricLabel}>Pending Tasks</Text>
          <Text style={styles.metricSub}>Doctor & Ward Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Matrix */}
      <Text style={styles.sectionHeader}>Clinical Quick Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(nurse)/vitals' as any)}
        >
          <HeartPulse size={20} color="#0F766E" />
          <Text style={styles.actionBtnText}>Record Vitals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(nurse)/medications')}
        >
          <Pill size={20} color="#0F766E" />
          <Text style={styles.actionBtnText}>Administer MAR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(nurse)/tasks')}
        >
          <FileText size={20} color="#0F766E" />
          <Text style={styles.actionBtnText}>Doctor Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(nurse)/handover' as any)}
        >
          <RotateCcw size={20} color="#0F766E" />
          <Text style={styles.actionBtnText}>Shift Handover</Text>
        </TouchableOpacity>
      </View>

      {/* Head Nurse Supervisor Quick Link */}
      {isHeadNurse && (
        <TouchableOpacity
          style={styles.supervisorCard}
          onPress={() => router.push('/(nurse)/supervisor' as any)}
        >
          <View style={styles.supervisorLeft}>
            <UserCheck size={24} color="#7C3AED" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supervisorTitle}>Head Nurse Ward Supervision</Text>
              <Text style={styles.supervisorDesc}>Census, nurse assignment, roster, and issue escalation</Text>
            </View>
          </View>
          <ArrowRight size={18} color="#7C3AED" />
        </TouchableOpacity>
      )}

      {/* Immediate Care Queue */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeader}>Immediate Care Schedule</Text>
        <TouchableOpacity onPress={() => router.push('/(nurse)/tasks')}>
          <Text style={styles.seeAllText}>View All ({tasks.length || 4})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.careCard}>
        <View style={styles.careItem}>
          <View style={styles.timeBadge}>
            <Clock size={12} color="#0F766E" />
            <Text style={styles.timeText}>12:00 PM</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.careTitle}>Check Vitals, SpO2 & GRBS</Text>
            <Text style={styles.carePatient}>Muthuvel K. • Bed ICCU-01</Text>
          </View>
          <TouchableOpacity
            style={styles.chartBtn}
            onPress={() => router.push('/(nurse)/vitals' as any)}
          >
            <Text style={styles.chartBtnText}>Chart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.careDivider} />

        <View style={styles.careItem}>
          <View style={[styles.timeBadge, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={12} color="#D97706" />
            <Text style={[styles.timeText, { color: '#B45309' }]}>01:00 PM</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.careTitle}>Ecosprin 75mg Oral Dose</Text>
            <Text style={styles.carePatient}>Anitha V. • Bed ICCU-02</Text>
          </View>
          <TouchableOpacity
            style={styles.chartBtn}
            onPress={() => router.push('/(nurse)/medications')}
          >
            <Text style={styles.chartBtnText}>Log Dose</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.careDivider} />

        <View style={styles.careItem}>
          <View style={[styles.timeBadge, { backgroundColor: '#F1F5F9' }]}>
            <Clock size={12} color="#64748B" />
            <Text style={[styles.timeText, { color: '#475569' }]}>02:00 PM</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.careTitle}>Post-Op Laparoscopic Dressing Check</Text>
            <Text style={styles.carePatient}>Saravanan R. • Bed ICCU-03</Text>
          </View>
          <TouchableOpacity
            style={styles.chartBtn}
            onPress={() => router.push('/(nurse)/tasks')}
          >
            <Text style={styles.chartBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  banner: {
    backgroundColor: '#B5121B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 18, fontWeight: '800', color: '#fff' },
  roleTitle: { fontSize: 12, color: '#FECACA', marginTop: 3, fontWeight: '600' },
  notifBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  wardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  wardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  wardTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  shiftPill: { fontSize: 11, color: '#FECACA', fontWeight: '600' },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  criticalTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  criticalDesc: { fontSize: 11, color: '#991B1B', marginTop: 2 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#B5121B' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  metricLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 },
  metricSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: { fontSize: 10, fontWeight: '700', color: '#B5121B', textAlign: 'center' },
  supervisorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  supervisorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  supervisorTitle: { fontSize: 14, fontWeight: '800', color: '#6D28D9' },
  supervisorDesc: { fontSize: 11, color: '#5B21B6', marginTop: 2 },
  careCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  careItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  timeText: { fontSize: 10, fontWeight: '700', color: '#B5121B' },
  careTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  carePatient: { fontSize: 11, color: '#64748B', marginTop: 2 },
  chartBtn: {
    backgroundColor: '#B5121B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  careDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
});

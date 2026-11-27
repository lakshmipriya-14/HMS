import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BedDouble,
  Users,
  Activity,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  Building2,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  DoorOpen,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminMobileDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.hospitalAdmin.getDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load mobile admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const overview = data?.overview || {};
  const revenue = data?.revenue || {};
  const depts = data?.departmentPerformance || [];
  const approvals = data?.approvals || {};
  const alerts = data?.criticalAlerts || [];
  const activities = data?.recentActivity || [];

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Executive Hospital Command"
        alertsCount={alerts.length + (approvals.pendingBedTurnovers || 0)}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Fetching live hospital telemetry...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchTelemetry} tintColor="#1565C0" />
          }
        >
          {/* Quick Critical Banner if alerts exist */}
          {alerts.length > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => router.push('/(admin)/approvals')}
            >
              <ShieldAlert size={18} color="#DC2626" />
              <View style={styles.alertTextWrapper}>
                <Text style={styles.alertTitle}>{alerts[0].title}</Text>
                <Text style={styles.alertSub}>{alerts[0].message}</Text>
              </View>
              <ChevronRight size={16} color="#DC2626" />
            </TouchableOpacity>
          )}

          {/* Quick OPD & IPD Operational Launch Cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#E8F1FC',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                padding: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
              onPress={() => router.push('/(admin)/opd')}
            >
              <CalendarCheck size={20} color="#1565C0" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1565C0' }}>OPD Operations</Text>
                <Text style={{ fontSize: 10, color: '#00897B' }}>Tokens & Booking</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#FEE2E2',
                borderWidth: 1,
                borderColor: '#FEE2E2',
                padding: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
              onPress={() => router.push('/(admin)/ipd')}
            >
              <DoorOpen size={20} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>IPD Management</Text>
                <Text style={{ fontSize: 10, color: '#DC2626' }}>Census & Admissions</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* KPI Matrix (2 Columns) */}
          <View style={styles.matrixGrid}>
            {/* Bed Occupancy */}
            <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/ipd')}>
              <View style={styles.kpiHeader}>
                <BedDouble size={18} color="#1565C0" />
                <View style={[styles.kpiBadge, { backgroundColor: '#E8F1FC' }]}>
                  <Text style={[styles.kpiBadgeText, { color: '#1565C0' }]}>
                    {overview.bedOccupancyRate || 0}%
                  </Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>
                {overview.occupiedBeds || 0} / {overview.totalBeds || 0}
              </Text>
              <Text style={styles.kpiLabel}>Inpatient Beds Occupied</Text>
              <Text style={styles.kpiSub}>
                {overview.availableBeds || 0} beds available
              </Text>
            </TouchableOpacity>

            {/* OPD & Registered Patients */}
            <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/opd')}>
              <View style={styles.kpiHeader}>
                <CalendarCheck size={18} color="#1565C0" />
                <View style={[styles.kpiBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.kpiBadgeText, { color: '#1565C0' }]}>Today</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{overview.todayOpdPatients || 0}</Text>
              <Text style={styles.kpiLabel}>Today's OPD Visits</Text>
              <Text style={styles.kpiSub}>
                {overview.totalPatients || 0} registered patients
              </Text>
            </TouchableOpacity>

            {/* Inpatients & Emergency */}
            <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/ipd')}>
              <View style={styles.kpiHeader}>
                <Activity size={18} color="#DC2626" />
                <View style={[styles.kpiBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.kpiBadgeText, { color: '#DC2626' }]}>IPD</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{overview.currentIpdPatients || 0}</Text>
              <Text style={styles.kpiLabel}>Admitted Inpatients</Text>
              <Text style={styles.kpiSub}>
                {overview.emergencyPatients || 0} emergency cases
              </Text>
            </TouchableOpacity>

            {/* Doctors Available */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Users size={18} color="#16A34A" />
                <View style={[styles.kpiBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.kpiBadgeText, { color: '#16A34A' }]}>On Duty</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>
                {overview.availableDoctorsToday || 0} / {overview.totalDoctors || 0}
              </Text>
              <Text style={styles.kpiLabel}>Doctors Available</Text>
              <Text style={styles.kpiSub}>
                {overview.activeStaff || 0} total active staff
              </Text>
            </View>
          </View>

          {/* Financial Telemetry Banner */}
          <View style={styles.financeCard}>
            <View style={styles.financeHeader}>
              <View style={styles.financeIconWrapper}>
                <TrendingUp size={20} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.financeSub}>Collected Hospital Revenue</Text>
                <Text style={styles.financeMain}>
                  ₹ {(revenue.today || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={styles.financeDivider} />
            <View style={styles.financeRow}>
              <View>
                <Text style={styles.financeMetaLabel}>7-Day Total</Text>
                <Text style={styles.financeMetaVal}>
                  ₹ {(revenue.weekly || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.financeMetaLabel}>30-Day Total</Text>
                <Text style={styles.financeMetaVal}>
                  ₹ {(revenue.monthly || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Department Performance Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Department Performance</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/departments')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {depts.slice(0, 4).map((d: any) => (
            <TouchableOpacity
              key={d.id}
              style={styles.deptCard}
              onPress={() => router.push('/(admin)/departments')}
            >
              <View style={styles.deptHeader}>
                <View style={styles.deptIcon}>
                  <Building2 size={16} color="#1565C0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deptName}>{d.name}</Text>
                  <Text style={styles.deptSub}>
                    HOD: {d.hod?.user?.name || 'Unassigned'}
                  </Text>
                </View>
                <View style={styles.deptStatBadge}>
                  <Text style={styles.deptStatText}>{d.activePatients || 0} Patients</Text>
                </View>
              </View>
              <View style={styles.deptFooter}>
                <Text style={styles.deptMeta}>
                  👨‍⚕️ {d.doctorCount || 0} Doctors • 🛏️ {d.wardsCount || 0} Wards • 📅 {d.appointmentsToday || 0} OPD
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Executive Quick Links */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Operational Modules</Text>
          </View>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/(admin)/doctors')}
            >
              <Users size={20} color="#1565C0" />
              <Text style={styles.quickBtnText}>Doctors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/(admin)/staff')}
            >
              <Users size={20} color="#1565C0" />
              <Text style={styles.quickBtnText}>Staff & HR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/(admin)/wards')}
            >
              <BedDouble size={20} color="#DC2626" />
              <Text style={styles.quickBtnText}>Beds & Wards</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/(admin)/fleet')}
            >
              <Activity size={20} color="#F59E0B" />
              <Text style={styles.quickBtnText}>108 Fleet</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Hospital Activities */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Recent Activity Stream</Text>
          </View>
          <View style={styles.activityBox}>
            {activities.length === 0 ? (
              <Text style={styles.emptyActivity}>No recent audit records found.</Text>
            ) : (
              activities.slice(0, 5).map((act: any) => (
                <View key={act.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityAction}>{act.action}</Text>
                    <Text style={styles.activityMeta}>
                      {act.user?.name || 'System'} • {act.resource} •{' '}
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 13, color: '#64748B', marginTop: 10, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  alertBanner: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  alertTextWrapper: { flex: 1 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  alertSub: { fontSize: 11, color: '#DC2626', marginTop: 2 },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#183153',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  financeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F1FC',
    marginBottom: 20,
    shadowColor: '#1565C0',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  financeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  financeIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  financeMain: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1565C0',
    marginTop: 2,
  },
  financeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  financeMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#183153',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#183153',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deptIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#183153',
  },
  deptSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deptStatBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptStatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1565C0',
  },
  deptFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  deptMeta: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  activityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1565C0',
  },
  activityAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#183153',
  },
  activityMeta: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  emptyActivity: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

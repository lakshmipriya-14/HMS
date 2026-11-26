import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  BedDouble,
  Users,
  Activity,
  AlertTriangle,
  CalendarCheck,
  Building2,
  ChevronRight,
  Clock,
  CheckCircle2,
  DoorOpen,
  FlaskConical,
  Scan,
  UserCheck,
  CalendarOff,
  Layers,
  Wrench,
  Pill,
  Bell,
  Stethoscope,
  BarChart3,
  ShoppingCart,
  Hammer,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentAdminMobileDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');

  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load department admin mobile telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTelemetry();
    }, [])
  );

  const stats = {
    ...(data?.stats || {}),
    ...(data?.metrics || {}),
    todayOpd: data?.metrics?.todayOpdRegistrations ?? data?.stats?.todayOpd ?? 0,
    currentIpd: data?.metrics?.currentIpdPatients ?? data?.stats?.currentIpd ?? 0,
  };
  const department = data?.department || {};
  const recentActivities = data?.recentActivities || [];
  const alerts = data?.alerts || data?.notifications || [];
  const unreadAlerts = alerts.filter((a: any) => !a.isRead);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38845A" />
        <Text style={styles.loadingText}>Loading Department Command...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader
        title={department.name ? `${department.name} Command` : 'Department Command'}
        subtitle="Operational & Clinical Overview"
        alertsCount={unreadAlerts.length}
        notificationHref="/(department-admin)/notifications"
      />

      {/* Date Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterTitle}>Scope:</Text>
        {(['today', 'week', 'month'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setDateFilter(filter)}
            style={[styles.filterChip, dateFilter === filter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, dateFilter === filter && styles.filterChipTextActive]}>
              {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTelemetry} tintColor="#38845A" />
        }
      >
        {/* Department Info Header Banner (Clickable -> Module 2: Dept Info) */}
        <TouchableOpacity
          style={styles.deptBanner}
          onPress={() => router.push('/(department-admin)/info')}
          activeOpacity={0.8}
        >
          <View style={styles.deptIconCircle}>
            <Building2 size={24} color="#38845A" />
          </View>
          <View style={styles.deptTextCol}>
            <Text style={styles.deptName}>{department.name || 'Department Workspace'}</Text>
            <Text style={styles.deptMeta}>
              Code: {department.code || 'DEPT'} • Capacity: {department.capacity || 40} Beds
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Core KPI Matrix (Clickable Statistics) */}
        <Text style={styles.sectionTitle}>Census & Activity</Text>
        <View style={styles.kpiGrid}>
          {/* Appointments -> Module 8 */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(department-admin)/appointments')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#EAF5ED' }]}>
              <CalendarCheck size={18} color="#38845A" />
            </View>
            <Text style={styles.kpiValue}>{stats.todayAppointments ?? 0}</Text>
            <Text style={styles.kpiLabel}>Appointments</Text>
          </TouchableOpacity>

          {/* Today's OPD -> Module 9 */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(department-admin)/opd')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Users size={18} color="#0284C7" />
            </View>
            <Text style={styles.kpiValue}>{stats.todayOpd ?? 0}</Text>
            <Text style={styles.kpiLabel}>Today's OPD</Text>
          </TouchableOpacity>

          {/* Current IPD -> Module 10 */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(department-admin)/ipd')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#EDE9FE' }]}>
              <DoorOpen size={18} color="#7C3AED" />
            </View>
            <Text style={styles.kpiValue}>{stats.currentIpd ?? 0}</Text>
            <Text style={styles.kpiLabel}>Current IPD</Text>
          </TouchableOpacity>

          {/* Bed Occupancy -> Module 11 */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(department-admin)/wards-beds')}
            activeOpacity={0.7}
          >
            <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
              <BedDouble size={18} color="#D97706" />
            </View>
            <Text style={styles.kpiValue}>
              {stats.occupiedBeds ?? 0}/{stats.totalBeds ?? 0}
            </Text>
            <Text style={styles.kpiLabel}>Bed Occupancy</Text>
          </TouchableOpacity>
        </View>

        {/* Staff & Doctor Availability (Modules 3-6) */}
        <Text style={styles.sectionTitle}>Medical Staff & Attendance</Text>
        <View style={styles.twoColRow}>
          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => router.push('/(department-admin)/doctors')}
            activeOpacity={0.8}
          >
            <View style={styles.summaryTop}>
              <UserCheck size={20} color="#38845A" />
              <ChevronRight size={16} color="#94A3B8" />
            </View>
            <Text style={styles.summaryNumber}>
              {stats.availableDoctors ?? 0}/{stats.totalDoctors ?? 0}
            </Text>
            <Text style={styles.summarySubtitle}>Doctors on Duty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => router.push('/(department-admin)/staff')}
            activeOpacity={0.8}
          >
            <View style={styles.summaryTop}>
              <Users size={20} color="#0284C7" />
              <ChevronRight size={16} color="#94A3B8" />
            </View>
            <Text style={styles.summaryNumber}>
              {stats.availableStaff ?? 0}/{stats.totalStaff ?? 0}
            </Text>
            <Text style={styles.summarySubtitle}>Staff Present</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Requests & Clinical Throughput (Clickable to respective modules) */}
        <Text style={styles.sectionTitle}>Pending Requests & Orders</Text>
        <View style={styles.requestsGrid}>
          {/* Admissions -> Module 12 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/admissions')}
            activeOpacity={0.7}
          >
            <Text style={styles.requestMiniCount}>{stats.pendingAdmissions ?? 0}</Text>
            <Text style={styles.requestMiniLabel}>Admissions</Text>
          </TouchableOpacity>

          {/* Discharges -> Module 13 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/discharges')}
            activeOpacity={0.7}
          >
            <Text style={styles.requestMiniCount}>{stats.pendingDischarges ?? 0}</Text>
            <Text style={styles.requestMiniLabel}>Discharges</Text>
          </TouchableOpacity>

          {/* Lab Orders -> Module 14 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/lab-requests')}
            activeOpacity={0.7}
          >
            <Text style={[styles.requestMiniCount, { color: '#38845A' }]}>
              {stats.pendingLabRequests ?? 0}
            </Text>
            <Text style={styles.requestMiniLabel}>Lab Orders</Text>
          </TouchableOpacity>

          {/* Radiology -> Module 15 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/radiology-requests')}
            activeOpacity={0.7}
          >
            <Text style={[styles.requestMiniCount, { color: '#0284C7' }]}>
              {stats.pendingRadiologyRequests ?? 0}
            </Text>
            <Text style={styles.requestMiniLabel}>Radiology</Text>
          </TouchableOpacity>

          {/* Leaves -> Module 19 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/leaves')}
            activeOpacity={0.7}
          >
            <Text style={[styles.requestMiniCount, { color: '#DC2626' }]}>
              {stats.pendingLeaves ?? 0}
            </Text>
            <Text style={styles.requestMiniLabel}>Staff Leaves</Text>
          </TouchableOpacity>

          {/* Maintenance -> Module 23 */}
          <TouchableOpacity
            style={styles.requestMiniCard}
            onPress={() => router.push('/(department-admin)/maintenance-requests')}
            activeOpacity={0.7}
          >
            <Text style={[styles.requestMiniCount, { color: '#D97706' }]}>
              {stats.pendingMaintenanceRequests ?? 0}
            </Text>
            <Text style={styles.requestMiniLabel}>Maintenance</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Launchpad to All Major Workspaces */}
        <Text style={styles.sectionTitle}>Operational Modules</Text>
        <View style={styles.quickActionsList}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(department-admin)/operations')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F1F5F9' }]}>
              <BedDouble size={20} color="#334155" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Wards & Inpatients Hub</Text>
              <Text style={styles.actionDesc}>Live bed census, admissions, and discharges</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(department-admin)/patients')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EAF5ED' }]}>
              <Activity size={20} color="#38845A" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Patient Directory</Text>
              <Text style={styles.actionDesc}>Lookup UHID, OPD visits, and department files</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(department-admin)/inventory')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Pill size={20} color="#0284C7" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Supplies & Inventory</Text>
              <Text style={styles.actionDesc}>Consumables, drugs, and restock requests</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(department-admin)/approvals-hub')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Layers size={20} color="#D97706" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Requisitions & Approvals Hub</Text>
              <Text style={styles.actionDesc}>Central ledger for all requests and tickets</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(department-admin)/reports')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <BarChart3 size={20} color="#7C3AED" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>Reports & Analytics</Text>
              <Text style={styles.actionDesc}>OPD/IPD census, doctor volume, and occupancy</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Recent Department Activity Log (Module 26) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Department Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(department-admin)/activity-history')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityBox}>
          {recentActivities.length === 0 ? (
            <Text style={styles.emptyActivityText}>No recent activity logged</Text>
          ) : (
            recentActivities.slice(0, 4).map((item: any, idx: number) => (
              <View key={item.id || idx} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{item.action}</Text>
                  <Text style={styles.activityDetails}>
                    {typeof item.details === 'string' ? item.details : item.details?.notes || item.module}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.createdAt || Date.now()).toLocaleTimeString([], {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#38845A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  deptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deptIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deptTextCol: {
    flex: 1,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38845A',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  summarySubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  requestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  requestMiniCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requestMiniCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  requestMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  quickActionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyActivityText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38845A',
    marginTop: 4,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
});

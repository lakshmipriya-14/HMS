import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ShieldCheck,
  Users,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Layers,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import type { SuperAdminDashboardDto } from '@multispeciality-hms/contracts';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { UyirinaiTheme as theme } from '../../constants/theme';
import { SuperAdminHeader } from '../../components/SuperAdminHeader';

export default function SuperAdminHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const kpiCardWidth = width > 1024 ? '23.8%' : width > 520 ? '48.5%' : '100%';

  const stats = useQuery<SuperAdminDashboardDto>({
    queryKey: ['super-admin-dashboard', user?.hospitalId, user?.id],
    retry: false,
    queryFn: async () => {
      const response = await mobileApiClient.admin.getSuperAdminDashboard();
      if (!response.data) throw new Error('Dashboard metrics are unavailable.');
      return response.data;
    },
  });

  const isRefreshing = stats.isRefetching;

  return (
    <View style={styles.root}>
      <SuperAdminHeader currentTitle="Overview" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void stats.refetch();
            }}
          />
        }
      >
        {/* Header Hero Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerLeft}>
            <View style={styles.shieldIcon}>
              <ShieldCheck color="#fff" size={26} />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Super Admin Dashboard</Text>
              <Text style={styles.bannerSubtitle}>
                Executive Control Hub · {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
          <View style={styles.hospitalPill}>
            <Text style={styles.hospitalPillText}>UYIRINAI CENTRAL SYSTEM</Text>
          </View>
        </View>

        {/* Quick Module Navigation Bar */}
        <View style={styles.quickNav}>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/(super-admin)/branches' as any)}
          >
            <Building2 size={16} color={theme.colors.primary} />
            <Text style={styles.quickNavText}>Branches</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/(super-admin)/admins' as any)}
          >
            <UserCheck size={16} color={theme.colors.primary} />
            <Text style={styles.quickNavText}>Admins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/(super-admin)/users' as any)}
          >
            <Users size={16} color={theme.colors.primary} />
            <Text style={styles.quickNavText}>All Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/(super-admin)/reports' as any)}
          >
            <FileText size={16} color={theme.colors.primary} />
            <Text style={styles.quickNavText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Loading / Error States */}
        {stats.isPending && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading hospital database metrics...</Text>
          </View>
        )}

        {stats.isError && (
          <View style={styles.errorBox}>
            <AlertCircle size={24} color={theme.colors.accentRed} />
            <Text style={styles.errorTitle}>Metrics Unavailable</Text>
            <Text style={styles.errorDesc}>
              Could not retrieve real-time data from PostgreSQL. Pull down to retry.
            </Text>
          </View>
        )}

        {stats.data && (
          <>
            {/* Phase 1: Core KPI Metric Cards */}
            <Text style={styles.sectionHeading}>KEY HOSPITAL METRICS</Text>
            <View style={styles.kpiGrid}>
              {/* Branches Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/branches' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Building2 size={20} color={theme.colors.primary} />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.branches}</Text>
                <Text style={styles.kpiLabel}>Total Branches</Text>
                <View style={styles.kpiPills}>
                  <View style={styles.pillActive}>
                    <Text style={styles.pillTextActive}>
                      {stats.data.activeBranches} Active
                    </Text>
                  </View>
                  <View style={styles.pillInactive}>
                    <Text style={styles.pillTextInactive}>
                      {stats.data.inactiveBranches} Inactive
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Administrators Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/admins' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#EDE9FE' }]}>
                    <UserCheck size={20} color="#7C3AED" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.admins}</Text>
                <Text style={styles.kpiLabel}>Administrators</Text>
                <View style={styles.kpiPills}>
                  <View style={styles.pillActive}>
                    <Text style={styles.pillTextActive}>
                      {stats.data.activeAdmins ?? stats.data.admins} Active
                    </Text>
                  </View>
                  <View style={styles.pillInactive}>
                    <Text style={styles.pillTextInactive}>
                      {stats.data.inactiveAdmins ?? 0} Inactive
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Total Users Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/users' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#E0E7FF' }]}>
                    <Users size={20} color="#4338CA" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.totalUsers ?? stats.data.employees}</Text>
                <Text style={styles.kpiLabel}>Total Accounts</Text>
                <Text style={styles.kpiSub}>Doctors, Staff & Patients</Text>
              </TouchableOpacity>

              {/* Specialist Doctors Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/doctors' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#CCFBF1' }]}>
                    <Stethoscope size={20} color="#0F766E" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.doctors}</Text>
                <Text style={styles.kpiLabel}>Specialist Doctors</Text>
                <Text style={styles.kpiSub}>Clinical Practitioners</Text>
              </TouchableOpacity>

              {/* Clinical Departments Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/departments' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#D1FAE5' }]}>
                    <Layers size={20} color="#059669" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.departments}</Text>
                <Text style={styles.kpiLabel}>Clinical Departments</Text>
                <Text style={styles.kpiSub}>Across all branches</Text>
              </TouchableOpacity>

              {/* Registered Patients Card */}
              <TouchableOpacity
                style={[styles.kpiCard, { width: kpiCardWidth }]}
                onPress={() => router.push('/(super-admin)/patients' as any)}
                activeOpacity={0.7}
              >
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#FFE4E6' }]}>
                    <HeartPulse size={20} color="#E11D48" />
                  </View>
                  <ArrowRight size={16} color="#9CA3AF" />
                </View>
                <Text style={styles.kpiNumber}>{stats.data.patients}</Text>
                <Text style={styles.kpiLabel}>Registered Patients</Text>
                <Text style={styles.kpiSub}>Master UHID Records</Text>
              </TouchableOpacity>
            </View>

            {/* Phase 1: Users Grouped by Role Distribution */}
            {stats.data.usersByRole && Object.keys(stats.data.usersByRole).length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.cardHeader}>
                  <Users size={18} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>Users Grouped by Role</Text>
                </View>
                <View style={styles.rolesGrid}>
                  {Object.entries(stats.data.usersByRole).map(([roleName, count]) => (
                    <View key={roleName} style={styles.roleItem}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleCount}>{count}</Text>
                      </View>
                      <Text style={styles.roleName} numberOfLines={1}>
                        {roleName.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Phase 1: Branch-wise Statistics Table */}
            {stats.data.branchWiseStats && stats.data.branchWiseStats.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderBetween}>
                  <View style={styles.cardHeader}>
                    <Building2 size={18} color={theme.colors.primary} />
                    <Text style={styles.cardTitle}>Branch-Wise Statistics</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(super-admin)/branches' as any)}
                  >
                    <Text style={styles.viewAllLink}>View All Branches</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal={width < 768}
                  showsHorizontalScrollIndicator={width < 768}
                  contentContainerStyle={width < 768 ? { minWidth: 540 } : undefined}
                >
                  <View style={[styles.table, width < 768 ? { minWidth: 540 } : { width: '100%' }]}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 2, minWidth: 140 }]}>Branch Name</Text>
                      <Text style={[styles.th, { flex: 1, minWidth: 80 }]}>Status</Text>
                      <Text style={[styles.th, { flex: 1, minWidth: 60, textAlign: 'center' }]}>Depts</Text>
                      <Text style={[styles.th, { flex: 1, minWidth: 60, textAlign: 'center' }]}>Doctors</Text>
                      <Text style={[styles.th, { flex: 1, minWidth: 60, textAlign: 'center' }]}>Staff</Text>
                    </View>
                    {stats.data.branchWiseStats.map((branch) => (
                      <TouchableOpacity
                        key={branch.id}
                        style={styles.tableRow}
                        onPress={() =>
                          router.push({
                            pathname: '/(super-admin)/[section]' as any,
                            params: { section: 'branch-details', id: branch.id },
                          })
                        }
                      >
                        <View style={{ flex: 2, minWidth: 140 }}>
                          <Text style={styles.branchNameText}>{branch.name}</Text>
                          <Text style={styles.branchCodeText}>{branch.code}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 80 }}>
                          <View
                            style={
                              branch.isActive
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }
                          >
                            <Text
                              style={
                                branch.isActive
                                  ? styles.badgeTextActive
                                  : styles.badgeTextInactive
                              }
                            >
                              {branch.isActive ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.td, { flex: 1, minWidth: 60, textAlign: 'center' }]}>
                          {branch.departmentCount}
                        </Text>
                        <Text style={[styles.td, { flex: 1, minWidth: 60, textAlign: 'center' }]}>
                          {branch.doctorCount}
                        </Text>
                        <Text style={[styles.td, { flex: 1, minWidth: 60, textAlign: 'center' }]}>
                          {branch.employeeCount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Phase 1: Pending Administrative Actions */}
            {stats.data.pendingActions && (
              <View style={styles.sectionCard}>
                <View style={styles.cardHeader}>
                  <Clock size={18} color={theme.colors.accentAmber} />
                  <Text style={styles.cardTitle}>Pending Administrative Actions</Text>
                </View>
                <View style={styles.pendingList}>
                  {stats.data.pendingActions.inactiveBranches > 0 && (
                    <View style={styles.pendingItem}>
                      <View style={styles.pendingLeft}>
                        <AlertCircle size={16} color={theme.colors.accentRed} />
                        <Text style={styles.pendingText}>
                          <Text style={{ fontWeight: '700' }}>
                            {stats.data.pendingActions.inactiveBranches} Branch(es)
                          </Text>{' '}
                          currently deactivated or pending review.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.pendingActionBtn}
                        onPress={() => router.push('/(super-admin)/branches' as any)}
                      >
                        <Text style={styles.pendingActionText}>Review</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {stats.data.pendingActions.unassignedAdmins > 0 && (
                    <View style={styles.pendingItem}>
                      <View style={styles.pendingLeft}>
                        <AlertCircle size={16} color={theme.colors.accentAmber} />
                        <Text style={styles.pendingText}>
                          <Text style={{ fontWeight: '700' }}>
                            {stats.data.pendingActions.unassignedAdmins} Admin(s)
                          </Text>{' '}
                          without branch assignment.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.pendingActionBtn}
                        onPress={() => router.push('/(super-admin)/admins' as any)}
                      >
                        <Text style={styles.pendingActionText}>Assign</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {stats.data.pendingActions.pendingAppointmentRequests > 0 && (
                    <View style={styles.pendingItem}>
                      <View style={styles.pendingLeft}>
                        <Clock size={16} color={theme.colors.accentBlue} />
                        <Text style={styles.pendingText}>
                          <Text style={{ fontWeight: '700' }}>
                            {stats.data.pendingActions.pendingAppointmentRequests}
                          </Text>{' '}
                          Public appointment request(s) waiting confirmation.
                        </Text>
                      </View>
                    </View>
                  )}

                  {stats.data.pendingActions.inactiveBranches === 0 &&
                    stats.data.pendingActions.unassignedAdmins === 0 &&
                    stats.data.pendingActions.pendingAppointmentRequests === 0 && (
                      <View style={styles.allClearBox}>
                        <CheckCircle2 size={18} color={theme.colors.accentGreen} />
                        <Text style={styles.allClearText}>
                          All branches, administrators, and appointment queues are operational.
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Phase 1 & 5: Recent Activities (Strictly latest 3 records) */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderBetween}>
                <View style={styles.cardHeader}>
                  <FileText size={18} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>Recent Activity (Latest 3)</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(super-admin)/audit-logs' as any)}
                >
                  <Text style={styles.viewAllLink}>View Complete Audit Log</Text>
                </TouchableOpacity>
              </View>

              {stats.data.recentActivities && stats.data.recentActivities.length > 0 ? (
                <View style={styles.activityList}>
                  {stats.data.recentActivities.slice(0, 3).map((act) => (
                    <View key={act.id} style={styles.activityItem}>
                      <View style={styles.activityTop}>
                        <View style={styles.actionBadge}>
                          <Text style={styles.actionBadgeText}>{act.action}</Text>
                        </View>
                        <Text style={styles.activityResource}>{act.resource}</Text>
                        <Text style={styles.activityTime}>
                          {act.createdAt
                            ? new Date(act.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </Text>
                      </View>
                      <Text style={styles.activityUser}>
                        By: {act.userEmail} ({act.userRole})
                        {act.branchName ? ` · Branch: ${act.branchName}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No recent activity found in audit log.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  container: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  headerBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerSubtitle: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, marginTop: 2 },
  hospitalPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hospitalPillText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  quickNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  quickNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  kpiSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  kpiPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pillActive: {
    backgroundColor: theme.colors.accentGreenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillTextActive: {
    color: theme.colors.accentGreen,
    fontSize: 10,
    fontWeight: '700',
  },
  pillInactive: {
    backgroundColor: theme.colors.accentRedBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillTextInactive: {
    color: theme.colors.accentRed,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  roleCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  roleName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  td: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
  },
  branchNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  branchCodeText: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  badgeActive: {
    backgroundColor: theme.colors.accentGreenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeTextActive: {
    color: theme.colors.accentGreen,
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeInactive: {
    backgroundColor: theme.colors.accentRedBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeTextInactive: {
    color: theme.colors.accentRed,
    fontSize: 10.5,
    fontWeight: '700',
  },
  pendingList: {
    gap: 8,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pendingText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  pendingActionBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  allClearBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: theme.colors.accentGreenBg,
    borderRadius: 8,
  },
  allClearText: {
    fontSize: 12,
    color: theme.colors.accentGreen,
    fontWeight: '600',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    gap: 4,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2937',
  },
  activityResource: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  activityUser: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  noDataText: {
    fontSize: 12.5,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorBox: {
    padding: 20,
    backgroundColor: theme.colors.accentRedBg,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accentRed,
  },
  errorDesc: {
    fontSize: 12,
    color: theme.colors.accentRed,
    textAlign: 'center',
  },
});

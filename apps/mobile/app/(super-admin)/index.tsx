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
  ChevronDown,
  ChevronRight,
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

function cardRows<T>(items: T[], columns: number) {
  return Array.from({ length: Math.ceil(items.length / columns) }, (_, index) =>
    items.slice(index * columns, (index + 1) * columns)
  );
}

export default function SuperAdminHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [branchId, setBranchId] = useState('');
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const wideLayout = width >= 720;

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

  const totals = stats.data;
  const branches = totals?.branchWiseStats ?? [];
  const selectedBranch = branches.find((branch) => branch.id === branchId);
  const visibleBranches = selectedBranch ? [selectedBranch] : branches;
  const metrics = totals ? [
    { label: 'Branches', value: totals.branches, detail: `${totals.activeBranches} active · ${totals.inactiveBranches} inactive`, icon: Building2, route: 'branches', tint: '#FEE2E2', color: theme.colors.primary },
    { label: 'Administrators', value: totals.admins, detail: `${totals.activeAdmins ?? totals.admins} active · ${totals.inactiveAdmins ?? 0} inactive`, icon: UserCheck, route: 'admins', tint: '#EDE9FE', color: '#6D28D9' },
    { label: 'Accounts', value: totals.totalUsers ?? totals.employees, icon: Users, route: 'users', tint: '#E0E7FF', color: '#4338CA' },
    { label: 'Doctors', value: totals.doctors, icon: Stethoscope, route: 'doctors', tint: '#CCFBF1', color: '#0F766E' },
    { label: 'Departments', value: totals.departments, icon: Layers, route: 'departments', tint: '#D1FAE5', color: '#047857' },
    { label: 'Registered patients', value: totals.patients, icon: HeartPulse, route: 'patients', tint: '#FFE4E6', color: '#BE123C' },
  ] : [];

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
        <Text style={styles.pageTitle}>Dashboard</Text>

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
            <Text style={styles.sectionHeading}>Hospital totals</Text>
            <View style={styles.cardGrid}>
              {cardRows(metrics, wideLayout ? 3 : 2).map((row) => (
                <View key={row[0].route} style={styles.cardRow}>
                  {row.map(({ label, value, detail, icon: Icon, route, tint, color }) => (
                    <TouchableOpacity key={route} accessibilityRole="button"
                      style={styles.kpiCard}
                      onPress={() => router.push(`/(super-admin)/${route}` as any)}>
                      <View style={styles.kpiTop}>
                        <View style={[styles.kpiIconBox, { backgroundColor: tint }]}>
                          <Icon size={18} color={color} />
                        </View>
                        <ArrowRight size={15} color="#64748B" />
                      </View>
                      <Text style={styles.kpiNumber}>{value}</Text>
                      <Text style={styles.kpiLabel}>{label}</Text>
                      {!!detail && <Text style={styles.kpiSub}>{detail}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderBetween}>
                <Text style={styles.cardTitle}>Branch statistics</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(super-admin)/branches' as any)}>
                  <Text style={styles.viewAllLink}>Manage branches</Text>
                </TouchableOpacity>
              </View>
              {branches.length > 0 ? (
                <>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose a branch"
                    accessibilityState={{ expanded: branchMenuOpen }} style={styles.branchPicker}
                    onPress={() => setBranchMenuOpen((open) => !open)}>
                    <Text style={styles.branchNameText}>{selectedBranch?.name ?? 'All branches'}</Text>
                    <ChevronDown size={17} color="#475569" />
                  </TouchableOpacity>
                  {branchMenuOpen && (
                    <ScrollView nestedScrollEnabled style={styles.branchMenu}>
                      {[{ id: '', name: 'All branches' }, ...branches].map((branch) => (
                        <TouchableOpacity key={branch.id} accessibilityRole="radio"
                          accessibilityState={{ checked: (selectedBranch?.id ?? '') === branch.id }}
                          style={styles.branchOption} onPress={() => { setBranchId(branch.id); setBranchMenuOpen(false); }}>
                          <Text style={styles.branchNameText}>{branch.name}</Text>
                          {(selectedBranch?.id ?? '') === branch.id && <CheckCircle2 size={16} color={theme.colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  {visibleBranches.map((branch) => (
                    <TouchableOpacity key={branch.id} accessibilityRole="button" style={styles.branchCard}
                      onPress={() => router.push({ pathname: '/(super-admin)/[section]', params: { section: 'branch-details', id: branch.id } } as any)}>
                      <View style={styles.branchCardTop}>
                        <View style={styles.branchIdentity}>
                          <Text style={styles.branchNameText}>{branch.name}</Text>
                          <Text style={styles.branchCodeText}>{[branch.city, branch.code].filter(Boolean).join(' · ')}</Text>
                        </View>
                        <View style={branch.isActive ? styles.badgeActive : styles.badgeInactive}>
                          <Text style={branch.isActive ? styles.badgeTextActive : styles.badgeTextInactive}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        <ChevronRight size={16} color="#64748B" />
                      </View>
                      <View style={styles.branchMetrics}>
                        {[
                          ['Departments', branch.departmentCount],
                          ['Doctors', branch.doctorCount],
                          ['Staff', branch.employeeCount],
                          ['Patients', branch.patientCount],
                        ].map(([label, count]) => (
                          <View style={styles.branchMetric} key={label}>
                            <Text style={styles.branchMetricCount}>{count ?? '—'}</Text>
                            <Text style={styles.branchCodeText}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <Text style={styles.noDataText}>No branches to show.</Text>
              )}
            </View>

            {/* Phase 1: Users Grouped by Role Distribution */}
            {stats.data.usersByRole && Object.keys(stats.data.usersByRole).length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.cardHeader}>
                  <Users size={18} color={theme.colors.primary} />
                  <Text style={styles.cardTitle}>Users Grouped by Role</Text>
                </View>
                <View style={styles.cardGrid}>
                  {cardRows(Object.entries(stats.data.usersByRole), wideLayout ? 4 : 2).map((row) => (
                    <View key={row[0][0]} style={styles.cardRow}>
                      {row.map(([roleName, count]) => (
                        <View key={roleName} style={styles.roleItem}>
                          <Text style={styles.roleCount}>{count}</Text>
                          <Text style={styles.roleName}>
                            {roleName.toLowerCase().replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
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
              <View style={styles.cardHeader}>
                <FileText size={18} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Recent activity</Text>
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
              <TouchableOpacity accessibilityRole="button" style={styles.auditLink}
                onPress={() => router.push({ pathname: '/(super-admin)/[section]', params: { section: 'audit-logs' } })}>
                <Text style={styles.viewAllLink}>View full activity</Text>
                <ChevronRight size={17} color={theme.colors.primary} />
              </TouchableOpacity>
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
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: { color: '#111827', fontSize: 25, fontWeight: '800' },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: '#334155' },
  cardGrid: { gap: 10 },
  cardRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: 0,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, minHeight: 125,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 4,
  },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kpiNumber: { fontSize: 25, fontWeight: '800', color: '#111827', fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  kpiSub: { fontSize: 11, color: '#475569' },
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
    flexWrap: 'wrap',
    gap: 8,
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
  roleItem: {
    flex: 1, minWidth: 0,
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 74,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  roleCount: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  roleName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  branchPicker: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 9, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, gap: 8,
  },
  branchMenu: { maxHeight: 200, borderRadius: 9, borderWidth: 1, borderColor: '#E2E8F0' },
  branchOption: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0',
  },
  branchCard: { gap: 10, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: '#E2E8F0' },
  branchCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  branchIdentity: { flex: 1, gap: 3 },
  branchMetrics: { flexDirection: 'row', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  branchMetric: { flex: 1, gap: 3, alignItems: 'center' },
  branchMetricCount: { fontSize: 17, fontWeight: '800', color: '#111827', fontVariant: ['tabular-nums'] },
  branchNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  branchCodeText: { fontSize: 10.5, color: '#475569' },
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
  auditLink: {
    minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9,
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
    flexWrap: 'wrap',
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


import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Building2, ShieldCheck } from 'lucide-react-native';
import type { SuperAdminDashboardDto } from '@multispeciality-hms/contracts';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { UyirinaiTheme as theme } from '../../constants/theme';

const tiles: [keyof SuperAdminDashboardDto, string][] = [
  ['branches', 'Total Hospital Branches'], ['activeBranches', 'Active Branches'], ['inactiveBranches', 'Inactive Branches'],
  ['admins', 'Hospital Admins'], ['employees', 'Total Employees'], ['doctors', 'Specialist Doctors'],
  ['departments', 'Clinical Departments'], ['patients', 'Registered Patients'],
];

export default function SuperAdminHome() {
  const { user } = useAuth();
  const router = useRouter();
  const stats = useQuery({
    queryKey: ['super-admin-dashboard', user?.hospitalId, user?.id],
    retry: false,
    queryFn: async () => {
      const response = await mobileApiClient.admin.getSuperAdminDashboard();
      if (!response.data) throw new Error('Dashboard metrics are unavailable.');
      return response.data;
    },
  });
  const summaries = useQuery({
    queryKey: ['super-admin-branch-summary', user?.hospitalId, user?.id],
    enabled: user?.permissions.includes('HOSPITALS:VIEW') === true,
    retry: false,
    queryFn: async () => (await mobileApiClient.superAdmin.request<
      { id: string; name: string; departmentCount: number; doctorCount: number }[]
    >('branches', 'GET', undefined, { limit: 5 })).data ?? [],
  });
  const activity = useQuery({
    queryKey: ['super-admin-recent-activity', user?.hospitalId, user?.id],
    enabled: user?.permissions.includes('AUDIT_LOGS:VIEW') === true,
    retry: false,
    queryFn: async () => (await mobileApiClient.superAdmin.audit({ limit: 5 })).data ?? [],
  });
  return <ScrollView contentContainerStyle={styles.container} refreshControl={
    <RefreshControl refreshing={stats.isRefetching || summaries.isRefetching || activity.isRefetching} onRefresh={() => {
      void stats.refetch();
      if (user?.permissions.includes('HOSPITALS:VIEW')) void summaries.refetch();
      if (user?.permissions.includes('AUDIT_LOGS:VIEW')) void activity.refetch();
    }} />
  }>
    <View style={styles.header}>
      <ShieldCheck color="white" size={26} />
      <Text style={styles.title}>Super Admin Dashboard</Text>
      <Text style={styles.welcome}>{user?.firstName} {user?.lastName}</Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity onPress={() => router.push('/(super-admin)/branches')}><Building2 color={theme.colors.primary} /><Text>View Branches</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(super-admin)/admins')}><Text>Admins</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(super-admin)/reports')}><Text>Reports</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(super-admin)/profile-security')}><Text>Security</Text></TouchableOpacity>
    </View>
    {stats.isPending && <ActivityIndicator accessibilityLabel="Loading hospital totals" />}
    {stats.isError && <Text role="alert">Hospital totals are unavailable. Pull to refresh to retry.</Text>}
    {stats.data && <View style={styles.grid}>
      {tiles.map(([key, label]) => <View key={key} style={styles.tile}>
        <Text style={styles.number}>{stats.data[key]}</Text><Text>{label}</Text>
      </View>)}
    </View>}
    {summaries.isError && <Text role="alert">Branch summaries are unavailable.</Text>}
    {summaries.data && <View style={styles.section}>
      <Text style={styles.heading}>Branch summary</Text>
      {summaries.data.length ? summaries.data.map(branch => <View key={branch.id}>
        <Text style={styles.heading}>{branch.name}</Text>
        <Text>{branch.departmentCount} departments · {branch.doctorCount} doctors</Text>
      </View>) : <Text>No branches found.</Text>}
      <TouchableOpacity onPress={() => router.push('/(super-admin)/branches')}><Text>View all branches</Text></TouchableOpacity>
    </View>}
    {activity.isError && <Text role="alert">Recent activity is unavailable.</Text>}
    {activity.data && <View style={styles.section}>
      <Text style={styles.heading}>Recent activity</Text>
      {activity.data.length ? activity.data.map(event => <View key={String(event.id)}>
        <Text>{String(event.action ?? '')} · {String(event.resource ?? '')}</Text>
        <Text>{String(event.createdAt ?? '')}</Text>
      </View>) : <Text>No audit activity found.</Text>}
    </View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: theme.colors.lightGrey, flexGrow: 1 },
  header: { backgroundColor: theme.colors.primary, padding: 20, borderRadius: 16, gap: 6 },
  title: { color: 'white', fontSize: 22, fontWeight: '800' },
  welcome: { color: 'white' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, backgroundColor: 'white', borderRadius: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { width: '48%', borderRadius: 12, backgroundColor: 'white', padding: 14 },
  number: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  section: { gap: 10, backgroundColor: 'white', borderRadius: 12, padding: 14 },
  heading: { fontWeight: '700' },
});

import { UyirinaiTheme } from '../../constants/theme';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ArrowRight, CalendarDays, ChevronRight, Stethoscope, Users } from 'lucide-react-native';
import { useDoctorWorkspace } from '../../hooks/useDoctorWorkspace';

const shortcuts = [
  ['Appointments', '/(doctor)/appointments'],
  ['Inpatients', '/(doctor)/patients'],
  ['Schedule', '/(doctor)/schedule'],
  ['Reports', '/(doctor)/reports'],
] as const;

export default function DoctorHomeScreen() {
  const workspace = useDoctorWorkspace();
  const [noticeTab, setNoticeTab] = useState('APPOINTMENT');
  const notices = workspace.data?.notifications.filter((item) => noticeTab === 'OTHER'
    ? !['APPOINTMENT', 'LAB_RESULT'].includes(item.type) : item.type === noticeTab) ?? [];
  const data = workspace.data;
  const metrics = Object.entries(data?.counts ?? {});
  const rows = Array.from({ length: Math.ceil(metrics.length / 3) }, (_, index) => metrics.slice(index * 3, index * 3 + 3));
  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={
      <RefreshControl refreshing={workspace.isRefetching} onRefresh={() => void workspace.refetch()} />
    }>
      <Text style={styles.heading}>Doctor dashboard</Text>
      {workspace.isFetching && !data && <ActivityIndicator accessibilityLabel="Loading dashboard" />}
      {workspace.isError && <Pressable accessibilityRole="button" onPress={() => void workspace.refetch()}>
        <Text accessibilityRole="alert">{workspace.error.message} Tap to retry.</Text>
      </Pressable>}
      {!workspace.isFetching && !workspace.isError && !data && <Text>No doctor profile is assigned.</Text>}
      {data && <>
        <View style={styles.profileCard}>
          <View style={styles.icon}><Stethoscope size={18} color={UyirinaiTheme.colors.primary} /></View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{data.profile.firstName} {data.profile.lastName}</Text>
            <Text style={styles.detail}>{data.profile.specialization} · {data.profile.branch}</Text>
          </View>
        </View>
        <Text style={styles.name}>Clinical totals</Text>
        {rows.map((row, index) => <View key={row[0][0]} style={styles.grid}>
          {row.map(([label, count], column) => {
            const Icon = [CalendarDays, Stethoscope, Users][(index * 3 + column) % 3];
            return <View key={label} style={styles.metric}>
              <View style={styles.icon}><Icon size={16} color={UyirinaiTheme.colors.primary} /></View>
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>;
          })}
          {Array.from({ length: 3 - row.length }, (_, column) => <View key={column} style={styles.spacer} />)}
        </View>)}
        <Text style={styles.name}>Clinical workspace</Text>
        <View style={styles.menu}>
          {shortcuts.map(([label, href]) => (
            <Link key={href} href={href} asChild>
              <Pressable accessibilityRole="link" style={styles.shortcut}>
                <ArrowRight size={16} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.shortcutText}>{label}</Text>
                <ChevronRight size={16} color="#64748b" />
              </Pressable>
            </Link>
          ))}
        </View>
        <Text style={styles.name}>Notifications</Text>
        <View accessibilityRole="tablist" style={styles.grid}>
          {([['APPOINTMENT', 'New patients'], ['LAB_RESULT', 'Lab reports'], ['OTHER', 'Other']] as const).map(([key, label]) => (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: noticeTab === key }}
              style={[styles.noticeTab, noticeTab === key && styles.activeNoticeTab]} onPress={() => setNoticeTab(key)}>
              <Text style={styles.detail}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {notices.length === 0 && <Text style={styles.detail}>No notifications in this category.</Text>}
        {notices.map((item) => (
          <View key={item.id} style={[styles.notice, !item.isRead && styles.unread]}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.detail}>{item.message}</Text>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 14, gap: 11, backgroundColor: '#f5f6f8', flexGrow: 1 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  detail: { color: '#475569', fontSize: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12 },
  profileCopy: { flex: 1, gap: 3 },
  grid: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, minWidth: 0, minHeight: 99, padding: 8, gap: 5,
    backgroundColor: '#fff', borderColor: '#dce3eb', borderWidth: 1, borderRadius: 10 },
  spacer: { flex: 1, borderWidth: 1, borderColor: 'transparent' },
  icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2' },
  count: { fontSize: 21, fontWeight: '800', color: '#111827' },
  metricLabel: { color: '#334155', fontSize: 11, fontWeight: '600' },
  menu: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  shortcutText: { flex: 1, color: '#111827', fontWeight: '600' },
  noticeTab: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8 },
  activeNoticeTab: { backgroundColor: '#fee2e2' },
  notice: { padding: 12, gap: 4, backgroundColor: '#fff', borderRadius: 8 },
  unread: { borderLeftWidth: 3, borderLeftColor: UyirinaiTheme.colors.primary },
});

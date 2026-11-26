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
      <RefreshControl refreshing={workspace.isRefetching} onRefresh={() => void workspace.refetch()} colors={[UyirinaiTheme.colors.primary]} />
    }>
      <Text style={styles.heading}>Doctor Dashboard</Text>
      {workspace.isFetching && !data && <ActivityIndicator accessibilityLabel="Loading dashboard" color={UyirinaiTheme.colors.primary} />}
      {workspace.isError && <Pressable accessibilityRole="button" onPress={() => void workspace.refetch()}>
        <Text accessibilityRole="alert" style={{ color: UyirinaiTheme.colors.error }}>{workspace.error.message} Tap to retry.</Text>
      </Pressable>}
      {!workspace.isFetching && !workspace.isError && !data && <Text style={styles.detail}>No doctor profile is assigned.</Text>}
      {data && <>
        <View style={styles.profileCard}>
          <View style={styles.icon}><Stethoscope size={20} color={UyirinaiTheme.colors.primary} /></View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{data.profile.firstName} {data.profile.lastName}</Text>
            <Text style={styles.detail}>{data.profile.specialization} · {data.profile.branch}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Clinical Totals</Text>
        {rows.map((row, index) => <View key={row[0][0]} style={styles.grid}>
          {row.map(([label, count], column) => {
            const Icon = [CalendarDays, Stethoscope, Users][(index * 3 + column) % 3];
            return <View key={label} style={styles.metric}>
              <View style={styles.metricIconBox}><Icon size={16} color={UyirinaiTheme.colors.primary} /></View>
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>;
          })}
          {Array.from({ length: 3 - row.length }, (_, column) => <View key={column} style={styles.spacer} />)}
        </View>)}

        <Text style={styles.sectionTitle}>Clinical Workspace</Text>
        <View style={styles.menu}>
          {shortcuts.map(([label, href]) => (
            <Link key={href} href={href} asChild>
              <Pressable accessibilityRole="link" style={styles.shortcut}>
                <ArrowRight size={16} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.shortcutText}>{label}</Text>
                <ChevronRight size={16} color={UyirinaiTheme.colors.textMuted} />
              </Pressable>
            </Link>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View accessibilityRole="tablist" style={styles.tabGrid}>
          {([['APPOINTMENT', 'New Patients'], ['LAB_RESULT', 'Lab Reports'], ['OTHER', 'Other']] as const).map(([key, label]) => (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: noticeTab === key }}
              style={[styles.noticeTab, noticeTab === key && styles.activeNoticeTab]} onPress={() => setNoticeTab(key)}>
              <Text style={[styles.tabText, noticeTab === key && styles.activeTabText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {notices.length === 0 && <Text style={styles.emptyNoticeText}>No notifications in this category.</Text>}
        {notices.map((item) => (
          <View key={item.id} style={[styles.notice, !item.isRead && styles.unread]}>
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text style={styles.detail}>{item.message}</Text>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: UyirinaiTheme.spacing.base, gap: 12, backgroundColor: UyirinaiTheme.colors.backgroundSecondary, flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary, marginTop: 4 },
  name: { fontSize: 16, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary },
  detail: { color: UyirinaiTheme.colors.textSecondary, fontSize: 12.5, lineHeight: 18 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderColor: UyirinaiTheme.colors.lightGreen,
    borderWidth: 1,
    borderRadius: UyirinaiTheme.borderRadius.lg,
  },
  profileCopy: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', gap: 8 },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 96,
    padding: 12,
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    borderColor: UyirinaiTheme.colors.border,
    borderWidth: 1,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    ...UyirinaiTheme.shadows.subtle,
  },
  spacer: { flex: 1, borderWidth: 1, borderColor: 'transparent' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.softGreen,
  },
  count: { fontSize: 20, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  metricLabel: { color: UyirinaiTheme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  menu: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    overflow: 'hidden',
    ...UyirinaiTheme.shadows.subtle,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: UyirinaiTheme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  shortcutText: { flex: 1, color: UyirinaiTheme.colors.textPrimary, fontWeight: '600', fontSize: 14 },
  tabGrid: { flexDirection: 'row', gap: 8 },
  noticeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  activeNoticeTab: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  tabText: { fontSize: 12, color: UyirinaiTheme.colors.textSecondary, fontWeight: '600' },
  activeTabText: { color: UyirinaiTheme.colors.primaryDark, fontWeight: '700' },
  emptyNoticeText: { color: UyirinaiTheme.colors.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  notice: {
    padding: 14,
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: UyirinaiTheme.colors.primary,
    backgroundColor: '#FAFDFB',
  },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary },
});

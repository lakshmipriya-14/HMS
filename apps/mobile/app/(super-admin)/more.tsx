import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Shield,
  Sliders,
  FileSpreadsheet,
  Bell,
  User,
  Building,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function SuperAdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch { /* The workspace gate handles local sign-out. */ }
  };

  const moreItems = [
    {
      id: 'org',
      title: 'Organization Profile',
      desc: 'Hospital identity, license numbers & corporate details',
      icon: Building,
      route: '/(super-admin)/organization-profile',
      color: UyirinaiTheme.colors.primary,
    },
    {
      id: 'users',
      title: 'User Management',
      desc: 'Organization-wide doctors, nurses, staff & patient accounts',
      icon: Users,
      route: '/(super-admin)/users',
      color: '#7C3AED',
    },
    {
      id: 'doctors',
      title: 'Doctor Management',
      desc: 'Specialists, consultants, OPD schedules & consultation fees',
      icon: Stethoscope,
      route: '/(super-admin)/doctors',
      color: '#0D9488',
    },
    {
      id: 'departments',
      title: 'Clinical Departments',
      desc: 'Specialties, inpatient wards, bed census & active HODs',
      icon: Building,
      route: '/(super-admin)/departments',
      color: '#059669',
    },
    {
      id: 'patients',
      title: 'Patient Management',
      desc: 'Organization-wide inpatient admissions, OPD census & UHID records',
      icon: HeartPulse,
      route: '/(super-admin)/patients',
      color: '#E11D48',
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      desc: 'Granular view, create, edit, delete & export access matrix',
      icon: Shield,
      route: '/(super-admin)/roles-permissions',
      color: '#2563EB',
    },
    {
      id: 'settings',
      title: 'Master Settings',
      desc: 'Department, specialization & clinical designation masters',
      icon: Sliders,
      route: '/(super-admin)/master-settings',
      color: '#059669',
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      desc: 'Immutable hospital audit trail & regulatory activity history',
      icon: FileSpreadsheet,
      route: '/(super-admin)/audit-logs',
      color: '#D97706',
    },
    {
      id: 'notifications',
      title: 'Notifications Center',
      desc: 'Critical organizational alerts & branch status notifications',
      icon: Bell,
      route: '/(super-admin)/notifications',
      color: '#DC2626',
    },
    {
      id: 'profile',
      title: 'Profile & Security',
      desc: 'Account details, password change and recent sessions',
      icon: User,
      route: '/(super-admin)/profile-security',
      color: '#111827',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.badge}>
            <ShieldCheck size={20} color={UyirinaiTheme.colors.white} />
          </View>
          <View>
            <Text style={styles.screenTitle}>Super Admin Settings</Text>
            <Text style={styles.screenSub}>System Modules & Administrative Hub</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.adminCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName.charAt(0)}{user?.lastName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.adminName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.adminRole}>Super Admin</Text>
            <Text style={styles.adminEmail}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>ADMINISTRATION MODULES</Text>

        <View style={styles.menuStack}>
          {moreItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                  <IconComponent size={20} color={item.color} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
                <ChevronRight size={18} color={UyirinaiTheme.colors.mutedText} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={UyirinaiTheme.colors.accentRed} />
          <Text style={styles.logoutText}>Sign Out of Executive Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: UyirinaiTheme.colors.lightGrey },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: UyirinaiTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderGrey,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: { fontSize: 16, fontWeight: '800', color: UyirinaiTheme.colors.black },
  screenSub: { fontSize: 11, color: UyirinaiTheme.colors.mutedText },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: UyirinaiTheme.colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: UyirinaiTheme.colors.white, fontSize: 16, fontWeight: '800' },
  adminName: { fontSize: 15, fontWeight: '800', color: UyirinaiTheme.colors.black },
  adminRole: { fontSize: 12, color: UyirinaiTheme.colors.primary, fontWeight: '700' },
  adminEmail: { fontSize: 11, color: UyirinaiTheme.colors.mutedText, marginTop: 1 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.mutedText,
    letterSpacing: 1,
    marginTop: 6,
  },
  menuStack: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderGrey,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderGrey,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: { flex: 1 },
  menuTitle: { fontSize: 13.5, fontWeight: '700', color: UyirinaiTheme.colors.black },
  menuDesc: { fontSize: 11, color: UyirinaiTheme.colors.mutedText, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.accentRedBg,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutText: { color: UyirinaiTheme.colors.accentRed, fontSize: 13, fontWeight: '700' },
});

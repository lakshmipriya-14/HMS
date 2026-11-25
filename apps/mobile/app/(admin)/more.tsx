import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  BedDouble,
  CheckSquare,
  BarChart3,
  Ambulance,
  ShieldCheck,
  Building,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the executive console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      title: 'Hospital Staff & HR',
      desc: 'Employee directory, department assignments & accounts',
      icon: Users,
      route: '/(admin)/staff',
      color: '#2563EB',
      bgColor: '#DBEAFE',
    },
    {
      title: 'Wards & Beds Grid',
      desc: 'Bed turnover, maintenance status & allocations',
      icon: BedDouble,
      route: '/(admin)/wards',
      color: '#0F766E',
      bgColor: '#CCFBF1',
    },
    {
      title: 'Approvals Hub',
      desc: 'Department coverage & bed turnover clearances',
      icon: CheckSquare,
      route: '/(admin)/approvals',
      color: '#D97706',
      bgColor: '#FEF3C7',
    },
    {
      title: 'Reports & Analytics',
      desc: 'OPD, IPD, revenue, pharmacy and audit reports',
      icon: BarChart3,
      route: '/(admin)/reports',
      color: '#7C3AED',
      bgColor: '#EDE9FE',
    },
    {
      title: '108 Emergency Fleet',
      desc: 'Ambulance tracking, availability & active dispatches',
      icon: Ambulance,
      route: '/(admin)/fleet',
      color: '#E11D48',
      bgColor: '#FFE4E6',
    },
    {
      title: 'Admin Profile & Security',
      desc: 'Credentials, hospital branch & security settings',
      icon: ShieldCheck,
      route: '/(admin)/profile',
      color: '#059669',
      bgColor: '#D1FAE5',
    },
  ];

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Hospital Administrator';

  return (
    <View style={styles.container}>
      <AdminHeader title="Executive Hub" subtitle="Management & Governance" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <ShieldCheck size={24} color="#0F766E" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>HOSPITAL_ADMIN • SCOPED BRANCH</Text>
            </View>
          </View>
        </View>

        {/* Modules List */}
        <Text style={styles.sectionTitle}>Executive Management Modules</Text>

        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Icon size={20} color={item.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Executive Console</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});

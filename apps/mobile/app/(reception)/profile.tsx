import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  UserPlus,
  LogOut,
  Building2,
  Calendar,
  Search,
  Ticket,
  FileBarChart,
  Stethoscope,
  ChevronRight,
  Clock,
} from 'lucide-react-native';

export default function ReceptionProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <UserPlus size={36} color="#0284C7" />
        </View>
        <Text style={styles.name}>{user?.firstName || 'Front Desk'} {user?.lastName || 'Receptionist'}</Text>
        <Text style={styles.role}>Patient Registration & OPD Front Desk</Text>
        <Text style={styles.sub}>{user?.email || 'receptionist@aalayamhospital.com'}</Text>
        <Text style={styles.deskTag}>Terminal 01 • Ground Floor Main Atrium</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hospital Facility</Text>
          <Text style={styles.infoVal}>Aalayam / Uyirinai Hospital</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Counter</Text>
          <Text style={styles.infoVal}>OPD Registration & Token Desk</Text>
        </View>
      </View>

      {/* Terminal Quick Actions */}
      <View style={styles.menuCard}>
        <Text style={styles.menuTitle}>Front Desk Quick Shortcuts</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(reception)/search' as any)}
        >
          <View style={styles.menuLeft}>
            <Search size={18} color="#0284C7" />
            <Text style={styles.menuText}>Search Patient Directory</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(reception)/doctors' as any)}
        >
          <View style={styles.menuLeft}>
            <Stethoscope size={18} color="#0284C7" />
            <Text style={styles.menuText}>Doctor Schedules & OPD Hours</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(reception)/reports' as any)}
        >
          <View style={styles.menuLeft}>
            <FileBarChart size={18} color="#0284C7" />
            <Text style={styles.menuText}>Daily Reception Reports & Analytics</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of Reception Terminal</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  role: { fontSize: 12, fontWeight: '700', color: '#0284C7', marginTop: 2 },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  deskTag: { backgroundColor: '#F0F9FF', color: '#0284C7', fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  infoLabel: { fontSize: 11, color: '#64748B' },
  infoVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 14 },
  menuTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 10, gap: 8 },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },
});


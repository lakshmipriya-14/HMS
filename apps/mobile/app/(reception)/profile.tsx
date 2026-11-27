import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  LogOut,
  Search,
  FileBarChart,
  Stethoscope,
  ChevronRight,
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
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <User size={34} color="#1565C0" />
          )}
        </View>
        <Text style={styles.name}>{user?.firstName || 'Front Desk'} {user?.lastName || 'Receptionist'}</Text>
        <Text style={styles.role}>Patient Registration & OPD Front Desk</Text>
        <Text style={styles.sub}>{user?.email || 'Not provided'}</Text>
        <Text style={styles.deskTag}>
          Employee ID: {user?.employeeCode || user?.employeeId || 'Assigned'}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hospital Facility</Text>
          <Text style={styles.infoVal}>{user?.hospitalName || 'Uyirinai Multispeciality Hospital'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Branch</Text>
          <Text style={styles.infoVal}>{user?.branchName || 'OPD Registration & Token Desk'}</Text>
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
            <Search size={18} color="#1565C0" />
            <Text style={styles.menuText}>Search Patient Directory</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(reception)/doctors' as any)}
        >
          <View style={styles.menuLeft}>
            <Stethoscope size={18} color="#1565C0" />
            <Text style={styles.menuText}>Doctor Schedules & OPD Hours</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(reception)/reports' as any)}
        >
          <View style={styles.menuLeft}>
            <FileBarChart size={18} color="#1565C0" />
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
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  name: { fontSize: 17, fontWeight: '800', color: '#183153' },
  role: { fontSize: 12, fontWeight: '700', color: '#1565C0', marginTop: 2 },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  deskTag: { backgroundColor: '#E8F1FC', color: '#1565C0', fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  infoLabel: { fontSize: 11, color: '#64748B' },
  infoVal: { fontSize: 11, fontWeight: '700', color: '#183153' },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 14 },
  menuTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { fontSize: 13, fontWeight: '700', color: '#183153' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F1FC', paddingVertical: 14, borderRadius: 10, gap: 8 },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },
});


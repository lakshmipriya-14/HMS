import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  LogOut,
  ShieldCheck,
  MapPin,
  RotateCcw,
  UserCheck,
  BellRing,
  HeartPulse,
  Building2,
  ChevronRight,
} from 'lucide-react-native';
import { Role } from '@multispeciality-hms/contracts';

export default function NurseProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isHeadNurse = user?.role === Role.HEAD_NURSE;

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <User size={36} color="#0F766E" />
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>
          {isHeadNurse ? '🌟 Head Nurse – Ward Supervisor' : '🏥 Clinical Staff Nurse'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duty Ward</Text>
          <Text style={styles.infoVal}>Intensive Coronary Care Unit (ICCU)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Shift</Text>
          <Text style={styles.infoVal}>Day Shift (08:00 AM – 04:00 PM)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Clinical Hospital</Text>
          <Text style={styles.infoVal}>Aalayam / Uyirinai Multispeciality</Text>
        </View>
      </View>

      {/* Duty Shortcuts Card */}
      <View style={styles.menuCard}>
        <Text style={styles.menuTitle}>Clinical Workspace Shortcuts</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(nurse)/handover' as any)}
        >
          <View style={styles.menuLeft}>
            <RotateCcw size={18} color="#0F766E" />
            <Text style={styles.menuText}>Shift Handover Protocol</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        {isHeadNurse && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(nurse)/supervisor' as any)}
          >
            <View style={styles.menuLeft}>
              <UserCheck size={18} color="#7C3AED" />
              <Text style={[styles.menuText, { color: '#7C3AED' }]}>Head Nurse Ward Supervision</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(nurse)/notifications' as any)}
        >
          <View style={styles.menuLeft}>
            <BellRing size={18} color="#0F766E" />
            <Text style={styles.menuText}>Nurse Alerts & Notifications</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/(nurse)/vitals' as any)}
        >
          <View style={styles.menuLeft}>
            <HeartPulse size={18} color="#0F766E" />
            <Text style={styles.menuText}>Clinical Vitals Charting</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <LogOut size={16} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of Nursing Terminal</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  role: { fontSize: 12, fontWeight: '700', color: '#0F766E', marginTop: 2 },
  email: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: { fontSize: 11, color: '#64748B' },
  infoVal: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  menuTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { color: '#DC2626', fontWeight: '800', fontSize: 13 },
});


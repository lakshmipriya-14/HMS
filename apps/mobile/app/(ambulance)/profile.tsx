import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ambulance, LogOut, ShieldCheck, Phone } from 'lucide-react-native';

export default function AmbulanceDriverProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ambulance size={36} color="#0F766E" />
        </View>
        <Text style={styles.name}>{user?.firstName || 'Velu'} {user?.lastName || 'Pandian'}</Text>
        <Text style={styles.role}>Emergency Response Driver</Text>
        <Text style={styles.email}>{user?.email || 'driver@kizunahospital.com'}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Ambulance</Text>
          <Text style={styles.infoVal}>TN-58-AL-1081 (Cardiac ALS)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Driving License</Text>
          <Text style={styles.infoVal}>TN58-2015-DL-88219</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duty Status</Text>
          <Text style={[styles.infoVal, { color: '#059669' }]}>On Duty (Rapid Response)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dispatch Base</Text>
          <Text style={styles.infoVal}>Kizuna Trauma Center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Mobile Dispatch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  role: { fontSize: 12, fontWeight: 'bold', color: '#0F766E', marginTop: 2 },
  email: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { fontSize: 12, color: '#64748B' },
  infoVal: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, ShieldCheck, MapPin } from 'lucide-react-native';

export default function NurseProfileScreen() {
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
          <User size={36} color="#0F766E" />
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>{user?.role?.replace(/_/g, ' ')}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duty Ward</Text>
          <Text style={styles.infoVal}>ICCU Floor 2</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shift Time</Text>
          <Text style={styles.infoVal}>08:00 AM - 04:00 PM</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hospital</Text>
          <Text style={styles.infoVal}>Kizuna Multispeciality</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Terminal</Text>
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

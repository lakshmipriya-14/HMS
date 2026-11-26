import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { FlaskConical, LogOut } from 'lucide-react-native';

export default function LabProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <FlaskConical size={36} color="#38845A" />
        </View>
        <Text style={styles.name}>Laboratory Technician</Text>
        <Text style={styles.sub}>labtech@Uyirinaihospital.com</Text>
        <Text style={styles.deskTag}>NABL Accredited Pathology Lab</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of Laboratory Terminal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EAF5ED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  deskTag: { backgroundColor: '#EAF5ED', color: '#38845A', fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF5ED', paddingVertical: 14, borderRadius: 10, gap: 8 },
  logoutText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
});


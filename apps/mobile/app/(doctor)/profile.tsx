import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Award, Stethoscope } from 'lucide-react-native';

export default function DoctorProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User size={36} color="#0F766E" />
        </View>
        <Text style={styles.name}>Dr. K. Senthil Nathan</Text>
        <Text style={styles.spec}>MBBS, MD (Gen Med), DM (Cardiology)</Text>
        <Text style={styles.dept}>Department of Interventional Cardiology</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Award size={18} color="#0F766E" />
          <Text style={styles.infoLabel}>Medical Council Reg: TN-MC-68421</Text>
        </View>
        <View style={styles.infoRow}>
          <Stethoscope size={18} color="#0F766E" />
          <Text style={styles.infoLabel}>Designation: Senior Consultant Cardiologist</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of Doctor Terminal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  spec: { fontSize: 13, color: '#0F766E', fontWeight: '600', marginTop: 4 },
  dept: { fontSize: 12, color: '#64748B', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 13, color: '#334155', fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 10, gap: 8 },
  logoutText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
});

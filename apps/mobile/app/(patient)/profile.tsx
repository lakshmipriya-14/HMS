import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, Phone, MapPin, HeartPulse } from 'lucide-react-native';

export default function PatientProfileScreen() {
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
        <Text style={styles.name}>{user?.firstName || 'Muthuvel'} {user?.lastName || 'Karuppiah'}</Text>
        <Text style={styles.uhidBadge}>UHID: ALY-2026-0001</Text>
        <Text style={styles.email}>{user?.email || 'patient@aalayamhospital.com'}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoVal}>O Positive</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Emergency Contact</Text>
          <Text style={styles.infoVal}>Meena K (+91 98401 99999)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Known Allergies</Text>
          <Text style={[styles.infoVal, { color: '#DC2626' }]}>Penicillin, Sulfa</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Campus</Text>
          <Text style={styles.infoVal}>Madurai Apex Center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Patient Account</Text>
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
  uhidBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  email: { fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 20 },
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

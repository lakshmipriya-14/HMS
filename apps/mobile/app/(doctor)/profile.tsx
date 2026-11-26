import { UyirinaiTheme } from '../../constants/theme';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useDoctorWorkspace } from '../../hooks/useDoctorWorkspace';

export default function DoctorProfileScreen() {
  const { logout } = useAuth();
  const workspace = useDoctorWorkspace();
  const profile = workspace.data?.profile;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      {workspace.isFetching && !profile && <ActivityIndicator accessibilityLabel="Loading doctor profile" />}
      {workspace.isError && (
        <Pressable onPress={() => void workspace.refetch()}>
          <Text accessibilityRole="alert">{workspace.error.message} Tap to retry.</Text>
        </Pressable>
      )}
      {!workspace.isFetching && !workspace.isError && !profile && <Text>No doctor profile is assigned.</Text>}
      {profile && <>
        {profile.avatarUrl && <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} accessibilityLabel="Profile photo" />}
        <Text style={styles.title}>{profile.firstName} {profile.lastName}</Text>
        <Text>{profile.designation.replace(/_/g, ' ')} · {profile.specialization}</Text>
        <Text>{profile.department} · {profile.branch}</Text>
        <Text>Registration number {profile.licenseNumber} · {profile.experienceYears} years of experience</Text>
        <Text>{profile.isAvailableToday ? 'Available today' : 'Unavailable today'} · {profile.consultationDurationMin} minute consultations</Text>
        <Text style={styles.heading}>Qualifications</Text>
        {profile.qualifications.length === 0 && <Text>No qualifications on file.</Text>}
        {profile.qualifications.map((item) => <View key={item.id} style={styles.card}>
          <Text>{item.degree} · {item.yearPassed}</Text><Text>{item.institution}</Text>
        </View>)}
        <Text style={styles.heading}>Working hours</Text>
        {profile.schedules.length === 0 && <Text>No working hours on file.</Text>}
        {profile.schedules.map((item) => <Text key={item.id}>{item.dayOfWeek} · {item.startTime}–{item.endTime}</Text>)}
      </>}
      <Pressable accessibilityRole="button" style={styles.signOut} onPress={() => void logout().catch(() => undefined)}>
        <Text style={styles.action}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 10, backgroundColor: '#fff', flexGrow: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  title: { fontSize: 23, fontWeight: '800', color: UyirinaiTheme.colors.primary },
  heading: { marginTop: 8, fontSize: 16, fontWeight: '700', color: UyirinaiTheme.colors.primary },
  card: { padding: 10, gap: 3, backgroundColor: '#fff5f5', borderRadius: 8 },
  signOut: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#fff5f5' },
  action: { color: UyirinaiTheme.colors.primary, fontWeight: '700' },
});

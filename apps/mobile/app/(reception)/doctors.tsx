import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';

export default function ReceptionDoctorsScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const directory = useQuery({
    queryKey: ['reception-doctors', user?.hospitalId, user?.branchId, user?.id],
    enabled: !!user?.branchId,
    queryFn: async () => (await mobileApiClient.doctor.list()).data ?? [],
  });
  const query = search.trim().toLowerCase();
  const doctors = (directory.data ?? []).filter(({ employee, specialization, department }) =>
    [`${employee.user.firstName} ${employee.user.lastName}`, specialization, department.name]
      .some((value) => value.toLowerCase().includes(query))
  );
  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={
      <RefreshControl refreshing={directory.isRefetching} onRefresh={() => void directory.refetch()} />
    }>
      <Text style={styles.heading}>Branch doctors</Text>
      <TextInput style={styles.search} accessibilityLabel="Search doctors" placeholder="Search name, speciality or department"
        value={search} onChangeText={setSearch} />
      {directory.isLoading && <ActivityIndicator accessibilityLabel="Loading doctors" />}
      {directory.isError && <Pressable accessibilityRole="button" style={styles.card} onPress={() => void directory.refetch()}>
        <Text accessibilityRole="alert">{directory.error.message} Tap to retry.</Text>
      </Pressable>}
      {!directory.isLoading && !directory.isError && doctors.length === 0 && <Text>No doctors found for this branch.</Text>}
      {doctors.map((doctor) => (
        <View key={doctor.id} style={styles.card}>
          <Text style={styles.name}>{doctor.employee.user.firstName} {doctor.employee.user.lastName}</Text>
          <Text>{doctor.specialization} · {doctor.department.name}</Text>
          <Text>{doctor.branch.name} · {doctor.isAvailableToday ? 'Available today' : 'Unavailable today'}</Text>
          {doctor.qualifications.length > 0 && <Text>{doctor.qualifications.map(({ degree }) => degree).join(', ')}</Text>}
          <Text style={styles.name}>Working hours</Text>
          {doctor.schedules.length === 0 && <Text>No hours on file.</Text>}
          {doctor.schedules.map((schedule) => <Text key={schedule.id}>{schedule.dayOfWeek} · {schedule.startTime}–{schedule.endTime}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#fff', flexGrow: 1, padding: 16, gap: 12 },
  heading: { color: '#134e4a', fontSize: 24, fontWeight: '800' },
  search: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, minHeight: 44, paddingHorizontal: 12 },
  card: { borderWidth: 1, borderColor: '#EAF5ED', backgroundColor: '#EAF5ED', borderRadius: 10, padding: 12, gap: 5 },
  name: { color: '#134e4a', fontWeight: '700' },
});

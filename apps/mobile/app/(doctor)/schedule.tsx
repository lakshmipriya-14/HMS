import { UyirinaiTheme } from '../../constants/theme';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useDoctorWorkspace } from '../../hooks/useDoctorWorkspace';
import { apiRequest, mobileApiClient } from '../../services/api';

export default function DoctorScheduleScreen() {
  const workspace = useDoctorWorkspace();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const request = useMutation({
    mutationFn: () => mobileApiClient.doctor.requestLeave({ startDate, endDate, reason }),
    onSuccess: async () => {
      setStartDate('');
      setEndDate('');
      setReason('');
      await workspace.refetch();
    },
  });
  const [editing, setEditing] = useState<{ id: string; startTime: string; endTime: string } | null>(null);
  const saveHours = useMutation({
    mutationFn: ({ id, startTime, endTime }: NonNullable<typeof editing>) => apiRequest('/doctors/me/schedules/' + id, {
      method: 'PATCH', body: { startTime, endTime },
    }),
    onSuccess: async () => {
      setEditing(null);
      await workspace.refetch();
    },
  });
  const profile = workspace.data?.profile;
  const weekdayOrder = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  const schedule = [...(profile?.schedules ?? [])].sort(
    (a, b) => weekdayOrder.indexOf(a.dayOfWeek) - weekdayOrder.indexOf(b.dayOfWeek),
  );
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Weekly working hours</Text>
      {workspace.isFetching && !profile && <ActivityIndicator accessibilityLabel="Loading schedule" />}
      {workspace.isError && <Pressable onPress={() => void workspace.refetch()}>
        <Text accessibilityRole="alert">{workspace.error.message} Tap to retry.</Text>
      </Pressable>}
      {!workspace.isFetching && !workspace.isError && !profile && <Text>No doctor profile is assigned.</Text>}
      {profile && <>
        <Text>{profile.branch} · {profile.department}</Text>
        {schedule.length === 0 && <Text>No working hours on file.</Text>}
        {schedule.map((item) => <View key={item.id} style={styles.card}>
          <Text>{item.dayOfWeek}</Text><Text>{item.startTime}–{item.endTime}</Text>
          {editing?.id === item.id ? <>
            <TextInput style={styles.input} accessibilityLabel="Start time" value={editing.startTime}
              onChangeText={(startTime) => setEditing({ ...editing, startTime })} />
            <TextInput style={styles.input} accessibilityLabel="End time" value={editing.endTime}
              onChangeText={(endTime) => setEditing({ ...editing, endTime })} />
            {saveHours.isError && <Text accessibilityRole="alert">{saveHours.error.message}</Text>}
            <Pressable accessibilityRole="button" disabled={saveHours.isPending} style={styles.button} onPress={() => saveHours.mutate(editing)}>
              <Text style={styles.buttonText}>{saveHours.isPending ? 'Saving…' : 'Save working hours'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saveHours.isPending} onPress={() => setEditing(null)}><Text>Cancel</Text></Pressable>
          </> : <Pressable accessibilityRole="button" disabled={saveHours.isPending} onPress={() => {
            saveHours.reset();
            setEditing(item);
          }}><Text>Edit hours</Text></Pressable>}
        </View>)}
        <Text style={styles.title}>Leave requests</Text>
        {profile.leaves.length === 0 && <Text>No requests on file.</Text>}
        {profile.leaves.map((item) => <View key={item.id} style={styles.card}>
          <Text>{item.startDate.slice(0, 10)} to {item.endDate.slice(0, 10)} · {item.isApproved ? 'Approved' : 'Pending'}</Text>
          <Text>{item.reason}</Text>
        </View>)}
        <Text style={styles.title}>Request leave</Text>
        <TextInput style={styles.input} accessibilityLabel="Start date" placeholder="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
        <TextInput style={styles.input} accessibilityLabel="End date" placeholder="End date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} />
        <TextInput style={styles.input} accessibilityLabel="Leave reason" placeholder="Reason" value={reason} onChangeText={setReason} multiline maxLength={500} />
        {request.isError && <Text accessibilityRole="alert">{request.error.message}</Text>}
        {request.isSuccess && <Text>Leave request submitted.</Text>}
        <Pressable accessibilityRole="button" style={styles.button} disabled={request.isPending || !startDate || !endDate || !reason.trim()}
          onPress={() => request.mutate()}>
          <Text style={styles.buttonText}>{request.isPending ? 'Submitting…' : 'Submit request'}</Text>
        </Pressable>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 10, flexGrow: 1, backgroundColor: '#FFFFFF' },
  title: { fontSize: 19, fontWeight: '800', color: UyirinaiTheme.colors.primary },
  card: { gap: 5, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, minHeight: 44, padding: 10 },
  button: { padding: 12, borderRadius: 8, minHeight: 44, backgroundColor: UyirinaiTheme.colors.primary },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});

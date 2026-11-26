import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDoctorWorkspace } from '../../hooks/useDoctorWorkspace';
import { useAuth } from '../../hooks/useAuth';
import { exportDirectoryFile } from '../../services/downloadHelper';
import { UyirinaiTheme } from '../../constants/theme';

export default function DoctorReportsScreen() {
  const workspace = useDoctorWorkspace();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [format, setFormat] = useState<'csv' | 'pdf'>();
  const data = workspace.data;
  const statistics = Object.entries(data?.counts ?? {});
  const exportReport = async (next: 'csv' | 'pdf') => {
    if (!data || format) return;
    setError('');
    setFormat(next);
    const preview = next === 'pdf' && typeof document !== 'undefined' ? window.open('', '_blank') : undefined;
    try {
      await exportDirectoryFile(next, 'doctor-activity-summary', 'Doctor activity summary',
        ['Measure', 'Count'], statistics, preview ?? undefined);
    } catch (cause) {
      preview?.close();
      setError(cause instanceof Error ? cause.message : 'Could not export the report.');
    } finally {
      setFormat(undefined);
    }
  };

  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.heading}>My activity summary</Text>
    {workspace.isLoading && <ActivityIndicator accessibilityLabel="Loading activity summary" />}
    {workspace.isError && <Pressable accessibilityRole="button" onPress={() => void workspace.refetch()}>
      <Text accessibilityRole="alert">{workspace.error.message} Tap to retry.</Text>
    </Pressable>}
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    {data && <View style={styles.card}>
      <Text style={styles.subheading}>{data.profile.firstName} {data.profile.lastName} · {data.profile.branch}</Text>
      {statistics.length === 0 && <Text>No activity measures are available for your permissions.</Text>}
      {statistics.map(([label, count]) => <View key={label} style={styles.row}>
        <Text style={styles.measure}>{label}</Text><Text style={styles.count}>{count}</Text>
      </View>)}
    </View>}
    {user?.permissions.includes('REPORTS:EXPORT') && statistics.length > 0 && <View style={styles.row}>
      {(['csv', 'pdf'] as const).map((item) => <Pressable key={item} accessibilityRole="button" style={styles.button}
        disabled={!!format} onPress={() => void exportReport(item)}>
        <Text style={styles.buttonText}>{format === item ? 'Exporting…' : `Export ${item.toUpperCase()}`}</Text>
      </Pressable>)}
    </View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, gap: 12, backgroundColor: '#f5f6f8', padding: 16 },
  heading: { color: '#111827', fontWeight: '800', fontSize: 22 },
  subheading: { color: '#475569', fontWeight: '600' },
  card: { borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 38 },
  measure: { flex: 1, color: '#334155' },
  count: { color: '#111827', fontWeight: '800' },
  button: { flex: 1, backgroundColor: UyirinaiTheme.colors.primary, alignItems: 'center', justifyContent: 'center', borderRadius: 8, minHeight: 44 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

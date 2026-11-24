import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ambulance, CheckCircle2, Clock } from 'lucide-react-native';

const PAST_TRIPS = [
  { id: '1', code: 'AMB-2026-0001', location: 'Meenakshi Temple West Gate', severity: 'CRITICAL', status: 'In Progress', time: 'Today 10:15 AM' },
  { id: '2', code: 'AMB-2026-0000', location: 'Anna Nagar 4th Street, Madurai', severity: 'HIGH', status: 'Handover Completed', time: 'Yesterday 04:20 PM' },
  { id: '3', code: 'AMB-2025-0982', location: 'Simmakkal Bus Stand', severity: 'MODERATE', status: 'Handover Completed', time: '17 Nov 2026' },
];

export default function AmbulanceTripsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Emergency Dispatch History</Text>
      <FlatList
        data={PAST_TRIPS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={[styles.status, item.status === 'In Progress' ? styles.statusActive : styles.statusDone]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.loc}>{item.location}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.sev}>{item.severity}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  heading: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace', color: '#0F766E' },
  status: { fontSize: 11, fontWeight: 'bold' },
  statusActive: { color: '#D97706' },
  statusDone: { color: '#059669' },
  loc: { fontSize: 12, color: '#334155', marginTop: 4, fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  sev: { fontSize: 10, fontWeight: 'bold', color: '#DC2626' },
  time: { fontSize: 10, color: '#94A3B8' },
});


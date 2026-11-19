import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Bell, AlertCircle, CheckCircle, Clock } from 'lucide-react-native';

const NOTIFICATIONS = [
  { id: '1', title: 'Critical Lab Finding Released', msg: 'Your Cardiac Troponin I report is released. Doctor review requested.', time: '10 mins ago', type: 'alert' },
  { id: '2', title: 'Prescription Ready at Pharmacy', msg: 'Your cardiac medications have been verified and dispensed.', time: '1 hour ago', type: 'info' },
  { id: '3', title: 'OPD Token Confirmed', msg: 'Your token #1 with Dr. Senthil Nathan is scheduled for 10:00 AM.', time: 'Today 08:30 AM', type: 'success' },
];

export default function PatientNotificationsScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              {item.type === 'alert' ? (
                <AlertCircle size={18} color="#DC2626" />
              ) : item.type === 'success' ? (
                <CheckCircle size={18} color="#059669" />
              ) : (
                <Bell size={18} color="#0284C7" />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.msg}>{item.msg}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  msg: { fontSize: 11, color: '#475569', marginTop: 2 },
  time: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ticket, CheckCircle2, AlertCircle } from 'lucide-react-native';

const TOKENS = [
  { token: 'A-01', patient: 'Kannan K.', doctor: 'Dr. Senthil Nathan (Cardio)', status: 'Serving' },
  { token: 'A-02', patient: 'Meena R.', doctor: 'Dr. Senthil Nathan (Cardio)', status: 'Waiting' },
  { token: 'B-01', patient: 'Vijay S.', doctor: 'Dr. V. Rajesh (Ortho)', status: 'Serving' },
  { token: 'B-02', patient: 'Deepa T.', doctor: 'Dr. V. Rajesh (Ortho)', status: 'Waiting' },
  { token: 'C-01', patient: 'Arun Kumar', doctor: 'Dr. Ananya Sharma (Peds)', status: 'Serving' },
];

export default function ReceptionTokensScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OPD Live Token Queue</Text>
        <Text style={styles.sub}>Ground Floor Front Office Terminal</Text>
      </View>
      <View style={styles.list}>
        {TOKENS.map((t, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenText}>{t.token}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{t.patient}</Text>
              <Text style={styles.doc}>{t.doctor}</Text>
            </View>
            <View style={[styles.badge, t.status === 'Serving' ? styles.servingBadge : styles.waitingBadge]}>
              <Text style={[styles.badgeText, t.status === 'Serving' ? styles.servingText : styles.waitingText]}>{t.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tokenBox: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tokenText: { color: '#0284C7', fontWeight: '800', fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  doc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  servingBadge: { backgroundColor: '#D1FAE5' },
  waitingBadge: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  servingText: { color: '#065F46' },
  waitingText: { color: '#92400E' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CreditCard, CheckCircle2, IndianRupee } from 'lucide-react-native';

const BILLS = [
  { id: '1', invoiceNo: 'INV-2026-081', patient: 'Ramasamy K.', type: 'OPD Consultation + Echo', amount: '₹ 1,800', status: 'Pending' },
  { id: '2', invoiceNo: 'INV-2026-082', patient: 'Meenakshi S.', type: 'IPD Day 3 + Cath Lab Stent', amount: '₹ 1,45,000', status: 'Insurance Approved' },
  { id: '3', invoiceNo: 'INV-2026-083', patient: 'Vijay S.', type: 'Orthopedic Fracture POP Cast', amount: '₹ 4,500', status: 'Paid' },
];

export default function BillingCashierScreen() {
  const [bills, setBills] = useState(BILLS);

  const collectPayment = (id: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Paid' } : b))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hospital Billing & Cashier Desk</Text>
        <Text style={styles.sub}>OPD, IPD & Insurance Settlement POS</Text>
      </View>
      <View style={styles.list}>
        {bills.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{b.invoiceNo}</Text>
              </View>
              <Text style={styles.amount}>{b.amount}</Text>
            </View>

            <Text style={styles.patient}>{b.patient}</Text>
            <Text style={styles.type}>{b.type}</Text>

            <View style={styles.actionRow}>
              <Text style={[styles.statusTag, b.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                {b.status}
              </Text>
              {b.status !== 'Paid' && (
                <TouchableOpacity style={styles.btn} onPress={() => collectPayment(b.id)}>
                  <Text style={styles.btnText}>Collect Payment</Text>
                </TouchableOpacity>
              )}
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
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#059669', fontWeight: '800', fontSize: 12 },
  amount: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  patient: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  type: { fontSize: 13, color: '#475569', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  statusPaid: { backgroundColor: '#D1FAE5', color: '#065F46' },
  btn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

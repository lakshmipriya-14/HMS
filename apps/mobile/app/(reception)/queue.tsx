import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { mobileApiClient } from '../../services/api';
import {
  Ticket,
  Clock,
  UserCheck,
  Stethoscope,
  Building2,
  CheckCircle2,
  Filter,
  ArrowRight,
  BellRing,
} from 'lucide-react-native';

interface QueueToken {
  id: string;
  token: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  department: string;
  appointmentTime: string;
  status: string;
}

export default function ReceptionQueueScreen() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadQueue = async () => {
    setFailed(false);
    try {
      const response = await mobileApiClient.reception.getTodayQueue();
      setTokens((response.data ?? []).map((row: any) => {
        const doctor = row.doctor.employee.user;
        return {
          id: row.id, token: String(row.tokenNumber), patientName: row.patient.firstName + ' ' + row.patient.lastName,
          uhid: row.patient.uhid, doctorName: doctor.firstName + ' ' + doctor.lastName,
          department: row.department.name, appointmentTime: row.appointmentTime, status: row.status,
        };
      }));
    } catch {
      setTokens([]);
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const filteredTokens = tokens.filter((t) => {
    if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Department Filter Strip */}
      <View style={styles.deptFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', ...new Set(tokens.map((row) => row.department))].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.deptChip, selectedDept === d && styles.deptChipActive]}
              onPress={() => setSelectedDept(d)}
            >
              <Text style={[styles.deptChipText, selectedDept === d && styles.deptChipTextActive]}>
                {d === 'ALL' ? 'All Clinics' : d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Queue Tokens List */}
      <FlatList
        data={filteredTokens}
        ListEmptyComponent={<Text onPress={failed ? onRefresh : undefined}>{failed ? 'Could not load the queue. Tap to retry.' : 'No appointments in this queue.'}</Text>}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
        renderItem={({ item }) => {
          const isServing = item.status === 'IN_PROGRESS';
          const isCheckedIn = item.status === 'CHECKED_IN';

          return (
            <View style={[styles.card, isServing && styles.cardServing]}>
              <View style={styles.cardTop}>
                <View style={[styles.tokenBox, isServing ? styles.tokenBoxServing : styles.tokenBoxWait]}>
                  <Text style={[styles.tokenNum, isServing ? styles.tokenNumServing : styles.tokenNumWait]}>
                    {item.token}
                  </Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.pName}>{item.patientName}</Text>
                  <Text style={styles.pUhid}>{item.uhid}</Text>
                  <Text style={styles.docText}>{item.doctorName}</Text>
                </View>

                <View style={[styles.statusBadge, isServing ? styles.badgeServing : isCheckedIn ? styles.badgeCheckedIn : styles.badgeWait]}>
                  <Text style={[styles.statusText, isServing ? styles.textServing : isCheckedIn ? styles.textCheckedIn : styles.textWait]}>
                    {isServing ? 'Serving Now' : isCheckedIn ? 'Ready' : item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.waitBox}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.waitText}>Scheduled time: {item.appointmentTime}</Text>
                </View>


              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  deptFilterRow: { marginBottom: 12 },
  deptChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
  },
  deptChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  deptChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  deptChipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  cardServing: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  tokenBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tokenBoxServing: { backgroundColor: '#DCFCE7' },
  tokenBoxWait: { backgroundColor: '#E0F2FE' },
  tokenNum: { fontSize: 16, fontWeight: '900' },
  tokenNumServing: { color: '#166534' },
  tokenNumWait: { color: '#0284C7' },
  infoCol: { flex: 1, marginLeft: 12 },
  pName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  pUhid: { fontSize: 10, color: '#64748B', fontFamily: 'monospace', marginTop: 1 },
  docText: { fontSize: 11, color: '#475569', marginTop: 3, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeServing: { backgroundColor: '#DCFCE7' },
  badgeCheckedIn: { backgroundColor: '#FEF3C7' },
  badgeWait: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800' },
  textServing: { color: '#166534' },
  textCheckedIn: { color: '#B45309' },
  textWait: { color: '#64748B' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  waitBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waitText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  callBtnText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
});


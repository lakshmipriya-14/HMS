import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Clock, UserCheck } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';

interface QueueToken {
  id: string;
  appointmentNumber: string;
  token: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  department: string;
  branchName: string;
  appointmentTime: string;
  status: string;
  source: string;
}

export default function ReceptionQueueScreen() {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setFailed(false);
    try {
      const response = await mobileApiClient.reception.getTodayQueue();
      setTokens(
        (response.data ?? []).map((row: any) => {
          const doctor = row.doctor?.employee?.user;
          return {
            id: row.id,
            appointmentNumber: row.appointmentNumber || '',
            token: String(row.tokenNumber),
            patientName: `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`.trim(),
            uhid: row.patient?.uhid || '',
            doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Consultant',
            department: row.department?.name || 'OPD',
            branchName: row.branch?.name || '',
            appointmentTime: row.appointmentTime || '',
            status: row.status,
            source: row.source || 'ONLINE_PATIENT',
          };
        }),
      );
    } catch {
      setTokens([]);
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadQueue();
      const interval = setInterval(() => {
        void loadQueue();
      }, 15_000);
      return () => clearInterval(interval);
    }, [loadQueue]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadQueue();
  };

  const handleCheckIn = async (item: QueueToken) => {
    if (checkingInId) return;
    setCheckingInId(item.id);
    try {
      await mobileApiClient.reception.checkInAppointment(item.id);
      await loadQueue();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to check in patient.';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(msg);
      } else {
        Alert.alert('Check-in failed', msg);
      }
    } finally {
      setCheckingInId(null);
    }
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
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText} onPress={failed ? onRefresh : undefined}>
              {failed ? 'Could not load the queue. Tap to retry.' : 'No appointments in today’s live queue.'}
            </Text>
          </View>
        }
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
        renderItem={({ item }) => {
          const isServing = item.status === 'IN_PROGRESS';
          const isCheckedIn = item.status === 'CHECKED_IN';
          const isScheduled = item.status === 'SCHEDULED';
          const isWalkIn = item.source === 'RECEPTION_WALK_IN';

          return (
            <View style={[styles.card, isServing && styles.cardServing]}>
              <View style={styles.cardTop}>
                <View style={[styles.tokenBox, isServing ? styles.tokenBoxServing : styles.tokenBoxWait]}>
                  <Text style={[styles.tokenNum, isServing ? styles.tokenNumServing : styles.tokenNumWait]}>
                    T-{item.token}
                  </Text>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.pName}>{item.patientName}</Text>
                  <Text style={styles.pUhid}>
                    {item.uhid} {item.appointmentNumber ? `· ${item.appointmentNumber}` : ''}
                  </Text>
                  <Text style={styles.docText}>
                    {item.doctorName} · {item.department}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View
                    style={[
                      styles.statusBadge,
                      isServing ? styles.badgeServing : isCheckedIn ? styles.badgeCheckedIn : styles.badgeWait,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isServing ? styles.textServing : isCheckedIn ? styles.textCheckedIn : styles.textWait,
                      ]}
                    >
                      {isServing ? 'Serving Now' : isCheckedIn ? 'Checked In' : item.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={[styles.sourcePill, isWalkIn ? styles.sourceWalkIn : styles.sourceOnline]}>
                    <Text style={[styles.sourceText, isWalkIn ? styles.sourceWalkInText : styles.sourceOnlineText]}>
                      {isWalkIn ? 'Walk-in' : 'Online'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.waitBox}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.waitText}>
                    Slot: {item.appointmentTime} IST {item.branchName ? `· ${item.branchName}` : ''}
                  </Text>
                </View>

                {isScheduled && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    disabled={checkingInId === item.id}
                    onPress={() => void handleCheckIn(item)}
                  >
                    <UserCheck size={13} color="#1565C0" />
                    <Text style={styles.callBtnText}>
                      {checkingInId === item.id ? 'Checking in...' : 'Check In'}
                    </Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
  },
  deptChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  deptChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  deptChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  cardServing: { borderColor: '#BBF7D0', backgroundColor: '#DCFCE7' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  tokenBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tokenBoxServing: { backgroundColor: '#DCFCE7' },
  tokenBoxWait: { backgroundColor: '#E8F1FC' },
  tokenNum: { fontSize: 14, fontWeight: '900' },
  tokenNumServing: { color: '#16A34A' },
  tokenNumWait: { color: '#1565C0' },
  infoCol: { flex: 1, marginLeft: 12, paddingRight: 6 },
  pName: { fontSize: 15, fontWeight: '800', color: '#183153' },
  pUhid: { fontSize: 10.5, color: '#64748B', fontFamily: 'monospace', marginTop: 1 },
  docText: { fontSize: 11, color: '#475569', marginTop: 3, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeServing: { backgroundColor: '#DCFCE7' },
  badgeCheckedIn: { backgroundColor: '#FEF3C7' },
  badgeWait: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800' },
  textServing: { color: '#16A34A' },
  textCheckedIn: { color: '#F59E0B' },
  textWait: { color: '#64748B' },
  sourcePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  sourceWalkIn: { backgroundColor: '#FEF3C7' },
  sourceOnline: { backgroundColor: '#E8F1FC' },
  sourceText: { fontSize: 9.5, fontWeight: '800' },
  sourceWalkInText: { color: '#F59E0B' },
  sourceOnlineText: { color: '#1565C0' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  waitBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waitText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F1FC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
});

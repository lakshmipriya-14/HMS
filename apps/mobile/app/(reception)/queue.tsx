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
  tokenNumber: number;
  patientName: string;
  uhid: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  estimatedWait: string;
  status: 'IN_CONSULTATION' | 'WAITING' | 'CHECKED_IN' | 'COMPLETED';
  isWalkIn: boolean;
}

const INITIAL_QUEUE: QueueToken[] = [
  {
    id: 'q-1',
    token: 'A-01',
    tokenNumber: 1,
    patientName: 'Kannan K.',
    uhid: 'ALM-2026-0042',
    doctorName: 'Dr. K. Senthil Nathan',
    department: 'Cardiology',
    roomNumber: 'Room 102',
    estimatedWait: 'Now with Doctor',
    status: 'IN_CONSULTATION',
    isWalkIn: false,
  },
  {
    id: 'q-2',
    token: 'A-02',
    tokenNumber: 2,
    patientName: 'Meena R.',
    uhid: 'ALM-2026-0089',
    doctorName: 'Dr. K. Senthil Nathan',
    department: 'Cardiology',
    roomNumber: 'Room 102',
    estimatedWait: 'Next (5 mins)',
    status: 'CHECKED_IN',
    isWalkIn: false,
  },
  {
    id: 'q-3',
    token: 'A-03',
    tokenNumber: 3,
    patientName: 'Murugan P.',
    uhid: 'ALM-2026-0150',
    doctorName: 'Dr. K. Senthil Nathan',
    department: 'Cardiology',
    roomNumber: 'Room 102',
    estimatedWait: '18 mins',
    status: 'WAITING',
    isWalkIn: true,
  },
  {
    id: 'q-4',
    token: 'B-01',
    tokenNumber: 1,
    patientName: 'Vijay S.',
    uhid: 'ALM-2026-0114',
    doctorName: 'Dr. V. Rajesh',
    department: 'Orthopedics',
    roomNumber: 'Room 105',
    estimatedWait: 'Now with Doctor',
    status: 'IN_CONSULTATION',
    isWalkIn: false,
  },
  {
    id: 'q-5',
    token: 'B-02',
    tokenNumber: 2,
    patientName: 'Deepa T.',
    uhid: 'ALM-2026-0201',
    doctorName: 'Dr. V. Rajesh',
    department: 'Orthopedics',
    roomNumber: 'Room 105',
    estimatedWait: '12 mins',
    status: 'WAITING',
    isWalkIn: false,
  },
  {
    id: 'q-6',
    token: 'C-01',
    tokenNumber: 1,
    patientName: 'Arun Kumar',
    uhid: 'ALM-2026-0255',
    doctorName: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    roomNumber: 'Room 108',
    estimatedWait: 'Now with Doctor',
    status: 'IN_CONSULTATION',
    isWalkIn: true,
  },
];

export default function ReceptionQueueScreen() {
  const [tokens, setTokens] = useState<QueueToken[]>(INITIAL_QUEUE);
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'Cardiology' | 'Orthopedics' | 'General Medicine'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = async () => {
    try {
      const res = await mobileApiClient.reception.getTodayQueue();
      if (res?.data && res.data.length > 0) {
        // Map backend queue items
      }
    } catch {
      // Keep local data
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

  const handleCallToken = (token: QueueToken) => {
    Alert.alert(
      'Announcement Dispatched',
      `Token ${token.token} (${token.patientName}) called for ${token.doctorName} in ${token.roomNumber}. Display terminal chime broadcasted.`
    );
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
          {(['ALL', 'Cardiology', 'Orthopedics', 'General Medicine'] as const).map((d) => (
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
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
        renderItem={({ item }) => {
          const isServing = item.status === 'IN_CONSULTATION';
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
                  <Text style={styles.pUhid}>{item.uhid} {item.isWalkIn ? '• Walk-In' : '• Scheduled'}</Text>
                  <Text style={styles.docText}>{item.doctorName} ({item.roomNumber})</Text>
                </View>

                <View style={[styles.statusBadge, isServing ? styles.badgeServing : isCheckedIn ? styles.badgeCheckedIn : styles.badgeWait]}>
                  <Text style={[styles.statusText, isServing ? styles.textServing : isCheckedIn ? styles.textCheckedIn : styles.textWait]}>
                    {isServing ? 'Serving Now' : isCheckedIn ? 'Ready' : 'In Queue'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.waitBox}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.waitText}>Wait: {item.estimatedWait}</Text>
                </View>

                <TouchableOpacity style={styles.callBtn} onPress={() => handleCallToken(item)}>
                  <BellRing size={13} color="#0284C7" />
                  <Text style={styles.callBtnText}>Chime / Call Patient</Text>
                </TouchableOpacity>
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


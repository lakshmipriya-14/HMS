import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Ambulance,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Search,
  Filter,
  User,
  Phone,
} from 'lucide-react-native';

interface TripLogRecord {
  id: string;
  code: string;
  vehicle: string;
  driver: string;
  patient: string;
  location: string;
  destination: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  status: 'In Progress' | 'Handover Completed';
  time: string;
  handoverTo?: string;
  durationMins?: number;
}

const PAST_TRIPS: TripLogRecord[] = [
  {
    id: '1',
    code: 'AMB-2026-0001',
    vehicle: 'TN-58-AL-1081 (ALS ICU)',
    driver: 'Velu Pandian',
    patient: 'Saravanan R. (62y M)',
    location: 'Near Meenakshi Temple West Gate, Madurai',
    destination: 'Kizuna Hospital ER Bay 1',
    severity: 'CRITICAL',
    status: 'In Progress',
    time: 'Today 10:15 AM',
  },
  {
    id: '2',
    code: 'AMB-2026-0002',
    vehicle: 'TN-58-AL-1082 (BLS)',
    driver: 'M. Senthil Kumar',
    patient: 'Anitha Devi (28y F)',
    location: 'Anna Nagar 4th Main Road, Madurai',
    destination: 'Kizuna Hospital OBG ER',
    severity: 'HIGH',
    status: 'In Progress',
    time: 'Today 10:35 AM',
  },
  {
    id: '3',
    code: 'AMB-2026-0000',
    vehicle: 'TN-58-AL-1081 (ALS ICU)',
    driver: 'Velu Pandian',
    patient: 'Muruganandam P. (55y M)',
    location: 'Simmakkal Bus Stand Roundabout',
    destination: 'Kizuna Hospital Trauma Resuscitation Bay',
    severity: 'CRITICAL',
    status: 'Handover Completed',
    time: 'Yesterday 04:20 PM',
    handoverTo: 'Dr. R. Natarajan, MD (Trauma Lead)',
    durationMins: 24,
  },
  {
    id: '4',
    code: 'AMB-2025-0982',
    vehicle: 'TN-58-AL-1085 (Trauma)',
    driver: 'K. Rajendran',
    patient: 'Selvi Meenakshi (40y F)',
    location: 'Sellur Vaigai North Bank Road',
    destination: 'Kizuna Hospital Central Casualty',
    severity: 'MODERATE',
    status: 'Handover Completed',
    time: '17 Nov 2026, 02:10 PM',
    handoverTo: 'Nurse Priya S. (Triage RN)',
    durationMins: 18,
  },
  {
    id: '5',
    code: 'AMB-2025-0981',
    vehicle: 'TN-58-AL-1083 (ALS ICU)',
    driver: 'Velu Pandian',
    patient: 'Kannan R. (70y M)',
    location: 'Villapuram Bypass Road',
    destination: 'Kizuna Hospital Cardiac ICU',
    severity: 'CRITICAL',
    status: 'Handover Completed',
    time: '16 Nov 2026, 09:45 AM',
    handoverTo: 'Dr. Arun Kumar, MD (Cardiologist)',
    durationMins: 31,
  },
];

export default function AmbulanceTripsScreen() {
  const [trips] = useState<TripLogRecord[]>(PAST_TRIPS);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = trips.filter((t) => {
    if (filter === 'ACTIVE' && t.status !== 'In Progress') return false;
    if (filter === 'COMPLETED' && t.status !== 'Handover Completed') return false;
    if (filter === 'CRITICAL' && t.severity !== 'CRITICAL') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.code.toLowerCase().includes(q) ||
        t.patient.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.vehicle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={styles.iconBox}>
            <Ambulance size={22} color="#38845A" />
          </View>
          <View>
            <Text style={styles.title}>Emergency Dispatch Log</Text>
            <Text style={styles.subtitle}>Audit Trail & Hospital Handover History</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {[
            { key: 'ALL', label: 'All Trips' },
            { key: 'ACTIVE', label: 'In Progress' },
            { key: 'COMPLETED', label: 'Handover Done' },
            { key: 'CRITICAL', label: 'Critical ALS' },
          ].map((c) => {
            const isActive = filter === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setFilter(c.key as any)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.list}>
        {filtered.map((item) => {
          const isActive = item.status === 'In Progress';
          return (
            <View key={item.id} style={[styles.card, isActive && styles.cardActive]}>
              <View style={styles.row}>
                <View style={styles.codeWrap}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Text style={styles.vehiclePill}>{item.vehicle}</Text>
                </View>
                <View style={[styles.statusTag, isActive ? styles.statusActive : styles.statusDone]}>
                  <Text style={[styles.statusTagText, isActive ? { color: '#B45309' } : { color: '#047857' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.patientRow}>
                <Text style={styles.patientText}>{item.patient}</Text>
                <View style={[styles.sevBadge, item.severity === 'CRITICAL' ? { backgroundColor: '#EAF5ED' } : { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.sevText, item.severity === 'CRITICAL' ? { color: '#DC2626' } : { color: '#D97706' }]}>
                    {item.severity}
                  </Text>
                </View>
              </View>

              <View style={styles.locRow}>
                <MapPin size={13} color="#38845A" />
                <Text style={styles.loc}>{item.location}</Text>
              </View>

              <View style={styles.destRow}>
                <Text style={styles.destLabel}>Destination:</Text>
                <Text style={styles.destVal}>{item.destination}</Text>
              </View>

              {item.handoverTo && (
                <View style={styles.handoverRow}>
                  <CheckCircle2 size={13} color="#38845A" />
                  <Text style={styles.handoverText}>Handed to {item.handoverTo} ({item.durationMins} min run)</Text>
                </View>
              )}

              <View style={styles.footerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <User size={12} color="#64748B" />
                  <Text style={styles.driverText}>{item.driver}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EAF5ED', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B' },
  chipRow: { flexDirection: 'row', marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 8 },
  chipActive: { backgroundColor: '#EAF5ED' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#38845A', fontWeight: '800' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  cardActive: { borderColor: '#CDE8D5', backgroundColor: '#EAF5ED' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontSize: 13, fontWeight: '800', fontFamily: 'monospace', color: '#38845A' },
  vehiclePill: { backgroundColor: '#F1F5F9', fontSize: 10, color: '#475569', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusActive: { backgroundColor: '#FEF3C7' },
  statusDone: { backgroundColor: '#ECFDF5' },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  patientText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sevText: { fontSize: 9, fontWeight: '900' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  loc: { fontSize: 12, color: '#334155', flex: 1 },
  destRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  destLabel: { fontSize: 11, color: '#64748B' },
  destVal: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  handoverRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6, marginTop: 8 },
  handoverText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  driverText: { fontSize: 11, color: '#475569' },
  time: { fontSize: 11, color: '#94A3B8' },
});


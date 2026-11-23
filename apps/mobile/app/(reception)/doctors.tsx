import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ArrowRight,
} from 'lucide-react-native';

interface DoctorScheduleItem {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  department: string;
  room: string;
  opHours: string;
  availableDays: string[];
  todayStatus: 'AVAILABLE' | 'IN_SURGERY' | 'ON_LEAVE';
  consultationFee: number;
  bookedCount: number;
  maxCapacity: number;
  nextSlot: string;
}

const DOCTOR_SCHEDULES: DoctorScheduleItem[] = [
  {
    id: 'doc-1',
    name: 'Dr. K. Senthil Nathan',
    qualification: 'MBBS, MS, MCh (Cardiothoracic)',
    specialization: 'Senior Cardiologist & Interventional Surgeon',
    department: 'Cardiology',
    room: 'OPD Room 102 (First Floor)',
    opHours: '09:00 AM - 01:00 PM',
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    todayStatus: 'AVAILABLE',
    consultationFee: 500,
    bookedCount: 16,
    maxCapacity: 25,
    nextSlot: '11:45 AM',
  },
  {
    id: 'doc-2',
    name: 'Dr. V. Rajesh',
    qualification: 'MBBS, MS (Ortho), Fellowship Arthroscopy',
    specialization: 'Orthopedics & Joint Replacement Surgeon',
    department: 'Orthopedics',
    room: 'OPD Room 105 (First Floor)',
    opHours: '10:00 AM - 02:00 PM',
    availableDays: ['MON', 'WED', 'FRI', 'SAT'],
    todayStatus: 'AVAILABLE',
    consultationFee: 500,
    bookedCount: 12,
    maxCapacity: 20,
    nextSlot: '12:15 PM',
  },
  {
    id: 'doc-3',
    name: 'Dr. Rajesh Kumar',
    qualification: 'MBBS, MD (General Medicine)',
    specialization: 'Internal & General Medicine Specialist',
    department: 'General Medicine',
    room: 'OPD Room 108 (First Floor)',
    opHours: '08:30 AM - 01:30 PM',
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    todayStatus: 'AVAILABLE',
    consultationFee: 400,
    bookedCount: 22,
    maxCapacity: 30,
    nextSlot: '12:30 PM',
  },
  {
    id: 'doc-4',
    name: 'Dr. Ananya Sharma',
    qualification: 'MBBS, MD (Pediatrics), DNB',
    specialization: 'Pediatric Care & Child Health Specialist',
    department: 'Pediatrics',
    room: 'OPD Room 112 (Ground Floor)',
    opHours: '09:00 AM - 01:00 PM',
    availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    todayStatus: 'IN_SURGERY',
    consultationFee: 450,
    bookedCount: 18,
    maxCapacity: 20,
    nextSlot: '02:00 PM (Post-OT)',
  },
];

export default function ReceptionDoctorsScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorScheduleItem[]>(DOCTOR_SCHEDULES);
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'Cardiology' | 'Orthopedics' | 'General Medicine' | 'Pediatrics'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredDoctors = doctors.filter((d) => {
    if (selectedDept !== 'ALL' && d.department !== selectedDept) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Department Filter Strip */}
      <View style={styles.deptFilterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', 'Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics'] as const).map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.deptChip, selectedDept === dept && styles.deptChipActive]}
              onPress={() => setSelectedDept(dept)}
            >
              <Text style={[styles.deptChipText, selectedDept === dept && styles.deptChipTextActive]}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
        renderItem={({ item }) => {
          const isAvailable = item.todayStatus === 'AVAILABLE';
          const remainingSlots = item.maxCapacity - item.bookedCount;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.docAvatar}>
                  <Stethoscope size={22} color="#0284C7" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.docName}>{item.name}</Text>
                  <Text style={styles.docDegree}>{item.qualification}</Text>
                  <Text style={styles.docSpecialty}>{item.specialization}</Text>
                </View>
                <View style={[styles.statusBadge, isAvailable ? styles.statusAvail : styles.statusBusy]}>
                  <Text style={[styles.statusText, isAvailable ? styles.textAvail : styles.textBusy]}>
                    {item.todayStatus.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Room & OPD Hours</Text>
                  <Text style={styles.infoVal}>{item.room} • {item.opHours}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Consultation Fee</Text>
                  <Text style={styles.infoVal}>₹{item.consultationFee}</Text>
                </View>
              </View>

              <View style={styles.capacityRow}>
                <View style={styles.capLeft}>
                  <Users size={14} color="#64748B" />
                  <Text style={styles.capText}>
                    Capacity: {item.bookedCount}/{item.maxCapacity} booked ({remainingSlots} remaining)
                  </Text>
                </View>
                <View style={styles.slotTag}>
                  <Clock size={11} color="#0284C7" />
                  <Text style={styles.slotText}>Next: {item.nextSlot}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => router.push('/(reception)/appointments' as any)}
              >
                <Calendar size={14} color="#fff" />
                <Text style={styles.bookBtnText}>Book Appointment with {item.name}</Text>
              </TouchableOpacity>
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
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  docAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  docDegree: { fontSize: 10, color: '#64748B', marginTop: 1 },
  docSpecialty: { fontSize: 11, color: '#0284C7', fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusAvail: { backgroundColor: '#DCFCE7' },
  statusBusy: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 9, fontWeight: '800' },
  textAvail: { color: '#166534' },
  textBusy: { color: '#B45309' },
  infoGrid: { marginTop: 10, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, gap: 4 },
  infoCol: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  infoVal: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  capLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  capText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  slotTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  slotText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

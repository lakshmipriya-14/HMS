import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Calendar,
  Clock,
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  User,
  X,
  Building,
  AlertCircle,
  MapPin,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  fee: number;
  room: string;
  experience: string;
  slots: string[];
}

interface Appointment {
  id: string;
  appointmentNo: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  department: string;
  date: string;
  slot: string;
  tokenNumber: number;
  currentCallingToken: number;
  status: 'Confirmed' | 'In Queue' | 'In Consultation' | 'Completed' | 'Cancelled';
  room: string;
}

const DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Senthil Nathan',
    specialty: 'Interventional Cardiology',
    department: 'Cardiology',
    qualification: 'MD, DM (Cardio), FACC',
    fee: 800,
    room: 'Room 104 (OPD Block A)',
    experience: '16 Years Exp',
    slots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '04:00 PM'],
  },
  {
    id: 'doc-2',
    name: 'Dr. Meenakshi Sundaram',
    specialty: 'General Medicine & Diabetology',
    department: 'General Medicine',
    qualification: 'MD (Gen Med), FRCP',
    fee: 500,
    room: 'Room 202 (OPD Block B)',
    experience: '12 Years Exp',
    slots: ['10:30 AM', '11:15 AM', '02:00 PM', '02:30 PM', '03:15 PM'],
  },
  {
    id: 'doc-3',
    name: 'Dr. Anitha Varma',
    specialty: 'Orthopaedic & Joint Replacement',
    department: 'Orthopaedics',
    qualification: 'MS (Ortho), MCh',
    fee: 700,
    room: 'Room 110 (Trauma Block)',
    experience: '14 Years Exp',
    slots: ['11:00 AM', '11:45 AM', '03:30 PM', '04:15 PM'],
  },
  {
    id: 'doc-4',
    name: 'Dr. Balamurugan S.',
    specialty: 'Diagnostic Neuro & Body Radiology',
    department: 'Radiology',
    qualification: 'MD, DNB (Radiodiagnosis)',
    fee: 600,
    room: 'Diagnostics Suite 3',
    experience: '10 Years Exp',
    slots: ['09:30 AM', '12:00 PM', '04:30 PM'],
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-01',
    appointmentNo: 'APT-2026-1042',
    doctorId: 'doc-1',
    doctorName: 'Dr. Senthil Nathan',
    specialty: 'Interventional Cardiology',
    department: 'Cardiology',
    date: 'Today, 24 Nov 2026',
    slot: '10:00 AM',
    tokenNumber: 14,
    currentCallingToken: 11,
    status: 'In Queue',
    room: 'Room 104 • 1st Floor',
  },
  {
    id: 'apt-02',
    appointmentNo: 'APT-2026-0988',
    doctorId: 'doc-3',
    doctorName: 'Dr. Anitha Varma',
    specialty: 'Orthopaedic Surgery',
    department: 'Orthopaedics',
    date: '27 Nov 2026',
    slot: '11:00 AM',
    tokenNumber: 5,
    currentCallingToken: 1,
    status: 'Confirmed',
    room: 'Room 110 • Ground Floor',
  },
];

export default function PatientAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingModal, setBookingModal] = useState(false);

  const departments = ['All', 'Cardiology', 'General Medicine', 'Orthopaedics', 'Radiology'];

  const filteredDoctors = useMemo(() => {
    return DOCTORS.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase()) ||
        d.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = selectedDept === 'All' || d.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [search, selectedDept]);

  const handleBookSlot = () => {
    if (!selectedDoctor || !selectedSlot) {
      Alert.alert('Select Slot', 'Please select a consultation time slot.');
      return;
    }

    const tokenNum = Math.floor(10 + Math.random() * 20);
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNo: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      department: selectedDoctor.department,
      date: 'Today, 24 Nov 2026',
      slot: selectedSlot,
      tokenNumber: tokenNum,
      currentCallingToken: Math.max(1, tokenNum - 4),
      status: 'Confirmed',
      room: selectedDoctor.room,
    };

    setAppointments([newApt, ...appointments]);
    setBookingModal(false);
    setSelectedDoctor(null);
    setSelectedSlot('');
    Alert.alert(
      'Appointment Confirmed',
      `Booking ${newApt.appointmentNo} confirmed with ${newApt.doctorName}. Token #${newApt.tokenNumber} assigned.`
    );
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this consultation slot?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a))
          );
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Active Queue Tracker Banner (P03) */}
      {appointments.find((a) => a.status === 'In Queue' || a.status === 'Confirmed') && (
        <View style={styles.activeQueueCard}>
          <View style={styles.queueHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#38845A" />
              <Text style={styles.queueHeaderTitle}>Active Token Queue</Text>
            </View>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE QUEUE</Text>
            </View>
          </View>

          {(() => {
            const active = appointments.find((a) => a.status === 'In Queue' || a.status === 'Confirmed')!;
            const diff = active.tokenNumber - active.currentCallingToken;
            return (
              <View style={{ marginTop: 8 }}>
                <View style={styles.queueSplit}>
                  <View style={styles.queueBox}>
                    <Text style={styles.queueBoxLabel}>Your Token</Text>
                    <Text style={styles.queueMyToken}>#{active.tokenNumber}</Text>
                    <Text style={styles.queueWaitText}>
                      {diff > 0 ? `${diff} Patients Ahead` : 'Please proceed to room'}
                    </Text>
                  </View>
                  <View style={styles.queueDivider} />
                  <View style={styles.queueBox}>
                    <Text style={styles.queueBoxLabel}>Calling Now</Text>
                    <Text style={styles.queueCallingToken}>#{active.currentCallingToken}</Text>
                    <Text style={styles.queueRoomText}>{active.room}</Text>
                  </View>
                </View>
                <Text style={styles.queueDocText}>
                  {active.doctorName} • {active.specialty}
                </Text>
              </View>
            );
          })()}
        </View>
      )}

      {/* Booked Appointments Header */}
      <Text style={styles.sectionTitle}>My Booked Appointments</Text>
      {appointments.map((apt) => (
        <View key={apt.id} style={styles.aptCard}>
          <View style={styles.aptCardHeader}>
            <View>
              <Text style={styles.aptNo}>{apt.appointmentNo}</Text>
              <Text style={styles.aptDocName}>{apt.doctorName}</Text>
              <Text style={styles.aptSpec}>{apt.specialty}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                apt.status === 'In Queue'
                  ? styles.badgeQueue
                  : apt.status === 'Confirmed'
                  ? styles.badgeConfirmed
                  : styles.badgeCancelled,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  apt.status === 'In Queue'
                    ? styles.textQueue
                    : apt.status === 'Confirmed'
                    ? styles.textConfirmed
                    : styles.textCancelled,
                ]}
              >
                {apt.status}
              </Text>
            </View>
          </View>

          <View style={styles.aptMetaRow}>
            <View style={styles.aptMetaItem}>
              <Calendar size={12} color="#64748B" />
              <Text style={styles.aptMetaText}>{apt.date}</Text>
            </View>
            <View style={styles.aptMetaItem}>
              <Clock size={12} color="#64748B" />
              <Text style={styles.aptMetaText}>{apt.slot}</Text>
            </View>
            <View style={styles.tokenPill}>
              <Text style={styles.tokenPillText}>Token #{apt.tokenNumber}</Text>
            </View>
          </View>

          <Text style={styles.aptRoom}>{apt.room}</Text>

          {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => handleCancelAppointment(apt.id)}
            >
              <Text style={styles.cancelLinkText}>Cancel / Reschedule Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Doctor & Department Discovery Section (P03 & P04) */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Find & Book Specialist</Text>
      <Text style={styles.sectionSub}>Select doctor, review consultation fee, and book slot</Text>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctor name, specialty, or condition..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Department Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
        {departments.map((dept) => (
          <TouchableOpacity
            key={dept}
            style={[styles.deptPill, selectedDept === dept && styles.deptPillActive]}
            onPress={() => setSelectedDept(dept)}
          >
            <Text style={[styles.deptPillText, selectedDept === dept && styles.deptPillTextActive]}>
              {dept}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Doctors List */}
      <View style={{ marginTop: 10 }}>
        {filteredDoctors.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docTop}>
              <View style={styles.docAvatar}>
                <Stethoscope size={22} color="#38845A" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docSpec}>{doc.specialty}</Text>
                <Text style={styles.docQual}>
                  {doc.qualification} • {doc.experience}
                </Text>
              </View>
              <Text style={styles.docFee}>₹{doc.fee}</Text>
            </View>

            <View style={styles.docRoomRow}>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.docRoomText}>{doc.room}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookSlotBtn}
              onPress={() => {
                setSelectedDoctor(doc);
                setSelectedSlot(doc.slots[0] || '');
                setBookingModal(true);
              }}
            >
              <Text style={styles.bookSlotBtnText}>Book Consultation Slot</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Slot Booking Modal */}
      <Modal visible={bookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Appointment Slot</Text>
                <Text style={styles.modalSub}>{selectedDoctor?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setBookingModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.docModalInfo}>
              <Text style={styles.modalDocSpec}>{selectedDoctor?.specialty}</Text>
              <Text style={styles.modalDocFee}>Consultation Fee: ₹{selectedDoctor?.fee}</Text>
            </View>

            <Text style={styles.slotSectionTitle}>Available OPD Slots for Today</Text>
            <View style={styles.slotsGrid}>
              {selectedDoctor?.slots.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.slotCard, selectedSlot === s && styles.slotCardActive]}
                  onPress={() => setSelectedSlot(s)}
                >
                  <Clock size={12} color={selectedSlot === s ? '#38845A' : '#64748B'} />
                  <Text style={[styles.slotText, selectedSlot === s && styles.slotTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmAptBtn} onPress={handleBookSlot}>
              <CheckCircle2 size={16} color="#fff" />
              <Text style={styles.confirmAptBtnText}>Confirm Booking & Assign Token</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  activeQueueCard: {
    backgroundColor: '#EAF5ED',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CDE8D5',
    marginBottom: 14,
  },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#38845A' },
  liveTag: { backgroundColor: '#38845A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveTagText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  queueSplit: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  queueBox: { flex: 1, alignItems: 'center' },
  queueBoxLabel: { fontSize: 10, color: '#64748B' },
  queueMyToken: { fontSize: 24, fontWeight: '900', color: '#38845A' },
  queueWaitText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  queueDivider: { width: 1, height: 35, backgroundColor: '#EAF5ED' },
  queueCallingToken: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  queueRoomText: { fontSize: 10, color: '#64748B' },
  queueDocText: { fontSize: 11, color: '#334155', fontWeight: '600', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  sectionSub: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  aptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aptCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aptNo: { fontSize: 11, fontWeight: '700', color: '#64748B', fontFamily: 'monospace' },
  aptDocName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  aptSpec: { fontSize: 11, color: '#475569' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeQueue: { backgroundColor: '#FEF3C7' },
  badgeConfirmed: { backgroundColor: '#D1FAE5' },
  badgeCancelled: { backgroundColor: '#EAF5ED' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textQueue: { color: '#B45309' },
  textConfirmed: { color: '#065F46' },
  textCancelled: { color: '#DC2626' },
  aptMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  aptMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aptMetaText: { fontSize: 11, color: '#475569' },
  tokenPill: { backgroundColor: '#EAF5ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tokenPillText: { fontSize: 10, fontWeight: '800', color: '#38845A' },
  aptRoom: { fontSize: 11, color: '#64748B', marginTop: 6 },
  cancelLink: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelLinkText: { fontSize: 11, color: '#DC2626', fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  deptScroll: { flexDirection: 'row', marginTop: 10, marginBottom: 8 },
  deptPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  deptPillActive: { backgroundColor: '#38845A', borderColor: '#38845A' },
  deptPillText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  deptPillTextActive: { color: '#fff', fontWeight: '700' },
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docTop: { flexDirection: 'row', alignItems: 'center' },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  docSpec: { fontSize: 11, color: '#38845A', fontWeight: '700', marginTop: 1 },
  docQual: { fontSize: 10, color: '#64748B', marginTop: 1 },
  docFee: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  docRoomRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  docRoomText: { fontSize: 11, color: '#64748B' },
  bookSlotBtn: {
    backgroundColor: '#38845A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  bookSlotBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  docModalInfo: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 14 },
  modalDocSpec: { fontSize: 12, fontWeight: '700', color: '#38845A' },
  modalDocFee: { fontSize: 12, color: '#334155', marginTop: 2 },
  slotSectionTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  slotCardActive: { borderColor: '#38845A', backgroundColor: '#EAF5ED' },
  slotText: { fontSize: 11, color: '#475569' },
  slotTextActive: { color: '#38845A', fontWeight: '800' },
  confirmAptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  confirmAptBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


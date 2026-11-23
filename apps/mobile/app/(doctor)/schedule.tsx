import React, { useState } from 'react';
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
  Plus,
  CheckCircle2,
  AlertCircle,
  Ban,
  UserCheck,
  X,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

interface ScheduleSlot {
  day: string;
  shift: string;
  timings: string;
  room: string;
  maxPatients: number;
  status: 'ACTIVE' | 'BLOCKED';
}

interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'APPROVED' | 'PENDING';
}

const WEEKLY_SCHEDULE: ScheduleSlot[] = [
  { day: 'Monday', shift: 'Morning OPD', timings: '09:00 AM – 01:00 PM', room: 'Room 204', maxPatients: 25, status: 'ACTIVE' },
  { day: 'Monday', shift: 'Evening Rounds & Review', timings: '05:00 PM – 07:30 PM', room: 'Cardio Ward', maxPatients: 15, status: 'ACTIVE' },
  { day: 'Tuesday', shift: 'Morning Cath Lab / OT', timings: '08:30 AM – 02:00 PM', room: 'OT-1', maxPatients: 6, status: 'ACTIVE' },
  { day: 'Wednesday', shift: 'Morning OPD', timings: '09:00 AM – 01:00 PM', room: 'Room 204', maxPatients: 25, status: 'ACTIVE' },
  { day: 'Thursday', shift: 'Morning OPD & Echo', timings: '09:00 AM – 01:00 PM', room: 'Room 204', maxPatients: 20, status: 'ACTIVE' },
  { day: 'Friday', shift: 'Morning Cath Lab / OT', timings: '08:30 AM – 02:00 PM', room: 'OT-1', maxPatients: 6, status: 'ACTIVE' },
  { day: 'Saturday', shift: 'Weekend Executive Clinic', timings: '09:00 AM – 12:30 PM', room: 'Room 204', maxPatients: 15, status: 'ACTIVE' },
];

const INITIAL_LEAVES: LeaveRecord[] = [
  {
    id: 'leave-1',
    startDate: '2026-11-28',
    endDate: '2026-11-29',
    type: 'Conference / CME',
    reason: 'National Interventional Cardiology Summit (Chennai)',
    status: 'APPROVED',
  },
];

export default function DoctorScheduleScreen() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(WEEKLY_SCHEDULE);
  const [leaves, setLeaves] = useState<LeaveRecord[]>(INITIAL_LEAVES);

  // Apply Leave / Block Slot Modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('2026-12-05');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-12-06');
  const [leaveType, setLeaveType] = useState('Personal / Casual Leave');
  const [leaveReason, setLeaveReason] = useState('Personal leave. Dr. R. Anand will cover emergency cardiac calls.');

  const handleApplyLeave = () => {
    if (!leaveStartDate || !leaveReason.trim()) {
      Alert.alert('Required', 'Please fill in the leave date and reason.');
      return;
    }

    const newRecord: LeaveRecord = {
      id: `leave-${Date.now()}`,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      type: leaveType,
      reason: leaveReason,
      status: 'PENDING',
    };

    setLeaves((prev) => [newRecord, ...prev]);
    setLeaveModalOpen(false);
    Alert.alert(
      'Leave Request Submitted',
      `Leave requested from ${leaveStartDate} to ${leaveEndDate}. Reception and patient booking will be notified upon Medical Director approval.`
    );
  };

  const toggleSlotBlock = (index: number) => {
    setSchedule((prev) =>
      prev.map((slot, i) =>
        i === index
          ? { ...slot, status: slot.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' }
          : slot
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Doctor Duty Schedule & Leave</Text>
          <TouchableOpacity onPress={() => setLeaveModalOpen(true)} style={styles.applyBtn}>
            <Plus size={13} color="#0F766E" />
            <Text style={styles.applyBtnText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerSub}>
          OPD Clinic Timings, OT Allocations & Slot Blocking Control
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{schedule.length}</Text>
            <Text style={styles.statLabel}>Weekly Slots</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {schedule.filter((s) => s.status === 'ACTIVE').length}
            </Text>
            <Text style={styles.statLabel}>Active Slots</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{leaves.length}</Text>
            <Text style={styles.statLabel}>Leave Records</Text>
          </View>
        </View>
      </View>

      {/* Roster Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Clinical Roster</Text>

        {schedule.map((slot, index) => {
          const isBlocked = slot.status === 'BLOCKED';
          return (
            <View key={index} style={[styles.card, isBlocked && styles.cardBlocked]}>
              <View style={styles.cardHeader}>
                <View style={styles.dayBadge}>
                  <Calendar size={13} color="#0F766E" />
                  <Text style={styles.dayText}>{slot.day}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.blockBtn, isBlocked ? styles.unblockBtn : styles.blockBtnActive]}
                  onPress={() => toggleSlotBlock(index)}
                >
                  <Ban size={12} color={isBlocked ? '#059669' : '#DC2626'} />
                  <Text style={[styles.blockBtnText, isBlocked ? styles.unblockText : styles.blockText]}>
                    {isBlocked ? 'Re-open Slot' : 'Block Slot'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.shiftName}>{slot.shift}</Text>

              <View style={styles.slotMetaRow}>
                <View style={styles.metaItem}>
                  <Clock size={13} color="#64748B" />
                  <Text style={styles.metaItemText}>{slot.timings}</Text>
                </View>
                <Text style={styles.roomText}>{slot.room}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.capacityText}>Max Capacity: {slot.maxPatients} Patients</Text>
                <View style={[styles.statusTag, isBlocked ? styles.statusBlocked : styles.statusActive]}>
                  <Text style={[styles.statusTagText, isBlocked ? styles.textBlocked : styles.textActive]}>
                    {isBlocked ? 'SLOT BLOCKED' : 'BOOKINGS OPEN'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Leave History Section */}
      <View style={[styles.section, { paddingTop: 0 }]}>
        <Text style={styles.sectionTitle}>Leave History & Slot Blocks</Text>

        {leaves.map((l) => (
          <View key={l.id} style={styles.leaveCard}>
            <View style={styles.leaveTop}>
              <Text style={styles.leaveDate}>{l.startDate} to {l.endDate}</Text>
              <View style={[styles.leaveBadge, l.status === 'APPROVED' ? styles.badgeApproved : styles.badgePending]}>
                <Text style={[styles.leaveBadgeText, l.status === 'APPROVED' ? styles.textApproved : styles.textPending]}>
                  {l.status}
                </Text>
              </View>
            </View>
            <Text style={styles.leaveType}>{l.type}</Text>
            <Text style={styles.leaveReason}>{l.reason}</Text>
          </View>
        ))}
      </View>

      {/* APPLY LEAVE MODAL */}
      <Modal visible={leaveModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply Doctor Leave / Block OPD</Text>
            <TouchableOpacity onPress={() => setLeaveModalOpen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              <Text style={styles.label}>Leave / Block Category</Text>
              <TextInput
                style={styles.input}
                value={leaveType}
                onChangeText={setLeaveType}
                placeholder="Conference / Medical Leave / Personal"
              />

              <View style={styles.grid2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Start Date</Text>
                  <TextInput
                    style={styles.input}
                    value={leaveStartDate}
                    onChangeText={setLeaveStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>End Date</Text>
                  <TextInput
                    style={styles.input}
                    value={leaveEndDate}
                    onChangeText={setLeaveEndDate}
                  />
                </View>
              </View>

              <Text style={styles.label}>Reason & Cross-Covering Doctor *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                placeholder="Reason for leave, covering physician for inpatients..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleApplyLeave}>
              <CheckCircle2 size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Leave & Block Slots</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: '#0F766E', padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSub: { color: '#99F6E4', fontSize: 12, marginTop: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  applyBtnText: { color: '#0F766E', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#CCFBF1', fontSize: 11, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardBlocked: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dayBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  dayText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  blockBtnActive: { backgroundColor: '#FEE2E2' },
  unblockBtn: { backgroundColor: '#D1FAE5' },
  blockBtnText: { fontSize: 11, fontWeight: '700' },
  blockText: { color: '#DC2626' },
  unblockText: { color: '#059669' },
  shiftName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  slotMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  roomText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  capacityText: { fontSize: 11, color: '#64748B' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusBlocked: { backgroundColor: '#FEE2E2' },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  textActive: { color: '#065F46' },
  textBlocked: { color: '#991B1B' },
  leaveCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  leaveTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveDate: { fontSize: 13, fontWeight: '700', color: '#0F766E' },
  leaveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeApproved: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEF3C7' },
  leaveBadgeText: { fontSize: 10, fontWeight: '700' },
  textApproved: { color: '#065F46' },
  textPending: { color: '#92400E' },
  leaveType: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginTop: 4 },
  leaveReason: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: '#0F766E', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalScroll: { flex: 1 },
  formPadding: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  grid2: { flexDirection: 'row', gap: 10 },
  modalFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

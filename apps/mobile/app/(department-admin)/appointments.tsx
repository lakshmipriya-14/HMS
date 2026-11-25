import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  CalendarCheck,
  Search,
  Clock,
  User,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentAppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Reschedule state
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  // Cancel state
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [processing, setProcessing] = useState(false);

  const loadAppointments = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getAppointments({
        status: statusFilter || undefined,
      });
      if (res.data) setAppointments(res.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleCheckIn = async (id: string) => {
    try {
      await mobileApiClient.departmentAdmin.updateAppointmentStatus(id, 'CHECKED_IN');
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CHECKED_IN' } : a))
      );
    } catch (err) {
      console.error('Failed to check in:', err);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppt || !newDate) return;
    try {
      setProcessing(true);
      await mobileApiClient.departmentAdmin.rescheduleAppointment(selectedAppt.id, {
        appointmentDate: newDate,
        appointmentTime: newTime,
      });
      setRescheduleModal(false);
      setSelectedAppt(null);
      loadAppointments();
    } catch (err) {
      console.error('Failed to reschedule:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedAppt || !cancelReason.trim()) return;
    try {
      setProcessing(true);
      await mobileApiClient.departmentAdmin.cancelAppointment(selectedAppt.id, cancelReason);
      setCancelModal(false);
      setSelectedAppt(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = appointments.filter((a) => {
    if (!search) return true;
    const patName = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
    const uhid = (a.patient?.uhid || '').toLowerCase();
    const docName = (a.doctor?.user?.firstName || a.doctor?.name || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || docName.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Appointments" subtitle="Queue & Check-in Desk" />

      {/* Search & Filters */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search by UHID, patient, doctor..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {(['', 'SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All' : st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAppointments} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarCheck size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isCheckedIn = item.status === 'CHECKED_IN';
            const isCompleted = item.status === 'COMPLETED';
            const isCancelled = item.status === 'CANCELLED';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.patientCol}>
                    <Text style={styles.patName}>
                      {item.patient?.firstName} {item.patient?.lastName}
                    </Text>
                    <Text style={styles.patUhid}>UHID: {item.patient?.uhid || '—'}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isCheckedIn
                          ? '#CCFBF1'
                          : isCompleted
                          ? '#E0F2FE'
                          : isCancelled
                          ? '#FEE2E2'
                          : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isCheckedIn
                            ? '#0F766E'
                            : isCompleted
                            ? '#0284C7'
                            : isCancelled
                            ? '#DC2626'
                            : '#D97706',
                        },
                      ]}
                    >
                      {item.status || 'SCHEDULED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.doctorText}>
                    Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Assigned Physician'}
                  </Text>
                  <Text style={styles.timeText}>
                    {new Date(item.appointmentDate || Date.now()).toLocaleDateString('en-IN')}{' '}
                    • {item.appointmentTime || '10:00'}
                  </Text>
                </View>

                {!isCompleted && !isCancelled && (
                  <View style={styles.actionsRow}>
                    {!isCheckedIn && (
                      <TouchableOpacity
                        style={[styles.btn, styles.checkInBtn]}
                        onPress={() => handleCheckIn(item.id)}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.checkInText}>Check In</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.btn, styles.rescheduleBtn]}
                      onPress={() => {
                        setSelectedAppt(item);
                        setNewDate(new Date(item.appointmentDate || Date.now()).toISOString().split('T')[0]);
                        setRescheduleModal(true);
                      }}
                    >
                      <Calendar size={13} color="#0F766E" />
                      <Text style={styles.rescheduleText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => {
                        setSelectedAppt(item);
                        setCancelModal(true);
                      }}
                    >
                      <XCircle size={13} color="#DC2626" />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="2026-11-26"
            />

            <Text style={styles.inputLabel}>New Time (HH:MM)</Text>
            <TextInput
              style={styles.modalInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="10:30"
            />

            <TouchableOpacity
              style={[styles.submitBtn, processing && { opacity: 0.6 }]}
              onPress={handleRescheduleSubmit}
              disabled={processing}
            >
              <Text style={styles.submitBtnText}>{processing ? 'Updating...' : 'Confirm Reschedule'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={cancelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <TouchableOpacity onPress={() => setCancelModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Cancellation Reason *</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              numberOfLines={3}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="e.g. Doctor emergency leave, patient requested..."
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }, processing && { opacity: 0.6 }]}
              onPress={handleCancelSubmit}
              disabled={processing}
            >
              <Text style={styles.submitBtnText}>{processing ? 'Cancelling...' : 'Confirm Cancellation'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },
  statusChips: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0F766E',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientCol: {
    flex: 1,
  },
  patName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#0F766E',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  doctorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkInBtn: {
    backgroundColor: '#0F766E',
  },
  checkInText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rescheduleBtn: {
    backgroundColor: '#CCFBF1',
  },
  rescheduleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

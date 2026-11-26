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
  Plus,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentAppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Book Appointment Modal
  const [bookModal, setBookModal] = useState(false);
  const [patientUhid, setPatientUhid] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('10:00');
  const [bookReason, setBookReason] = useState('General Consultation');
  const [booking, setBooking] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Reschedule state
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  // Cancel state
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reject state
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Doctor slot unavailable / emergency shift');

  const [processing, setProcessing] = useState(false);

  const getDocName = (doc: any) => {
    if (!doc) return 'Assigned Physician';
    const u = doc.employee?.user || doc.user;
    if (u) return `Dr. ${u.firstName || ''} ${u.lastName || ''}`.trim();
    return doc.name ? `Dr. ${doc.name}` : 'Assigned Physician';
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [apptRes, docRes] = await Promise.allSettled([
        mobileApiClient.departmentAdmin.getAppointments({
          status: statusFilter || undefined,
        }),
        mobileApiClient.departmentAdmin.getDoctors(),
      ]);

      if (apptRes.status === 'fulfilled' && apptRes.value.data) {
        setAppointments(apptRes.value.data);
      }
      if (docRes.status === 'fulfilled' && docRes.value.data) {
        setDoctors(docRes.value.data);
        if (docRes.value.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docRes.value.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setProcessing(true);
      await mobileApiClient.departmentAdmin.updateAppointmentStatus(id, 'CONFIRMED');
      setToastMsg('Appointment approved and confirmed');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to approve appointment:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedAppt) return;
    try {
      setProcessing(true);
      await mobileApiClient.departmentAdmin.cancelAppointment(
        selectedAppt.id,
        `Rejected by Department Admin: ${rejectReason}`
      );
      setRejectModal(false);
      setSelectedAppt(null);
      setToastMsg('Appointment rejected');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to reject appointment:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setProcessing(true);
      await mobileApiClient.departmentAdmin.updateAppointmentStatus(id, 'COMPLETED');
      setToastMsg('Consultation marked as completed');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to complete consultation:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await mobileApiClient.departmentAdmin.updateAppointmentStatus(id, 'CHECKED_IN');
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CHECKED_IN' } : a))
      );
      setToastMsg('Patient checked in successfully');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      console.error('Failed to check in:', err);
    }
  };

  const handleBookSubmit = async () => {
    if (!patientUhid.trim()) return;
    try {
      setBooking(true);
      await mobileApiClient.departmentAdmin.createAppointment({
        patientUhid: patientUhid.trim(),
        doctorId: selectedDoctorId,
        appointmentDate: bookDate,
        appointmentTime: bookTime,
        reason: bookReason,
      });
      setBookModal(false);
      setPatientUhid('');
      setToastMsg('Appointment booked successfully');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error('Failed to book appointment:', err);
    } finally {
      setBooking(false);
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
      setToastMsg('Appointment rescheduled');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
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
      setToastMsg('Appointment cancelled');
      setTimeout(() => setToastMsg(''), 3000);
      loadData();
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
    const docName = getDocName(a.doctor).toLowerCase();
    const q = search.toLowerCase();
    return patName.includes(q) || uhid.includes(q) || docName.includes(q);
  });

  return (
    <View style={styles.container}>
      <AdminHeader
        showBack={true}
        fallbackHref="/(department-admin)/operations"
        title="Department Appointments"
        subtitle="Queue & Check-in Desk"
      />

      {toastMsg ? (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {/* Search & Status Filters */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchRow}>
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
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => setBookModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChips}
        >
          {(['', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All' : st === 'SCHEDULED' ? 'Pending Approval' : st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
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
                          ? '#EAF5ED'
                          : isCompleted
                          ? '#E0F2FE'
                          : isCancelled
                          ? '#EAF5ED'
                          : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isCheckedIn
                            ? '#38845A'
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
                    {getDocName(item.doctor)}
                  </Text>
                  <Text style={styles.timeText}>
                    {new Date(item.appointmentDate || Date.now()).toLocaleDateString('en-IN')} •{' '}
                    {item.appointmentTime || '10:00'}
                  </Text>
                </View>

                {!isCompleted && !isCancelled && (
                  <View style={styles.actionsRow}>
                    {(item.status === 'SCHEDULED' || item.status === 'PENDING') && (
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#38845A' }]}
                        onPress={() => handleApprove(item.id)}
                        disabled={processing}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.checkInText}>Approve</Text>
                      </TouchableOpacity>
                    )}

                    {(item.status === 'SCHEDULED' || item.status === 'PENDING') && (
                      <TouchableOpacity
                        style={[styles.btn, styles.cancelBtn]}
                        onPress={() => {
                          setSelectedAppt(item);
                          setRejectModal(true);
                        }}
                        disabled={processing}
                      >
                        <XCircle size={13} color="#DC2626" />
                        <Text style={styles.cancelText}>Reject</Text>
                      </TouchableOpacity>
                    )}

                    {item.status === 'CONFIRMED' && !isCheckedIn && (
                      <TouchableOpacity
                        style={[styles.btn, styles.checkInBtn]}
                        onPress={() => handleCheckIn(item.id)}
                        disabled={processing}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.checkInText}>Check In</Text>
                      </TouchableOpacity>
                    )}

                    {isCheckedIn && (
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#0284C7' }]}
                        onPress={() => handleComplete(item.id)}
                        disabled={processing}
                      >
                        <CheckCircle2 size={13} color="#FFFFFF" />
                        <Text style={styles.checkInText}>Complete</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.btn, styles.rescheduleBtn]}
                      onPress={() => {
                        setSelectedAppt(item);
                        setNewDate(
                          new Date(item.appointmentDate || Date.now()).toISOString().split('T')[0]
                        );
                        setRescheduleModal(true);
                      }}
                      disabled={processing}
                    >
                      <Calendar size={13} color="#38845A" />
                      <Text style={styles.rescheduleText}>Reschedule</Text>
                    </TouchableOpacity>

                    {item.status === 'CONFIRMED' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.cancelBtn]}
                        onPress={() => {
                          setSelectedAppt(item);
                          setCancelModal(true);
                        }}
                        disabled={processing}
                      >
                        <XCircle size={13} color="#DC2626" />
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Book Appointment Modal */}
      <Modal visible={bookModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Department Appointment</Text>
              <TouchableOpacity onPress={() => setBookModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient UHID *</Text>
              <TextInput
                style={styles.modalInput}
                value={patientUhid}
                onChangeText={setPatientUhid}
                placeholder="e.g. UYI-2026-0012"
              />

              <Text style={styles.inputLabel}>Consulting Doctor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.docChip,
                      selectedDoctorId === doc.id && styles.docChipActive,
                    ]}
                    onPress={() => setSelectedDoctorId(doc.id)}
                  >
                    <Text
                      style={[
                        styles.docChipText,
                        selectedDoctorId === doc.id && styles.docChipTextActive,
                      ]}
                    >
                      Dr. {doc.user?.firstName || doc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Appointment Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={bookDate}
                onChangeText={setBookDate}
                placeholder="2026-11-26"
              />

              <Text style={styles.inputLabel}>Appointment Time (HH:MM)</Text>
              <TextInput
                style={styles.modalInput}
                value={bookTime}
                onChangeText={setBookTime}
                placeholder="10:00"
              />

              <Text style={styles.inputLabel}>Reason / Symptoms</Text>
              <TextInput
                style={styles.modalInput}
                value={bookReason}
                onChangeText={setBookReason}
                placeholder="e.g. Follow-up consultation"
              />

              <TouchableOpacity
                style={[styles.submitBtn, booking && { opacity: 0.6 }]}
                onPress={handleBookSubmit}
                disabled={booking}
              >
                {booking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

            <View style={styles.modalBody}>
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
                <Text style={styles.submitBtnText}>
                  {processing ? 'Updating...' : 'Confirm Reschedule'}
                </Text>
              </TouchableOpacity>
            </View>
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

            <View style={styles.modalBody}>
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
                style={[
                  styles.submitBtn,
                  { backgroundColor: '#DC2626' },
                  processing && { opacity: 0.6 },
                ]}
                onPress={handleCancelSubmit}
                disabled={processing}
              >
                <Text style={styles.submitBtnText}>
                  {processing ? 'Cancelling...' : 'Confirm Cancellation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Appointment Modal */}
      <Modal visible={rejectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Appointment Request</Text>
              <TouchableOpacity onPress={() => setRejectModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Rejection Reason *</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                multiline
                numberOfLines={3}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="State reason for rejecting request..."
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: '#DC2626' },
                  processing && { opacity: 0.6 },
                ]}
                onPress={handleRejectSubmit}
                disabled={processing}
              >
                <Text style={styles.submitBtnText}>
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </Text>
              </TouchableOpacity>
            </View>
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
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38845A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toastText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#38845A',
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  doctorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkInBtn: {
    backgroundColor: '#38845A',
  },
  checkInText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rescheduleBtn: {
    backgroundColor: '#EAF5ED',
  },
  rescheduleText: {
    color: '#38845A',
    fontSize: 11,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#EAF5ED',
  },
  cancelText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  docChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
  },
  docChipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  docChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  docChipTextActive: {
    color: '#38845A',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

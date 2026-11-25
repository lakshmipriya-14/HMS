import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CalendarCheck,
  Search,
  Plus,
  Clock,
  User,
  Users,
  CheckCircle,
  AlertCircle,
  Edit2,
  Ban,
  ArrowRight,
  Filter,
  CheckSquare,
  Phone,
  DollarSign,
  TrendingUp,
  X,
  UserCheck,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

type OpdTab = 'queue' | 'appointments' | 'checkin' | 'patients' | 'overview';

export default function AdminOpdScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OpdTab>('queue');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  // Book Appointment Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDeptId, setBookDeptId] = useState('');
  const [bookPatientName, setBookPatientName] = useState('');
  const [bookPatientPhone, setBookPatientPhone] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('10:00');
  const [bookReason, setBookReason] = useState('');

  // Reschedule Modal
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('10:00');

  // Cancel Modal
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Patient Detail Modal
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [qRes, docRes, deptRes, patRes] = await Promise.all([
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getDoctors().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getDepartments().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getPatients({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      if (qRes.data) setAppointments(qRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (patRes.data) setPatients(patRes.data);
    } catch (err: any) {
      console.error('Failed to load OPD data:', err);
      Alert.alert('Load Error', err.message || 'Failed to load OPD data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const q = searchQuery.toLowerCase();
      const patientName = `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.toLowerCase();
      const doctorName = apt.doctor?.employee?.user
        ? `${apt.doctor.employee.user.firstName} ${apt.doctor.employee.user.lastName}`.toLowerCase()
        : '';
      const token = String(apt.tokenNumber || '');
      const uhid = (apt.patient?.uhid || '').toLowerCase();

      const matchesSearch =
        patientName.includes(q) || doctorName.includes(q) || token.includes(q) || uhid.includes(q);
      const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
      const matchesDept = selectedDeptId === 'ALL' || apt.departmentId === selectedDeptId;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [appointments, searchQuery, statusFilter, selectedDeptId]);

  // Derived Metrics
  const totalAppointments = appointments.length;
  const waitingCount = appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN').length;
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
  const estimatedRevenue = completedCount * 500;

  // Actions
  const handleCheckIn = async (id: string) => {
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.checkIn(id);
      Alert.alert('Checked In', 'Patient marked checked in for consultation.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to check in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.updateStatus(id, status);
      Alert.alert('Status Updated', `Appointment marked as ${status}.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!bookDoctorId || !bookDate || !bookTime) {
      Alert.alert('Incomplete Form', 'Please choose doctor, appointment date, and slot time.');
      return;
    }
    try {
      setSubmitting(true);
      const doc = doctors.find((d) => d.id === bookDoctorId);
      await mobileApiClient.appointments.book({
        doctorId: bookDoctorId,
        departmentId: bookDeptId || doc?.departmentId || departments[0]?.id,
        appointmentDate: bookDate,
        appointmentTime: bookTime,
        reason: bookReason || 'General OPD Consultation',
        patientName: bookPatientName || undefined,
        patientPhone: bookPatientPhone || undefined,
      });

      setBookModalOpen(false);
      setBookPatientName('');
      setBookPatientPhone('');
      setBookReason('');
      Alert.alert('Success', 'OPD Appointment booked and token generated.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !reschedDate) return;
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.reschedule(rescheduleModal.id, {
        appointmentDate: reschedDate,
        appointmentTime: reschedTime || '10:00',
      });
      setRescheduleModal(null);
      Alert.alert('Rescheduled', 'Appointment slot updated.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.cancel(cancelModal.id, cancelReason || 'Administrative cancellation');
      setCancelModal(null);
      setCancelReason('');
      Alert.alert('Cancelled', 'Appointment has been cancelled.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="OPD Management" subtitle="Outpatient Flow, Tokens & Clinic Desk" />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'queue', label: 'Live Queue', icon: Clock },
          { id: 'appointments', label: 'Ledger', icon: CalendarCheck },
          { id: 'checkin', label: 'Check-In', icon: UserCheck },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'overview', label: 'Metrics', icon: TrendingUp },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id as OpdTab)}
            >
              <Icon size={14} color={isActive ? '#0F766E' : '#64748B'} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading OPD telemetry & live queue...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#0F766E" />}
        >
          {/* Header Action Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              setBookDoctorId(doctors[0]?.id || '');
              setBookDeptId(departments[0]?.id || '');
              setBookModalOpen(true);
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>Book OPD Appointment</Text>
          </TouchableOpacity>

          {/* ========================================================================= */}
          {/* TAB 1: LIVE TOKEN QUEUE                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'queue' && (
            <View>
              {/* Quick Queue Stats */}
              <View style={styles.statRow}>
                <View style={[styles.miniStatCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.miniStatNum, { color: '#16A34A' }]}>{waitingCount}</Text>
                  <Text style={styles.miniStatLabel}>Waiting</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Text style={[styles.miniStatNum, { color: '#2563EB' }]}>{inProgressCount}</Text>
                  <Text style={styles.miniStatLabel}>Consulting</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                  <Text style={[styles.miniStatNum, { color: '#475569' }]}>{completedCount}</Text>
                  <Text style={styles.miniStatLabel}>Completed</Text>
                </View>
              </View>

              {/* Live Queue Cards */}
              {appointments.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle size={32} color="#10B981" />
                  <Text style={styles.emptyTitle}>OPD Queue Clear</Text>
                  <Text style={styles.emptySub}>All scheduled consultations for today have been completed.</Text>
                </View>
              ) : (
                appointments
                  .filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
                  .map((apt) => {
                    const pName = apt.patient
                      ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim()
                      : apt.patientName || 'Patient';
                    const docName = apt.doctor?.employee?.user
                      ? `Dr. ${apt.doctor.employee.user.firstName} ${apt.doctor.employee.user.lastName}`
                      : 'Consultant';
                    const isSched = apt.status === 'SCHEDULED';
                    const isChecked = apt.status === 'CHECKED_IN';
                    const isInProgress = apt.status === 'IN_PROGRESS';

                    return (
                      <View key={apt.id} style={styles.card}>
                        <View style={styles.queueHeader}>
                          <View style={styles.tokenBox}>
                            <Text style={styles.tokenNum}>#{apt.tokenNumber || '1'}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.patientName}>{pName}</Text>
                            <Text style={styles.docSubtitle}>
                              {docName} • {apt.department?.name || 'General'}
                            </Text>
                            <Text style={styles.timeText}>
                              Slot: {apt.slotTime || apt.appointmentTime || 'Today'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: isChecked
                                  ? '#CCFBF1'
                                  : isInProgress
                                  ? '#DBEAFE'
                                  : '#FEF3C7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color: isChecked
                                    ? '#0F766E'
                                    : isInProgress
                                    ? '#1D4ED8'
                                    : '#B45309',
                                },
                              ]}
                            >
                              {apt.status}
                            </Text>
                          </View>
                        </View>

                        {/* Status Progression Actions */}
                        <View style={styles.actionRow}>
                          {isSched && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                              onPress={() => handleCheckIn(apt.id)}
                            >
                              <CheckCircle size={13} color="#16A34A" />
                              <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Check-In</Text>
                            </TouchableOpacity>
                          )}

                          {isChecked && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                              onPress={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}
                            >
                              <Clock size={13} color="#2563EB" />
                              <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Call In / Start</Text>
                            </TouchableOpacity>
                          )}

                          {isInProgress && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                              onPress={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                            >
                              <CheckSquare size={13} color="#16A34A" />
                              <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Mark Complete</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                              setRescheduleModal(apt);
                              setReschedDate(
                                apt.appointmentDate
                                  ? new Date(apt.appointmentDate).toISOString().split('T')[0]
                                  : new Date().toISOString().split('T')[0]
                              );
                              setReschedTime(apt.slotTime || apt.appointmentTime || '10:00');
                            }}
                          >
                            <Edit2 size={13} color="#0F766E" />
                            <Text style={styles.actionBtnText}>Reschedule</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: '#FECDD3' }]}
                            onPress={() => {
                              setCancelModal(apt);
                              setCancelReason('');
                            }}
                          >
                            <Ban size={13} color="#DC2626" />
                            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
              )}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: APPOINTMENTS LEDGER                                                */}
          {/* ========================================================================= */}
          {activeTab === 'appointments' && (
            <View>
              {/* Search & Status Filters */}
              <View style={styles.searchBox}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by patient, token, doctor..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['ALL', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                  >
                    <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                      {st.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredAppointments.length === 0 ? (
                <Text style={styles.emptyText}>No appointments matching criteria.</Text>
              ) : (
                filteredAppointments.map((apt) => {
                  const pName = apt.patient
                    ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim()
                    : apt.patientName || 'Patient';
                  const docName = apt.doctor?.employee?.user
                    ? `Dr. ${apt.doctor.employee.user.firstName} ${apt.doctor.employee.user.lastName}`
                    : 'Consultant';

                  return (
                    <View key={apt.id} style={styles.card}>
                      <View style={styles.ledgerHead}>
                        <View>
                          <Text style={styles.patientName}>{pName}</Text>
                          <Text style={styles.uhidText}>Token #{apt.tokenNumber} • UHID: {apt.patient?.uhid || 'N/A'}</Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>{apt.status}</Text>
                        </View>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailText}>👨‍⚕️ {docName} ({apt.department?.name || 'OPD'})</Text>
                        <Text style={styles.detailText}>
                          🕒 {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString('en-IN') : 'Today'} at {apt.slotTime || apt.appointmentTime || '10:00'}
                        </Text>
                        {apt.reason && <Text style={styles.detailText}>📝 Reason: {apt.reason}</Text>}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CHECK-IN DESK                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'checkin' && (
            <View>
              <Text style={styles.sectionHeader}>Patients Scheduled for Arrival Today</Text>
              {appointments.filter((a) => a.status === 'SCHEDULED').length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle size={32} color="#10B981" />
                  <Text style={styles.emptyTitle}>No Pending Arrivals</Text>
                  <Text style={styles.emptySub}>All scheduled patients have either checked in or completed consultations.</Text>
                </View>
              ) : (
                appointments
                  .filter((a) => a.status === 'SCHEDULED')
                  .map((apt) => (
                    <View key={apt.id} style={styles.card}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={styles.patientName}>
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </Text>
                          <Text style={styles.docSubtitle}>Token #{apt.tokenNumber} • Slot: {apt.slotTime || apt.appointmentTime}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', paddingVertical: 8, paddingHorizontal: 14 }]}
                          onPress={() => handleCheckIn(apt.id)}
                        >
                          <CheckCircle size={14} color="#16A34A" />
                          <Text style={[styles.actionBtnText, { color: '#16A34A', fontSize: 12 }]}>Mark Arrival</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              )}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PATIENT DIRECTORY & DUPLICATE CHECK                                 */}
          {/* ========================================================================= */}
          {activeTab === 'patients' && (
            <View>
              <View style={styles.searchBox}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search patient name, phone, or UHID..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {patients
                .filter((p) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
                    (p.uhid || '').toLowerCase().includes(q) ||
                    (p.phone || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 30)
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.card}
                    onPress={() => setSelectedPatient(p)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={styles.patientName}>
                          {p.firstName} {p.lastName}
                        </Text>
                        <Text style={styles.uhidText}>UHID: {p.uhid} • Phone: {p.phone || 'N/A'}</Text>
                        <Text style={styles.docSubtitle}>
                          {p.gender} • {p.age ? `${p.age} yrs` : 'Age N/A'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: OPD METRICS & OVERVIEW                                             */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <View style={{ gap: 12 }}>
              <View style={styles.metricsCard}>
                <Text style={styles.metricsTitle}>Daily Outpatient Performance</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNum}>{totalAppointments}</Text>
                    <Text style={styles.metricLabel}>Total Bookings</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNum, { color: '#16A34A' }]}>{completedCount}</Text>
                    <Text style={styles.metricLabel}>Consulted</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNum, { color: '#2563EB' }]}>{waitingCount}</Text>
                    <Text style={styles.metricLabel}>In Waiting Queue</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricNum, { color: '#DC2626' }]}>{cancelledCount}</Text>
                    <Text style={styles.metricLabel}>Cancelled / No-Show</Text>
                  </View>
                </View>
              </View>

              <View style={styles.revenueCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.revenueIcon}>
                    <DollarSign size={20} color="#0F766E" />
                  </View>
                  <View>
                    <Text style={styles.revenueTitle}>Est. Consultation Revenue</Text>
                    <Text style={styles.revenueVal}>₹ {estimatedRevenue.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK APPOINTMENT                                                   */}
      {/* ========================================================================= */}
      <Modal visible={bookModalOpen} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Book OPD Appointment</Text>
              <TouchableOpacity onPress={() => setBookModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Attending Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {doctors.map((d) => {
                const isSelected = bookDoctorId === d.id;
                const name = d.employee?.user
                  ? `Dr. ${d.employee.user.firstName} ${d.employee.user.lastName}`
                  : 'Doctor';
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      setBookDoctorId(d.id);
                      setBookDeptId(d.departmentId);
                    }}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Patient Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Ramesh Kumar"
              value={bookPatientName}
              onChangeText={setBookPatientName}
            />

            <Text style={styles.fieldLabel}>Patient Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10-digit Phone"
              keyboardType="phone-pad"
              value={bookPatientPhone}
              onChangeText={setBookPatientPhone}
            />

            <Text style={styles.fieldLabel}>Appointment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              value={bookDate}
              onChangeText={setBookDate}
            />

            <Text style={styles.fieldLabel}>Slot Time (e.g. 10:00, 11:30)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10:00"
              value={bookTime}
              onChangeText={setBookTime}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleBookAppointment} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Generate OPD Token</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESCHEDULE APPOINTMENT                                            */}
      {/* ========================================================================= */}
      <Modal visible={!!rescheduleModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>New Appointment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              value={reschedDate}
              onChangeText={setReschedDate}
            />

            <Text style={styles.fieldLabel}>New Slot Time</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10:00"
              value={reschedTime}
              onChangeText={setReschedTime}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleReschedule} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Reschedule</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CANCEL APPOINTMENT                                                */}
      {/* ========================================================================= */}
      <Modal visible={!!cancelModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <TouchableOpacity onPress={() => setCancelModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Cancellation Reason</Text>
            <TextInput
              style={[styles.fieldInput, { height: 70 }]}
              placeholder="Doctor emergency / Patient request"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleCancelAppointment}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Cancellation</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: PATIENT DETAILS                                                   */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedPatient} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Patient Demographic Info</Text>
              <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedPatient && (
              <View style={{ gap: 8 }}>
                <Text style={styles.patientName}>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </Text>
                <Text style={styles.uhidText}>UHID: {selectedPatient.uhid}</Text>
                <Text style={styles.docSubtitle}>Phone: {selectedPatient.phone || 'None'}</Text>
                <Text style={styles.docSubtitle}>Gender: {selectedPatient.gender} • Age: {selectedPatient.age || 'N/A'}</Text>
                <Text style={styles.docSubtitle}>Address: {selectedPatient.address || 'Not specified'}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, color: '#64748B', marginTop: 8 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F766E',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F766E',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F766E',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  miniStatCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  miniStatNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  ledgerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  uhidText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#334155',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  revenueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  revenueVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
  },
  chipSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSelectActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  chipSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipSelectTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

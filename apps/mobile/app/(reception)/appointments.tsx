import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import {
  Calendar,
  Clock,
  PlusCircle,
  Stethoscope,
  User,
  Filter,
  CheckCircle2,
  X,
  Building2,
  AlertCircle,
  Ticket,
} from 'lucide-react-native';

interface AppointmentItem {
  id: string;
  tokenNumber: number;
  patientName: string;
  patientPhone: string;
  uhid: string;
  doctorName: string;
  department: string;
  appointmentTime: string;
  appointmentDate: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: string;
}

export default function ReceptionAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('TODAY');
  const [refreshing, setRefreshing] = useState(false);

  // Booking Modal
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [patUhid, setPatUhid] = useState('');
  const [requests, setRequests] = useState<NonNullable<Awaited<ReturnType<typeof mobileApiClient.reception.getAppointmentRequests>>['data']>>([]);
  const [requestId, setRequestId] = useState<string>();
  const [requestError, setRequestError] = useState(false);
  const fetchRequests = async () => {
    try {
      setRequests((await mobileApiClient.reception.getAppointmentRequests()).data ?? []);
      setRequestError(false);
    } catch {
      setRequestError(true);
    }
  };
  const [doctors, setDoctors] = useState<NonNullable<Awaited<ReturnType<typeof mobileApiClient.doctor.list>>['data']>>([]);
  const [doctorId, setDoctorId] = useState('');
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [aptTime, setAptTime] = useState('');
  const [aptType, setAptType] = useState('OPD');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Reschedule / Cancel Modal
  const [actionItem, setActionItem] = useState<AppointmentItem | null>(null);
  const [changing, setChanging] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const openActions = (item: AppointmentItem) => {
    setNewDate(item.appointmentDate.slice(0, 10));
    setNewTime(item.appointmentTime);
    setConfirmCancel(false);
    setActionItem(item);
  };

  const fetchAppointments = async () => {
    try {
      const res = await mobileApiClient.reception.getTodayQueue();
      if (res?.data && Array.isArray(res.data)) {
        const mapped = res.data.map((a: any) => ({
          id: a.id,
          tokenNumber: a.tokenNumber,
          patientName: `${a.patient?.firstName} ${a.patient?.lastName}`,
          patientPhone: a.patient?.phone || '',
          uhid: a.patient?.uhid || '',
          doctorName: a.doctor?.employee?.user ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}` : 'Dr. Consultant',
          department: a.department?.name || 'General OPD',
          appointmentTime: a.appointmentTime || '10:00 AM',
          appointmentDate: a.appointmentDate,
          status: a.status,
          type: a.type || 'OPD',
        }));
        setAppointments(mapped);
      }
    } catch {
      // Keep state
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    void fetchRequests();
    mobileApiClient.doctor.list().then((res) => setDoctors(res.data ?? []))
      .catch(() => Alert.alert('Could not load doctors', 'Reopen this screen to retry.'));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
    void fetchRequests();
  };

  const handleBookSubmit = async () => {
    const doctor = doctors.find((item) => item.id === doctorId);
    if (!user || !doctor || !patUhid.trim() || !aptDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(aptTime)) {
      Alert.alert('Required', 'Enter the UHID and date, select a doctor, and enter the time in HH:mm format.');
      return;
    }
    setIsBooking(true);
    try {
      const selected = requests.find((request) => request.id === requestId);
      const matches = selected ? [selected.patient] : (await mobileApiClient.reception.searchPatients(patUhid.trim())).data;
      const patient = Array.isArray(matches) ? matches.find((item) => item.uhid?.toUpperCase() === patUhid.trim().toUpperCase()) : undefined;
      if (!patient) throw new Error('No patient in your directory has that UHID.');
      const response = await mobileApiClient.reception.bookAppointment({
        requestId: selected?.id, patientId: patient.id, doctorId: doctor.id, departmentId: doctor.department.id,
        hospitalId: user.hospitalId,
        appointmentDate: aptDate, appointmentTime: aptTime,
        appointmentType: aptType as Parameters<typeof mobileApiClient.reception.bookAppointment>[0]['appointmentType'],
        reasonForVisit: reason.trim(),
      });
      setBookModalVisible(false);
      setRequestId(undefined);
      await Promise.all([fetchAppointments(), fetchRequests()]);
      Alert.alert('Appointment confirmed', `Token #${response.data?.tokenNumber} allocated for ${patient.firstName} ${patient.lastName}.`);
    } catch (error) {
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const changeAppointment = async (action: 'cancel' | 'reschedule') => {
    if (!actionItem || changing) return;
    setChanging(true);
    try {
      await mobileApiClient.reception.changeAppointment(actionItem.id, { action, date: newDate, time: newTime });
      await fetchAppointments();
      setActionItem(null);
    } catch (error) {
      Alert.alert('Appointment could not be changed', error instanceof Error ? error.message : 'Refresh and try again.');
    } finally {
      setChanging(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'TODAY') return a.status === 'SCHEDULED' || a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return a.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return a.status === 'CANCELLED';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Controls */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Appointment Management</Text>
          <Text style={styles.headerSub}>OPD Scheduling & Capacity Calendar</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => setBookModalVisible(true)}>
          <PlusCircle size={16} color="#fff" />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'TODAY' && styles.tabActive]} onPress={() => setActiveTab('TODAY')}>
          <Text style={[styles.tabText, activeTab === 'TODAY' && styles.tabTextActive]}>Today Active ({appointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'COMPLETED' && styles.tabActive]} onPress={() => setActiveTab('COMPLETED')}>
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'CANCELLED' && styles.tabActive]} onPress={() => setActiveTab('CANCELLED')}>
          <Text style={[styles.tabText, activeTab === 'CANCELLED' && styles.tabTextActive]}>Cancelled</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ALL' && styles.tabActive]} onPress={() => setActiveTab('ALL')}>
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>All ({appointments.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Appointment List */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Calendar size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No appointments in this view</Text>
            <Text style={styles.emptySub}>All scheduled slots are up to date</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openActions(item)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={styles.tokenPill}>
                <Text style={styles.tokenPillText}>T-{item.tokenNumber}</Text>
              </View>
              <Text style={styles.timePill}>{item.appointmentTime}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'IN_PROGRESS' && styles.badgeProgress,
                  item.status === 'CHECKED_IN' && styles.badgeCheckedIn,
                  item.status === 'SCHEDULED' && styles.badgeScheduled,
                  item.status === 'CANCELLED' && styles.badgeCancelled,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    item.status === 'IN_PROGRESS' && styles.textProgress,
                    item.status === 'CHECKED_IN' && styles.textCheckedIn,
                    item.status === 'SCHEDULED' && styles.textScheduled,
                    item.status === 'CANCELLED' && styles.textCancelled,
                  ]}
                >
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.uhidLine}>UHID: {item.uhid} • Phone: {item.patientPhone}</Text>

            <View style={styles.docRow}>
              <Stethoscope size={13} color="#0284C7" />
              <Text style={styles.docText}>{item.doctorName} ({item.department})</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.typeText}>Type: {item.type}</Text>
              <Text style={styles.actionPrompt}>Tap to manage / reschedule / cancel</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* ============================================================== */}
      {/* BOOK APPOINTMENT MODAL                                         */}
      {/* ============================================================== */}
      <Modal visible={bookModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.mHeader}>
              <Text style={styles.mTitle}>Book OPD Consultation</Text>
              <TouchableOpacity onPress={() => setBookModalVisible(false)}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.fLabel}>Patient appointment requests</Text>
              {requestError && <Text accessibilityRole="alert" onPress={() => void fetchRequests()}>Could not load requests. Tap to retry.</Text>}
              {!requestError && requests.length === 0 && <Text>No pending patient requests.</Text>}
              {requests.map((request) => <TouchableOpacity key={request.id} style={styles.fInput}
                accessibilityRole="radio" accessibilityState={{ selected: requestId === request.id }}
                onPress={() => {
                  setRequestId(request.id);
                  setPatUhid(request.patient.uhid);
                  setAptDate(request.preferredDate.slice(0, 10));
                }}>
                <Text>{requestId === request.id ? 'Selected: ' : ''}{request.patient.firstName} {request.patient.lastName} · {request.specialty} · {request.preferredDate.slice(0, 10)}</Text>
              </TouchableOpacity>)}
              <Text style={styles.fLabel}>Patient UHID</Text>
              <TextInput style={styles.fInput} value={patUhid} onChangeText={(value) => { setPatUhid(value); setRequestId(undefined); }} autoCapitalize="characters" />
              <Text style={styles.fLabel}>Consultant Doctor</Text>
              {doctors.length === 0 && <Text>No doctors available.</Text>}
              {doctors.map((doctor) => (
                <TouchableOpacity key={doctor.id} style={styles.fInput} accessibilityRole="radio"
                  accessibilityState={{ selected: doctorId === doctor.id }} onPress={() => setDoctorId(doctor.id)}>
                  <Text>{doctorId === doctor.id ? 'Selected: ' : ''}{doctor.employee.user.firstName} {doctor.employee.user.lastName} · {doctor.department.name}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fLabel}>Date</Text>
                  <TextInput style={styles.fInput} value={aptDate} onChangeText={setAptDate} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fLabel}>Preferred Slot</Text>
                  <TextInput style={styles.fInput} value={aptTime} onChangeText={setAptTime} />
                </View>
              </View>

              <Text style={styles.fLabel}>Chief Complaint / Visit Reason</Text>
              <TextInput style={[styles.fInput, { height: 60, textAlignVertical: 'top' }]} multiline value={reason} onChangeText={setReason} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleBookSubmit} disabled={isBooking}>
                {isBooking ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Booking & Issue Token</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MANAGE (RESCHEDULE / CANCEL) MODAL                             */}
      {/* ============================================================== */}
      <Modal visible={!!actionItem} animationType="fade" transparent={true}>
        {actionItem && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.mHeader}>
                <Text style={styles.mTitle}>Manage Appointment</Text>
                <TouchableOpacity onPress={() => setActionItem(null)}><X size={20} color="#64748B" /></TouchableOpacity>
              </View>

              <Text style={styles.actionItemName}>{actionItem.patientName} (T-{actionItem.tokenNumber})</Text>
              <Text style={styles.actionItemSub}>{actionItem.doctorName} • {actionItem.appointmentTime}</Text>
              <TextInput style={styles.fInput} accessibilityLabel="New appointment date" placeholder="YYYY-MM-DD" value={newDate} onChangeText={setNewDate} />
              <TextInput style={styles.fInput} accessibilityLabel="New appointment time" placeholder="HH:mm (IST)" value={newTime} onChangeText={setNewTime} />

              <View style={{ gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={styles.reschedBtn} disabled={changing} onPress={() => void changeAppointment('reschedule')}>
                  <Clock size={16} color="#0284C7" />
                  <Text style={styles.reschedBtnText}>Save new time</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} disabled={changing} onPress={() => confirmCancel ? void changeAppointment('cancel') : setConfirmCancel(true)}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.cancelBtnText}>{confirmCancel ? 'Confirm cancellation' : 'Cancel appointment'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#38845A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  bookBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#38845A' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tokenPill: { backgroundColor: '#EAF5ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  tokenPillText: { fontSize: 11, fontWeight: '800', color: '#38845A' },
  timePill: { fontSize: 11, fontWeight: '700', color: '#64748B', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeProgress: { backgroundColor: '#DCFCE7' },
  badgeCheckedIn: { backgroundColor: '#FEF3C7' },
  badgeScheduled: { backgroundColor: '#F1F5F9' },
  badgeCancelled: { backgroundColor: '#EAF5ED' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  textProgress: { color: '#166534' },
  textCheckedIn: { color: '#B45309' },
  textScheduled: { color: '#475569' },
  textCancelled: { color: '#DC2626' },
  patientName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  uhidLine: { fontSize: 11, color: '#64748B', marginTop: 2 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  docText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  typeText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  actionPrompt: { fontSize: 10, color: '#38845A', fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, maxHeight: '90%' },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  fLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  fInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 12, backgroundColor: '#F8FAFC' },
  row: { flexDirection: 'row' },
  submitBtn: { backgroundColor: '#38845A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  actionItemName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  actionItemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  reschedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2FE', paddingVertical: 12, borderRadius: 8, gap: 8 },
  reschedBtnText: { color: '#0284C7', fontSize: 12, fontWeight: '700' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF5ED', paddingVertical: 12, borderRadius: 8, gap: 8 },
  cancelBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
});


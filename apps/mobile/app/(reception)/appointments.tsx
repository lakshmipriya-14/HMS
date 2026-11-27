import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AppointmentSource,
  BookingOptionsDto,
  DoctorSlotAvailabilityDto,
} from '@multispeciality-hms/contracts';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  PlusCircle,
  Search,
  Stethoscope,
  Ticket,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { downloadPatientReceiptPdf } from '../../services/downloadHelper';
import { UyirinaiTheme } from '../../constants/theme';

interface AppointmentItem {
  id: string;
  appointmentNumber: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  uhid: string;
  doctorId: string;
  doctorName: string;
  department: string;
  branchName: string;
  hospitalName: string;
  branchAddress?: string;
  branchPhone?: string;
  appointmentTime: string;
  appointmentDate: string;
  status: string;
  type: string;
  priority: string;
  source: AppointmentSource | string;
  reasonForVisit: string;
  consultationFee: number;
}

interface SelectedPatient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  portalAccess?: { email: string; accessCode: string; expiresAt: string };
}

function getIstDateOffset(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
  }).format(date);
}

function showNotice(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function ReceptionAppointmentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('TODAY');
  const [listSearch, setListSearch] = useState('');

  // Walk-in Booking Wizard Modal State
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState<'PATIENT' | 'DOCTOR' | 'CONFIRMATION'>('PATIENT');

  // Step A: Patient identification & inline registration
  const [requests, setRequests] = useState<NonNullable<Awaited<ReturnType<typeof mobileApiClient.reception.getAppointmentRequests>>['data']>>([]);
  const [requestId, setRequestId] = useState<string>();
  const [patientQuery, setPatientQuery] = useState('');
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientResults, setPatientResults] = useState<SelectedPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [registeringPatient, setRegisteringPatient] = useState(false);
  const [regError, setRegError] = useState('');

  // Inline new patient fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('1990-05-15');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [regBloodGroup, setRegBloodGroup] = useState('O_POSITIVE');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Madurai');
  const [regState, setRegState] = useState('Tamil Nadu');
  const [regPostalCode, setRegPostalCode] = useState('625001');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regEmergencyRelation, setRegEmergencyRelation] = useState('Family');

  // Step B: Branch, Department, Doctor & Slot Selection
  const [bookingOptions, setBookingOptions] = useState<BookingOptionsDto | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [aptDate, setAptDate] = useState(getIstDateOffset(0));
  const [slotInfo, setSlotInfo] = useState<DoctorSlotAvailabilityDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [aptType, setAptType] = useState<'OPD' | 'FOLLOW_UP' | 'EMERGENCY'>('OPD');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY'>('ROUTINE');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Step C: Confirmation record & PDF download
  const [confirmedApt, setConfirmedApt] = useState<AppointmentItem | null>(null);
  const [createdPortalAccess, setCreatedPortalAccess] = useState<SelectedPatient['portalAccess']>();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Reschedule / Cancel Action Modal
  const [actionItem, setActionItem] = useState<AppointmentItem | null>(null);
  const [changing, setChanging] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const todayStr = getIstDateOffset(0);

  const mapAppointment = (a: any): AppointmentItem => ({
    id: a.id,
    appointmentNumber: a.appointmentNumber || `APT-${a.id?.slice(0, 6)?.toUpperCase()}`,
    tokenNumber: a.tokenNumber ?? 0,
    patientId: a.patient?.id || a.patientId,
    patientName: a.patient ? `${a.patient.firstName} ${a.patient.lastName}`.trim() : 'Patient',
    patientPhone: a.patient?.phone || '',
    patientEmail: a.patient?.email || null,
    uhid: a.patient?.uhid || '',
    doctorId: a.doctorId || a.doctor?.id || '',
    doctorName: a.doctor?.employee?.user
      ? `Dr. ${a.doctor.employee.user.firstName} ${a.doctor.employee.user.lastName}`
      : 'Dr. Consultant',
    department: a.department?.name || a.doctor?.department?.name || 'General OPD',
    branchName: a.branch?.name || user?.branchName || 'Main Branch',
    hospitalName: a.branch?.hospital?.name || user?.hospitalName || 'Uyirinai Multispeciality Hospital',
    branchAddress: [a.branch?.address, a.branch?.city].filter(Boolean).join(', '),
    branchPhone: a.branch?.phone || '',
    appointmentTime: a.appointmentTime || '09:00',
    appointmentDate: typeof a.appointmentDate === 'string' ? a.appointmentDate : new Date(a.appointmentDate).toISOString(),
    status: a.status || 'SCHEDULED',
    type: a.type || 'OPD',
    priority: a.priority || 'ROUTINE',
    source: a.source || 'ONLINE_PATIENT',
    reasonForVisit: a.reasonForVisit || 'OPD Consultation',
    consultationFee: Number(a.consultationFee ?? 0),
  });

  const fetchAppointments = useCallback(async () => {
    try {
      const [allRes, queueRes] = await Promise.all([
        mobileApiClient.appointments.list().catch(() => ({ data: [] })),
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
      ]);

      const mergedMap = new Map<string, AppointmentItem>();
      const queueRows = Array.isArray(queueRes?.data) ? queueRes.data : [];
      const listRows = Array.isArray(allRes?.data) ? allRes.data : [];

      for (const row of [...queueRows, ...listRows]) {
        if (row?.id) mergedMap.set(row.id, mapAppointment(row));
      }

      const sorted = Array.from(mergedMap.values()).sort((a, b) => {
        const dCmp = b.appointmentDate.slice(0, 10).localeCompare(a.appointmentDate.slice(0, 10));
        if (dCmp !== 0) return dCmp;
        return (a.tokenNumber || 0) - (b.tokenNumber || 0);
      });
      setAppointments(sorted);
    } catch {
      // keep existing state on transient error
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, [user?.branchName, user?.hospitalName]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await mobileApiClient.reception.getAppointmentRequests();
      setRequests(res.data ?? []);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchBookingOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await mobileApiClient.reception.getBookingOptions();
      const opts = res.data;
      if (opts) {
        setBookingOptions(opts);
        const defaultBranch = opts.branches.find((b) => b.id === user?.branchId) || opts.branches[0];
        if (defaultBranch && !selectedBranchId) {
          setSelectedBranchId(defaultBranch.id);
        }
        if (opts.departments.length > 0 && !selectedDepartmentId) {
          const branchDepts = opts.departments.filter(
            (d) => !defaultBranch || d.branchId === defaultBranch.id,
          );
          if (branchDepts[0]) setSelectedDepartmentId(branchDepts[0].id);
        }
      }
    } catch {
      // fallback via doctor.list if needed
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedBranchId, selectedDepartmentId, user?.branchId]);

  useFocusEffect(
    useCallback(() => {
      void fetchAppointments();
      void fetchRequests();
      const interval = setInterval(() => {
        void fetchAppointments();
      }, 15_000);
      return () => clearInterval(interval);
    }, [fetchAppointments, fetchRequests]),
  );

  useEffect(() => {
    if (params.mode === 'walkin') {
      openBookingWizard();
    }
  }, [params.mode]);

  // Load slots whenever doctor or date changes
  useEffect(() => {
    if (!bookModalVisible || wizardStep !== 'DOCTOR' || !doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(aptDate)) {
      setSlotInfo(null);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError('');
    mobileApiClient.reception
      .getDoctorSlots({ doctorId, date: aptDate, branchId: selectedBranchId || undefined })
      .then((res) => {
        if (cancelled) return;
        setSlotInfo(res.data ?? null);
        // Clear selected time if it became unavailable on new date/doctor
        const matching = res.data?.slots.find((s) => s.time === aptTime && s.available);
        if (!matching) {
          const firstAvail = res.data?.slots.find((s) => s.available);
          setAptTime(firstAvail ? firstAvail.time : '');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSlotInfo(null);
        setSlotError(err instanceof Error ? err.message : 'Could not load slots for selected date.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookModalVisible, wizardStep, doctorId, aptDate, selectedBranchId]);

  const openBookingWizard = () => {
    setWizardStep('PATIENT');
    setRequestId(undefined);
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setShowNewPatientForm(false);
    setRegError('');
    setDoctorId('');
    setAptDate(getIstDateOffset(0));
    setAptTime('');
    setAptType('OPD');
    setPriority('ROUTINE');
    setReason('');
    setBookingError('');
    setConfirmedApt(null);
    setCreatedPortalAccess(undefined);
    setBookModalVisible(true);
    void fetchBookingOptions();
    void fetchRequests();
  };

  const handlePatientSearch = async () => {
    const q = patientQuery.trim();
    if (!q) {
      showNotice('Enter search details', 'Enter Patient ID (UHID), Patient Name, or Phone Number.');
      return;
    }
    setSearchingPatients(true);
    setRegError('');
    try {
      const res = await mobileApiClient.reception.searchPatients(q);
      let rows: SelectedPatient[] = Array.isArray(res?.data) ? res.data : [];

      // If no branch-directory hit & input looks like phone or email, check hospital duplicate lookup
      const digits = q.replace(/\D/g, '');
      if (rows.length === 0 && (digits.length >= 10 || q.includes('@'))) {
        const dup = await mobileApiClient.reception.checkDuplicate(
          digits.length >= 10 ? q : '',
          q.includes('@') ? q : undefined,
        );
        if (dup?.data?.isDuplicate && dup.data.existingPatient) {
          rows = [dup.data.existingPatient];
        }
      }
      setPatientResults(rows);
    } catch (err) {
      showNotice('Search failed', err instanceof Error ? err.message : 'Unable to search patients.');
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleInlineRegister = async () => {
    setRegError('');
    if (!regFirstName.trim() || !regLastName.trim()) {
      setRegError('First name and last name are required.');
      return;
    }
    if (regPhone.replace(/\D/g, '').length < 10) {
      setRegError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (regEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegError('Enter a valid email address or leave email blank.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(regDob.trim())) {
      setRegError('Date of birth must be YYYY-MM-DD.');
      return;
    }

    setRegisteringPatient(true);
    try {
      const dup = await mobileApiClient.reception.checkDuplicate(
        regPhone.trim(),
        regEmail.trim().toLowerCase() || undefined,
      );
      if (dup?.data?.isDuplicate && dup.data.existingPatient) {
        const existing = dup.data.existingPatient as SelectedPatient;
        setSelectedPatient(existing);
        setShowNewPatientForm(false);
        setWizardStep('DOCTOR');
        showNotice(
          'Existing Patient Retrieved',
          `Matched existing patient ${existing.firstName} ${existing.lastName} (${existing.uhid}). No duplicate record created.`,
        );
        return;
      }

      const res = await mobileApiClient.reception.registerPatient({
        hospitalId: user?.hospitalId || '',
        branchId: selectedBranchId || user?.branchId,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim().toLowerCase() || undefined,
        dateOfBirth: regDob.trim(),
        gender: regGender as any,
        bloodGroup: regBloodGroup as any,
        addressLine1: regAddress.trim() || 'Main Road, Front Desk Walk-in',
        city: regCity.trim() || 'Madurai',
        state: regState.trim() || 'Tamil Nadu',
        postalCode: regPostalCode.trim() || '625001',
        emergencyContactName: regEmergencyName.trim() || `${regFirstName.trim()} Family`,
        emergencyContactPhone: regEmergencyPhone.trim() || regPhone.trim(),
        emergencyContactRelation: regEmergencyRelation.trim() || 'Relative',
        allergies: [],
      });

      const created = res?.data as SelectedPatient;
      if (!created?.id) throw new Error('Registration did not return a patient profile.');

      setSelectedPatient(created);
      setCreatedPortalAccess(created.portalAccess);
      setShowNewPatientForm(false);
      setWizardStep('DOCTOR');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Patient registration failed.');
    } finally {
      setRegisteringPatient(false);
    }
  };

  const handleBookSubmit = async () => {
    setBookingError('');
    const doctor = bookingOptions?.doctors.find((item) => item.id === doctorId);
    if (!user || !selectedPatient) {
      setBookingError('Select or register a patient first.');
      return;
    }
    if (!doctor) {
      setBookingError('Select a department and available doctor.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(aptDate)) {
      setBookingError('Enter appointment date in YYYY-MM-DD format.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(aptTime)) {
      setBookingError('Select an available time slot (HH:mm).');
      return;
    }
    if (!reason.trim()) {
      setBookingError('Enter the reason for consultation.');
      return;
    }

    setIsBooking(true);
    try {
      const response = await mobileApiClient.reception.bookAppointment({
        requestId,
        patientId: selectedPatient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId || doctor.department.id,
        hospitalId: user.hospitalId || '',
        branchId: doctor.branchId || selectedBranchId || user.branchId,
        appointmentDate: aptDate,
        appointmentTime: aptTime,
        appointmentType: aptType as any,
        priority: priority as any,
        reasonForVisit: reason.trim(),
      });

      const booked = mapAppointment(response.data);
      setConfirmedApt(booked);
      setWizardStep('CONFIRMATION');

      await Promise.all([fetchAppointments(), fetchRequests()]);
      void queryClient.invalidateQueries({ queryKey: ['patient-portal-active-appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['reception-notifications'] });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Could not book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleDownloadConfirmationPdf = async (apt: AppointmentItem) => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      await downloadPatientReceiptPdf({
        filename: `Appointment_Confirmation_${apt.appointmentNumber}`,
        receiptId: apt.appointmentNumber,
        documentTitle: 'APPOINTMENT CONFIRMATION & TOKEN SLIP',
        hospitalName: apt.hospitalName,
        branchName: apt.branchName,
        branchLocation: apt.branchAddress,
        branchPhone: apt.branchPhone,
        date: apt.appointmentDate.slice(0, 10),
        status: `${apt.status} (Token #${apt.tokenNumber})`,
        patientName: apt.patientName,
        patientUhid: apt.uhid,
        patientPhone: apt.patientPhone,
        patientEmail: apt.patientEmail || undefined,
        department: apt.department,
        paymentMethod: apt.source === 'RECEPTION_WALK_IN' ? 'Walk-in Reception Desk' : 'Online Patient Portal',
        items: [
          {
            description: `OPD Consultation — ${apt.doctorName}`,
            detail: `${apt.department} · ${apt.appointmentDate.slice(0, 10)} at ${apt.appointmentTime} IST · Token #${apt.tokenNumber}`,
            amount: apt.consultationFee > 0 ? `INR ${apt.consultationFee.toFixed(2)}` : 'Pay at Desk',
          },
        ],
        summaryLines: [
          { label: 'Appointment ID', value: apt.appointmentNumber },
          { label: 'Queue Token', value: `T-${apt.tokenNumber}`, highlight: true },
          { label: 'Reason for Visit', value: apt.reasonForVisit },
        ],
        notes: 'Present this confirmation slip or UHID at the OPD counter on arrival.',
      });
    } catch (err) {
      showNotice('PDF Error', err instanceof Error ? err.message : 'Unable to generate PDF confirmation.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCheckIn = async (apt: AppointmentItem) => {
    if (checkingInId) return;
    setCheckingInId(apt.id);
    try {
      await mobileApiClient.reception.checkInAppointment(apt.id);
      await fetchAppointments();
      if (confirmedApt?.id === apt.id) {
        setConfirmedApt({ ...confirmedApt, status: 'CHECKED_IN' });
      }
      showNotice('Checked In', `${apt.patientName} (Token #${apt.tokenNumber}) checked in to OPD Live Queue.`);
    } catch (err) {
      showNotice('Check-in unavailable', err instanceof Error ? err.message : 'Could not check in appointment.');
    } finally {
      setCheckingInId(null);
    }
  };

  const openActions = (item: AppointmentItem) => {
    setNewDate(item.appointmentDate.slice(0, 10));
    setNewTime(item.appointmentTime);
    setConfirmCancel(false);
    setActionItem(item);
  };

  const changeAppointment = async (action: 'cancel' | 'reschedule') => {
    if (!actionItem || changing) return;
    setChanging(true);
    try {
      await mobileApiClient.reception.changeAppointment(actionItem.id, { action, date: newDate, time: newTime });
      await fetchAppointments();
      setActionItem(null);
    } catch (error) {
      showNotice('Update failed', error instanceof Error ? error.message : 'Refresh and try again.');
    } finally {
      setChanging(false);
    }
  };

  const branches = bookingOptions?.branches ?? [];
  const departmentsForBranch = useMemo(() => {
    if (!bookingOptions) return [];
    return bookingOptions.departments.filter(
      (d) => !selectedBranchId || d.branchId === selectedBranchId,
    );
  }, [bookingOptions, selectedBranchId]);

  const doctorsForSelection = useMemo(() => {
    if (!bookingOptions) return [];
    return bookingOptions.doctors.filter((d) => {
      if (selectedBranchId && d.branchId !== selectedBranchId) return false;
      if (selectedDepartmentId && d.departmentId !== selectedDepartmentId) return false;
      return true;
    });
  }, [bookingOptions, selectedBranchId, selectedDepartmentId]);

  const selectedDoctorObj = doctorsForSelection.find((d) => d.id === doctorId);

  const filteredAppointments = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return appointments.filter((a) => {
      const dateDay = a.appointmentDate.slice(0, 10);
      if (activeTab === 'TODAY') {
        if (dateDay !== todayStr || a.status === 'COMPLETED' || a.status === 'CANCELLED') return false;
      } else if (activeTab === 'UPCOMING') {
        if (dateDay <= todayStr || a.status === 'COMPLETED' || a.status === 'CANCELLED') return false;
      } else if (activeTab === 'COMPLETED') {
        if (a.status !== 'COMPLETED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (a.status !== 'CANCELLED') return false;
      }

      if (q) {
        return (
          a.patientName.toLowerCase().includes(q) ||
          a.uhid.toLowerCase().includes(q) ||
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.patientPhone.includes(q)
        );
      }
      return true;
    });
  }, [appointments, activeTab, listSearch, todayStr]);

  return (
    <View style={styles.container}>
      {/* Top Action Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSub}>Walk-in Booking & OPD Schedule</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={openBookingWizard}>
          <PlusCircle size={16} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Walk-in Book</Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter */}
      <View style={styles.searchBar}>
        <Search size={15} color={UyirinaiTheme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient, UHID, APT ID or doctor..."
          placeholderTextColor={UyirinaiTheme.colors.textMuted}
          value={listSearch}
          onChangeText={setListSearch}
        />
        {!!listSearch && (
          <Pressable onPress={() => setListSearch('')} hitSlop={8}>
            <X size={14} color={UyirinaiTheme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabBar}>
        {([
          ['TODAY', 'Today Active'],
          ['UPCOMING', 'Upcoming'],
          ['COMPLETED', 'Completed'],
          ['CANCELLED', 'Cancelled'],
          ['ALL', `All (${appointments.length})`],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Appointment Cards */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchAppointments();
            }}
            colors={[UyirinaiTheme.colors.primary]}
          />
        }
        ListEmptyComponent={
          loadingList ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color={UyirinaiTheme.colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Calendar size={34} color={UyirinaiTheme.colors.textMuted} />
              <Text style={styles.emptyTitle}>No appointments in this view</Text>
              <Text style={styles.emptySub}>Use Walk-in Book above to schedule an appointment.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isWalkIn = item.source === 'RECEPTION_WALK_IN';
          const isTodayScheduled = item.appointmentDate.slice(0, 10) === todayStr && item.status === 'SCHEDULED';

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.tokenPill}>
                  <Text style={styles.tokenPillText}>T-{item.tokenNumber}</Text>
                </View>
                <Text style={styles.aptNumText}>{item.appointmentNumber}</Text>
                <View style={[styles.sourcePill, isWalkIn ? styles.sourceWalkIn : styles.sourceOnline]}>
                  <Text style={[styles.sourcePillText, isWalkIn ? styles.sourceWalkInText : styles.sourceOnlineText]}>
                    {isWalkIn ? 'Walk-in' : 'Online'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'IN_PROGRESS' && styles.badgeProgress,
                    item.status === 'CHECKED_IN' && styles.badgeCheckedIn,
                    item.status === 'SCHEDULED' && styles.badgeScheduled,
                    item.status === 'COMPLETED' && styles.badgeCompleted,
                    item.status === 'CANCELLED' && styles.badgeCancelled,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.uhidLine}>
                UHID: {item.uhid} · {item.patientPhone}
              </Text>

              <View style={styles.docRow}>
                <Stethoscope size={13} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.docText}>
                  {item.doctorName} ({item.department})
                </Text>
              </View>

              <View style={styles.docRow}>
                <Clock size={13} color={UyirinaiTheme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {item.appointmentDate.slice(0, 10)} at {item.appointmentTime} IST · {item.branchName}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                {isTodayScheduled && (
                  <TouchableOpacity
                    style={styles.checkinMiniBtn}
                    disabled={checkingInId === item.id}
                    onPress={() => void handleCheckIn(item)}
                  >
                    <UserCheck size={13} color="#FFFFFF" />
                    <Text style={styles.checkinMiniText}>
                      {checkingInId === item.id ? 'Checking in...' : 'Check In'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.pdfMiniBtn}
                  onPress={() => void handleDownloadConfirmationPdf(item)}
                >
                  <Download size={13} color={UyirinaiTheme.colors.primaryDark} />
                  <Text style={styles.pdfMiniText}>Receipt PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manageMiniBtn} onPress={() => openActions(item)}>
                  <Text style={styles.actionPrompt}>Manage</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* WALK-IN BOOKING MODAL */}
      <Modal visible={bookModalVisible} animationType="slide" transparent={true} onRequestClose={() => setBookModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.mHeader}>
              <View>
                <Text style={styles.mTitle}>
                  {wizardStep === 'PATIENT'
                    ? 'Step 1: Patient Identification'
                    : wizardStep === 'DOCTOR'
                      ? 'Step 2: Doctor & Slot Selection'
                      : 'Step 3: Booking Confirmed'}
                </Text>
                <Text style={styles.mSub}>
                  {wizardStep === 'PATIENT'
                    ? 'Find existing patient or register new walk-in'
                    : wizardStep === 'DOCTOR'
                      ? `Patient: ${selectedPatient?.firstName} ${selectedPatient?.lastName} (${selectedPatient?.uhid})`
                      : 'Receipt & Queue Token Issued'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBookModalVisible(false)} hitSlop={10}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepRow}>
              {(['PATIENT', 'DOCTOR', 'CONFIRMATION'] as const).map((s, idx) => (
                <View key={s} style={[styles.stepPill, wizardStep === s && styles.stepPillActive]}>
                  <Text style={[styles.stepPillText, wizardStep === s && styles.stepPillTextActive]}>
                    {idx + 1}. {s === 'PATIENT' ? 'Patient' : s === 'DOCTOR' ? 'Doctor & Slot' : 'Confirmed'}
                  </Text>
                </View>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {wizardStep === 'PATIENT' && (
                <View>
                  {/* Pending Online Patient Requests */}
                  {requests.length > 0 && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.fLabel}>Pending Online Patient Requests</Text>
                      {requests.map((req) => (
                        <TouchableOpacity
                          key={req.id}
                          style={[styles.selectCard, requestId === req.id && styles.selectCardActive]}
                          onPress={() => {
                            setRequestId(req.id);
                            setSelectedPatient({
                              id: req.patient.id,
                              uhid: req.patient.uhid,
                              firstName: req.patient.firstName,
                              lastName: req.patient.lastName,
                              phone: '',
                            });
                            setAptDate(req.preferredDate.slice(0, 10));
                            setShowNewPatientForm(false);
                            setWizardStep('DOCTOR');
                          }}
                        >
                          <Text style={styles.selectCardTitle}>
                            {req.patient.firstName} {req.patient.lastName} ({req.patient.uhid})
                          </Text>
                          <Text style={styles.selectCardSub}>
                            Online Request · {req.specialty} · Preferred: {req.preferredDate.slice(0, 10)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Search Existing Walk-in Patient */}
                  <Text style={styles.fLabel}>Search Existing Patient (UHID, Name or Phone)</Text>
                  <View style={styles.inlineSearchRow}>
                    <TextInput
                      style={[styles.fInput, { flex: 1, marginBottom: 0 }]}
                      placeholder="e.g. KZN-2026-0001 or 98401..."
                      value={patientQuery}
                      onChangeText={setPatientQuery}
                      onSubmitEditing={() => void handlePatientSearch()}
                    />
                    <TouchableOpacity
                      style={styles.searchActionBtn}
                      onPress={() => void handlePatientSearch()}
                      disabled={searchingPatients}
                    >
                      {searchingPatients ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Search size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {patientResults.map((p) => {
                    const isPicked = selectedPatient?.id === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.selectCard, isPicked && styles.selectCardActive]}
                        onPress={() => {
                          setRequestId(undefined);
                          setSelectedPatient(p);
                          setShowNewPatientForm(false);
                          setWizardStep('DOCTOR');
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.selectCardTitle}>
                            {p.firstName} {p.lastName}
                          </Text>
                          <Text style={styles.uhidBadge}>{p.uhid}</Text>
                        </View>
                        <Text style={styles.selectCardSub}>
                          Phone: {p.phone} {p.email ? `· ${p.email}` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.newPatientToggle}
                    onPress={() => {
                      setRequestId(undefined);
                      setShowNewPatientForm((prev) => !prev);
                      setRegError('');
                    }}
                  >
                    <UserPlus size={16} color={UyirinaiTheme.colors.primaryDark} />
                    <Text style={styles.newPatientToggleText}>
                      {showNewPatientForm ? 'Hide New Patient Form' : '+ Register New Walk-in Patient'}
                    </Text>
                  </TouchableOpacity>

                  {showNewPatientForm && (
                    <View style={styles.regFormCard}>
                      {!!regError && <Text style={styles.inlineError}>{regError}</Text>}
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>First Name *</Text>
                          <TextInput style={styles.fInput} value={regFirstName} onChangeText={setRegFirstName} placeholder="First Name" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fLabel}>Last Name *</Text>
                          <TextInput style={styles.fInput} value={regLastName} onChangeText={setRegLastName} placeholder="Last Name" />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>Mobile Phone *</Text>
                          <TextInput style={styles.fInput} value={regPhone} onChangeText={setRegPhone} keyboardType="phone-pad" placeholder="9876543210" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fLabel}>Email (for Patient Login)</Text>
                          <TextInput style={styles.fInput} value={regEmail} onChangeText={setRegEmail} keyboardType="email-address" autoCapitalize="none" placeholder="patient@email.com" />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>Date of Birth *</Text>
                          <TextInput style={styles.fInput} value={regDob} onChangeText={setRegDob} placeholder="YYYY-MM-DD" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fLabel}>Gender</Text>
                          <View style={styles.chipRow}>
                            {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                              <TouchableOpacity
                                key={g}
                                style={[styles.miniChip, regGender === g && styles.miniChipActive]}
                                onPress={() => setRegGender(g)}
                              >
                                <Text style={[styles.miniChipText, regGender === g && styles.miniChipTextActive]}>
                                  {g === 'MALE' ? 'M' : g === 'FEMALE' ? 'F' : 'O'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.fLabel}>Blood Group</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['O_POSITIVE', 'A_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE', 'O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE'].map((bg) => (
                          <TouchableOpacity
                            key={bg}
                            style={[styles.miniChip, { marginRight: 6 }, regBloodGroup === bg && styles.miniChipActive]}
                            onPress={() => setRegBloodGroup(bg)}
                          >
                            <Text style={[styles.miniChipText, regBloodGroup === bg && styles.miniChipTextActive]}>
                              {bg.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.fLabel}>Address Line 1</Text>
                      <TextInput style={styles.fInput} value={regAddress} onChangeText={setRegAddress} placeholder="Street / Area" />
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>City</Text>
                          <TextInput style={styles.fInput} value={regCity} onChangeText={setRegCity} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fLabel}>Postal Code</Text>
                          <TextInput style={styles.fInput} value={regPostalCode} onChangeText={setRegPostalCode} keyboardType="numeric" />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>Emergency Contact</Text>
                          <TextInput style={styles.fInput} value={regEmergencyName} onChangeText={setRegEmergencyName} placeholder="Contact Name" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.fLabel}>Emergency Phone</Text>
                          <TextInput style={styles.fInput} value={regEmergencyPhone} onChangeText={setRegEmergencyPhone} keyboardType="phone-pad" placeholder="Phone" />
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        disabled={registeringPatient}
                        onPress={() => void handleInlineRegister()}
                      >
                        {registeringPatient ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.submitBtnText}>Create Patient Account & Continue</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {wizardStep === 'DOCTOR' && (
                <View>
                  {!!bookingError && <Text style={styles.inlineError}>{bookingError}</Text>}
                  {loadingOptions ? (
                    <ActivityIndicator style={{ marginVertical: 20 }} color={UyirinaiTheme.colors.primary} />
                  ) : (
                    <>
                      {/* Branch Selection */}
                      <Text style={styles.fLabel}>Hospital Branch</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {branches.map((branch) => (
                          <TouchableOpacity
                            key={branch.id}
                            style={[styles.filterChip, selectedBranchId === branch.id && styles.filterChipActive]}
                            onPress={() => {
                              setSelectedBranchId(branch.id);
                              const firstDept = bookingOptions?.departments.find((d) => d.branchId === branch.id);
                              setSelectedDepartmentId(firstDept?.id || '');
                              setDoctorId('');
                            }}
                          >
                            <Building2 size={12} color={selectedBranchId === branch.id ? '#FFFFFF' : UyirinaiTheme.colors.primaryDark} />
                            <Text style={[styles.filterChipText, selectedBranchId === branch.id && styles.filterChipTextActive]}>
                              {branch.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Department Selection */}
                      <Text style={styles.fLabel}>Department</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {departmentsForBranch.map((dept) => (
                          <TouchableOpacity
                            key={dept.id}
                            style={[styles.filterChip, selectedDepartmentId === dept.id && styles.filterChipActive]}
                            onPress={() => {
                              setSelectedDepartmentId(dept.id);
                              setDoctorId('');
                            }}
                          >
                            <Text style={[styles.filterChipText, selectedDepartmentId === dept.id && styles.filterChipTextActive]}>
                              {dept.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Doctor Selection */}
                      <Text style={styles.fLabel}>Select Doctor ({doctorsForSelection.length} available in clinic)</Text>
                      {doctorsForSelection.length === 0 ? (
                        <Text style={styles.emptyClinicText}>No active doctors found in this department/branch.</Text>
                      ) : (
                        doctorsForSelection.map((doc) => {
                          const isDocSelected = doctorId === doc.id;
                          return (
                            <TouchableOpacity
                              key={doc.id}
                              style={[styles.selectCard, isDocSelected && styles.selectCardActive]}
                              onPress={() => setDoctorId(doc.id)}
                            >
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.selectCardTitle}>
                                  Dr. {doc.employee.user.firstName} {doc.employee.user.lastName}
                                </Text>
                                <Text style={styles.feeTag}>INR {doc.consultationFee}</Text>
                              </View>
                              <Text style={styles.selectCardSub}>
                                {doc.specialization} · {doc.department.name} · {doc.consultationDurationMin}m slot
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}

                      {/* Date Selection */}
                      <Text style={styles.fLabel}>Appointment Date (YYYY-MM-DD)</Text>
                      <View style={styles.chipRow}>
                        {[
                          { label: 'Today', value: getIstDateOffset(0) },
                          { label: 'Tomorrow', value: getIstDateOffset(1) },
                          { label: '+2 Days', value: getIstDateOffset(2) },
                        ].map((d) => (
                          <TouchableOpacity
                            key={d.label}
                            style={[styles.miniChip, aptDate === d.value && styles.miniChipActive]}
                            onPress={() => setAptDate(d.value)}
                          >
                            <Text style={[styles.miniChipText, aptDate === d.value && styles.miniChipTextActive]}>
                              {d.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={styles.fInput}
                        value={aptDate}
                        onChangeText={setAptDate}
                        placeholder="YYYY-MM-DD"
                      />

                      {/* Available Time Slots */}
                      {!!doctorId && (
                        <View style={styles.sectionBlock}>
                          <Text style={styles.fLabel}>
                            Available Time Slots {slotInfo ? `(${slotInfo.dayOfWeek})` : ''}
                          </Text>
                          {loadingSlots ? (
                            <ActivityIndicator size="small" color={UyirinaiTheme.colors.primary} />
                          ) : slotError ? (
                            <Text style={styles.inlineError}>{slotError}</Text>
                          ) : slotInfo?.isOnLeave ? (
                            <Text style={styles.inlineError}>Doctor is on approved leave on {aptDate}. Choose another date or doctor.</Text>
                          ) : !slotInfo || slotInfo.slots.length === 0 ? (
                            <Text style={styles.emptyClinicText}>
                              No scheduled OPD clinic hours for Dr. {selectedDoctorObj?.employee.user.lastName} on {slotInfo?.dayOfWeek || 'this date'}.
                            </Text>
                          ) : (
                            <View style={styles.slotGrid}>
                              {slotInfo.slots.map((slot) => {
                                const isPicked = aptTime === slot.time;
                                return (
                                  <TouchableOpacity
                                    key={slot.time}
                                    disabled={!slot.available}
                                    style={[
                                      styles.slotBtn,
                                      !slot.available && styles.slotBtnDisabled,
                                      isPicked && styles.slotBtnActive,
                                    ]}
                                    onPress={() => setAptTime(slot.time)}
                                  >
                                    <Text
                                      style={[
                                        styles.slotBtnText,
                                        !slot.available && styles.slotBtnTextDisabled,
                                        isPicked && styles.slotBtnTextActive,
                                      ]}
                                    >
                                      {slot.time}
                                    </Text>
                                    {!slot.available && (
                                      <Text style={styles.slotReasonText}>
                                        {slot.reason === 'BOOKED' ? 'Booked' : slot.reason === 'PAST_TIME' ? 'Past' : 'Full'}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Type & Priority */}
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fLabel}>Visit Type</Text>
                          <View style={styles.chipRow}>
                            {(['OPD', 'FOLLOW_UP', 'EMERGENCY'] as const).map((t) => (
                              <TouchableOpacity
                                key={t}
                                style={[styles.miniChip, aptType === t && styles.miniChipActive]}
                                onPress={() => {
                                  setAptType(t);
                                  if (t === 'EMERGENCY') setPriority('STAT_EMERGENCY');
                                }}
                              >
                                <Text style={[styles.miniChipText, aptType === t && styles.miniChipTextActive]}>
                                  {t.replace('_', ' ')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      {aptType === 'EMERGENCY' && (
                        <>
                          <Text style={styles.fLabel}>Emergency Override Time (HH:mm)</Text>
                          <TextInput style={styles.fInput} value={aptTime} onChangeText={setAptTime} placeholder="HH:mm" />
                        </>
                      )}

                      <Text style={styles.fLabel}>Reason for Consultation *</Text>
                      <TextInput
                        style={[styles.fInput, { height: 64, textAlignVertical: 'top' }]}
                        multiline
                        placeholder="Describe symptoms or visit purpose..."
                        value={reason}
                        onChangeText={setReason}
                      />

                      <View style={styles.footerBtnsRow}>
                        <TouchableOpacity style={styles.backStepBtn} onPress={() => setWizardStep('PATIENT')}>
                          <Text style={styles.backStepText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.submitBtn, { flex: 1, marginTop: 0 }]}
                          onPress={() => void handleBookSubmit()}
                          disabled={isBooking}
                        >
                          {isBooking ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.submitBtnText}>Confirm Booking & Issue Token</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}

              {wizardStep === 'CONFIRMATION' && confirmedApt && (
                <View style={styles.confirmBox}>
                  <View style={styles.confirmIconCircle}>
                    <CheckCircle2 size={32} color={UyirinaiTheme.colors.primaryDark} />
                  </View>
                  <Text style={styles.confirmTitle}>Appointment Confirmed</Text>
                  <Text style={styles.confirmSub}>
                    Saved to Hospital Queue, Doctor Schedule & Patient Portal
                  </Text>

                  <View style={styles.tokenBanner}>
                    <View>
                      <Text style={styles.tokenBannerLabel}>APPOINTMENT ID</Text>
                      <Text style={styles.tokenBannerVal}>{confirmedApt.appointmentNumber}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.tokenBannerLabel}>QUEUE TOKEN</Text>
                      <Text style={styles.tokenBannerVal}>T-{confirmedApt.tokenNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Patient</Text>
                      <Text style={styles.summaryVal}>
                        {confirmedApt.patientName} ({confirmedApt.uhid})
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Doctor</Text>
                      <Text style={styles.summaryVal}>{confirmedApt.doctorName}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Department</Text>
                      <Text style={styles.summaryVal}>{confirmedApt.department}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Hospital & Branch</Text>
                      <Text style={styles.summaryVal}>
                        {confirmedApt.hospitalName} — {confirmedApt.branchName}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Date & Time</Text>
                      <Text style={styles.summaryVal}>
                        {confirmedApt.appointmentDate.slice(0, 10)} at {confirmedApt.appointmentTime} IST
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Source</Text>
                      <Text style={styles.summaryVal}>
                        {confirmedApt.source === 'RECEPTION_WALK_IN'
                          ? 'Receptionist / Walk-in Booking'
                          : 'Online Patient Booking'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryKey}>Status</Text>
                      <Text style={styles.summaryVal}>{confirmedApt.status}</Text>
                    </View>
                  </View>

                  {createdPortalAccess && (
                    <View style={styles.portalNote}>
                      <Text style={styles.portalNoteTitle}>Patient Portal Login Activated</Text>
                      <Text style={styles.portalNoteBody}>
                        Email: {createdPortalAccess.email}{'\n'}
                        One-time activation code: {createdPortalAccess.accessCode}
                      </Text>
                    </View>
                  )}

                  <View style={{ gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.submitBtn}
                      disabled={downloadingPdf}
                      onPress={() => void handleDownloadConfirmationPdf(confirmedApt)}
                    >
                      <Text style={styles.submitBtnText}>
                        {downloadingPdf ? 'Generating PDF...' : 'Download / Print Receipt PDF'}
                      </Text>
                    </TouchableOpacity>

                    {confirmedApt.appointmentDate.slice(0, 10) === todayStr && confirmedApt.status === 'SCHEDULED' && (
                      <TouchableOpacity
                        style={styles.reschedBtn}
                        disabled={checkingInId === confirmedApt.id}
                        onPress={() => void handleCheckIn(confirmedApt)}
                      >
                        <UserCheck size={16} color={UyirinaiTheme.colors.primaryDark} />
                        <Text style={styles.reschedBtnText}>Check In to Live Queue Now</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.backStepBtn}
                      onPress={() => {
                        setBookModalVisible(false);
                        router.push('/(reception)/queue' as any);
                      }}
                    >
                      <Text style={styles.backStepText}>Done · View Live Queue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MANAGE (RESCHEDULE / CANCEL) MODAL */}
      <Modal visible={!!actionItem} animationType="fade" transparent={true} onRequestClose={() => setActionItem(null)}>
        {actionItem && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.mHeader}>
                <Text style={styles.mTitle}>Manage Appointment</Text>
                <TouchableOpacity onPress={() => setActionItem(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.actionItemName}>
                {actionItem.patientName} ({actionItem.appointmentNumber} · T-{actionItem.tokenNumber})
              </Text>
              <Text style={styles.actionItemSub}>
                {actionItem.doctorName} · {actionItem.appointmentDate.slice(0, 10)} {actionItem.appointmentTime} IST
              </Text>
              <Text style={styles.fLabel}>New Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fInput}
                accessibilityLabel="New appointment date"
                placeholder="YYYY-MM-DD"
                value={newDate}
                onChangeText={setNewDate}
              />
              <Text style={styles.fLabel}>New Time (HH:mm IST)</Text>
              <TextInput
                style={styles.fInput}
                accessibilityLabel="New appointment time"
                placeholder="HH:mm (IST)"
                value={newTime}
                onChangeText={setNewTime}
              />

              <View style={{ gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={styles.reschedBtn}
                  disabled={changing}
                  onPress={() => void changeAppointment('reschedule')}
                >
                  <Clock size={16} color={UyirinaiTheme.colors.primaryDark} />
                  <Text style={styles.reschedBtnText}>Save New Date & Time</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  disabled={changing}
                  onPress={() => (confirmCancel ? void changeAppointment('cancel') : setConfirmCancel(true))}
                >
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.cancelBtnText}>
                    {confirmCancel ? 'Confirm Cancellation' : 'Cancel Appointment'}
                  </Text>
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
  container: { flex: 1, backgroundColor: UyirinaiTheme.colors.backgroundSecondary, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  headerSub: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary, marginTop: 1 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    gap: 6,
  },
  bookBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: UyirinaiTheme.colors.textPrimary },
  tabScroll: { maxHeight: 42, marginBottom: 10 },
  tabBar: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  tabActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  tabText: { fontSize: 11.5, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  emptyBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary, marginTop: 8 },
  emptySub: { fontSize: 12, color: UyirinaiTheme.colors.textSecondary, marginTop: 3, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  tokenPill: { backgroundColor: UyirinaiTheme.colors.softGreen, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tokenPillText: { fontSize: 11, fontWeight: '800', color: UyirinaiTheme.colors.primaryDark },
  aptNumText: { fontSize: 11, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary, flex: 1 },
  sourcePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  sourceWalkIn: { backgroundColor: '#FEF3C7' },
  sourceOnline: { backgroundColor: '#E8F1FC' },
  sourcePillText: { fontSize: 9.5, fontWeight: '800' },
  sourceWalkInText: { color: '#F59E0B' },
  sourceOnlineText: { color: '#1565C0' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F1F5F9' },
  badgeProgress: { backgroundColor: '#DCFCE7' },
  badgeCheckedIn: { backgroundColor: '#FEF3C7' },
  badgeScheduled: { backgroundColor: '#E8F1FC' },
  badgeCompleted: { backgroundColor: '#DCFCE7' },
  badgeCancelled: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  patientName: { fontSize: 15, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  uhidLine: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary, marginTop: 2 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  docText: { fontSize: 12, color: UyirinaiTheme.colors.textPrimary, fontWeight: '600' },
  metaText: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  checkinMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkinMiniText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  pdfMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfMiniText: { fontSize: 11, fontWeight: '700', color: UyirinaiTheme.colors.primaryDark },
  manageMiniBtn: { marginLeft: 'auto', paddingVertical: 5, paddingHorizontal: 6 },
  actionPrompt: { fontSize: 11.5, color: UyirinaiTheme.colors.primary, fontWeight: '700' },

  // Modal & Wizard
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
  },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mTitle: { fontSize: 16, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  mSub: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary, marginTop: 2 },
  stepRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stepPill: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    alignItems: 'center',
  },
  stepPillActive: { backgroundColor: UyirinaiTheme.colors.softLilac, borderWidth: 1, borderColor: UyirinaiTheme.colors.primary },
  stepPillText: { fontSize: 10.5, fontWeight: '700', color: UyirinaiTheme.colors.textMuted },
  stepPillTextActive: { color: UyirinaiTheme.colors.primaryDark },
  sectionBlock: { marginBottom: 8 },
  fLabel: { fontSize: 11.5, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary, marginTop: 10, marginBottom: 5 },
  fInput: {
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 4,
  },
  inlineSearchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  searchActionBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCard: {
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  selectCardActive: { borderColor: UyirinaiTheme.colors.primary, backgroundColor: UyirinaiTheme.colors.softLilac },
  selectCardTitle: { fontSize: 13, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  selectCardSub: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary, marginTop: 2 },
  uhidBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feeTag: { fontSize: 11, fontWeight: '800', color: '#00897B' },
  newPatientToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  newPatientToggleText: { fontSize: 12.5, fontWeight: '700', color: UyirinaiTheme.colors.primaryDark },
  regFormCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  inlineError: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  emptyClinicText: { fontSize: 12, color: UyirinaiTheme.colors.textMuted, paddingVertical: 6 },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
  },
  miniChipActive: { backgroundColor: UyirinaiTheme.colors.primary, borderColor: UyirinaiTheme.colors.primary },
  miniChipText: { fontSize: 11.5, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary },
  miniChipTextActive: { color: '#FFFFFF' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
  },
  filterChipActive: { backgroundColor: UyirinaiTheme.colors.primary, borderColor: UyirinaiTheme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary },
  filterChipTextActive: { color: '#FFFFFF' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  slotBtn: {
    minWidth: 68,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  slotBtnDisabled: { borderColor: '#E2E8F0', backgroundColor: '#F1F5F9', opacity: 0.7 },
  slotBtnActive: { backgroundColor: UyirinaiTheme.colors.primary },
  slotBtnText: { fontSize: 12, fontWeight: '800', color: UyirinaiTheme.colors.primaryDark },
  slotBtnTextDisabled: { color: '#94A3B8', textDecorationLine: 'line-through' },
  slotBtnTextActive: { color: '#FFFFFF' },
  slotReasonText: { fontSize: 9, color: '#94A3B8', marginTop: 1 },
  footerBtnsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  backStepBtn: {
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
  },
  backStepText: { fontSize: 12.5, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary },
  submitBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Confirmation Step
  confirmBox: { paddingBottom: 8 },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary, textAlign: 'center' },
  confirmSub: { fontSize: 11.5, color: UyirinaiTheme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  tokenBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tokenBannerLabel: { fontSize: 9.5, fontWeight: '700', color: UyirinaiTheme.colors.lavender },
  tokenBannerVal: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  summaryCard: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: 12,
    padding: 12,
    gap: 7,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  summaryKey: { fontSize: 11.5, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary },
  summaryVal: { fontSize: 12, fontWeight: '700', color: UyirinaiTheme.colors.textPrimary, flex: 1, textAlign: 'right' },
  portalNote: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  portalNoteTitle: { fontSize: 12, fontWeight: '800', color: '#183153' },
  portalNoteBody: { fontSize: 11, color: '#00897B', marginTop: 3, lineHeight: 16 },

  actionItemName: { fontSize: 15, fontWeight: '800', color: UyirinaiTheme.colors.textPrimary },
  actionItemSub: { fontSize: 12, color: UyirinaiTheme.colors.textSecondary, marginTop: 2, marginBottom: 6 },
  reschedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  reschedBtnText: { color: UyirinaiTheme.colors.primaryDark, fontSize: 12.5, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelBtnText: { color: '#DC2626', fontSize: 12.5, fontWeight: '700' },
});

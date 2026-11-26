import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Step 1: General vs Specialist
  const [designationType, setDesignationType] = useState<'ALL' | 'GENERAL' | 'SPECIALIST'>('ALL');

  // Step 2: Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');
  const [sortBy, setSortBy] = useState<'EXP_DESC' | 'FEE_ASC'>('EXP_DESC');

  // Step 3: Selection
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().slice(0, 10);
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30');
  const [reason, setReason] = useState<string>('');

  // Doctor Profile Modal State
  const [profileDoctor, setProfileDoctor] = useState<any>(null);

  // Success Confirmation State
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null);

  // Fetch doctors
  const { data: doctorsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['patient-doctors-directory', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.getDoctors('')).data ?? [],
  });

  const doctors = doctorsData ?? [];

  // Filtered Doctors List
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc: any) => {
      // 1. General vs Specialist
      if (designationType === 'GENERAL' && doc.designation !== 'GENERAL_PHYSICIAN') {
        return false;
      }
      if (designationType === 'SPECIALIST' && doc.designation === 'GENERAL_PHYSICIAN') {
        return false;
      }

      // 2. Gender filter
      if (selectedGender !== 'ALL') {
        const docGender = (doc.gender || 'MALE').toUpperCase();
        if (docGender !== selectedGender) return false;
      }

      // 3. Experience filter
      if (minExperience > 0 && (doc.experienceYears || 0) < minExperience) {
        return false;
      }

      // 4. Timing / Shift filter
      if (selectedTimeRange !== 'ALL') {
        const schedules = doc.schedules || [];
        const matchesShift = schedules.some((s: any) => {
          const startHour = parseInt(s.startTime?.split(':')[0] || '9', 10);
          if (selectedTimeRange === 'MORNING' && startHour < 12) return true;
          if (selectedTimeRange === 'AFTERNOON' && startHour >= 12 && startHour < 16) return true;
          if (selectedTimeRange === 'EVENING' && startHour >= 16) return true;
          return false;
        });
        if (!matchesShift && schedules.length > 0) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const docUser = doc.employee?.user;
        const name = `${docUser?.firstName || ''} ${docUser?.lastName || ''}`.toLowerCase();
        const spec = (doc.specialization || '').toLowerCase();
        const dept = (doc.department?.name || '').toLowerCase();
        if (!name.includes(q) && !spec.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => {
      if (sortBy === 'EXP_DESC') {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      return parseFloat(a.consultationFee || '500') - parseFloat(b.consultationFee || '500');
    });
  }, [doctors, designationType, selectedGender, minExperience, selectedTimeRange, searchQuery, sortBy]);

  // Booking Mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      return await mobileApiClient.patientPortal.requestAppointment({
        doctorId: selectedDoctorId,
        preferredDate: preferredDate.trim(),
        reason: reason.trim() || 'General Consultation',
      });
    },
    onSuccess: (res) => {
      setBookingSuccessData(res.data);
      queryClient.invalidateQueries({ queryKey: ['patient-portal-active-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-home'] });
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
    onError: (err) => {
      Alert.alert('Booking Error', err instanceof Error ? err.message : 'Could not submit appointment request.');
    },
  });

  const selectedDoctor = doctors.find((d: any) => d.id === selectedDoctorId);

  // Quick Date options
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const label =
        i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      list.push({ iso, label });
    }
    return list;
  }, []);

  if (isLoading) {
    return <LoadingIndicator message="Fetching doctors and clinic schedules..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load doctors"
        message={error instanceof Error ? error.message : 'Please check connection.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. GENERAL VS SPECIALIST TOGGLE */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>1. Select Consultation Type</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, designationType === 'ALL' && styles.toggleBtnActive]}
            onPress={() => setDesignationType('ALL')}
          >
            <Users size={16} color={designationType === 'ALL' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textPrimary} />
            <Text style={[styles.toggleBtnText, designationType === 'ALL' && styles.toggleBtnTextActive]}>
              All Doctors
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleBtn, designationType === 'GENERAL' && styles.toggleBtnActive]}
            onPress={() => setDesignationType('GENERAL')}
          >
            <Stethoscope size={16} color={designationType === 'GENERAL' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textPrimary} />
            <Text style={[styles.toggleBtnText, designationType === 'GENERAL' && styles.toggleBtnTextActive]}>
              General Physician
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleBtn, designationType === 'SPECIALIST' && styles.toggleBtnActive]}
            onPress={() => setDesignationType('SPECIALIST')}
          >
            <Award size={16} color={designationType === 'SPECIALIST' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textPrimary} />
            <Text style={[styles.toggleBtnText, designationType === 'SPECIALIST' && styles.toggleBtnTextActive]}>
              Specialist
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. SEARCH & ADVANCED FILTERS */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>2. Search & Filter Doctors</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={UyirinaiTheme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor name, specialty, or department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gender Filter Pills */}
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterRowLabel}>Gender:</Text>
          {(['ALL', 'MALE', 'FEMALE'] as const).map((g) => (
            <Pressable
              key={g}
              style={[styles.filterChip, selectedGender === g && styles.filterChipActive]}
              onPress={() => setSelectedGender(g)}
            >
              <Text style={[styles.filterChipText, selectedGender === g && styles.filterChipTextActive]}>
                {g === 'ALL' ? 'Any Gender' : g === 'MALE' ? 'Male' : 'Female'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Experience & Time Filter Pills */}
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterRowLabel}>Experience:</Text>
          {[0, 5, 10, 15].map((exp) => (
            <Pressable
              key={exp}
              style={[styles.filterChip, minExperience === exp && styles.filterChipActive]}
              onPress={() => setMinExperience(exp)}
            >
              <Text style={[styles.filterChipText, minExperience === exp && styles.filterChipTextActive]}>
                {exp === 0 ? 'All' : `${exp}+ Yrs`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timing Shift Range Filter */}
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterRowLabel}>Shift Time:</Text>
          {(['ALL', 'MORNING', 'AFTERNOON', 'EVENING'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.filterChip, selectedTimeRange === t && styles.filterChipActive]}
              onPress={() => setSelectedTimeRange(t)}
            >
              <Text style={[styles.filterChipText, selectedTimeRange === t && styles.filterChipTextActive]}>
                {t === 'ALL'
                  ? 'All Hours'
                  : t === 'MORNING'
                  ? 'Morning'
                  : t === 'AFTERNOON'
                  ? 'Afternoon'
                  : 'Evening'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sort Order Selector */}
        <View style={styles.sortRow}>
          <Text style={styles.filterRowLabel}>Sort by:</Text>
          <Pressable
            style={[styles.sortChip, sortBy === 'EXP_DESC' && styles.sortChipActive]}
            onPress={() => setSortBy('EXP_DESC')}
          >
            <Text style={[styles.sortChipText, sortBy === 'EXP_DESC' && styles.sortChipTextActive]}>
              Most Experienced
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortChip, sortBy === 'FEE_ASC' && styles.sortChipActive]}
            onPress={() => setSortBy('FEE_ASC')}
          >
            <Text style={[styles.sortChipText, sortBy === 'FEE_ASC' && styles.sortChipTextActive]}>
              Fee: Low to High
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. DOCTORS DIRECTORY LIST */}
      <View style={styles.sectionBlock}>
        <View style={styles.directoryHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            3. Choose Doctor ({filteredDoctors.length} available)
          </Text>
          {selectedDoctor && (
            <Text style={styles.selectedDocLabel}>
              Selected: Dr. {selectedDoctor.employee?.user?.firstName}
            </Text>
          )}
        </View>

        {filteredDoctors.length > 0 ? (
          <View style={styles.doctorCardsList}>
            {filteredDoctors.map((doc: any) => {
              const isSelected = selectedDoctorId === doc.id;
              const docUser = doc.employee?.user;
              const name = `Dr. ${docUser?.firstName || 'Doctor'} ${docUser?.lastName || ''}`;
              const deptName = doc.department?.name || 'General Medicine';
              const fee = doc.consultationFee || '500';
              const exp = doc.experienceYears || 0;
              const isSpecialist = doc.designation !== 'GENERAL_PHYSICIAN';
              const schedules = doc.schedules || [];

              return (
                <View
                  key={doc.id}
                  style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                >
                  <Pressable
                    style={styles.doctorCardBody}
                    onPress={() => setSelectedDoctorId(doc.id)}
                  >
                    <View style={styles.docAvatarCol}>
                      <View style={styles.docAvatarCirc}>
                        <Stethoscope size={22} color={UyirinaiTheme.colors.primary} />
                      </View>
                      <View style={styles.genderBadge}>
                        <Text style={styles.genderBadgeText}>{doc.gender || 'MALE'}</Text>
                      </View>
                    </View>

                    <View style={styles.docDetailsCol}>
                      <View style={styles.docNameHeaderRow}>
                        <Text style={styles.doctorItemName}>{name}</Text>
                        <View style={[styles.typePill, isSpecialist ? styles.specPill : styles.genPill]}>
                          <Text style={[styles.typePillText, isSpecialist ? styles.specPillText : styles.genPillText]}>
                            {isSpecialist ? 'Specialist' : 'General'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.doctorItemSpec}>{doc.specialization || deptName}</Text>
                      <Text style={styles.doctorItemDept}>
                        {deptName} · {doc.branch?.name || 'Main Branch'}
                      </Text>

                      <View style={styles.docMetaBadges}>
                        <Text style={styles.metaHighlight}>{exp} Years Experience</Text>
                        <Text style={styles.metaDivider}>·</Text>
                        <Text style={styles.metaFee}>₹{fee} Consultation Fee</Text>
                      </View>

                      {/* Timings preview */}
                      {schedules.length > 0 && (
                        <View style={styles.timingPillRow}>
                          <Clock size={12} color={UyirinaiTheme.colors.textMuted} />
                          <Text style={styles.timingPillText}>
                            {schedules[0].startTime} - {schedules[0].endTime} ({schedules.map((s: any) => s.dayOfWeek.slice(0, 3)).join(', ')})
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Doctor Card Footer: Select Button + View Profile Link */}
                  <View style={styles.doctorCardFooter}>
                    <Pressable
                      style={styles.viewProfileBtn}
                      onPress={() => setProfileDoctor(doc)}
                    >
                      <User size={13} color={UyirinaiTheme.colors.primary} />
                      <Text style={styles.viewProfileBtnText}>View Doctor Profile</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.selectDocBtn, isSelected && styles.selectDocBtnActive]}
                      onPress={() => setSelectedDoctorId(doc.id)}
                    >
                      <Text style={[styles.selectDocBtnText, isSelected && styles.selectDocBtnTextActive]}>
                        {isSelected ? '✓ Selected' : 'Select Doctor'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyDoctors}>
            <Stethoscope size={36} color={UyirinaiTheme.colors.textMuted} />
            <Text style={styles.emptyDocTitle}>No Doctors Found</Text>
            <Text style={styles.emptyDocSub}>
              Try adjusting your gender, experience, or timing filters above.
            </Text>
          </View>
        )}
      </View>

      {/* 4. DATE & TIME SELECTION */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>4. Choose Consultation Date & Time</Text>

        {/* Quick Date Pills */}
        <Text style={styles.inputSublabel}>Select Preferred Date:</Text>
        <View style={styles.quickDatesRow}>
          {quickDates.map((q) => (
            <Pressable
              key={q.iso}
              style={[styles.quickDateChip, preferredDate === q.iso && styles.quickDateChipActive]}
              onPress={() => setPreferredDate(q.iso)}
            >
              <Text style={[styles.quickDateText, preferredDate === q.iso && styles.quickDateTextActive]}>
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.customDateInput}
          value={preferredDate}
          onChangeText={setPreferredDate}
          placeholder="Or enter custom date: YYYY-MM-DD"
        />

        {/* Quick Time Slots */}
        <Text style={[styles.inputSublabel, { marginTop: 12 }]}>Preferred Time Slot:</Text>
        <View style={styles.timeSlotsRow}>
          {['09:30', '10:00', '10:30', '11:00', '11:30', '14:30', '15:30', '17:00'].map((slot) => (
            <Pressable
              key={slot}
              style={[styles.slotChip, selectedTimeSlot === slot && styles.slotChipActive]}
              onPress={() => setSelectedTimeSlot(slot)}
            >
              <Text style={[styles.slotChipText, selectedTimeSlot === slot && styles.slotChipTextActive]}>
                {slot} IST
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 5. REASON FOR APPOINTMENT */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionHeaderTitle}>5. Reason for Consultation</Text>
        <Text style={styles.inputSublabel}>
          Describe symptoms, reason for visit, or clinical concerns (optional):
        </Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Mild headache and throat irritation for 2 days, routine blood pressure checkup..."
          multiline={true}
          numberOfLines={3}
        />
      </View>

      {/* 6. BOOK APPOINTMENT SUBMIT BUTTON */}
      <View style={styles.submitSection}>
        <Pressable
          style={[
            styles.bookAppointmentFinalBtn,
            (!selectedDoctorId || !preferredDate || bookMutation.isPending) && styles.submitDisabled,
          ]}
          onPress={() => bookMutation.mutate()}
          disabled={!selectedDoctorId || !preferredDate || bookMutation.isPending}
        >
          <Text style={styles.bookAppointmentFinalText}>
            {bookMutation.isPending ? 'Sending to Department Admin...' : 'Book Appointment'}
          </Text>
        </Pressable>

        <Text style={styles.submitDisclaimer}>
          After booking, your request is forwarded to the Department Admin & Reception team for slot scheduling. Both doctor and patient will receive real-time notifications.
        </Text>
      </View>

      {/* DOCTOR PROFILE MODAL */}
      <Modal visible={!!profileDoctor} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Doctor Clinical Profile</Text>
              <Pressable onPress={() => setProfileDoctor(null)} style={styles.modalClose}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </Pressable>
            </View>

            {profileDoctor && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.docModalHero}>
                  <View style={styles.docModalAvatarCircle}>
                    <Stethoscope size={32} color={UyirinaiTheme.colors.primary} />
                  </View>
                  <Text style={styles.docModalName}>
                    Dr. {profileDoctor.employee?.user?.firstName} {profileDoctor.employee?.user?.lastName}
                  </Text>
                  <Text style={styles.docModalDesignation}>
                    {profileDoctor.designation?.replace('_', ' ')} · {profileDoctor.specialization}
                  </Text>
                  <Text style={styles.docModalDept}>
                    {profileDoctor.department?.name} · {profileDoctor.branch?.name}
                  </Text>
                </View>

                {/* Key Metrics */}
                <View style={styles.modalMetricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{profileDoctor.experienceYears || 10}+ Yrs</Text>
                    <Text style={styles.metricLbl}>Experience</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>₹{profileDoctor.consultationFee || 500}</Text>
                    <Text style={styles.metricLbl}>Consultation</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{profileDoctor.gender || 'MALE'}</Text>
                    <Text style={styles.metricLbl}>Gender</Text>
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>About Doctor</Text>
                  <Text style={styles.docModalBio}>
                    {profileDoctor.bio ||
                      'Senior clinician dedicated to holistic patient wellness, advanced diagnosis, and compassionate healthcare.'}
                  </Text>
                </View>

                {/* Qualifications */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Qualifications & Accreditations</Text>
                  {profileDoctor.qualifications?.length > 0 ? (
                    profileDoctor.qualifications.map((q: any, idx: number) => (
                      <View key={idx} style={styles.qualificationItem}>
                        <GraduationCap size={16} color={UyirinaiTheme.colors.primary} />
                        <Text style={styles.qualText}>
                          {q.degree} · <Text style={{ color: UyirinaiTheme.colors.textSecondary }}>{q.institution}</Text>
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.docModalBio}>MBBS, MD - Certified Practitioner</Text>
                  )}
                </View>

                {/* Available Hours */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Weekly Consultation Schedule</Text>
                  {profileDoctor.schedules?.length > 0 ? (
                    profileDoctor.schedules.map((s: any, idx: number) => (
                      <View key={idx} style={styles.scheduleItemRow}>
                        <Clock size={14} color={UyirinaiTheme.colors.primary} />
                        <Text style={styles.scheduleItemText}>
                          {s.dayOfWeek}: {s.startTime} - {s.endTime} IST
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.docModalBio}>Monday - Saturday: 09:00 - 13:00 IST</Text>
                  )}
                </View>

                <Pressable
                  style={styles.modalSelectDoctorBtn}
                  onPress={() => {
                    setSelectedDoctorId(profileDoctor.id);
                    setProfileDoctor(null);
                  }}
                >
                  <Text style={styles.modalSelectDoctorText}>Select This Doctor for Booking</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* BOOKING SUCCESS MODAL */}
      <Modal visible={!!bookingSuccessData} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={42} color={UyirinaiTheme.colors.success} />
            </View>

            <Text style={styles.successModalTitle}>Appointment Request Submitted!</Text>
            <Text style={styles.successModalText}>
              Your booking request with{' '}
              <Text style={{ fontWeight: '800' }}>
                Dr. {selectedDoctor?.employee?.user?.firstName || 'Doctor'}
              </Text>{' '}
              for <Text style={{ fontWeight: '800' }}>{preferredDate}</Text> has been forwarded to the
              Department Admin and Reception team for scheduling.
            </Text>

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Request Reference ID</Text>
              <Text style={styles.refVal}>{bookingSuccessData?.id || 'REQ-2026-0042'}</Text>
            </View>

            <Pressable
              style={styles.goToAptsBtn}
              onPress={() => {
                setBookingSuccessData(null);
                router.replace('/(patient)/appointments' as any);
              }}
            >
              <Text style={styles.goToAptsText}>View Active Appointments</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  sectionBlock: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 12,
  },

  /* Step 1 Toggle */
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  toggleBtnActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  toggleBtnTextActive: {
    color: UyirinaiTheme.colors.white,
  },

  /* Search & Filters */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  filterRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginRight: 4,
    minWidth: 74,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  filterChipActive: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderColor: UyirinaiTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: UyirinaiTheme.colors.primaryDark,
    fontWeight: '800',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  sortChipActive: {
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    borderColor: UyirinaiTheme.colors.primary,
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  sortChipTextActive: {
    color: UyirinaiTheme.colors.primary,
    fontWeight: '800',
  },

  /* Doctors List */
  directoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectedDocLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  doctorCardsList: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.borderLight,
    overflow: 'hidden',
  },
  doctorCardSelected: {
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: '#F7FCF8',
  },
  doctorCardBody: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  docAvatarCol: {
    alignItems: 'center',
  },
  docAvatarCirc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  genderBadge: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  genderBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textMuted,
  },
  docDetailsCol: {
    flex: 1,
  },
  docNameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  doctorItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  specPill: {
    backgroundColor: '#E8F4FD',
  },
  specPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D72B8',
  },
  genPill: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
  },
  genPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  doctorItemSpec: {
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.primary,
    marginBottom: 1,
  },
  doctorItemDept: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 6,
  },
  docMetaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  metaDivider: {
    color: UyirinaiTheme.colors.textMuted,
  },
  metaFee: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  timingPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timingPillText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
  },
  doctorCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  selectDocBtn: {
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  selectDocBtnActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  selectDocBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  selectDocBtnTextActive: {
    color: UyirinaiTheme.colors.white,
  },
  emptyDoctors: {
    alignItems: 'center',
    padding: 24,
  },
  emptyDocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 8,
  },
  emptyDocSub: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  /* Step 4 Date & Time */
  inputSublabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 6,
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickDateChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: UyirinaiTheme.borderRadius.md,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  quickDateChipActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  quickDateTextActive: {
    color: UyirinaiTheme.colors.white,
  },
  customDateInput: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: UyirinaiTheme.borderRadius.md,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  slotChipActive: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderColor: UyirinaiTheme.colors.primary,
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  slotChipTextActive: {
    color: UyirinaiTheme.colors.primaryDark,
  },

  /* Step 5 Reason */
  reasonInput: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  /* Step 6 Submit */
  submitSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bookAppointmentFinalBtn: {
    width: '100%',
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    alignItems: 'center',
    shadowColor: UyirinaiTheme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  bookAppointmentFinalText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  submitDisclaimer: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: 12,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  modalScroll: {
    paddingVertical: 12,
  },
  docModalHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  docModalAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  docModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  docModalDesignation: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
    marginTop: 2,
  },
  docModalDept: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
  },
  modalMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  modalSection: {
    marginBottom: 14,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 6,
  },
  docModalBio: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    lineHeight: 18,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  qualText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  scheduleItemText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
  },
  modalSelectDoctorBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalSelectDoctorText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  /* Success Modal */
  successModalCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DEF7EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalText: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  refBox: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  refVal: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 2,
  },
  goToAptsBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: UyirinaiTheme.borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  goToAptsText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

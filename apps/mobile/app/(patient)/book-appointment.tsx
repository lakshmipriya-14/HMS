import React, { useMemo, useState } from 'react';
import {
  Alert,
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
  Activity,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Eye,
  GraduationCap,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  User,
  Users,
  Volume2,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

// Department icons mapping for visual selection
const DEPARTMENTS = [
  { code: 'ALL', name: 'All Specialties', icon: Stethoscope },
  { code: 'CARD', name: 'Cardiology', icon: Heart, description: 'Heart & Vascular' },
  { code: 'NEURO', name: 'Neurology', icon: Activity, description: 'Brain & Nervous System' },
  { code: 'PED', name: 'Pediatrics', icon: HeartPulse, description: 'Child & Infant Care' },
  { code: 'ORTHO', name: 'Orthopedics', icon: Shield, description: 'Bones & Joint Care' },
  { code: 'GYN', name: 'Gynecology', icon: Sparkles, description: "Women's Health" },
  { code: 'SURG', name: 'Surgery', icon: Award, description: 'Laparoscopic & General' },
  { code: 'DERM', name: 'Dermatology', icon: Sparkles, description: 'Skin & Hair' },
  { code: 'ENT', name: 'ENT', icon: Volume2, description: 'Ear, Nose & Throat' },
  { code: 'OPHTH', name: 'Ophthalmology', icon: Eye, description: 'Eye & Vision Care' },
  { code: 'NEPH', name: 'Nephrology', icon: Droplets, description: 'Kidney Health' },
];

// Predefined visual slot boxes
const MORNING_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM'];
const EVENING_SLOTS = ['02:00 PM', '02:30 PM', '03:30 PM', '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM'];

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Step 1: General vs Specialist
  const [consultationType, setConsultationType] = useState<'ALL' | 'GENERAL' | 'SPECIALIST'>('ALL');

  // Step 1b: Specialist Department Filter
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>('ALL');

  // Step 2: Search & Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [selectedShift, setSelectedShift] = useState<'ALL' | 'MORNING' | 'EVENING'>('ALL');
  const [sortBy, setSortBy] = useState<'EXP_DESC' | 'FEE_ASC'>('EXP_DESC');

  // Step 3: Selected Doctor & Visual Slots
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().slice(0, 10);
  });
  const [selectedVisualSlot, setSelectedVisualSlot] = useState<string>('10:30 AM');
  const [reason, setReason] = useState<string>('');

  // Doctor Clinical Profile Modal
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
    return doctors
      .filter((doc: any) => {
        // 1. General vs Specialist
        if (consultationType === 'GENERAL' && doc.designation !== 'GENERAL_PHYSICIAN') {
          return false;
        }
        if (consultationType === 'SPECIALIST' && doc.designation === 'GENERAL_PHYSICIAN') {
          return false;
        }

        // 1b. Specialist Department filter
        if (selectedDeptCode !== 'ALL') {
          const docDeptCode = (doc.department?.code || '').toUpperCase();
          if (!docDeptCode.includes(selectedDeptCode)) return false;
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

        // 4. Shift filter
        if (selectedShift !== 'ALL') {
          const schedules = doc.schedules || [];
          const matches = schedules.some((s: any) => {
            const startH = parseInt(s.startTime?.split(':')[0] || '9', 10);
            if (selectedShift === 'MORNING' && startH < 13) return true;
            if (selectedShift === 'EVENING' && startH >= 13) return true;
            return false;
          });
          if (!matches && schedules.length > 0) return false;
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
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'EXP_DESC') {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        return parseFloat(a.consultationFee || '500') - parseFloat(b.consultationFee || '500');
      });
  }, [doctors, consultationType, selectedDeptCode, selectedGender, minExperience, selectedShift, searchQuery, sortBy]);

  // Booking Mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      return await mobileApiClient.patientPortal.requestAppointment({
        doctorId: selectedDoctorId,
        preferredDate: preferredDate.trim(),
        reason: `${reason.trim() || 'General Consultation'} (Slot: ${selectedVisualSlot})`,
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
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      list.push({ iso, dayName, dateNum });
    }
    return list;
  }, []);

  if (isLoading) {
    return <LoadingIndicator message="Loading clinical specialties and schedules..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load doctors"
        message={error instanceof Error ? error.message : 'Please check your connection and retry.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Phone Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconBadge}>
            <Stethoscope size={24} color={UyirinaiTheme.colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Book an Appointment</Text>
            <Text style={styles.heroSub}>Choose General or Specialist care, view slots & confirm.</Text>
          </View>
        </View>

        {/* 1. GENERAL VS SPECIALIST TOGGLE */}
        <View style={styles.cardSection}>
          <Text style={styles.stepTitle}>1. Select Consultation Type</Text>
          <View style={styles.typeSelectorRow}>
            <Pressable
              style={[styles.typeBtn, consultationType === 'ALL' && styles.typeBtnActive]}
              onPress={() => {
                setConsultationType('ALL');
                setSelectedDeptCode('ALL');
              }}
            >
              <Users
                size={16}
                color={consultationType === 'ALL' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.primaryDark}
              />
              <Text style={[styles.typeBtnText, consultationType === 'ALL' && styles.typeBtnTextActive]}>
                All Doctors
              </Text>
            </Pressable>

            <Pressable
              style={[styles.typeBtn, consultationType === 'GENERAL' && styles.typeBtnActive]}
              onPress={() => {
                setConsultationType('GENERAL');
                setSelectedDeptCode('ALL');
              }}
            >
              <Stethoscope
                size={16}
                color={consultationType === 'GENERAL' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.primaryDark}
              />
              <Text style={[styles.typeBtnText, consultationType === 'GENERAL' && styles.typeBtnTextActive]}>
                General Physician
              </Text>
            </Pressable>

            <Pressable
              style={[styles.typeBtn, consultationType === 'SPECIALIST' && styles.typeBtnActive]}
              onPress={() => setConsultationType('SPECIALIST')}
            >
              <Award
                size={16}
                color={consultationType === 'SPECIALIST' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.primaryDark}
              />
              <Text style={[styles.typeBtnText, consultationType === 'SPECIALIST' && styles.typeBtnTextActive]}>
                Specialist
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 2. SPECIALIST DEPARTMENT SELECTOR (Prominently shown when Specialist is chosen) */}
        {(consultationType === 'SPECIALIST' || consultationType === 'ALL') && (
          <View style={styles.cardSection}>
            <View style={styles.deptHeaderRow}>
              <Text style={styles.stepTitle}>
                {consultationType === 'SPECIALIST' ? '2. Choose Medical Specialty' : 'Specialty Filter (Optional)'}
              </Text>
              {selectedDeptCode !== 'ALL' && (
                <Pressable onPress={() => setSelectedDeptCode('ALL')}>
                  <Text style={styles.clearFilterText}>Show All</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptScrollContainer}
            >
              {DEPARTMENTS.map((dept) => {
                const IconComponent = dept.icon;
                const isSelected = selectedDeptCode === dept.code;
                return (
                  <Pressable
                    key={dept.code}
                    style={[styles.deptVisualCard, isSelected && styles.deptVisualCardActive]}
                    onPress={() => setSelectedDeptCode(dept.code)}
                  >
                    <View style={[styles.deptIconCircle, isSelected && styles.deptIconCircleActive]}>
                      <IconComponent
                        size={20}
                        color={isSelected ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.primaryDark}
                      />
                    </View>
                    <Text style={[styles.deptVisualName, isSelected && styles.deptVisualNameActive]}>
                      {dept.name}
                    </Text>
                    {dept.description && (
                      <Text style={[styles.deptVisualSub, isSelected && styles.deptVisualSubActive]}>
                        {dept.description}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 3. SEARCH & DOCTOR FILTERS */}
        <View style={styles.cardSection}>
          <Text style={styles.stepTitle}>
            {consultationType === 'SPECIALIST' ? '3. Search & Refine' : '2. Search Doctors'}
          </Text>

          <View style={styles.searchBox}>
            <Search size={18} color={UyirinaiTheme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by doctor name or specialty..."
              placeholderTextColor={UyirinaiTheme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Gender Filter Pills */}
          <View style={styles.pillsRow}>
            <Text style={styles.pillLabel}>Gender:</Text>
            {(['ALL', 'MALE', 'FEMALE'] as const).map((g) => (
              <Pressable
                key={g}
                style={[styles.pillBtn, selectedGender === g && styles.pillBtnActive]}
                onPress={() => setSelectedGender(g)}
              >
                <Text style={[styles.pillBtnText, selectedGender === g && styles.pillBtnTextActive]}>
                  {g === 'ALL' ? 'Any' : g === 'MALE' ? 'Male' : 'Female'}
                </Text>
              </Pressable>
            ))}

            <View style={{ width: 8 }} />
            <Text style={styles.pillLabel}>Timing:</Text>
            {(['ALL', 'MORNING', 'EVENING'] as const).map((s) => (
              <Pressable
                key={s}
                style={[styles.pillBtn, selectedShift === s && styles.pillBtnActive]}
                onPress={() => setSelectedShift(s)}
              >
                <Text style={[styles.pillBtnText, selectedShift === s && styles.pillBtnTextActive]}>
                  {s === 'ALL' ? 'All' : s === 'MORNING' ? 'Morning' : 'Evening'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 4. DOCTORS DIRECTORY WITH VISUAL SELECTION */}
        <View style={styles.cardSection}>
          <View style={styles.docSectionHeader}>
            <Text style={styles.stepTitle}>
              Choose Doctor ({filteredDoctors.length} Available)
            </Text>
            {selectedDoctor && (
              <View style={styles.selectedBadge}>
                <Check size={12} color={UyirinaiTheme.colors.primaryDark} strokeWidth={3} />
                <Text style={styles.selectedBadgeText}>
                  Dr. {selectedDoctor.employee?.user?.firstName}
                </Text>
              </View>
            )}
          </View>

          {filteredDoctors.length > 0 ? (
            <View style={styles.doctorsList}>
              {filteredDoctors.map((doc: any) => {
                const isSelected = selectedDoctorId === doc.id;
                const docUser = doc.employee?.user;
                const name = `Dr. ${docUser?.firstName || 'Doctor'} ${docUser?.lastName || ''}`;
                const deptName = doc.department?.name || 'General Medicine';
                const fee = doc.consultationFee || '500';
                const exp = doc.experienceYears || 10;
                const isSpecialist = doc.designation !== 'GENERAL_PHYSICIAN';
                const schedules = doc.schedules || [];

                return (
                  <View
                    key={doc.id}
                    style={[styles.doctorVisualCard, isSelected && styles.doctorVisualCardSelected]}
                  >
                    <Pressable
                      style={styles.doctorCardContent}
                      onPress={() => setSelectedDoctorId(doc.id)}
                    >
                      <View style={styles.docAvatarCol}>
                        <View style={styles.docAvatarBubble}>
                          <Stethoscope size={22} color={UyirinaiTheme.colors.primaryDark} />
                        </View>
                        <View style={styles.genderChip}>
                          <Text style={styles.genderChipText}>{doc.gender || 'MALE'}</Text>
                        </View>
                      </View>

                      <View style={styles.docDetailsCol}>
                        <View style={styles.nameHeaderRow}>
                          <Text style={styles.docTitleName} numberOfLines={1}>
                            {name}
                          </Text>
                          <View
                            style={[
                              styles.categoryTag,
                              isSpecialist ? styles.categoryTagSpecialist : styles.categoryTagGeneral,
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryTagText,
                                isSpecialist ? styles.categoryTagTextSpecialist : styles.categoryTagTextGeneral,
                              ]}
                            >
                              {isSpecialist ? 'Specialist' : 'General'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.docSpecialty}>{doc.specialization || deptName}</Text>
                        <Text style={styles.docHospital}>
                          {deptName} · {doc.branch?.hospital?.name ? `${doc.branch.hospital.name} - ` : ''}
                          {doc.branch?.name || 'Hospital Branch'}{doc.branch?.city ? `, ${doc.branch.city}` : ''}
                        </Text>

                        {/* Experience and Fee Pill Row */}
                        <View style={styles.metricsPillsRow}>
                          <View style={styles.metricPill}>
                            <Award size={12} color={UyirinaiTheme.colors.primaryDark} />
                            <Text style={styles.metricPillText}>{exp}+ Yrs Exp</Text>
                          </View>
                          <View style={styles.metricPill}>
                            <Text style={styles.metricPillFee}>₹{fee}</Text>
                            <Text style={styles.metricPillFeeLabel}>Fee</Text>
                          </View>
                        </View>

                        {/* Timing Chips */}
                        {schedules.length > 0 && (
                          <View style={styles.timingPillsWrap}>
                            <Clock size={12} color={UyirinaiTheme.colors.textMuted} />
                            <Text style={styles.timingPillsText}>
                              {schedules[0].startTime} - {schedules[0].endTime} IST
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>

                    {/* Bottom Action Bar of Doctor Card */}
                    <View style={styles.cardBottomBar}>
                      <Pressable
                        style={styles.viewProfileLink}
                        onPress={() => setProfileDoctor(doc)}
                      >
                        <Info size={14} color={UyirinaiTheme.colors.primaryDark} />
                        <Text style={styles.viewProfileLinkText}>View Doctor Profile & Bio</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.selectDoctorPill, isSelected && styles.selectDoctorPillActive]}
                        onPress={() => setSelectedDoctorId(doc.id)}
                      >
                        <Text
                          style={[
                            styles.selectDoctorPillText,
                            isSelected && styles.selectDoctorPillTextActive,
                          ]}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyDoctorState}>
              <Stethoscope size={40} color={UyirinaiTheme.colors.textMuted} />
              <Text style={styles.emptyDoctorTitle}>No Doctors Matching Filters</Text>
              <Text style={styles.emptyDoctorSub}>
                Try selecting "All Specialties" or relaxing your gender/shift filter above.
              </Text>
            </View>
          )}
        </View>

        {/* 5. VISUAL CONSULTATION DATE & TIME SLOTS */}
        <View style={styles.cardSection}>
          <Text style={styles.stepTitle}>5. Choose Date & Time Slot</Text>

          {/* Visual Date Selection Boxes */}
          <Text style={styles.subLabel}>1. Select Consultation Date:</Text>
          <View style={styles.dateBoxesGrid}>
            {quickDates.map((q) => {
              const isSelected = preferredDate === q.iso;
              return (
                <Pressable
                  key={q.iso}
                  style={[styles.dateBox, isSelected && styles.dateBoxActive]}
                  onPress={() => setPreferredDate(q.iso)}
                >
                  <Text style={[styles.dateBoxDay, isSelected && styles.dateBoxDayActive]}>
                    {q.dayName}
                  </Text>
                  <Text style={[styles.dateBoxNum, isSelected && styles.dateBoxNumActive]}>
                    {q.dateNum}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Morning Visual Slot Boxes */}
          <Text style={[styles.subLabel, { marginTop: 14 }]}>
            2. Morning Available Slots (09:00 AM - 12:30 PM):
          </Text>
          <View style={styles.slotsGrid}>
            {MORNING_SLOTS.map((slot) => {
              const isSelected = selectedVisualSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotVisualBox, isSelected && styles.slotVisualBoxActive]}
                  onPress={() => setSelectedVisualSlot(slot)}
                >
                  <Text style={[styles.slotVisualText, isSelected && styles.slotVisualTextActive]}>
                    {slot}
                  </Text>
                  {isSelected && <Check size={12} color={UyirinaiTheme.colors.white} strokeWidth={3} />}
                </Pressable>
              );
            })}
          </View>

          {/* Afternoon / Evening Visual Slot Boxes */}
          <Text style={[styles.subLabel, { marginTop: 14 }]}>
            3. Afternoon & Evening Slots (02:00 PM - 08:00 PM):
          </Text>
          <View style={styles.slotsGrid}>
            {EVENING_SLOTS.map((slot) => {
              const isSelected = selectedVisualSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotVisualBox, isSelected && styles.slotVisualBoxActive]}
                  onPress={() => setSelectedVisualSlot(slot)}
                >
                  <Text style={[styles.slotVisualText, isSelected && styles.slotVisualTextActive]}>
                    {slot}
                  </Text>
                  {isSelected && <Check size={12} color={UyirinaiTheme.colors.white} strokeWidth={3} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 6. REASON FOR CONSULTATION */}
        <View style={styles.cardSection}>
          <Text style={styles.stepTitle}>6. Reason for Appointment (Optional)</Text>
          <Text style={styles.subLabel}>
            Briefly share your chief complaint, symptoms, or follow-up note:
          </Text>
          <TextInput
            style={styles.reasonInputField}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Routine hypertension checkup, seasonal cough, chest discomfort..."
            placeholderTextColor={UyirinaiTheme.colors.textMuted}
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* 7. SUBMIT BUTTON */}
        <View style={styles.submitContainer}>
          <Pressable
            style={[
              styles.primaryBookingBtn,
              (!selectedDoctorId || !preferredDate || bookMutation.isPending) && styles.primaryBookingBtnDisabled,
            ]}
            onPress={() => bookMutation.mutate()}
            disabled={!selectedDoctorId || !preferredDate || bookMutation.isPending}
          >
            <Text style={styles.primaryBookingBtnText}>
              {bookMutation.isPending
                ? 'Routing to Department Admin...'
                : `Confirm Booking with Dr. ${
                    selectedDoctor?.employee?.user?.firstName || 'Selected Doctor'
                  }`}
            </Text>
          </Pressable>

          <Text style={styles.submissionNotice}>
            Your request will be scheduled by the Department Admin & Reception. Both doctor and patient receive instant in-app alerts.
          </Text>
        </View>
      </ScrollView>

      {/* ======================================================== */}
      {/* PHONE-CONSTRAINED ENHANCED DOCTOR PROFILE MODAL          */}
      {/* ======================================================== */}
      <Modal visible={!!profileDoctor} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.phoneModalSheet}>
            {/* Modal Top Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Doctor Clinical Profile</Text>
                <Pressable onPress={() => setProfileDoctor(null)} style={styles.sheetCloseBtn}>
                  <X size={20} color={UyirinaiTheme.colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {profileDoctor && (
              <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
                {/* Doctor Hero Card */}
                <View style={styles.doctorSheetHero}>
                  <View style={styles.heroAvatarBig}>
                    <Stethoscope size={36} color={UyirinaiTheme.colors.primaryDark} />
                  </View>
                  <Text style={styles.heroDoctorName}>
                    Dr. {profileDoctor.employee?.user?.firstName}{' '}
                    {profileDoctor.employee?.user?.lastName}
                  </Text>
                  <Text style={styles.heroDoctorSpecialty}>
                    {profileDoctor.designation?.replace('_', ' ')} · {profileDoctor.specialization}
                  </Text>
                  <Text style={styles.heroDoctorDept}>
                    {profileDoctor.department?.name} · {profileDoctor.branch?.hospital?.name ? `${profileDoctor.branch.hospital.name} - ` : ''}
                    {profileDoctor.branch?.name || 'Hospital Branch'}{profileDoctor.branch?.city ? `, ${profileDoctor.branch.city}` : ''}
                  </Text>
                </View>

                {/* Key Metrics Row */}
                <View style={styles.sheetStatsRow}>
                  <View style={styles.sheetStatItem}>
                    <Text style={styles.sheetStatVal}>
                      {profileDoctor.experienceYears || 10}+ Yrs
                    </Text>
                    <Text style={styles.sheetStatLbl}>Experience</Text>
                  </View>
                  <View style={styles.sheetStatDivider} />
                  <View style={styles.sheetStatItem}>
                    <Text style={styles.sheetStatVal}>₹{profileDoctor.consultationFee || 500}</Text>
                    <Text style={styles.sheetStatLbl}>Fee</Text>
                  </View>
                  <View style={styles.sheetStatDivider} />
                  <View style={styles.sheetStatItem}>
                    <Text style={styles.sheetStatVal}>{profileDoctor.gender || 'MALE'}</Text>
                    <Text style={styles.sheetStatLbl}>Gender</Text>
                  </View>
                </View>

                {/* Clinical Bio */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionHeading}>About Doctor</Text>
                  <Text style={styles.sheetBioText}>
                    {profileDoctor.bio ||
                      'Experienced clinical consultant providing compassionate, comprehensive medical care and patient wellness management.'}
                  </Text>
                </View>

                {/* Qualifications */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionHeading}>Qualifications & Degrees</Text>
                  {profileDoctor.qualifications?.length > 0 ? (
                    profileDoctor.qualifications.map((q: any, idx: number) => (
                      <View key={idx} style={styles.qualRow}>
                        <GraduationCap size={16} color={UyirinaiTheme.colors.primaryDark} />
                        <Text style={styles.qualDegree}>
                          {q.degree} · <Text style={styles.qualInst}>{q.institution}</Text>
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sheetBioText}>MBBS, MD - Certified Medical Specialist</Text>
                  )}
                </View>

                {/* Visual Weekly Consultation Schedule */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionHeading}>Consultation Schedule & Days</Text>
                  {profileDoctor.schedules?.length > 0 ? (
                    <View style={styles.scheduleDaysGrid}>
                      {profileDoctor.schedules.map((s: any, idx: number) => (
                        <View key={idx} style={styles.scheduleDayCard}>
                          <Clock size={14} color={UyirinaiTheme.colors.primaryDark} />
                          <View>
                            <Text style={styles.scheduleDayTitle}>{s.dayOfWeek}</Text>
                            <Text style={styles.scheduleDayTiming}>
                              {s.startTime} - {s.endTime} IST
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.sheetBioText}>Monday to Saturday: 09:00 AM - 01:00 PM IST</Text>
                  )}
                </View>

                {/* Visual Slots Picker Inside Modal */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionHeading}>Select Your Time Slot:</Text>
                  <View style={styles.slotsGrid}>
                    {MORNING_SLOTS.slice(0, 4).concat(EVENING_SLOTS.slice(0, 4)).map((slot) => {
                      const isSel = selectedVisualSlot === slot;
                      return (
                        <Pressable
                          key={slot}
                          style={[styles.slotVisualBox, isSel && styles.slotVisualBoxActive]}
                          onPress={() => setSelectedVisualSlot(slot)}
                        >
                          <Text style={[styles.slotVisualText, isSel && styles.slotVisualTextActive]}>
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Modal Select Doctor CTA */}
                <Pressable
                  style={styles.sheetCtaBtn}
                  onPress={() => {
                    setSelectedDoctorId(profileDoctor.id);
                    setProfileDoctor(null);
                  }}
                >
                  <Text style={styles.sheetCtaBtnText}>
                    Select Dr. {profileDoctor.employee?.user?.firstName} for Booking
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* PHONE-CONSTRAINED BOOKING SUCCESS MODAL                  */}
      {/* ======================================================== */}
      <Modal visible={!!bookingSuccessData} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successSheetCard}>
            <View style={styles.successCircle}>
              <CheckCircle2 size={46} color={UyirinaiTheme.colors.white} />
            </View>

            <Text style={styles.successHeading}>Appointment Booked!</Text>
            <Text style={styles.successBody}>
              Your consultation request with{' '}
              <Text style={{ fontWeight: '800', color: UyirinaiTheme.colors.primaryDark }}>
                Dr. {selectedDoctor?.employee?.user?.firstName || 'Doctor'}
              </Text>{' '}
              on <Text style={{ fontWeight: '800' }}>{preferredDate}</Text> at{' '}
              <Text style={{ fontWeight: '800' }}>{selectedVisualSlot}</Text> has been forwarded to
              the Department Admin for scheduling.
            </Text>

            <View style={styles.bookingRefCard}>
              <Text style={styles.bookingRefTitle}>Request Reference Number</Text>
              <Text style={styles.bookingRefCode}>{bookingSuccessData?.id || 'KZN-REQ-0042'}</Text>
            </View>

            <Pressable
              style={styles.successActionBtn}
              onPress={() => {
                setBookingSuccessData(null);
                router.replace('/(patient)/appointments' as any);
              }}
            >
              <Text style={styles.successActionBtnText}>View My Active Appointments</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 60,
  },

  /* Hero Banner */
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  /* Card Section */
  cardSection: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 12,
  },

  /* Step 1 Type Selector */
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  typeBtnActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  typeBtnTextActive: {
    color: UyirinaiTheme.colors.white,
  },

  /* Specialist Department Visual Selector */
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  deptScrollContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  deptVisualCard: {
    width: 105,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.border,
  },
  deptVisualCardActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  deptIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UyirinaiTheme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  deptIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  deptVisualName: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  deptVisualNameActive: {
    color: UyirinaiTheme.colors.white,
  },
  deptVisualSub: {
    fontSize: 9,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
  },
  deptVisualSubActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  /* Search & Filters */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  pillBtnActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  pillBtnTextActive: {
    color: UyirinaiTheme.colors.white,
  },

  /* Doctors Directory List */
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.full,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  doctorsList: {
    gap: 12,
  },
  doctorVisualCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.border,
    overflow: 'hidden',
  },
  doctorVisualCardSelected: {
    borderColor: UyirinaiTheme.colors.primaryDark,
    backgroundColor: '#FAF5FB',
  },
  doctorCardContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  docAvatarCol: {
    alignItems: 'center',
  },
  docAvatarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  genderChip: {
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  genderChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textMuted,
  },
  docDetailsCol: {
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  docTitleName: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  categoryTagSpecialist: {
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
  },
  categoryTagGeneral: {
    backgroundColor: '#F0EAF5',
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryTagTextSpecialist: {
    color: UyirinaiTheme.colors.primaryDark,
  },
  categoryTagTextGeneral: {
    color: UyirinaiTheme.colors.textSecondary,
  },
  docSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
    marginBottom: 1,
  },
  docHospital: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 6,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  metricPillFee: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  metricPillFeeLabel: {
    fontSize: 10,
    color: UyirinaiTheme.colors.textMuted,
  },
  timingPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingPillsText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
  },
  cardBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  viewProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewProfileLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  selectDoctorPill: {
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  selectDoctorPillActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  selectDoctorPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  selectDoctorPillTextActive: {
    color: UyirinaiTheme.colors.white,
  },
  emptyDoctorState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyDoctorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 8,
  },
  emptyDoctorSub: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  /* Step 5 Visual Dates & Slots */
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 6,
  },
  dateBoxesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.border,
  },
  dateBoxActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  dateBoxDay: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 2,
  },
  dateBoxDayActive: {
    color: UyirinaiTheme.colors.white,
  },
  dateBoxNum: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  dateBoxNumActive: {
    color: UyirinaiTheme.colors.white,
  },

  /* Visual Slots Grid */
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotVisualBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.border,
    minWidth: 92,
  },
  slotVisualBoxActive: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderColor: UyirinaiTheme.colors.primaryDark,
  },
  slotVisualText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  slotVisualTextActive: {
    color: UyirinaiTheme.colors.white,
    fontWeight: '800',
  },

  /* Step 6 Reason */
  reasonInputField: {
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  /* Step 7 Submit */
  submitContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBookingBtn: {
    width: '100%',
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    paddingVertical: 15,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    alignItems: 'center',
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  primaryBookingBtnDisabled: {
    opacity: 0.5,
  },
  primaryBookingBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  submissionNotice: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: 12,
  },

  /* ======================================================== */
  /* PHONE CONSTRAINED MODAL STYLES                           */
  /* ======================================================== */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 24, 56, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  phoneModalSheet: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: UyirinaiTheme.colors.border,
    marginBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetBody: {
    padding: 18,
  },
  doctorSheetHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroAvatarBig: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: UyirinaiTheme.colors.border,
  },
  heroDoctorName: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  heroDoctorSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
    marginTop: 2,
  },
  heroDoctorDept: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
  },
  sheetStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  sheetStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  sheetStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: UyirinaiTheme.colors.border,
  },
  sheetStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  sheetStatLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sheetSection: {
    marginBottom: 16,
  },
  sheetSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 8,
  },
  sheetBioText: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    lineHeight: 19,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  qualDegree: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  qualInst: {
    fontWeight: '400',
    color: UyirinaiTheme.colors.textSecondary,
  },
  scheduleDaysGrid: {
    gap: 6,
  },
  scheduleDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  scheduleDayTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  scheduleDayTiming: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
  },
  sheetCtaBtn: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  sheetCtaBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  /* Success Modal */
  successSheetCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successBody: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  bookingRefCard: {
    backgroundColor: UyirinaiTheme.colors.cardBackgroundSoft,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
  },
  bookingRefTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  bookingRefCode: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
    marginTop: 2,
  },
  successActionBtn: {
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    paddingVertical: 14,
    borderRadius: UyirinaiTheme.borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  successActionBtnText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

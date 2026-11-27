import React from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HeartPulse,
  Phone,
  ShieldAlert,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

function getAge(dobString?: string): string {
  if (!dobString) return '34 yrs';
  const birth = new Date(dobString);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${years} yrs`;
}

function formatGender(gender?: string): string {
  if (!gender) return 'Female';
  if (gender.toUpperCase() === 'FEMALE') return 'Female';
  if (gender.toUpperCase() === 'MALE') return 'Male';
  return gender;
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-home', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  if (isLoading) {
    return <LoadingIndicator message="Loading your health portal..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Portal"
        message={error instanceof Error ? error.message : 'Please check your connection and retry.'}
        onRetry={() => refetch()}
      />
    );
  }

  const patient = data?.patient;
  const fallbackName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient';
  const fullName = patient ? `${patient.firstName} ${patient.lastName}` : fallbackName;
  const avatarUrl = patient?.user?.avatarUrl;
  const age = getAge(patient?.dateOfBirth);
  const gender = formatGender(patient?.gender);
  const phone = patient?.phone || '+91 98765 43210';
  const bloodGroup = patient?.bloodGroup?.replace('_', ' ') || 'O+';
  const uhid = patient?.uhid || 'DEMO-UHID-001';

  // Active (unmet) appointments
  const allAppointments = data?.appointments || [];
  const unmetAppointments = allAppointments.filter(
    (apt: { status: string }) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
  );
  const nextAppointment = unmetAppointments[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[UyirinaiTheme.colors.primary]}
          tintColor={UyirinaiTheme.colors.primary}
        />
      }
    >
      {/* 1. Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          {/* Circular Frame Photo */}
          <View style={styles.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {patient?.firstName?.[0] || 'L'}
                  {patient?.lastName?.[0] || 'S'}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          {/* Name & UHID */}
          <View style={styles.nameSection}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.patientNameText} numberOfLines={1}>
              {fullName}
            </Text>
            <View style={styles.uhidBadge}>
              <Text style={styles.uhidText}>UHID: {uhid}</Text>
            </View>
          </View>
        </View>

        {/* Basic Details: Age, Gender, Phone, Blood Group */}
        <View style={styles.basicDetailsRow}>
          <View style={styles.detailPill}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{age}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailPill}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{gender}</Text>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailPill}>
            <Text style={styles.detailLabel}>Blood Group</Text>
            <Text style={styles.detailValue}>{bloodGroup}</Text>
          </View>
        </View>

        <View style={styles.phoneRow}>
          <Phone size={14} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.phoneText}>{phone}</Text>
        </View>
      </View>

      {/* 2. Two Prominent Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {/* Button 1: View Full Profile */}
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => router.push('/(patient)/profile' as any)}
          accessibilityRole="button"
          accessibilityLabel="View Full Profile"
        >
          <View style={styles.actionIconContainerPrimary}>
            <User size={22} color={UyirinaiTheme.colors.white} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitlePrimary}>View Full Profile</Text>
            <Text style={styles.actionSubtitlePrimary}>Personal, contact & emergency details</Text>
          </View>
          <ChevronRight size={20} color={UyirinaiTheme.colors.white} />
        </Pressable>

        {/* Button 2: View Medical History */}
        <Pressable
          style={styles.secondaryActionButton}
          onPress={() => router.push('/(patient)/records' as any)}
          accessibilityRole="button"
          accessibilityLabel="View Medical History"
        >
          <View style={styles.actionIconContainerSecondary}>
            <FileText size={22} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitleSecondary}>View Medical History</Text>
            <Text style={styles.actionSubtitleSecondary}>
              Past appointments, diagnostic reports & bills
            </Text>
          </View>
          <ChevronRight size={20} color={UyirinaiTheme.colors.primary} />
        </Pressable>
      </View>

      {/* 3. Upcoming Unmet Appointment Card */}
      {nextAppointment ? (
        <View style={styles.appointmentBanner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleRow}>
              <Calendar size={18} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.bannerTitle}>Next Scheduled Appointment</Text>
            </View>
            <StatusBadge status={nextAppointment.status} />
          </View>

          <View style={styles.bannerBody}>
            <Text style={styles.doctorName}>
              Dr. {nextAppointment.doctor?.employee?.user?.firstName || 'Doctor'}{' '}
              {nextAppointment.doctor?.employee?.user?.lastName || ''}
            </Text>
            <Text style={styles.departmentName}>
              {nextAppointment.department?.name || 'General Medicine'} ·{' '}
              {nextAppointment.branch?.hospital?.name ? `${nextAppointment.branch.hospital.name} - ` : ''}
              {nextAppointment.branch?.name || patient?.registrationBranch?.name || 'Hospital Branch'}
            </Text>

            <View style={styles.appointmentTimingRow}>
              <View style={styles.timingItem}>
                <Clock size={14} color={UyirinaiTheme.colors.textSecondary} />
                <Text style={styles.timingText}>
                  {nextAppointment.appointmentDate?.slice(0, 10)} at {nextAppointment.appointmentTime || '10:30'} IST
                </Text>
              </View>
              {nextAppointment.tokenNumber ? (
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenText}>Token #{nextAppointment.tokenNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            style={styles.bannerFooter}
            onPress={() => router.push('/(patient)/appointments' as any)}
          >
            <Text style={styles.bannerFooterText}>Manage Active Appointments</Text>
            <ChevronRight size={16} color={UyirinaiTheme.colors.primary} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyAptCard}>
          <View style={styles.emptyAptIconWrap}>
            <Stethoscope size={28} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={styles.emptyAptTextWrap}>
            <Text style={styles.emptyAptTitle}>No Active Appointments</Text>
            <Text style={styles.emptyAptSubtitle}>
              Need to consult a doctor? Book a new appointment anytime.
            </Text>
          </View>
          <Pressable
            style={styles.bookShortcutBtn}
            onPress={() => router.push('/(patient)/book-appointment' as any)}
          >
            <Text style={styles.bookShortcutText}>Book Now</Text>
          </Pressable>
        </View>
      )}

      {/* 4. Quick Health Overview Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Health Overview</Text>

        <View style={styles.summaryGrid}>
          {/* Allergies Notice */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconHeader}>
              <ShieldAlert size={18} color={UyirinaiTheme.colors.warning} />
              <Text style={styles.summaryCardTitle}>Known Allergies</Text>
            </View>
            <Text style={styles.summaryCardValue}>
              {patient?.allergies?.length ? patient.allergies.join(', ') : 'No known drug allergies'}
            </Text>
          </View>

          {/* Diagnostic Reports Summary */}
          <Pressable
            style={styles.summaryCard}
            onPress={() => router.push('/(patient)/records' as any)}
          >
            <View style={styles.summaryIconHeader}>
              <HeartPulse size={18} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.summaryCardTitle}>Lab Reports</Text>
            </View>
            <Text style={styles.summaryCardValue}>
              {data?.labOrders?.length || 0} Released Reports
            </Text>
            <Text style={styles.summaryCardSubtext}>Tap to download PDF</Text>
          </Pressable>

          {/* Billing Summary */}
          <Pressable
            style={styles.summaryCard}
            onPress={() => router.push('/(patient)/billing' as any)}
          >
            <View style={styles.summaryIconHeader}>
              <CreditCard size={18} color={UyirinaiTheme.colors.info} />
              <Text style={styles.summaryCardTitle}>Billing History</Text>
            </View>
            <Text style={styles.summaryCardValue}>
              {data?.invoices?.length || 0} Invoices Cleared
            </Text>
            <Text style={styles.summaryCardSubtext}>View receipts</Text>
          </Pressable>
        </View>
      </View>
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
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: UyirinaiTheme.colors.primary,
    overflow: 'hidden',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: UyirinaiTheme.colors.success,
    borderWidth: 2,
    borderColor: UyirinaiTheme.colors.white,
  },
  nameSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 2,
    marginBottom: 6,
  },
  uhidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
  },
  uhidText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },

  /* Basic Details */
  basicDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  detailPill: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: UyirinaiTheme.colors.borderDefault,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },

  /* Action Buttons */
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.primary,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    shadowColor: UyirinaiTheme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  actionIconContainerPrimary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitlePrimary: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
    marginBottom: 2,
  },
  actionSubtitlePrimary: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.primary,
  },
  actionIconContainerSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UyirinaiTheme.colors.lightLilac,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTitleSecondary: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
    marginBottom: 2,
  },
  actionSubtitleSecondary: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
  },

  /* Upcoming Appointment Banner */
  appointmentBanner: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  bannerBody: {
    padding: 16,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 4,
  },
  departmentName: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 12,
  },
  appointmentTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingText: {
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  tokenBadge: {
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  bannerFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Empty Appointment Card */
  emptyAptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginBottom: 16,
  },
  emptyAptIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyAptTextWrap: {
    flex: 1,
  },
  emptyAptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 2,
  },
  emptyAptSubtitle: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
  },
  bookShortcutBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginLeft: 8,
  },
  bookShortcutText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Health Overview Summary */
  summarySection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 12,
  },
  summaryGrid: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  summaryIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  summaryCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  summaryCardSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.primary,
    marginTop: 4,
  },
});

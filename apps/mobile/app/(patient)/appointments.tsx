import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  Clock,
  FileText,
  History,
  RotateCcw,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [cancelTargetApt, setCancelTargetApt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Patient schedule conflict');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-active-appointments', user?.id],
    enabled: !!user,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await mobileApiClient.patientPortal.changeAppointment(id, {
        action: 'cancel',
        reason,
      });
    },
    onSuccess: () => {
      setCancelTargetApt(null);
      setCancelError('');
      setCancelSuccessMsg('Appointment cancelled successfully.');
      setTimeout(() => setCancelSuccessMsg(''), 4000);
      queryClient.invalidateQueries({ queryKey: ['patient-portal-active-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-home'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-records'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['reception-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-workspace'] });
    },
    onError: (err) => {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel appointment.');
    },
  });

  const handleCancelClick = (apt: any) => {
    setCancelError('');
    setCancelTargetApt(apt);
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading appointment details..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load appointments"
        message={error instanceof Error ? error.message : 'Please check your connection and retry.'}
        onRetry={() => refetch()}
      />
    );
  }

  const allAppointments = data?.appointments || [];

  // SPEC REQUIREMENT: Show ONLY appointments not met with doctors (exclude COMPLETED and CANCELLED)
  const unmetAppointments = allAppointments.filter(
    (apt: { status: string }) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
  );

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
      {/* Notice Header */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIconWrap}>
          <Calendar size={18} color={UyirinaiTheme.colors.primary} />
        </View>
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>Active & Upcoming Consultations</Text>
          <Text style={styles.infoSubtitle}>
            Completed consultations are moved to Medical History.
          </Text>
        </View>
        <Pressable
          style={styles.historyLinkBtn}
          onPress={() => router.push({ pathname: '/(patient)/records', params: { tab: 'appointments' } } as any)}
        >
          <History size={15} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.historyLinkText}>History</Text>
        </Pressable>
      </View>

      {/* Cancellation Success Feedback */}
      {!!cancelSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{cancelSuccessMsg}</Text>
        </View>
      )}

      {/* Appointment Cards List */}
      {unmetAppointments.length > 0 ? (
        <View style={styles.appointmentList}>
          {unmetAppointments.map((apt: any) => {
            const docUser = apt.doctor?.employee?.user;
            const doctorName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Consultant Doctor';
            const deptName = apt.department?.name || 'General Medicine';
            const hospitalName = apt.branch?.hospital?.name || data?.patient?.hospital?.name;
            const branchName = apt.branch?.name || data?.patient?.registrationBranch?.name || 'Hospital Branch';
            const branchLoc = [apt.branch?.address, apt.branch?.city].filter(Boolean).join(', ');
            const dateStr = apt.appointmentDate?.slice(0, 10);
            const timeStr = apt.appointmentTime || '10:30';

            return (
              <View key={apt.id} style={styles.appointmentCard}>
                {/* Card Top */}
                <View style={styles.cardHeader}>
                  <View style={styles.doctorInfoRow}>
                    <View style={styles.docAvatarCircle}>
                      <Stethoscope size={20} color={UyirinaiTheme.colors.primary} />
                    </View>
                    <View style={styles.docNameCol}>
                      <Text style={styles.docName}>{doctorName}</Text>
                      <Text style={styles.docDept}>
                        {deptName} · {hospitalName ? `${hospitalName} — ` : ''}{branchName}{branchLoc ? ` (${branchLoc})` : ''}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={apt.status} />
                </View>

                {/* Appointment Schedule Info */}
                <View style={styles.scheduleBox}>
                  <View style={styles.scheduleItem}>
                    <Calendar size={15} color={UyirinaiTheme.colors.primary} />
                    <Text style={styles.scheduleText}>{dateStr}</Text>
                  </View>
                  <View style={styles.scheduleItem}>
                    <Clock size={15} color={UyirinaiTheme.colors.primary} />
                    <Text style={styles.scheduleText}>{timeStr} IST</Text>
                  </View>
                  {apt.tokenNumber ? (
                    <View style={styles.tokenPill}>
                      <Text style={styles.tokenPillText}>Token #{apt.tokenNumber}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  {apt.appointmentNumber ? (
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: UyirinaiTheme.colors.textSecondary }}>
                      Appointment ID: {apt.appointmentNumber}
                    </Text>
                  ) : <View />}
                  {apt.source ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: apt.source === 'RECEPTION_WALK_IN' ? '#F59E0B' : UyirinaiTheme.colors.primaryDark }}>
                      {apt.source === 'RECEPTION_WALK_IN' ? 'Walk-in / Reception' : 'Online Booking'}
                    </Text>
                  ) : null}
                </View>

                {apt.reasonForVisit ? (
                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: '700' }}>Reason: </Text>
                    {apt.reasonForVisit}
                  </Text>
                ) : null}

                {/* Reschedule Guidance & Cancel Action */}
                <View style={styles.rescheduleNoticeBox}>
                  <Text style={styles.rescheduleNoticeText}>
                    Need to reschedule? Cancel this slot and book a new consultation.
                  </Text>
                </View>

                <View style={styles.cardActionsRow}>
                  {apt.status === 'IN_PROGRESS' ? (
                    <Text style={styles.rescheduleNoticeText}>
                      Consultation is currently in progress with your doctor.
                    </Text>
                  ) : (
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => handleCancelClick(apt)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle size={15} color={UyirinaiTheme.colors.error} />
                      <Text style={styles.cancelText}>Cancel Appointment</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Calendar size={36} color={UyirinaiTheme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Active Appointments</Text>
          <Text style={styles.emptySubtitle}>
            You do not have any pending or upcoming appointments scheduled right now.
          </Text>

          <Pressable
            style={styles.bookActionBtn}
            onPress={() => router.push('/(patient)/book-appointment' as any)}
          >
            <CalendarPlus size={18} color={UyirinaiTheme.colors.white} />
            <Text style={styles.bookActionText}>Book New Appointment</Text>
          </Pressable>

          <Pressable
            style={styles.viewHistoryBtn}
            onPress={() => router.push({ pathname: '/(patient)/records', params: { tab: 'appointments' } } as any)}
          >
            <FileText size={16} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.viewHistoryText}>View Completed Consultations History</Text>
          </Pressable>
        </View>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal visible={!!cancelTargetApt} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <Pressable onPress={() => setCancelTargetApt(null)} style={styles.closeBtn}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </Pressable>
            </View>

            {!!cancelError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={UyirinaiTheme.colors.error} />
                <Text style={styles.errorText}>{cancelError}</Text>
              </View>
            )}

            <Text style={styles.inputPrompt}>
              Are you sure you want to cancel your consultation with{' '}
              <Text style={{ fontWeight: '700' }}>
                Dr. {cancelTargetApt?.doctor?.employee?.user?.firstName || 'Doctor'}{' '}
                {cancelTargetApt?.doctor?.employee?.user?.lastName || ''}
              </Text>{' '}
              on{' '}
              <Text style={{ fontWeight: '700' }}>
                {cancelTargetApt?.appointmentDate?.slice(0, 10)} at {cancelTargetApt?.appointmentTime || '10:30'} IST
              </Text>?
            </Text>

            <Text style={styles.inputLabel}>Reason for Cancellation</Text>
            <TextInput
              style={styles.inputField}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="e.g. Schedule conflict, feeling better..."
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.keepBtn}
                onPress={() => setCancelTargetApt(null)}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.keepBtnText}>Keep Slot</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmCancelBtn,
                  cancelMutation.isPending && styles.btnDisabled,
                ]}
                onPress={() =>
                  cancelMutation.mutate({
                    id: cancelTargetApt.id,
                    reason: cancelReason,
                  })
                }
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.confirmCancelText}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                </Text>
              </Pressable>
            </View>
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
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
    marginBottom: 16,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.lightLilac,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  infoSubtitle: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 1,
  },
  historyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  historyLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Appointment Cards */
  appointmentList: {
    gap: 14,
  },
  appointmentCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNameCol: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  docDept: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 1,
  },

  /* Schedule Box */
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    marginBottom: 10,
    gap: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  tokenPill: {
    marginLeft: 'auto',
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  reasonText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 12,
  },

  /* Action Buttons */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  rescheduleNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: UyirinaiTheme.colors.primary,
  },
  rescheduleNoticeText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
    fontStyle: 'italic',
  },
  cancelBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  keepBtn: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  keepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: UyirinaiTheme.colors.error,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },
  successBanner: {
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    marginBottom: 14,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
    textAlign: 'center',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 30,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  bookActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: UyirinaiTheme.borderRadius.full,
    marginBottom: 14,
  },
  bookActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.white,
  },
  viewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  viewHistoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  inputPrompt: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  inputField: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    borderRadius: UyirinaiTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: UyirinaiTheme.colors.textPrimary,
  },
  confirmRescheduleBtn: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmRescheduleText: {
    fontSize: 14,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginBottom: 10,
  },
  errorText: {
    color: UyirinaiTheme.colors.error,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});

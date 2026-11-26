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

  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-active-appointments', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  // Reschedule / Cancel mutation
  const changeMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      date,
      time,
    }: {
      id: string;
      action: 'cancel' | 'reschedule';
      date?: string;
      time?: string;
    }) => {
      return await mobileApiClient.patientPortal.changeAppointment(id, {
        action,
        date,
        time,
      });
    },
    onSuccess: () => {
      setRescheduleApt(null);
      setRescheduleError('');
      queryClient.invalidateQueries({ queryKey: ['patient-portal-active-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-portal-home'] });
    },
    onError: (err) => {
      setRescheduleError(err instanceof Error ? err.message : 'Could not update appointment.');
    },
  });

  const handleCancel = (apt: any) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your appointment with Dr. ${
        apt.doctor?.employee?.user?.firstName || 'Doctor'
      }?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => changeMutation.mutate({ id: apt.id, action: 'cancel' }),
        },
      ]
    );
  };

  const openReschedule = (apt: any) => {
    setRescheduleApt(apt);
    setRescheduleDate(apt.appointmentDate?.slice(0, 10) || '');
    setRescheduleTime(apt.appointmentTime || '10:30');
    setRescheduleError('');
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
          onPress={() => router.push('/(patient)/records' as any)}
        >
          <History size={15} color={UyirinaiTheme.colors.primary} />
          <Text style={styles.historyLinkText}>History</Text>
        </Pressable>
      </View>

      {/* Appointment Cards List */}
      {unmetAppointments.length > 0 ? (
        <View style={styles.appointmentList}>
          {unmetAppointments.map((apt: any) => {
            const docUser = apt.doctor?.employee?.user;
            const doctorName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Consultant Doctor';
            const deptName = apt.department?.name || 'General Medicine';
            const branchName = apt.branch?.name || 'Main Branch';
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
                        {deptName} · {branchName}
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

                {apt.reasonForVisit ? (
                  <Text style={styles.reasonText}>
                    <Text style={{ fontWeight: '700' }}>Reason: </Text>
                    {apt.reasonForVisit}
                  </Text>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={styles.rescheduleBtn}
                    onPress={() => openReschedule(apt)}
                    disabled={changeMutation.isPending}
                  >
                    <RotateCcw size={14} color={UyirinaiTheme.colors.primary} />
                    <Text style={styles.rescheduleText}>Reschedule</Text>
                  </Pressable>

                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(apt)}
                    disabled={changeMutation.isPending}
                  >
                    <XCircle size={14} color={UyirinaiTheme.colors.error} />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
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
            onPress={() => router.push('/(patient)/records' as any)}
          >
            <FileText size={16} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.viewHistoryText}>View Completed Consultations History</Text>
          </Pressable>
        </View>
      )}

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduleApt} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Consultation</Text>
              <Pressable onPress={() => setRescheduleApt(null)} style={styles.closeBtn}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </Pressable>
            </View>

            {!!rescheduleError && (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={UyirinaiTheme.colors.error} />
                <Text style={styles.errorText}>{rescheduleError}</Text>
              </View>
            )}

            <Text style={styles.inputPrompt}>
              Choose a new preferred date and time for consultation with{' '}
              <Text style={{ fontWeight: '700' }}>
                Dr. {rescheduleApt?.doctor?.employee?.user?.firstName || 'Doctor'}
              </Text>
              :
            </Text>

            <Text style={styles.inputLabel}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.inputField}
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="e.g. 2026-11-28"
            />

            <Text style={styles.inputLabel}>New Time (HH:mm in 24hr format)</Text>
            <TextInput
              style={styles.inputField}
              value={rescheduleTime}
              onChangeText={setRescheduleTime}
              placeholder="e.g. 11:30"
            />

            <Pressable
              style={[
                styles.confirmRescheduleBtn,
                changeMutation.isPending && styles.btnDisabled,
              ]}
              onPress={() =>
                changeMutation.mutate({
                  id: rescheduleApt.id,
                  action: 'reschedule',
                  date: rescheduleDate.trim(),
                  time: rescheduleTime.trim(),
                })
              }
              disabled={changeMutation.isPending || !rescheduleDate || !rescheduleTime}
            >
              <Text style={styles.confirmRescheduleText}>
                {changeMutation.isPending ? 'Confirming...' : 'Confirm Rescheduled Time'}
              </Text>
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
    paddingBottom: 40,
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
    marginBottom: 16,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.lightGreen,
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
    backgroundColor: UyirinaiTheme.colors.softGreen,
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
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
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
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  rescheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FDE8E8',
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
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
    padding: 20,
  },
  modalBox: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 20,
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
    backgroundColor: '#FDE8E8',
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

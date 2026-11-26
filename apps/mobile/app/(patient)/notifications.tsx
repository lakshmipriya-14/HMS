import React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  HeartPulse,
  Pill,
  Stethoscope,
  Trash2,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await mobileApiClient.notifications.getNotifications();
      return res.data ?? [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await mobileApiClient.notifications.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await mobileApiClient.notifications.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await mobileApiClient.notifications.deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
    onError: (err) => {
      Alert.alert('Delete Error', err instanceof Error ? err.message : 'Could not delete notification.');
    },
  });

  const handleDelete = (notif: any) => {
    Alert.alert('Delete Notification', 'Are you sure you want to dismiss this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(notif.id),
      },
    ]);
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading your health alerts..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load notifications"
        message={error instanceof Error ? error.message : 'Please check your connection.'}
        onRetry={() => refetch()}
      />
    );
  }

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Clock size={20} color={UyirinaiTheme.colors.warning} />;
      case 'APPOINTMENT':
      case 'APPOINTMENT_REQUEST':
        return <Calendar size={20} color={UyirinaiTheme.colors.primary} />;
      case 'LAB_RESULT':
        return <HeartPulse size={20} color={UyirinaiTheme.colors.info} />;
      case 'PRESCRIPTION':
        return <Pill size={20} color={UyirinaiTheme.colors.primaryDark} />;
      default:
        return <Bell size={20} color={UyirinaiTheme.colors.primary} />;
    }
  };

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return { bg: '#FFF8E1', text: '#B78103', label: 'Reminder Alert' };
      case 'APPOINTMENT':
      case 'APPOINTMENT_REQUEST':
        return { bg: UyirinaiTheme.colors.softGreen, text: UyirinaiTheme.colors.primaryDark, label: 'Appointment' };
      case 'LAB_RESULT':
        return { bg: '#E8F4FD', text: '#1D72B8', label: 'Lab Report' };
      case 'PRESCRIPTION':
        return { bg: '#F3E8FD', text: '#7E22CE', label: 'Prescription' };
      default:
        return { bg: UyirinaiTheme.colors.secondaryBackground, text: UyirinaiTheme.colors.textSecondary, label: 'General' };
    }
  };

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
      {/* Unread Alerts Sub-Header Bar */}
      <View style={styles.topHeaderBar}>
        <View style={styles.unreadCountPill}>
          <Text style={styles.unreadCountText}>
            {unreadCount > 0 ? `${unreadCount} Unread Alert${unreadCount > 1 ? 's' : ''}` : 'All Read'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <Pressable
            style={styles.markAllReadBtn}
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck size={14} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.markAllReadText}>
              {markAllReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <View style={styles.list}>
          {notifications.map((notif: any) => {
            const isUnread = !notif.isRead;
            const badge = getBadgeStyle(notif.type);
            const dateStr = notif.createdAt ? String(notif.createdAt).slice(0, 10) : 'Today';

            return (
              <View
                key={notif.id}
                style={[styles.notificationCard, isUnread && styles.notificationCardUnread]}
              >
                {/* Notification Left Icon */}
                <View style={styles.iconCol}>
                  <View style={[styles.iconCirc, { backgroundColor: badge.bg }]}>
                    {getNotificationIcon(notif.type)}
                  </View>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                {/* Notification Body */}
                <View style={styles.bodyCol}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.typePillText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>

                  <Text style={[styles.notifTitle, isUnread && styles.notifTitleBold]}>
                    {notif.title}
                  </Text>
                  <Text style={styles.notifMsg}>{notif.message}</Text>

                  {/* Actions Row */}
                  <View style={styles.cardActions}>
                    {isUnread && (
                      <Pressable
                        style={styles.markReadBtn}
                        onPress={() => markReadMutation.mutate(notif.id)}
                        disabled={markReadMutation.isPending}
                      >
                        <Check size={13} color={UyirinaiTheme.colors.primary} />
                        <Text style={styles.markReadBtnText}>Mark as Read</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(notif)}
                      disabled={deleteMutation.isPending}
                      accessibilityLabel="Delete notification"
                    >
                      <Trash2 size={14} color={UyirinaiTheme.colors.error} />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCirc}>
            <BellOff size={36} color={UyirinaiTheme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySub}>
            You're all caught up! New reminders, appointment confirmations, and lab results will appear here.
          </Text>
        </View>
      )}
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
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  unreadCountPill: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  list: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  notificationCardUnread: {
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: '#F8FDF9',
  },
  iconCol: {
    alignItems: 'center',
    position: 'relative',
  },
  iconCirc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: UyirinaiTheme.colors.primary,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.white,
  },
  bodyCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 3,
  },
  notifTitleBold: {
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  notifMsg: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 4,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    backgroundColor: UyirinaiTheme.colors.softGreen,
  },
  markReadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 36,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginTop: 20,
  },
  emptyIconCirc: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

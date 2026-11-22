import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  HeartPulse,
  X,
  CheckCheck,
  Check,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { UyirinaiTheme as theme } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { mobileApiClient } from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export function SuperAdminHeader({
  breadcrumbs,
  currentTitle,
}: {
  breadcrumbs?: { label: string; href?: string }[];
  currentTitle?: string;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await mobileApiClient.notifications.getNotifications();
      return (res?.data as NotificationItem[]) ?? [];
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await mobileApiClient.notifications.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await mobileApiClient.notifications.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.headerInner}>
          {/* Left: Branding & Breadcrumbs */}
          <View style={styles.leftCol}>
            <TouchableOpacity
              style={styles.brandRow}
              onPress={() => router.push('/(super-admin)/index')}
              activeOpacity={0.8}
            >
              <View style={styles.logoBadge}>
                <HeartPulse size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.brandTitle}>UYIRINAI</Text>
                <Text style={styles.brandSub}>MULTISPECIALITY HOSPITAL</Text>
              </View>
            </TouchableOpacity>

            {(breadcrumbs || currentTitle) && (
              <View style={styles.breadcrumbsRow}>
                <TouchableOpacity onPress={() => router.push('/(super-admin)/index')}>
                  <Text style={styles.breadcrumbLink}>Dashboard</Text>
                </TouchableOpacity>
                {breadcrumbs?.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <Text style={styles.breadcrumbDivider}>/</Text>
                    {crumb.href ? (
                      <TouchableOpacity onPress={() => router.push(crumb.href as any)}>
                        <Text style={styles.breadcrumbLink}>{crumb.label}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.breadcrumbCurrent}>{crumb.label}</Text>
                    )}
                  </React.Fragment>
                ))}
                {currentTitle && (
                  <>
                    <Text style={styles.breadcrumbDivider}>/</Text>
                    <Text style={styles.breadcrumbCurrent}>{currentTitle}</Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Right: Notification Bell & Quick Profile */}
          <View style={styles.rightCol}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={20} color={theme.colors.black} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.profileBadge}>
              <Text style={styles.profileInitial}>
                {user?.firstName?.charAt(0) || 'A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notification Modal Drawer */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Bell size={20} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>Notification Center</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadCountPill}>
                    <Text style={styles.unreadCountText}>{unreadCount} unread</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
              >
                <X size={20} color={theme.colors.black} />
              </TouchableOpacity>
            </View>

            {/* Filter and Actions Bar */}
            <View style={styles.modalActionBar}>
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterChip, !unreadOnly && styles.filterChipActive]}
                  onPress={() => setUnreadOnly(false)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !unreadOnly && styles.filterChipTextActive,
                    ]}
                  >
                    All ({notifications.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, unreadOnly && styles.filterChipActive]}
                  onPress={() => setUnreadOnly(true)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      unreadOnly && styles.filterChipTextActive,
                    ]}
                  >
                    Unread ({unreadCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                >
                  <CheckCheck size={14} color={theme.colors.primary} />
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            {isLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.emptyText}>Loading notifications...</Text>
              </View>
            ) : displayedNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Info size={32} color={theme.colors.mutedText} />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyText}>
                  {unreadOnly
                    ? 'You have read all recent alerts.'
                    : 'No administrative notifications found.'}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.notificationList}>
                {displayedNotifications.map((notif) => (
                  <View
                    key={notif.id}
                    style={[
                      styles.notifItem,
                      !notif.isRead && styles.notifItemUnread,
                    ]}
                  >
                    <View style={styles.notifHeader}>
                      <View style={styles.notifTypeBadge}>
                        <Text style={styles.notifTypeText}>{notif.type || 'SYSTEM'}</Text>
                      </View>
                      <Text style={styles.notifTime}>
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Text>
                    </View>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMessage}>{notif.message}</Text>

                    <View style={styles.notifFooter}>
                      {!notif.isRead && (
                        <TouchableOpacity
                          style={styles.markSingleReadBtn}
                          onPress={() => markReadMutation.mutate(notif.id)}
                          disabled={markReadMutation.isPending}
                        >
                          <Check size={14} color={theme.colors.accentGreen} />
                          <Text style={styles.markSingleReadText}>Mark read</Text>
                        </TouchableOpacity>
                      )}
                      {notif.linkUrl && (
                        <TouchableOpacity
                          style={styles.openLinkBtn}
                          onPress={() => {
                            setModalVisible(false);
                            router.push(notif.linkUrl as any);
                          }}
                        >
                          <Text style={styles.openLinkText}>View Details</Text>
                          <ChevronRight size={14} color={theme.colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  leftCol: {
    gap: 4,
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: theme.colors.black,
    letterSpacing: 0.5,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  breadcrumbLink: {
    fontSize: 11,
    color: theme.colors.mutedText,
    fontWeight: '600',
  },
  breadcrumbDivider: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  breadcrumbCurrent: {
    fontSize: 11,
    color: theme.colors.black,
    fontWeight: '700',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  unreadCountPill: {
    backgroundColor: theme.colors.accentRedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accentRed,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  notificationList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notifItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginBottom: 10,
    gap: 4,
  },
  notifItemUnread: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTypeBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notifTypeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#374151',
  },
  notifTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  notifMessage: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  markSingleReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.accentGreenBg,
  },
  markSingleReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accentGreen,
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
  },
});

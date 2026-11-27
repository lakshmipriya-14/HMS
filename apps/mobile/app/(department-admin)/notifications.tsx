import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  CheckCheck,
  Megaphone,
  Clock,
  CalendarCheck,
  FlaskConical,
  AlertTriangle,
  BedDouble,
  Pill,
  Wrench,
  ChevronRight,
  X,
  Trash2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setErrorMsg('');
      setRefreshing(true);
      const res = await mobileApiClient.notifications.getNotifications();
      if (res && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setErrorMsg(err?.message || 'Unable to connect to notifications service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const handleMarkAsRead = async (id: string) => {
    try {
      setActionLoadingId(id);
      await mobileApiClient.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif((prev: any) => ({ ...prev, isRead: true }));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await mobileApiClient.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoadingId(id);
      await mobileApiClient.notifications.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif(null);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDestinationForNotification = (item: any): string | null => {
    if (item.linkUrl && typeof item.linkUrl === 'string') {
      if (item.linkUrl.startsWith('/(') || item.linkUrl.startsWith('/')) {
        return item.linkUrl;
      }
    }
    const type = (item.type || '').toUpperCase();
    switch (type) {
      case 'APPOINTMENT':
        return '/(department-admin)/appointments';
      case 'LAB':
      case 'LAB_RESULT':
      case 'DIAGNOSTIC':
        return '/(department-admin)/lab-requests';
      case 'ADMISSION':
        return '/(department-admin)/admissions';
      case 'EMERGENCY':
        return '/(department-admin)/opd';
      case 'EQUIPMENT':
      case 'MAINTENANCE':
        return '/(department-admin)/equipment';
      case 'LEAVE':
        return '/(department-admin)/leaves';
      case 'BED':
      case 'WARD':
        return '/(department-admin)/wards-beds';
      default:
        return null;
    }
  };

  const handleItemPress = async (item: any) => {
    // Automatically mark read on tap
    if (!item.isRead) {
      void handleMarkAsRead(item.id);
    }

    const destination = getDestinationForNotification(item);
    if (destination) {
      router.push(destination as any);
    } else {
      setSelectedNotif(item);
    }
  };

  const getNotificationTypeConfig = (typeStr?: string) => {
    const type = (typeStr || '').toUpperCase();
    switch (type) {
      case 'APPOINTMENT':
        return { icon: CalendarCheck, color: '#1565C0', bg: '#E8F1FC', label: 'Appointment' };
      case 'LAB':
      case 'LAB_RESULT':
      case 'DIAGNOSTIC':
        return { icon: FlaskConical, color: '#1565C0', bg: '#E8F1FC', label: 'Laboratory' };
      case 'EMERGENCY':
        return { icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2', label: 'Emergency' };
      case 'ADMISSION':
        return { icon: BedDouble, color: '#F59E0B', bg: '#FEF3C7', label: 'Admission' };
      case 'PRESCRIPTION':
        return { icon: Pill, color: '#00897B', bg: '#DCFCE7', label: 'Prescription' };
      case 'EQUIPMENT':
      case 'MAINTENANCE':
        return { icon: Wrench, color: '#EA580C', bg: '#FFEDD5', label: 'Engineering' };
      case 'SYSTEM':
      case 'BROADCAST':
        return { icon: Megaphone, color: '#1565C0', bg: '#E8F1FC', label: 'Broadcast' };
      default:
        return { icon: Bell, color: '#1565C0', bg: '#E8F1FC', label: 'Alert' };
    }
  };

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications =
    activeTab === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <View style={styles.container}>
      <AdminHeader
        showBack={true}
        fallbackHref="/(department-admin)"
        title="Notifications"
        subtitle="Alerts & Department Broadcasts"
        alertsCount={unreadCount}
      />

      {/* Top Filter & Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ALL')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'UNREAD' && styles.tabBtnActive]}
            onPress={() => setActiveTab('UNREAD')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'UNREAD' && styles.tabBtnTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, markingAll && { opacity: 0.6 }]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#1565C0" />
            ) : (
              <>
                <CheckCheck size={14} color="#1565C0" />
                <Text style={styles.markAllText}>Mark all read</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error state banner */}
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <AlertTriangle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={loadNotifications} style={styles.retryBtn}>
            <RefreshCw size={13} color="#DC2626" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadNotifications}
            tintColor="#1565C0"
            colors={['#1565C0']}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : displayedNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Bell size={36} color="#1565C0" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'UNREAD' ? 'No unread notifications' : 'All caught up!'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'UNREAD'
                ? 'You have reviewed all active department alerts and patient updates.'
                : 'There are no active alerts or broadcasts for your department.'}
            </Text>
          </View>
        ) : (
          displayedNotifications.map((item) => {
            const config = getNotificationTypeConfig(item.type);
            const IconComp = config.icon;
            const dest = getDestinationForNotification(item);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notifCard,
                  !item.isRead ? styles.notifCardUnread : styles.notifCardRead,
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                    <IconComp size={18} color={config.color} />
                  </View>

                  <View style={styles.textCol}>
                    <View style={styles.headerLine}>
                      <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Clock size={11} color="#94A3B8" />
                        <Text style={styles.timeText}>{formatTimestamp(item.createdAt)}</Text>
                      </View>
                    </View>

                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                      {item.title}
                    </Text>
                    <Text style={styles.notifMsg} numberOfLines={3}>
                      {item.message}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {!item.isRead && (
                      <TouchableOpacity
                        style={styles.readBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.readBtnText}>Read</Text>
                      </TouchableOpacity>
                    )}
                    {dest ? (
                      <ChevronRight size={16} color="#94A3B8" style={{ marginTop: 6 }} />
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedNotif} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedNotif(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {selectedNotif && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTypeRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: getNotificationTypeConfig(selectedNotif.type).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: getNotificationTypeConfig(selectedNotif.type).color },
                        ]}
                      >
                        {getNotificationTypeConfig(selectedNotif.type).label}
                      </Text>
                    </View>
                    <Text style={styles.modalTime}>
                      {new Date(selectedNotif.createdAt || Date.now()).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedNotif(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selectedNotif.title}</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalMessage}>{selectedNotif.message}</Text>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {getDestinationForNotification(selectedNotif) ? (
                    <TouchableOpacity
                      style={styles.actionDestinationBtn}
                      onPress={() => {
                        const dest = getDestinationForNotification(selectedNotif);
                        setSelectedNotif(null);
                        if (dest) router.push(dest as any);
                      }}
                    >
                      <ExternalLink size={15} color="#FFFFFF" />
                      <Text style={styles.actionDestinationText}>Open Related Screen</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.deleteModalBtn}
                    onPress={() => handleDelete(selectedNotif.id)}
                  >
                    <Trash2 size={15} color="#DC2626" />
                    <Text style={styles.deleteModalText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#1565C0',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F1FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F1FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183153',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  notifCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardRead: {
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#183153',
  },
  notifMsg: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  cardActions: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  readBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F1FC',
    borderRadius: 6,
    marginBottom: 4,
  },
  readBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1565C0',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183153',
    marginBottom: 10,
  },
  modalScroll: {
    maxHeight: 220,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionDestinationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1565C0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionDestinationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  deleteModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});

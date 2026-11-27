import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  Bell,
  Building2,
  CheckCheck,
  ChevronRight,
  LogOut,
  Mail,
  User,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UyirinaiTheme } from '../constants/theme';

type ActivePopup = 'PROFILE' | 'NOTIFICATIONS' | null;

interface ReceptionOverlayContextValue {
  activePopup: ActivePopup;
  openProfile: () => void;
  openNotifications: () => void;
  close: () => void;
  toggleProfile: () => void;
  toggleNotifications: () => void;
  unreadCount: number;
}

const ReceptionOverlayContext = createContext<ReceptionOverlayContextValue | undefined>(undefined);

export function ReceptionOverlayProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bounds, setBounds] = useState({ width: 390, height: 760 });

  const openProfile = useCallback(() => setActivePopup('PROFILE'), []);
  const openNotifications = useCallback(() => setActivePopup('NOTIFICATIONS'), []);
  const close = useCallback(() => setActivePopup(null), []);
  const toggleProfile = useCallback(
    () => setActivePopup((prev) => (prev === 'PROFILE' ? null : 'PROFILE')),
    [],
  );
  const toggleNotifications = useCallback(
    () => setActivePopup((prev) => (prev === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')),
    [],
  );

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['reception-notifications', user?.id],
    enabled: !!user,
    refetchInterval: 20_000,
    queryFn: async () => {
      const res = await mobileApiClient.notifications.getNotifications();
      return Array.isArray(res?.data) ? res.data : [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => mobileApiClient.notifications.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reception-notifications', user?.id] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => mobileApiClient.notifications.markAllAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reception-notifications', user?.id] });
    },
  });

  useEffect(() => {
    if (activePopup === 'NOTIFICATIONS') {
      void refetchNotifications();
    }
  }, [activePopup, refetchNotifications]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl, user?.id]);

  useEffect(() => {
    if (!activePopup) return;

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      setActivePopup(null);
      return true;
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePopup(null);
      }
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      backSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKeyDown);
      }
    };
  }, [activePopup]);

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Receptionist';
  const employeeCode = user?.employeeCode || user?.employeeId || 'Assigned';
  const email = user?.email || 'Not provided';
  const facility = [user?.hospitalName, user?.branchName].filter(Boolean).join(' · ') || 'Front Desk OPD';
  const avatarUrl = user?.avatarUrl;

  const handleViewProfile = () => {
    setActivePopup(null);
    router.push('/(reception)/profile' as any);
  };

  const handleOpenAllNotifications = () => {
    setActivePopup(null);
    router.push('/(reception)/notifications' as any);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setActivePopup(null);
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // In-screen positioning clamped to phoneFrame / viewport bounds
  const isCompactHeight = bounds.height < 470;
  const isVeryNarrow = bounds.width < 340;
  const useBottomSheet = isCompactHeight || isVeryNarrow;
  const topAnchor = Math.max(insets.top, 0) + 56;
  const bottomSafe = Math.max(insets.bottom, 12);
  const cardWidth = useBottomSheet
    ? Math.min(bounds.width - 16, 400)
    : Math.min(bounds.width - 20, 326);
  const cardMaxHeight = useBottomSheet
    ? Math.max(240, bounds.height - Math.max(insets.top, 12) - bottomSafe - 16)
    : Math.max(240, bounds.height - topAnchor - bottomSafe - 14);

  return (
    <ReceptionOverlayContext.Provider
      value={{
        activePopup,
        openProfile,
        openNotifications,
        close,
        toggleProfile,
        toggleNotifications,
        unreadCount,
      }}
    >
      <View
        style={styles.portalHost}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setBounds((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height },
            );
          }
        }}
      >
        {children}

        {activePopup !== null && (
          <View style={styles.inScreenOverlay} pointerEvents="box-none">
            <Pressable
              style={[
                styles.overlayBackdrop,
                useBottomSheet ? styles.overlayBottomAlign : styles.overlayTopRightAlign,
                useBottomSheet
                  ? { paddingBottom: bottomSafe, paddingHorizontal: 8 }
                  : { paddingTop: topAnchor, paddingRight: 10, paddingLeft: 10 },
              ]}
              onPress={close}
              accessibilityLabel="Close popup"
            >
              <Pressable
                style={[
                  styles.dropdownCard,
                  useBottomSheet && styles.bottomSheetCard,
                  { width: cardWidth, maxHeight: cardMaxHeight },
                ]}
                onPress={(e) => e.stopPropagation()}
                accessibilityViewIsModal
              >
                {activePopup === 'PROFILE' ? (
                  <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.cardScrollContent}
                  >
                    <View style={styles.dropdownHeader}>
                      <Text style={styles.dropdownTag}>RECEPTIONIST PROFILE</Text>
                      <Pressable
                        onPress={close}
                        accessibilityLabel="Close profile popup"
                        accessibilityRole="button"
                        hitSlop={10}
                        style={styles.closeBtn}
                      >
                        <X size={18} color={UyirinaiTheme.colors.textSecondary} />
                      </Pressable>
                    </View>

                    <View style={styles.profileSummaryRow}>
                      <View style={styles.dropdownAvatarCircle}>
                        {avatarUrl && !avatarFailed ? (
                          <Image
                            source={{ uri: avatarUrl }}
                            style={styles.dropdownAvatarImage}
                            onError={() => setAvatarFailed(true)}
                          />
                        ) : (
                          <User size={22} color={UyirinaiTheme.colors.primaryDark} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.dropdownName} numberOfLines={2}>
                          {fullName}
                        </Text>
                        <View style={styles.idPill}>
                          <BadgeCheck size={12} color={UyirinaiTheme.colors.primaryDark} />
                          <Text style={styles.idPillText} numberOfLines={1}>
                            Emp ID: {employeeCode}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.detailsBox}>
                      <View style={styles.detailRow}>
                        <Mail size={14} color={UyirinaiTheme.colors.primary} />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {email}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Building2 size={14} color={UyirinaiTheme.colors.primary} />
                        <Text style={styles.detailText} numberOfLines={2}>
                          {facility}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.menuDivider} />

                    <Pressable
                      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                      accessibilityRole="button"
                      onPress={handleViewProfile}
                    >
                      <User size={17} color={UyirinaiTheme.colors.primaryDark} />
                      <Text style={styles.menuItemText}>View Profile</Text>
                      <ChevronRight size={16} color={UyirinaiTheme.colors.textMuted} />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.menuItem,
                        styles.logoutItem,
                        pressed && styles.menuItemPressed,
                      ]}
                      accessibilityRole="button"
                      disabled={loggingOut}
                      onPress={() => void handleLogout()}
                    >
                      <LogOut size={17} color={UyirinaiTheme.colors.error} />
                      <Text style={styles.logoutText}>
                        {loggingOut ? 'Signing out...' : 'Logout'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                ) : (
                  <View style={styles.notificationsWrap}>
                    <View style={styles.dropdownHeader}>
                      <Text style={styles.dropdownTag}>
                        NOTIFICATIONS {unreadCount > 0 ? `(${unreadCount})` : ''}
                      </Text>
                      <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                          <Pressable
                            onPress={() => markAllMutation.mutate()}
                            disabled={markAllMutation.isPending}
                            style={styles.markAllBtn}
                            accessibilityRole="button"
                          >
                            <CheckCheck size={14} color={UyirinaiTheme.colors.primary} />
                            <Text style={styles.markAllText}>Read all</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={close}
                          accessibilityLabel="Close notifications popup"
                          accessibilityRole="button"
                          hitSlop={10}
                          style={styles.closeBtn}
                        >
                          <X size={18} color={UyirinaiTheme.colors.textSecondary} />
                        </Pressable>
                      </View>
                    </View>

                    <ScrollView
                      bounces={false}
                      showsVerticalScrollIndicator={true}
                      style={{ maxHeight: Math.max(150, cardMaxHeight - 108) }}
                      contentContainerStyle={styles.notificationList}
                    >
                      {notificationsLoading && notifications.length === 0 ? (
                        <View style={styles.centerState}>
                          <ActivityIndicator size="small" color={UyirinaiTheme.colors.primary} />
                        </View>
                      ) : notifications.length === 0 ? (
                        <View style={styles.centerState}>
                          <Bell size={22} color={UyirinaiTheme.colors.textMuted} />
                          <Text style={styles.emptyNotifTitle}>All caught up</Text>
                          <Text style={styles.emptyNotifSub}>No notifications at the moment.</Text>
                        </View>
                      ) : (
                        notifications.slice(0, 12).map((item: any) => (
                          <Pressable
                            key={item.id}
                            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                            onPress={() => {
                              if (!item.isRead) markReadMutation.mutate(item.id);
                            }}
                          >
                            <View style={styles.notifTopRow}>
                              <View style={[styles.notifDot, item.isRead && styles.notifDotRead]} />
                              <Text style={styles.notifTitle} numberOfLines={1}>
                                {item.title || 'Hospital Notification'}
                              </Text>
                              <Text style={styles.notifTime}>
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </Text>
                            </View>
                            <Text style={styles.notifBody} numberOfLines={3}>
                              {item.message}
                            </Text>
                          </Pressable>
                        ))
                      )}
                    </ScrollView>

                    <View style={styles.menuDivider} />
                    <Pressable
                      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                      accessibilityRole="button"
                      onPress={handleOpenAllNotifications}
                    >
                      <Bell size={16} color={UyirinaiTheme.colors.primaryDark} />
                      <Text style={styles.menuItemText}>View All Notifications</Text>
                      <ChevronRight size={16} color={UyirinaiTheme.colors.textMuted} />
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Pressable>
          </View>
        )}
      </View>
    </ReceptionOverlayContext.Provider>
  );
}

export function ReceptionHeaderRight() {
  const { user } = useAuth();
  const context = useContext(ReceptionOverlayContext);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarUrl = user?.avatarUrl;
  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl, user?.id]);

  const unreadCount = context?.unreadCount ?? 0;

  return (
    <View style={styles.headerRightContainer}>
      <Pressable
        onPress={() => context?.toggleNotifications()}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={8}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
      >
        <Bell size={19} color={UyirinaiTheme.colors.primaryDark} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={() => context?.toggleProfile()}
        accessibilityRole="button"
        accessibilityLabel="Open receptionist profile menu"
        hitSlop={8}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.iconBtnPressed]}
      >
        <View style={styles.avatarRing}>
          {avatarUrl && !avatarFailed ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.headerAvatarImage}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <User size={18} color={UyirinaiTheme.colors.primaryDark} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  portalHost: {
    flex: 1,
    position: 'relative',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnPressed: {
    opacity: 0.78,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },
  avatarButton: {
    padding: 2,
    borderRadius: 20,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  inScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 50,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
  },
  overlayTopRightAlign: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  overlayBottomAlign: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dropdownCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    overflow: 'hidden',
    shadowColor: '#183153',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 18,
  },
  bottomSheetCard: {
    borderRadius: UyirinaiTheme.borderRadius.xl,
  },
  cardScrollContent: {
    padding: 14,
  },
  notificationsWrap: {
    padding: 14,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  dropdownTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: UyirinaiTheme.colors.primaryDark,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dropdownAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  dropdownAvatarImage: {
    width: '100%',
    height: '100%',
  },
  dropdownName: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  idPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
  },
  idPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  detailsBox: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: UyirinaiTheme.colors.borderLight,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
  },
  menuItemPressed: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  logoutItem: {
    marginTop: 2,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
  },
  notificationList: {
    gap: 8,
    paddingBottom: 4,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyNotifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  emptyNotifSub: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
  },
  notifCard: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  notifCardUnread: {
    backgroundColor: UyirinaiTheme.colors.primaryLight,
    borderColor: UyirinaiTheme.colors.primaryBorder,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: UyirinaiTheme.colors.primary,
  },
  notifDotRead: {
    backgroundColor: UyirinaiTheme.colors.borderDefault,
  },
  notifTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  notifTime: {
    fontSize: 10,
    color: UyirinaiTheme.colors.textMuted,
  },
  notifBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: UyirinaiTheme.colors.textSecondary,
  },
});

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CalendarPlus,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UyirinaiTheme } from '../constants/theme';

interface ProfileMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ProfileMenuContext = createContext<ProfileMenuContextValue | undefined>(undefined);

export function PatientProfileMenuProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [bounds, setBounds] = useState({ width: 390, height: 760 });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Fetch logged-in patient's profile dynamically (strictly scoped by user.id)
  const { data: portalData } = useQuery({
    queryKey: ['patient-portal-header', user?.id],
    enabled: !!user && user.role === 'PATIENT',
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  const patient = portalData?.patient;
  const avatarUrl = patient?.user?.avatarUrl;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl, user?.id]);

  // Close popup on hardware Back button (Android) or Escape key (Web)
  useEffect(() => {
    if (!isOpen) return;

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      setIsOpen(false);
      return true;
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Patient';
  const patientId = patient?.uhid || 'Assigned on registration';
  const patientEmail = patient?.email || patient?.user?.email || user?.email || 'Not provided';
  const patientPhone = patient?.phone || 'Not provided';

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push('/(patient)/profile' as any);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setIsOpen(false);
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Intelligent in-screen positioning based on available viewport space
  const isCompactHeight = bounds.height < 470;
  const isVeryNarrow = bounds.width < 340;
  const useBottomSheet = isCompactHeight || isVeryNarrow;
  const topAnchor = Math.max(insets.top, 0) + (Platform.OS === 'web' ? 56 : 56);
  const bottomSafe = Math.max(insets.bottom, 12);
  const cardWidth = useBottomSheet
    ? Math.min(bounds.width - 16, 400)
    : Math.min(bounds.width - 20, 308);
  const cardMaxHeight = useBottomSheet
    ? Math.max(220, bounds.height - Math.max(insets.top, 12) - bottomSafe - 16)
    : Math.max(220, bounds.height - topAnchor - bottomSafe - 12);

  return (
    <ProfileMenuContext.Provider value={{ isOpen, open, close, toggle }}>
      <View
        style={styles.portalHost}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setBounds((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height }
            );
          }
        }}
      >
        {children}

        {isOpen && (
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
              accessibilityLabel="Close profile popup"
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
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.cardScrollContent}
                >
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTag}>PATIENT PROFILE</Text>
                    <Pressable
                      onPress={close}
                      accessibilityLabel="Close profile menu"
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
                        {patientName}
                      </Text>
                      <View style={styles.idPill}>
                        <Text style={styles.idPillText} numberOfLines={1}>
                          Patient ID: {patientId}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Mail size={14} color={UyirinaiTheme.colors.primary} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {patientEmail}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Phone size={14} color={UyirinaiTheme.colors.primary} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {patientPhone}
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
              </Pressable>
            </Pressable>
          </View>
        )}
      </View>
    </ProfileMenuContext.Provider>
  );
}

export function PatientHeaderRight() {
  const router = useRouter();
  const { user } = useAuth();
  const profileMenu = useContext(ProfileMenuContext);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const [avatarFailed, setAvatarFailed] = useState(false);

  const { data: portalData } = useQuery({
    queryKey: ['patient-portal-header', user?.id],
    enabled: !!user && user.role === 'PATIENT',
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  const avatarUrl = portalData?.patient?.user?.avatarUrl;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl, user?.id]);

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['patient-notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await mobileApiClient.notifications.getNotifications();
      return res.data ?? [];
    },
    refetchInterval: 15000,
  });

  const notifications = notificationsData ?? [];
  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  // Shake / Pop animation when there are unread notifications
  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;

    if (unreadCount > 0) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnimation, {
            toValue: -8,
            duration: 90,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shakeAnimation, {
            toValue: 8,
            duration: 90,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shakeAnimation, {
            toValue: -6,
            duration: 90,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shakeAnimation, {
            toValue: 6,
            duration: 90,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shakeAnimation, {
            toValue: 0,
            duration: 90,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(1200),
        ])
      );
      animationLoop.start();
    } else {
      shakeAnimation.setValue(0);
    }

    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [unreadCount, shakeAnimation]);

  const animatedStyle: any = {
    transform: [
      {
        rotate: shakeAnimation.interpolate({
          inputRange: [-8, 8],
          outputRange: ['-14deg', '14deg'],
        }),
      },
      {
        scale: shakeAnimation.interpolate({
          inputRange: [-8, 0, 8],
          outputRange: [1.12, 1, 1.12],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* BOOK APPOINTMENT Button */}
      <Pressable
        style={styles.bookButton}
        onPress={() => router.push('/(patient)/book-appointment' as any)}
        accessibilityLabel="Book Appointment"
        accessibilityRole="button"
        hitSlop={4}
      >
        <CalendarPlus size={14} color={UyirinaiTheme.colors.white} strokeWidth={2.5} />
        <Text style={styles.bookButtonText}>Book</Text>
      </Pressable>

      {/* Shaking Notification Bell */}
      <Pressable
        style={styles.bellButton}
        onPress={() => router.push('/(patient)/notifications' as any)}
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
        accessibilityRole="button"
        hitSlop={4}
      >
        <Animated.View style={animatedStyle}>
          <Bell
            size={19}
            color={unreadCount > 0 ? UyirinaiTheme.colors.primary : UyirinaiTheme.colors.textSecondary}
            strokeWidth={unreadCount > 0 ? 2.4 : 2}
          />
        </Animated.View>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      {/* Patient Profile Avatar Trigger */}
      <Pressable
        style={styles.avatarButton}
        onPress={() => profileMenu?.toggle()}
        accessibilityLabel="Patient Profile Menu"
        accessibilityRole="button"
        accessibilityState={{ expanded: !!profileMenu?.isOpen }}
        hitSlop={4}
      >
        {avatarUrl && !avatarFailed ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <User size={18} color={UyirinaiTheme.colors.primaryDark} strokeWidth={2.2} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  portalHost: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 8,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: UyirinaiTheme.colors.primaryDark,
    paddingHorizontal: 10,
    minHeight: 36,
    borderRadius: UyirinaiTheme.borderRadius.full,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  bookButtonText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bellButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lavender,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: UyirinaiTheme.colors.error,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.white,
  },
  badgeText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 9.5,
    fontWeight: '800',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  inScreenOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 20,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37, 24, 56, 0.35)',
  },
  overlayTopRightAlign: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  overlayBottomAlign: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dropdownCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  bottomSheetCard: {
    borderRadius: UyirinaiTheme.borderRadius.xl,
  },
  cardScrollContent: {
    padding: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: UyirinaiTheme.colors.primaryDark,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
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
    borderWidth: 2,
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: UyirinaiTheme.colors.softLilac,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: UyirinaiTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  idPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  detailsBox: {
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
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
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: UyirinaiTheme.colors.borderLight,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: UyirinaiTheme.borderRadius.md,
  },
  menuItemPressed: {
    backgroundColor: UyirinaiTheme.colors.softLilac,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  logoutItem: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
    paddingTop: 12,
  },
  logoutText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
  },
});

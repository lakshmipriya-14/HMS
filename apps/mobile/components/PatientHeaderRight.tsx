import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarPlus } from 'lucide-react-native';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UyirinaiTheme } from '../constants/theme';

export function PatientHeaderRight() {
  const router = useRouter();
  const { user } = useAuth();
  const shakeAnimation = useRef(new Animated.Value(0)).current;

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
          Animated.delay(1200), // pause briefly before repeating
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
      >
        <CalendarPlus size={15} color={UyirinaiTheme.colors.white} strokeWidth={2.5} />
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </Pressable>

      {/* Shaking Notification Bell */}
      <Pressable
        style={styles.bellButton}
        onPress={() => router.push('/(patient)/notifications' as any)}
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
        accessibilityRole="button"
      >
        <Animated.View style={animatedStyle}>
          <Bell
            size={22}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 10,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: UyirinaiTheme.borderRadius.full,
    shadowColor: UyirinaiTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
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
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: UyirinaiTheme.colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.white,
  },
  badgeText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, HeartPulse } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { ProfileAvatar } from './ProfileAvatar';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBrand?: boolean;
  rightAction?: React.ReactNode;
  userAvatarName?: string;
  alertsCount?: number;
  onNotificationsPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showBrand = false,
  rightAction,
  userAvatarName,
  alertsCount = 0,
  onNotificationsPress,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={UyirinaiTheme.colors.textPrimary} />
            </TouchableOpacity>
          )}

          {showBrand && (
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <HeartPulse size={18} color={UyirinaiTheme.colors.white} />
              </View>
              <View>
                <Text style={styles.hospitalTitle}>UYIRINAI</Text>
                <Text style={styles.hospitalSubtitle}>HOSPITAL</Text>
              </View>
            </View>
          )}

          {title && !showBrand && (
            <View style={styles.titleColumn}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightAction}

          {onNotificationsPress && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onNotificationsPress}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Bell size={20} color={UyirinaiTheme.colors.textPrimary} />
              {alertsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {alertsCount > 9 ? '9+' : alertsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {userAvatarName && (
            <ProfileAvatar name={userAvatarName} size="sm" />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UyirinaiTheme.spacing.base,
    backgroundColor: UyirinaiTheme.colors.white,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: UyirinaiTheme.spacing.sm,
    padding: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: UyirinaiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalTitle: {
    fontSize: 14,
    fontWeight: UyirinaiTheme.typography.fontWeights.heavy,
    color: UyirinaiTheme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  hospitalSubtitle: {
    fontSize: 9,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    color: UyirinaiTheme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: UyirinaiTheme.typography.fontSizes.lg,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.textPrimary,
  },
  subtitle: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: UyirinaiTheme.colors.error,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 9,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
  },
});

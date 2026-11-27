import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Bell, Check, ChevronRight } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface NotificationItemProps {
  title: string;
  message: string;
  time?: string;
  isRead?: boolean;
  onPress?: () => void;
  onMarkRead?: () => void;
  style?: ViewStyle;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  message,
  time,
  isRead = true,
  onPress,
  onMarkRead,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.container,
        !isRead && styles.unreadContainer,
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: isRead
              ? UyirinaiTheme.colors.backgroundSecondary
              : UyirinaiTheme.colors.softGreen,
          },
        ]}
      >
        <Bell
          size={18}
          color={
            isRead
              ? UyirinaiTheme.colors.textSecondary
              : UyirinaiTheme.colors.primary
          }
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.title,
              !isRead && styles.unreadTitle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>

        {!isRead && onMarkRead && (
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={onMarkRead}
          >
            <Check size={12} color={UyirinaiTheme.colors.primary} />
            <Text style={styles.markReadText}>Mark read</Text>
          </TouchableOpacity>
        )}
      </View>

      {onPress && (
        <ChevronRight size={18} color={UyirinaiTheme.colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    padding: UyirinaiTheme.spacing.md,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    marginBottom: UyirinaiTheme.spacing.sm,
  },
  unreadContainer: {
    backgroundColor: UyirinaiTheme.colors.primaryLight,
    borderColor: UyirinaiTheme.colors.primaryBorder,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: UyirinaiTheme.spacing.md,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.primaryDark,
  },
  time: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textMuted,
    marginLeft: UyirinaiTheme.spacing.sm,
  },
  message: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textSecondary,
    lineHeight: 18,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 11,
    color: UyirinaiTheme.colors.primary,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
  },
});

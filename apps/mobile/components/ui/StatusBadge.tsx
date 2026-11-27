import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export type StatusType = 'success' | 'pending' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label?: string;
  status?: StatusType | string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = 'neutral',
  icon,
  style,
  textStyle,
  size = 'sm',
}) => {
  const normStatus = (() => {
    const s = String(status || '').toUpperCase();
    if (['SUCCESS', 'COMPLETED', 'PAID', 'ACTIVE', 'DISPENSED', 'RELEASED'].includes(s)) return 'success';
    if (['PENDING', 'SCHEDULED', 'REQUESTED', 'IN_PROGRESS'].includes(s)) return 'pending';
    if (['ERROR', 'CANCELLED', 'FAILED', 'CRITICAL', 'NO_SHOW'].includes(s)) return 'error';
    if (['INFO', 'CHECKED_IN', 'REPORT_RELEASED'].includes(s)) return 'info';
    return status as StatusType;
  })();

  const displayLabel = label || String(status || '').replace(/_/g, ' ');

  const getPalette = () => {
    switch (normStatus) {
      case 'success':
        return {
          bg: UyirinaiTheme.colors.successBg,
          text: UyirinaiTheme.colors.success,
          border: UyirinaiTheme.colors.successBorder,
        };
      case 'pending':
        return {
          bg: UyirinaiTheme.colors.warningBg,
          text: UyirinaiTheme.colors.warning,
          border: UyirinaiTheme.colors.warningBorder,
        };
      case 'error':
        return {
          bg: UyirinaiTheme.colors.errorBg,
          text: UyirinaiTheme.colors.error,
          border: UyirinaiTheme.colors.errorBorder,
        };
      case 'info':
        return {
          bg: UyirinaiTheme.colors.secondaryBg,
          text: UyirinaiTheme.colors.secondary,
          border: UyirinaiTheme.colors.secondaryBorder,
        };
      case 'neutral':
      default:
        return {
          bg: UyirinaiTheme.colors.neutralBg,
          text: UyirinaiTheme.colors.neutral,
          border: UyirinaiTheme.colors.border,
        };
    }
  };

  const palette = getPalette();

  const sizeStyles = {
    sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 11 },
    md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: palette.text,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    textTransform: 'uppercase',
  },
});

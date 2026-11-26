import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  variant?: 'white' | 'softGreen';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  variant = 'softGreen',
  onPress,
  style,
}) => {
  const isSoftGreen = variant === 'softGreen';

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isSoftGreen
            ? UyirinaiTheme.colors.softGreen
            : UyirinaiTheme.colors.white,
          borderColor: isSoftGreen
            ? UyirinaiTheme.colors.lightGreen
            : UyirinaiTheme.colors.border,
        },
        !isSoftGreen && UyirinaiTheme.shadows.subtle,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isSoftGreen
                  ? UyirinaiTheme.colors.white
                  : UyirinaiTheme.colors.softGreen,
              },
            ]}
          >
            {icon}
          </View>
        )}
      </View>

      <Text style={styles.value}>{value}</Text>

      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.touchable}
      >
        {card}
      </TouchableOpacity>
    );
  }

  return card;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    padding: UyirinaiTheme.spacing.base,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UyirinaiTheme.spacing.xs,
  },
  label: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
    color: UyirinaiTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: UyirinaiTheme.spacing.xs,
  },
  value: {
    fontSize: UyirinaiTheme.typography.fontSizes.xxl,
    fontWeight: UyirinaiTheme.typography.fontWeights.heavy,
    color: UyirinaiTheme.colors.textPrimary,
    marginVertical: 2,
  },
  subtitle: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textMuted,
  },
});

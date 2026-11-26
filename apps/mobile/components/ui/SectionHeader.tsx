import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onAction,
  style,
  titleStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {actionText && onAction && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UyirinaiTheme.spacing.md,
    marginTop: UyirinaiTheme.spacing.sm,
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
    marginTop: 2,
  },
  actionText: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    color: UyirinaiTheme.colors.primary,
  },
});

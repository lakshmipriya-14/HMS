import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leftIcon?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  meta,
  leftIcon,
  rightComponent,
  onPress,
  showChevron = true,
  style,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      {leftIcon && <View style={styles.leftIconBox}>{leftIcon}</View>}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {meta && <Text style={styles.meta}>{meta}</Text>}
        {rightComponent}
        {onPress && showChevron && (
          <ChevronRight size={18} color={UyirinaiTheme.colors.textMuted} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: UyirinaiTheme.spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    paddingVertical: UyirinaiTheme.spacing.md,
    paddingHorizontal: UyirinaiTheme.spacing.base,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    minHeight: 56,
  },
  leftIconBox: {
    marginRight: UyirinaiTheme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: UyirinaiTheme.typography.fontSizes.base,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
    color: UyirinaiTheme.colors.textPrimary,
  },
  subtitle: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: UyirinaiTheme.spacing.sm,
  },
  meta: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textMuted,
  },
});

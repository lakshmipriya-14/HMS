import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FolderOpen } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {icon || <FolderOpen size={32} color={UyirinaiTheme.colors.primary} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: UyirinaiTheme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UyirinaiTheme.spacing.md,
  },
  title: {
    fontSize: UyirinaiTheme.typography.fontSizes.lg,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: UyirinaiTheme.spacing.xs,
  },
  description: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: UyirinaiTheme.spacing.md,
  },
});

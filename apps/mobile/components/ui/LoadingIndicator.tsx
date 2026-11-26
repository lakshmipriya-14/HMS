import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'large',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={UyirinaiTheme.colors.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: UyirinaiTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: UyirinaiTheme.spacing.md,
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    color: UyirinaiTheme.colors.textSecondary,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
  },
});

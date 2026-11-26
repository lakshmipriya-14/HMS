import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'dark' | 'soft';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  style,
  textStyle,
  size = 'md',
  ...rest
}) => {
  const getBackgroundColor = () => {
    if (disabled) return UyirinaiTheme.colors.border;
    switch (variant) {
      case 'dark':
        return UyirinaiTheme.colors.primaryDark;
      case 'soft':
        return UyirinaiTheme.colors.softGreen;
      case 'primary':
      default:
        return UyirinaiTheme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return UyirinaiTheme.colors.textMuted;
    if (variant === 'soft') return UyirinaiTheme.colors.primary;
    return UyirinaiTheme.colors.textOnPrimary;
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 46 },
    lg: { paddingVertical: 15, paddingHorizontal: 20, minHeight: 52 },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'soft' ? UyirinaiTheme.colors.primary : UyirinaiTheme.colors.white}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              icon ? styles.textWithIcon : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: UyirinaiTheme.borderRadius.md,
    overflow: 'hidden',
  },
  text: {
    fontSize: UyirinaiTheme.typography.fontSizes.base,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: UyirinaiTheme.spacing.sm,
  },
});

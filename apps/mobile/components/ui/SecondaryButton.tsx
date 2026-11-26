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

export interface SecondaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'sm' | 'md' | 'lg';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  destructive = false,
  icon,
  style,
  textStyle,
  size = 'md',
  ...rest
}) => {
  const borderColor = disabled
    ? UyirinaiTheme.colors.border
    : destructive
    ? UyirinaiTheme.colors.error
    : UyirinaiTheme.colors.primary;

  const textColor = disabled
    ? UyirinaiTheme.colors.textMuted
    : destructive
    ? UyirinaiTheme.colors.error
    : UyirinaiTheme.colors.primary;

  const sizeStyles = {
    sm: { paddingVertical: 7, paddingHorizontal: 12, minHeight: 36 },
    md: { paddingVertical: 11, paddingHorizontal: 16, minHeight: 46 },
    lg: { paddingVertical: 14, paddingHorizontal: 20, minHeight: 52 },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles,
        { borderColor, backgroundColor: UyirinaiTheme.colors.white },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: textColor },
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
    borderWidth: 1.5,
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

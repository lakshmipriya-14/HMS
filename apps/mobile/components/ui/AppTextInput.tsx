import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={UyirinaiTheme.colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: UyirinaiTheme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: UyirinaiTheme.spacing.xs,
  },
  label: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    fontWeight: UyirinaiTheme.typography.fontWeights.medium,
    color: UyirinaiTheme.colors.textPrimary,
  },
  required: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    color: UyirinaiTheme.colors.error,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    borderRadius: UyirinaiTheme.borderRadius.md,
    minHeight: 46,
    paddingHorizontal: UyirinaiTheme.spacing.md,
  },
  inputFocused: {
    borderColor: UyirinaiTheme.colors.primary,
    backgroundColor: UyirinaiTheme.colors.primaryLight,
  },
  inputError: {
    borderColor: UyirinaiTheme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: UyirinaiTheme.typography.fontSizes.base,
    color: UyirinaiTheme.colors.textPrimary,
    paddingVertical: UyirinaiTheme.spacing.sm,
  },
  leftIconContainer: {
    marginRight: UyirinaiTheme.spacing.sm,
  },
  rightIconContainer: {
    marginLeft: UyirinaiTheme.spacing.sm,
  },
  errorText: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.error,
    marginTop: UyirinaiTheme.spacing.xs,
  },
  helperText: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: UyirinaiTheme.spacing.xs,
  },
});

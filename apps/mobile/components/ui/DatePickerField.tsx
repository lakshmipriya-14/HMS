import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface DatePickerFieldProps {
  label?: string;
  value?: string;
  onPress: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onPress,
  placeholder = 'Select date (YYYY-MM-DD)',
  required = false,
  error,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.trigger,
          Boolean(error) && styles.triggerError,
        ]}
      >
        <Text style={[styles.triggerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Calendar size={18} color={UyirinaiTheme.colors.primary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    borderRadius: UyirinaiTheme.borderRadius.md,
    minHeight: 46,
    paddingHorizontal: UyirinaiTheme.spacing.md,
  },
  triggerError: {
    borderColor: UyirinaiTheme.colors.error,
  },
  triggerText: {
    fontSize: UyirinaiTheme.typography.fontSizes.base,
    color: UyirinaiTheme.colors.textPrimary,
  },
  placeholderText: {
    color: UyirinaiTheme.colors.textMuted,
  },
  errorText: {
    fontSize: UyirinaiTheme.typography.fontSizes.xs,
    color: UyirinaiTheme.colors.error,
    marginTop: UyirinaiTheme.spacing.xs,
  },
});

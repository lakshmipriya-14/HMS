import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface AppDropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  required = false,
  error,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

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
        onPress={() => setModalVisible(true)}
        style={[
          styles.trigger,
          Boolean(error) && styles.triggerError,
          modalVisible && styles.triggerActive,
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color={UyirinaiTheme.colors.textSecondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Check size={18} color={UyirinaiTheme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  triggerActive: {
    borderColor: UyirinaiTheme.colors.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 53, 44, 0.4)',
    justifyContent: 'center',
    padding: UyirinaiTheme.spacing.xl,
  },
  modalContent: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    maxHeight: '70%',
    paddingVertical: UyirinaiTheme.spacing.md,
    ...UyirinaiTheme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UyirinaiTheme.spacing.base,
    paddingBottom: UyirinaiTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  modalTitle: {
    fontSize: UyirinaiTheme.typography.fontSizes.lg,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.textPrimary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UyirinaiTheme.spacing.md,
    paddingHorizontal: UyirinaiTheme.spacing.base,
  },
  optionSelected: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
  },
  optionLabel: {
    fontSize: UyirinaiTheme.typography.fontSizes.base,
    color: UyirinaiTheme.colors.textPrimary,
  },
  optionLabelSelected: {
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    color: UyirinaiTheme.colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: UyirinaiTheme.colors.borderLight,
  },
});

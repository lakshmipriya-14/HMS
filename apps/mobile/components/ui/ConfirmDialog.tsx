import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: destructive
                  ? UyirinaiTheme.colors.errorBg
                  : UyirinaiTheme.colors.softGreen,
              },
            ]}
          >
            <AlertCircle
              size={24}
              color={
                destructive
                  ? UyirinaiTheme.colors.error
                  : UyirinaiTheme.colors.primary
              }
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.btnRow}>
            <SecondaryButton
              title={cancelLabel}
              onPress={onCancel}
              style={styles.btn}
              disabled={loading}
            />
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={[
                styles.btn,
                destructive ? { backgroundColor: UyirinaiTheme.colors.error } : null,
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 53, 44, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UyirinaiTheme.spacing.lg,
  },
  card: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    padding: UyirinaiTheme.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...UyirinaiTheme.shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  message: {
    fontSize: UyirinaiTheme.typography.fontSizes.sm,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: UyirinaiTheme.spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
});

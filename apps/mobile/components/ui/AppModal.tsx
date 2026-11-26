import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  contentStyle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.content, contentStyle]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.body}>{children}</View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 53, 44, 0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderTopLeftRadius: UyirinaiTheme.borderRadius.xl,
    borderTopRightRadius: UyirinaiTheme.borderRadius.xl,
    paddingHorizontal: UyirinaiTheme.spacing.base,
    paddingBottom: UyirinaiTheme.spacing.xxl,
    maxHeight: '85%',
    ...UyirinaiTheme.shadows.card,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: UyirinaiTheme.colors.border,
    alignSelf: 'center',
    marginVertical: UyirinaiTheme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UyirinaiTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    marginBottom: UyirinaiTheme.spacing.md,
  },
  title: {
    fontSize: UyirinaiTheme.typography.fontSizes.lg,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
    color: UyirinaiTheme.colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingVertical: UyirinaiTheme.spacing.xs,
  },
});

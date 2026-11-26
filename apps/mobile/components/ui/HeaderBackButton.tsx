import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface HeaderBackButtonProps {
  onBack?: () => void;
  fallbackHref?: Href;
  color?: string;
  size?: number;
}

/**
 * Reusable Back Button component for mobile headers.
 * Safely navigates to previous screen if history exists,
 * or falls back to a parent route / module dashboard.
 */
export const HeaderBackButton: React.FC<HeaderBackButtonProps> = ({
  onBack,
  fallbackHref,
  color = UyirinaiTheme.colors.primaryDark,
  size = 22,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else if (fallbackHref) {
      router.replace(fallbackHref);
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.backBtn}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={size} color={color} strokeWidth={2.4} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 6,
  },
});

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacityProps,
} from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface AppCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'white' | 'softGreen' | 'bordered';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'white',
  style,
  onPress,
  padding = 'md',
  ...rest
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'softGreen':
        return UyirinaiTheme.colors.softGreen;
      case 'bordered':
      case 'white':
      default:
        return UyirinaiTheme.colors.white;
    }
  };

  const paddingStyle = {
    none: 0,
    sm: UyirinaiTheme.spacing.sm,
    md: UyirinaiTheme.spacing.base,
    lg: UyirinaiTheme.spacing.lg,
  }[padding];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      padding: paddingStyle,
      borderColor: variant === 'softGreen' ? UyirinaiTheme.colors.lightGreen : UyirinaiTheme.colors.border,
    },
    variant === 'white' && styles.shadow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={cardStyle}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: UyirinaiTheme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: UyirinaiTheme.spacing.md,
  },
  shadow: {
    ...UyirinaiTheme.shadows.subtle,
  },
});

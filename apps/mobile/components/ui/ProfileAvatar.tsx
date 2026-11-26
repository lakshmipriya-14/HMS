import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface ProfileAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: string;
  style?: ViewStyle;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  size = 'md',
  role,
  style,
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const dimensions = {
    sm: { size: 32, fontSize: 12 },
    md: { size: 42, fontSize: 15 },
    lg: { size: 54, fontSize: 19 },
    xl: { size: 72, fontSize: 26 },
  }[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimensions.size,
          height: dimensions.size,
          borderRadius: dimensions.size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: dimensions.fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: UyirinaiTheme.colors.primaryDark,
    fontWeight: UyirinaiTheme.typography.fontWeights.bold,
  },
});

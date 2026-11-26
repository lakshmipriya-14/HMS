import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export interface BottomTabBarConfig {
  activeTintColor?: string;
  inactiveTintColor?: string;
  style?: ViewStyle;
}

export const getStandardTabScreenOptions = () => ({
  tabBarActiveTintColor: UyirinaiTheme.colors.primary,
  tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
  tabBarHideOnKeyboard: true,
  tabBarStyle: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
    height: Platform.OS === 'web' ? 62 : 68,
    paddingBottom: Platform.OS === 'web' ? 8 : 12,
    paddingTop: 8,
    ...UyirinaiTheme.shadows.subtle,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: UyirinaiTheme.typography.fontWeights.semibold,
    marginTop: 2,
  },
});

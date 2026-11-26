import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../constants/role-home';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { UyirinaiTheme } from '../constants/theme';

export function WorkspaceGate({ home, children }: { home: Href; children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator message="Verifying session..." />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  const normalizedRoleHome = String(roleHome[user.role] || '').replace(/\/index$/, '');
  const normalizedHome = String(home || '').replace(/\/index$/, '');
  if (normalizedRoleHome !== normalizedHome) return <Redirect href={roleHome[user.role]} />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
  },
});

import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../constants/role-home';

export function WorkspaceGate({ home, children }: { home: Href; children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <ActivityIndicator accessibilityLabel="Restoring session" />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (roleHome[user.role] !== home) return <Redirect href={roleHome[user.role]} />;
  return <>{children}</>;
}

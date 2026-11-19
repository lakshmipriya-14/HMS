import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0F766E" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(doctor)" />
          <Stack.Screen name="(nurse)" />
          <Stack.Screen name="(reception)" />
          <Stack.Screen name="(pharmacy)" />
          <Stack.Screen name="(lab)" />
          <Stack.Screen name="(radiology)" />
          <Stack.Screen name="(billing)" />
          <Stack.Screen name="(ambulance)" />
          <Stack.Screen name="(patient)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}

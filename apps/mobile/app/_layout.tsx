import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';
import { View, StyleSheet, Platform } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const content = (
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
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0F766E" />
        {Platform.OS === 'web' ? (
          <View style={styles.webWrapper}>
            <View style={styles.phoneFrame}>
              {content}
            </View>
          </View>
        ) : (
          content
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
});

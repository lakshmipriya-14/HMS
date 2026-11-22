import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const content = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(super-admin)" />
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
        {Platform.OS === 'web' && width > 500 ? (
          <View style={styles.webWrapper}>
            <View style={[styles.phoneFrame, { maxHeight: Math.min(height - 24, 920) }]}>
              {content}
            </View>
          </View>
        ) : Platform.OS === 'web' ? (
          <View style={styles.webMobileWrapper}>{content}</View>
        ) : (
          content
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  webMobileWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F7F7F7',
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
});

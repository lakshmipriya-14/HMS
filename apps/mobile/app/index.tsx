import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (user.role === Role.NURSE || user.role === Role.HEAD_NURSE) {
        router.replace('/(nurse)');
      } else if (user.role === Role.AMBULANCE_DRIVER || user.role === Role.AMBULANCE_COORDINATOR) {
        router.replace('/(ambulance)');
      } else if (user.role === Role.PATIENT) {
        router.replace('/(patient)');
      } else {
        router.replace('/(nurse)');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0F766E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});

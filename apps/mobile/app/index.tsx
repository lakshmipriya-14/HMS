import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user.role) {
    case Role.SUPER_ADMIN:
    case Role.HOSPITAL_ADMIN:
    case Role.DEPARTMENT_ADMIN:
      return <Redirect href="/(admin)" />;
    case Role.DOCTOR:
      return <Redirect href="/(doctor)" />;
    case Role.NURSE:
    case Role.HEAD_NURSE:
      return <Redirect href="/(nurse)" />;
    case Role.RECEPTIONIST:
      return <Redirect href="/(reception)" />;
    case Role.PHARMACIST:
      return <Redirect href="/(pharmacy)" />;
    case Role.LAB_TECHNICIAN:
      return <Redirect href="/(lab)" />;
    case Role.RADIOLOGY_STAFF:
      return <Redirect href="/(radiology)" />;
    case Role.BILLING_STAFF:
    case Role.INSURANCE_STAFF:
    case Role.WARD_MANAGER:
      return <Redirect href="/(billing)" />;
    case Role.AMBULANCE_DRIVER:
    case Role.AMBULANCE_COORDINATOR:
      return <Redirect href="/(ambulance)" />;
    case Role.PATIENT:
      return <Redirect href="/(patient)" />;
    default:
      return <Redirect href="/(doctor)" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});

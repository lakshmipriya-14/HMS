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
      } else {
        switch (user.role) {
          case Role.SUPER_ADMIN:
          case Role.HOSPITAL_ADMIN:
          case Role.DEPARTMENT_ADMIN:
            router.replace('/(admin)');
            break;
          case Role.DOCTOR:
            router.replace('/(doctor)');
            break;
          case Role.NURSE:
          case Role.HEAD_NURSE:
            router.replace('/(nurse)');
            break;
          case Role.RECEPTIONIST:
            router.replace('/(reception)');
            break;
          case Role.PHARMACIST:
            router.replace('/(pharmacy)');
            break;
          case Role.LAB_TECHNICIAN:
            router.replace('/(lab)');
            break;
          case Role.RADIOLOGY_STAFF:
            router.replace('/(radiology)');
            break;
          case Role.BILLING_STAFF:
          case Role.INSURANCE_STAFF:
          case Role.WARD_MANAGER:
            router.replace('/(billing)');
            break;
          case Role.AMBULANCE_DRIVER:
          case Role.AMBULANCE_COORDINATOR:
            router.replace('/(ambulance)');
            break;
          case Role.PATIENT:
            router.replace('/(patient)');
            break;
          default:
            router.replace('/(doctor)');
            break;
        }
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

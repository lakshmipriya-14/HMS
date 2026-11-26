import { patientColors } from '../../components/PatientPortal';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, FileText, CreditCard, Bell, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { Home, Calendar, FileText, CreditCard, User } from 'lucide-react-native';

export default function PatientTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(patient)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: UyirinaiTheme.colors.white },
          headerTintColor: UyirinaiTheme.colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: UyirinaiTheme.colors.textPrimary },
          tabBarActiveTintColor: UyirinaiTheme.colors.primary,
          tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
            backgroundColor: UyirinaiTheme.colors.white,
            borderTopWidth: 1,
            borderTopColor: UyirinaiTheme.colors.borderLight,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
          headerStyle: { backgroundColor: patientColors.green },
          headerTintColor: '#fff',
          tabBarActiveTintColor: patientColors.green,
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Records',
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="billing"
          options={{
            title: 'Bills',
            tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


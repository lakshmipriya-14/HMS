import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Clock,
  UserPlus,
  Calendar,
  User,
  Bell,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function ReceptionTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(reception)">
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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="queue"
          options={{
            title: 'Live Queue',
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            title: 'Register',
            tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
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
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />

        {/* Sub-screens with direct router navigation */}
        <Tabs.Screen
          name="search"
          options={{
            href: null,
            title: 'Patient Directory Lookup',
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            href: null,
            title: 'Patient Arrival Check-In',
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            href: null,
            title: 'Doctor Schedules & OPD Hours',
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null,
            title: 'Reception Daily Analytics',
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}

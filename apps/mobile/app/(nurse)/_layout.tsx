import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Pill, User, HeartPulse, RotateCcw, UserCheck, BellRing } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';

export default function NurseTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(nurse)">
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
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'MAR',
            tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        {/* Clinical Sub-screens with header and deep links */}
        <Tabs.Screen
          name="vitals"
          options={{
            href: null,
            title: 'Clinical Vitals Charting',
            headerLeft: () => <HeaderBackButton fallbackHref="/(nurse)" />,
          }}
        />
        <Tabs.Screen
          name="handover"
          options={{
            href: null,
            title: 'Shift Handover Protocol',
            headerLeft: () => <HeaderBackButton fallbackHref="/(nurse)" />,
          }}
        />
        <Tabs.Screen
          name="supervisor"
          options={{
            href: null,
            title: 'Head Nurse Supervision',
            headerLeft: () => <HeaderBackButton fallbackHref="/(nurse)" />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            title: 'Nurse Alerts & Notifications',
            headerLeft: () => <HeaderBackButton fallbackHref="/(nurse)" />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


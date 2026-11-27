import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, CreditCard, Home, LayoutDashboard } from 'lucide-react-native';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import {
  PatientHeaderRight,
  PatientProfileMenuProvider,
} from '../../components/PatientHeaderRight';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';
import { UyirinaiTheme } from '../../constants/theme';

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 10);
  const tabHeight = 56 + bottomInset;

  return (
    <WorkspaceGate home="/(patient)">
      <PatientProfileMenuProvider>
        <Tabs
          initialRouteName="index"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: UyirinaiTheme.colors.white,
              borderBottomWidth: 1,
              borderBottomColor: UyirinaiTheme.colors.borderLight,
            },
            headerTintColor: UyirinaiTheme.colors.textPrimary,
            headerTitleAlign: 'left',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 17,
              color: UyirinaiTheme.colors.textPrimary,
            },
            headerRight: () => <PatientHeaderRight />,
            tabBarActiveTintColor: UyirinaiTheme.colors.primary,
            tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
            tabBarStyle: {
              height: tabHeight,
              paddingBottom: bottomInset,
              paddingTop: 6,
              backgroundColor: UyirinaiTheme.colors.white,
              borderTopWidth: 1,
              borderTopColor: UyirinaiTheme.colors.borderLight,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 8,
            },
            tabBarItemStyle: {
              minHeight: 48,
              paddingVertical: 2,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              marginBottom: 2,
            },
          }}
        >
          {/* Bottom Left: Main Hospital Website Home */}
          <Tabs.Screen
            name="main-home"
            options={{
              title: 'Main Home',
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />

          {/* Dashboard: Logged-in Patient Portal Home */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              headerTitle: 'Patient Dashboard',
              tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            }}
          />

          {/* Active Appointments */}
          <Tabs.Screen
            name="appointments"
            options={{
              title: 'Appointments',
              headerTitle: 'Active Appointments',
              tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
            }}
          />

          {/* Bottom Right: Payment History */}
          <Tabs.Screen
            name="billing"
            options={{
              title: 'Payments',
              headerTitle: 'Payment History',
              tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
            }}
          />

          {/* Hidden routes (accessible via top profile popup / dashboard actions) */}
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              headerTitle: 'Patient Profile',
              href: null,
              headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
            }}
          />
          <Tabs.Screen
            name="records"
            options={{
              title: 'Medical History',
              headerTitle: 'Medical History',
              href: null,
              headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Notifications',
              headerTitle: 'Health Alerts',
              href: null,
              headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
            }}
          />
          <Tabs.Screen
            name="book-appointment"
            options={{
              title: 'Book Appointment',
              headerTitle: 'Schedule Consultation',
              href: null,
              headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
            }}
          />
          <Tabs.Screen
            name="logout"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </PatientProfileMenuProvider>
    </WorkspaceGate>
  );
}

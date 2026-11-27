import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import {
  Calendar,
  Clock,
  Home,
  LayoutDashboard,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UyirinaiTheme } from '../../constants/theme';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';
import {
  ReceptionHeaderRight,
  ReceptionOverlayProvider,
} from '../../components/ReceptionHeaderRight';

export default function ReceptionTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 8 : 10);
  const tabHeight = 56 + bottomInset;

  return (
    <WorkspaceGate home="/(reception)">
      <ReceptionOverlayProvider>
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
            headerRight: () => <ReceptionHeaderRight />,
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
          {/* 1. Main Home (Actual Main HMS Homepage) */}
          <Tabs.Screen
            name="main-home"
            options={{
              title: 'Main Home',
              headerShown: false,
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />

          {/* 2. Receptionist Dashboard */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              headerTitle: 'Reception Dashboard',
              tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            }}
          />

          {/* 3. OPD Live Queue */}
          <Tabs.Screen
            name="queue"
            options={{
              title: 'Live Queue',
              headerTitle: 'OPD Live Queue',
              tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
            }}
          />

          {/* 4. Appointment Management & Walk-in Booking */}
          <Tabs.Screen
            name="appointments"
            options={{
              title: 'Appointments',
              headerTitle: 'Appointments',
              tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
            }}
          />

          {/* Hidden Sub-screens (routable, not shown in bottom bar) */}
          <Tabs.Screen
            name="profile"
            options={{
              href: null,
              title: 'Receptionist Profile',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              href: null,
              title: 'Notifications',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="register"
            options={{
              href: null,
              title: 'Patient Registration',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              href: null,
              title: 'Patient Directory Lookup',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="checkin"
            options={{
              href: null,
              title: 'Patient Arrival Check-In',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="doctors"
            options={{
              href: null,
              title: 'Doctor Schedules & OPD Hours',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              href: null,
              title: 'Reception Daily Analytics',
              headerLeft: () => <HeaderBackButton fallbackHref="/(reception)" />,
            }}
          />
        </Tabs>
      </ReceptionOverlayProvider>
    </WorkspaceGate>
  );
}

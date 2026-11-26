import React from 'react';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  BedDouble,
  Menu,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function AdminTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(admin)">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: UyirinaiTheme.colors.primary,
          tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
            backgroundColor: UyirinaiTheme.colors.white,
            borderTopWidth: 1,
            borderTopColor: UyirinaiTheme.colors.borderLight,
            elevation: 4,
            shadowColor: UyirinaiTheme.colors.primaryDark,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Executive',
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="departments"
          options={{
            title: 'Departments',
            tabBarIcon: ({ color }) => <Building2 color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            title: 'Doctors',
            tabBarIcon: ({ color }) => <UserCheck color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="operations"
          options={{
            title: 'Operations',
            tabBarIcon: ({ color }) => <BedDouble color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Menu color={color} size={20} />,
          }}
        />

        {/* Sub-screens (hidden from tab bar) */}
        <Tabs.Screen name="opd" options={{ href: null }} />
        <Tabs.Screen name="ipd" options={{ href: null }} />
        <Tabs.Screen name="staff" options={{ href: null }} />
        <Tabs.Screen name="wards" options={{ href: null }} />
        <Tabs.Screen name="approvals" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="fleet" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </WorkspaceGate>
  );
}

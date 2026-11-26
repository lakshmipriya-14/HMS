import React from 'react';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, UserCheck, BarChart3, Menu } from 'lucide-react-native';
import { UyirinaiTheme } from '../../constants/theme';
import { Platform } from 'react-native';

export default function SuperAdminTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(super-admin)">
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
            title: 'Home',
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="branches"
          options={{
            title: 'Branches',
            tabBarIcon: ({ color }) => <Building2 color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="admins"
          options={{
            title: 'Admins',
            tabBarIcon: ({ color }) => <UserCheck color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => <BarChart3 color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Menu color={color} size={20} />,
          }}
        />

        <Tabs.Screen name="[section]" options={{ href: null }} />
        <Tabs.Screen name="profile-security" options={{ href: null }} />
      </Tabs>
    </WorkspaceGate>
  );
}


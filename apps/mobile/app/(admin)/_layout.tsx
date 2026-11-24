import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, User } from 'lucide-react-native';

export default function AdminTabsLayout() {
  return (
    <WorkspaceGate home="/(admin)">
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1E293B' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Executive',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="departments"
        options={{
          title: 'Departments',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
    </WorkspaceGate>
  );
}


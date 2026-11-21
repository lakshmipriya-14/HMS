import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { UserPlus, Clock, User } from 'lucide-react-native';

export default function ReceptionTabsLayout() {
  return (
    <WorkspaceGate home="/(reception)">
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0284C7' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'OPD Tokens',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Walk-In Register',
          tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Reception Desk',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
    </WorkspaceGate>
  );
}

import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Pill, Boxes, User } from 'lucide-react-native';

export default function PharmacyTabsLayout() {
  return (
    <WorkspaceGate home="/(pharmacy)">
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#7C3AED' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dispensing Queue',
          tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Stock & Batches',
          tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Pharmacist',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
    </WorkspaceGate>
  );
}

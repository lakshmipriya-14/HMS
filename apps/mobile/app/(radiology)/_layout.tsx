import React from 'react';
import { Tabs } from 'expo-router';
import { Scan, User } from 'lucide-react-native';

export default function RadiologyTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#475569' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Imaging Scans',
          tabBarIcon: ({ color, size }) => <Scan color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Radiologist',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

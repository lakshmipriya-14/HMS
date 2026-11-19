import React from 'react';
import { Tabs } from 'expo-router';
import { Stethoscope, Users, FileText, User } from 'lucide-react-native';

export default function DoctorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0F766E' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'OPD Queue',
          tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Inpatients',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Rx Pad',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, FileText, CreditCard, Bell, User } from 'lucide-react-native';

export default function PatientTabsLayout() {
  return (
    <WorkspaceGate home="/(patient)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0F766E' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#0F766E',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home & SOS',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Records & Rx',
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="billing"
          options={{
            title: 'Pay & Claims',
            tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'UHID & Vitals',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}

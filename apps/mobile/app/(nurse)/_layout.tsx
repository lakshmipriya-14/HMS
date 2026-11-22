import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, CheckSquare, Pill, User, HeartPulse, RotateCcw, UserCheck, BellRing } from 'lucide-react-native';

export default function NurseTabsLayout() {
  return (
    <WorkspaceGate home="/(nurse)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#B5121B' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#B5121B',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'MAR',
            tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        {/* Clinical Sub-screens with header and deep links */}
        <Tabs.Screen
          name="vitals"
          options={{
            href: null,
            title: 'Clinical Vitals Charting',
          }}
        />
        <Tabs.Screen
          name="handover"
          options={{
            href: null,
            title: 'Shift Handover Protocol',
          }}
        />
        <Tabs.Screen
          name="supervisor"
          options={{
            href: null,
            title: 'Head Nurse Supervision',
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            title: 'Nurse Alerts & Notifications',
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}

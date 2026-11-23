import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import {
  Stethoscope,
  Users,
  Scissors,
  FileText,
  Pill,
  Calendar,
  User,
} from 'lucide-react-native';

export default function DoctorTabsLayout() {
  return (
    <WorkspaceGate home="/(doctor)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0F766E' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#0F766E',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
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
          name="surgery"
          options={{
            title: 'Surgery OT',
            tabBarIcon: ({ color, size }) => <Scissors color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="prescriptions"
          options={{
            title: 'Rx Pad',
            tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
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
    </WorkspaceGate>
  );
}

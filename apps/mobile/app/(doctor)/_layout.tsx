import { UyirinaiTheme } from '../../constants/theme';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { SuperAdminHeader } from '../../components/SuperAdminHeader';
import { Tabs } from 'expo-router';
import {
  Stethoscope,
  House,
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
          header: ({ options }) => <SuperAdminHeader currentTitle={options.title} home="/(doctor)" />,
          tabBarActiveTintColor: UyirinaiTheme.colors.primary,
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} />,
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
          name="surgery"
          options={{
            title: 'Surgery OT',
            href: null,
            tabBarIcon: ({ color, size }) => <Scissors color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            href: null,
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="prescriptions"
          options={{
            title: 'Rx Pad',
            href: null,
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
        <Tabs.Screen name="patient-history" options={{ title: 'Patient history', href: null }} />
      </Tabs>
    </WorkspaceGate>
  );
}


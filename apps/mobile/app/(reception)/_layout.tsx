import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Clock, UserPlus, Calendar, User, Search, UserCheck, Stethoscope, FileBarChart } from 'lucide-react-native';

export default function ReceptionTabsLayout() {
  return (
    <WorkspaceGate home="/(reception)">
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
          name="queue"
          options={{
            title: 'Live Queue',
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            title: 'Register',
            tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
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
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        {/* Sub-screens with direct router navigation */}
        <Tabs.Screen
          name="search"
          options={{
            href: null,
            title: 'Patient Directory Lookup',
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            href: null,
            title: 'Patient Arrival Check-In',
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            href: null,
            title: 'Doctor Schedules & OPD Hours',
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null,
            title: 'Reception Daily Analytics',
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


import React from 'react';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  BedDouble,
  Menu,
} from 'lucide-react-native';
import { Platform } from 'react-native';

export default function DepartmentAdminTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(department-admin)">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0F766E',
          tabBarInactiveTintColor: '#64748B',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        {/* Main 5 Navigation Tabs */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            title: 'Doctors',
            tabBarIcon: ({ color }) => <UserCheck color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Staff',
            tabBarIcon: ({ color }) => <Users color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="operations"
          options={{
            title: 'Operations',
            tabBarIcon: ({ color }) => <BedDouble color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Menu color={color} size={20} />,
          }}
        />

        {/* Dedicated Module Sub-screens (accessible via routes & shortcuts) */}
        <Tabs.Screen name="info" options={{ href: null }} />
        <Tabs.Screen name="scheduling" options={{ href: null }} />
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="patients" options={{ href: null }} />
        <Tabs.Screen name="appointments" options={{ href: null }} />
        <Tabs.Screen name="opd" options={{ href: null }} />
        <Tabs.Screen name="ipd" options={{ href: null }} />
        <Tabs.Screen name="wards-beds" options={{ href: null }} />
        <Tabs.Screen name="admissions" options={{ href: null }} />
        <Tabs.Screen name="discharges" options={{ href: null }} />
        <Tabs.Screen name="lab-requests" options={{ href: null }} />
        <Tabs.Screen name="radiology-requests" options={{ href: null }} />
        <Tabs.Screen name="diagnostics" options={{ href: null }} />
        <Tabs.Screen name="equipment" options={{ href: null }} />
        <Tabs.Screen name="inventory" options={{ href: null }} />
        <Tabs.Screen name="leaves" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="resource-requests" options={{ href: null }} />
        <Tabs.Screen name="purchase-requests" options={{ href: null }} />
        <Tabs.Screen name="maintenance-requests" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="approvals-hub" options={{ href: null }} />
        <Tabs.Screen name="activity-history" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="requests" options={{ href: null }} />
      </Tabs>
    </WorkspaceGate>
  );
}

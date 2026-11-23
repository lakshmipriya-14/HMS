import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Scan, ShieldCheck, FileText, User } from 'lucide-react-native';

export default function RadiologyTabsLayout() {
  return (
    <WorkspaceGate home="/(radiology)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#334155' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#0F766E',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Modality Worklist',
            tabBarIcon: ({ color, size }) => <Scan color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="safety"
          options={{
            title: 'Pre-Scan Safety',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Report Release',
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
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
    </WorkspaceGate>
  );
}

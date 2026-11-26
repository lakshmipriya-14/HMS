import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Ambulance, Navigation, HeartPulse, ListOrdered, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function AmbulanceTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(ambulance)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: UyirinaiTheme.colors.white },
          headerTintColor: UyirinaiTheme.colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: UyirinaiTheme.colors.textPrimary },
          tabBarActiveTintColor: UyirinaiTheme.colors.primary,
          tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
            backgroundColor: UyirinaiTheme.colors.white,
            borderTopWidth: 1,
            borderTopColor: UyirinaiTheme.colors.borderLight,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Active Run',
            tabBarIcon: ({ color, size }) => <Ambulance color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="tracker"
          options={{
            title: 'Live Tracker',
            tabBarIcon: ({ color, size }) => <Navigation color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="transit"
          options={{
            title: 'Paramedic Vitals',
            tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trips Log',
            tabBarIcon: ({ color, size }) => <ListOrdered color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Driver Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


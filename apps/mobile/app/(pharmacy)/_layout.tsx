import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { Pill, Boxes, RotateCcw, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function PharmacyTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(pharmacy)">
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
            title: 'Dispense Queue',
            tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Stock & Expiry',
            tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="returns"
          options={{
            title: 'Returns & Wastage',
            tabBarIcon: ({ color, size }) => <RotateCcw color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Pharmacist',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { FlaskConical, QrCode, AlertTriangle, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function LabTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(lab)">
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
            title: 'Worklist',
            tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="samples"
          options={{
            title: 'Accessioning',
            tabBarIcon: ({ color, size }) => <QrCode color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Panic Alerts',
            tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Lab Tech',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGate>
  );
}


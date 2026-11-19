import React from 'react';
import { Tabs } from 'expo-router';
import { FlaskConical, QrCode, User } from 'lucide-react-native';

export default function LabTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#EA580C' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#EA580C',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
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
        name="profile"
        options={{
          title: 'Lab Tech',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

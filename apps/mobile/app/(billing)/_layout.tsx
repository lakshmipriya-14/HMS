import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, BedDouble, User } from 'lucide-react-native';

export default function BillingTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cashier & Bills',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="beds"
        options={{
          title: 'Bed Census',
          tabBarIcon: ({ color, size }) => <BedDouble color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cashier',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

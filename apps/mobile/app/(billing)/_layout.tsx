import { WorkspaceGate } from '../../components/WorkspaceGate';
import React from 'react';
import { Tabs } from 'expo-router';
import { CreditCard, CheckCircle2, ShieldCheck, BedDouble, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { UyirinaiTheme } from '../../constants/theme';

export default function BillingTabsLayout() {
  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  return (
    <WorkspaceGate home="/(billing)">
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
            title: 'Cashier & Bills',
            tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="clearance"
          options={{
            title: 'Discharge Clearance',
            tabBarIcon: ({ color, size }) => <CheckCircle2 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="insurance"
          options={{
            title: 'TPA & Insurance',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
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
    </WorkspaceGate>
  );
}


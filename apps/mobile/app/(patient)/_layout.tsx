import React, { useState } from 'react';
import { Alert, Platform, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Calendar, Home, LogOut, User } from 'lucide-react-native';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { PatientHeaderRight } from '../../components/PatientHeaderRight';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { HeaderBackButton } from '../../components/ui/HeaderBackButton';
import { UyirinaiTheme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function PatientTabsLayout() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const bottomInset = Platform.OS === 'web' ? 10 : 12;
  const tabHeight = Platform.OS === 'web' ? 64 : 70;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutConfirm(true);
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to sign out of your UYIRINAI patient portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    }
  };

  return (
    <WorkspaceGate home="/(patient)">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: UyirinaiTheme.colors.white,
            borderBottomWidth: 1,
            borderBottomColor: UyirinaiTheme.colors.borderLight,
          },
          headerTintColor: UyirinaiTheme.colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: UyirinaiTheme.colors.textPrimary,
          },
          headerRight: () => <PatientHeaderRight />,
          tabBarActiveTintColor: UyirinaiTheme.colors.primary,
          tabBarInactiveTintColor: UyirinaiTheme.colors.textMuted,
          tabBarStyle: {
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 8,
            backgroundColor: UyirinaiTheme.colors.white,
            borderTopWidth: 1,
            borderTopColor: UyirinaiTheme.colors.borderLight,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 2,
          },
        }}
      >
        {/* Bottom Left: Full Profile Details */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'Patient Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        {/* Home: First Page / Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'UYIRINAI Health',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />

        {/* Middle: Appointment Details (Unmet / Active Appointments) */}
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            headerTitle: 'Active Appointments',
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />

        {/* Bottom Right: Logout */}
        <Tabs.Screen
          name="logout"
          options={{
            title: 'Logout',
            tabBarIcon: ({ color, size }) => <LogOut color={color} size={size} />,
            tabBarButton: (props) => (
              <Pressable {...(props as any)} onPress={handleLogout} />
            ),
          }}
        />

        {/* Hidden subpages accessed via buttons/header */}
        <Tabs.Screen
          name="records"
          options={{
            title: 'Medical History',
            headerTitle: 'Medical History',
            href: null,
            headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
          }}
        />
        <Tabs.Screen
          name="billing"
          options={{
            title: 'Payment History',
            headerTitle: 'Payment & Billing',
            href: null,
            headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            headerTitle: 'Health Alerts',
            href: null,
            headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
          }}
        />
        <Tabs.Screen
          name="book-appointment"
          options={{
            title: 'Book Appointment',
            headerTitle: 'Schedule Consultation',
            href: null,
            headerLeft: () => <HeaderBackButton fallbackHref="/(patient)" />,
          }}
        />
      </Tabs>

      {/* Web Logout Confirmation Modal */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your UYIRINAI patient portal?"
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        destructive={true}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
          router.replace('/(auth)/login');
        }}
      />
    </WorkspaceGate>
  );
}

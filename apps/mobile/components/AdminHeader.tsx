import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HeartPulse, Bell, ShieldCheck, LogOut, ChevronRight, X } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { UyirinaiTheme } from '../constants/theme';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  alertsCount?: number;
  rightAction?: React.ReactNode;
}

export function AdminHeader({
  title = 'Executive Hospital Command',
  subtitle = 'Uyirinai Multispeciality Hospital',
  alertsCount = 0,
  rightAction,
}: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Hospital Admin';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View style={styles.iconCircle}>
            <HeartPulse size={20} color={UyirinaiTheme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {subtitle ? <Text style={styles.hospitalText} numberOfLines={1}>{subtitle}</Text> : null}
            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {rightAction}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(admin)/approvals')}
          >
            <Bell size={20} color={UyirinaiTheme.colors.textPrimary} />
            {alertsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{alertsCount > 9 ? '9+' : alertsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => setMenuVisible(true)}
          >
            <ShieldCheck size={18} color={UyirinaiTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>{displayName}</Text>
                <Text style={styles.modalEmail}>{user?.email || 'admin@uyirinai.test'}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{user?.role || 'HOSPITAL_ADMIN'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <X size={20} color={UyirinaiTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/(admin)/profile');
              }}
            >
              <ShieldCheck size={18} color={UyirinaiTheme.colors.primary} />
              <Text style={styles.menuItemText}>Admin Profile & Credentials</Text>
              <ChevronRight size={16} color={UyirinaiTheme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/(admin)/reports');
              }}
            >
              <Text style={[styles.menuItemText, { marginLeft: 26 }]}>Analytics & Reports</Text>
              <ChevronRight size={16} color={UyirinaiTheme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <LogOut size={18} color={UyirinaiTheme.colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 14 : 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  hospitalText: {
    fontSize: 10,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: UyirinaiTheme.colors.error,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: UyirinaiTheme.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 53, 44, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 60 : 90,
    paddingRight: 16,
  },
  modalContent: {
    width: 290,
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.border,
    shadowColor: UyirinaiTheme.colors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalName: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  modalEmail: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primaryDark,
  },
  modalDivider: {
    height: 1,
    backgroundColor: UyirinaiTheme.colors.borderLight,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textPrimary,
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
    marginTop: 6,
    paddingTop: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.error,
  },
});

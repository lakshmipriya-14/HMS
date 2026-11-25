import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
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
}

export function AdminHeader({
  title = 'Executive Hospital Command',
  subtitle = 'Uyirinai Multispeciality Hospital',
  alertsCount = 0,
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
            <HeartPulse size={20} color="#0F766E" />
          </View>
          <View>
            <Text style={styles.hospitalText}>{subtitle}</Text>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(admin)/approvals')}
          >
            <Bell size={20} color="#FFFFFF" />
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
            <ShieldCheck size={18} color="#0F766E" />
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
                <X size={20} color="#64748B" />
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
              <ShieldCheck size={18} color="#0F766E" />
              <Text style={styles.menuItemText}>Admin Profile & Credentials</Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/(admin)/reports');
              }}
            >
              <Text style={[styles.menuItemText, { marginLeft: 26 }]}>Analytics & Reports</Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <LogOut size={18} color="#DC2626" />
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 14 : 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14B8A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F766E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 60 : 90,
    paddingRight: 16,
  },
  modalContent: {
    width: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: '#CCFBF1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
    color: '#334155',
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    marginTop: 6,
    paddingTop: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});

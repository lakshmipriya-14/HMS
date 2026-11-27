import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  BarChart3,
  History,
  Bell,
  FlaskConical,
  Scan,
  Stethoscope,
  Wrench,
  Pill,
  Layers,
  ShoppingCart,
  Hammer,
  CalendarOff,
  CheckSquare,
  Megaphone,
  User,
  KeyRound,
  LogOut,
  ChevronRight,
  ShieldCheck,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AdminHeader } from '../../components/AdminHeader';
import { mobileApiClient } from '../../services/api';

export default function DepartmentAdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Password Modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordErr('Please fill in both current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match');
      return;
    }
    try {
      setSavingPassword(true);
      setPasswordErr('');
      await mobileApiClient.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMsg('');
        setPasswordModal(false);
      }, 2000);
    } catch (err: any) {
      setPasswordErr(err?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const sections = [
    {
      title: 'DEPARTMENT ADMINISTRATION',
      items: [
        {
          title: 'Department Information',
          desc: 'Code, working hours, capacity & HOD',
          icon: Building2,
          route: '/(department-admin)/info',
          color: '#1565C0',
        },
        {
          title: 'Department Reports',
          desc: 'OPD/IPD census, doctor volume & metrics',
          icon: BarChart3,
          route: '/(department-admin)/reports',
          color: '#1565C0',
        },
        {
          title: 'Activity History',
          desc: 'Chronological department operational audit log',
          icon: History,
          route: '/(department-admin)/activity-history',
          color: '#475569',
        },
        {
          title: 'Notifications',
          desc: 'Department notices & system alerts',
          icon: Bell,
          route: '/(department-admin)/notifications',
          color: '#F59E0B',
        },
      ],
    },
    {
      title: 'DIAGNOSTIC SERVICES',
      items: [
        {
          title: 'Laboratory Requests',
          desc: 'Specimens, barcodes & released test results',
          icon: FlaskConical,
          route: '/(department-admin)/lab-requests',
          color: '#1565C0',
        },
        {
          title: 'Radiology & Imaging',
          desc: 'X-Ray, CT, MRI, Ultrasound orders & findings',
          icon: Scan,
          route: '/(department-admin)/radiology-requests',
          color: '#1565C0',
        },
        {
          title: 'Other Diagnostic Services',
          desc: 'ECG, Echo, Endoscopy & Special Tests',
          icon: Stethoscope,
          route: '/(department-admin)/diagnostics',
          color: '#1565C0',
        },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        {
          title: 'Equipment Management',
          desc: 'Biomedical asset registry & issue reporting',
          icon: Wrench,
          route: '/(department-admin)/equipment',
          color: '#F59E0B',
        },
        {
          title: 'Department Inventory',
          desc: 'Consumables, drugs & restock indents',
          icon: Pill,
          route: '/(department-admin)/inventory',
          color: '#00897B',
        },
        {
          title: 'Resource Requests',
          desc: 'Requisition additional beds, staff & equipment',
          icon: Layers,
          route: '/(department-admin)/resource-requests',
          color: '#1565C0',
        },
        {
          title: 'Purchase Requests',
          desc: 'Procurement indents & cost estimation',
          icon: ShoppingCart,
          route: '/(department-admin)/purchase-requests',
          color: '#1565C0',
        },
        {
          title: 'Maintenance Requests',
          desc: 'Facility electrical, plumbing & HVAC tickets',
          icon: Hammer,
          route: '/(department-admin)/maintenance-requests',
          color: '#F59E0B',
        },
      ],
    },
    {
      title: 'ADMINISTRATIVE WORKFLOWS',
      items: [
        {
          title: 'Leave Management',
          desc: 'Staff leave review, recommendations & approvals',
          icon: CalendarOff,
          route: '/(department-admin)/leaves',
          color: '#DC2626',
        },
        {
          title: 'Request & Approval Tracking',
          desc: 'Centralized tracking of all department requests',
          icon: CheckSquare,
          route: '/(department-admin)/approvals-hub',
          color: '#1565C0',
        },
        {
          title: 'Department Announcements',
          desc: 'Broadcast memos & administrative notices',
          icon: Megaphone,
          route: '/(department-admin)/notifications',
          color: '#1565C0',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Hub" subtitle="" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push('/(department-admin)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.firstName?.[0] || 'D'}
              {user?.lastName?.[0] || 'A'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userRole}>DEPARTMENT ADMINISTRATOR</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 4 Grouped Sections */}
        {sections.map((sec, idx) => (
          <View key={idx} style={styles.sectionBox}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            <View style={styles.cardGroup}>
              {sec.items.map((item, itemIdx) => {
                const IconComponent = item.icon;
                const isLast = itemIdx === sec.items.length - 1;

                return (
                  <TouchableOpacity
                    key={itemIdx}
                    style={[styles.menuItem, isLast && styles.menuItemLast]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                      <IconComponent size={20} color={item.color} />
                    </View>
                    <View style={styles.menuTextCol}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDesc}>{item.desc}</Text>
                    </View>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* ACCOUNT Section */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(department-admin)/profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#38845A15' }]}>
                <User size={20} color="#1565C0" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Admin Profile</Text>
                <Text style={styles.menuDesc}>View account details & contact information</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setPasswordModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#7C3AED15' }]}>
                <KeyRound size={20} color="#1565C0" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuDesc}>Update security credentials</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#DC262615' }]}>
                <LogOut size={20} color="#DC2626" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Sign Out</Text>
                <Text style={styles.menuDesc}>End active mobile session</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Account Password</Text>
              <TouchableOpacity onPress={() => setPasswordModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {passwordMsg ? (
                <View style={styles.successToast}>
                  <CheckCircle2 size={16} color="#00897B" />
                  <Text style={styles.successToastText}>{passwordMsg}</Text>
                </View>
              ) : null}

              {passwordErr ? <Text style={styles.errorText}>{passwordErr}</Text> : null}

              <Text style={styles.inputLabel}>Current Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <Text style={styles.inputLabel}>New Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.inputLabel}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPasswordModal(false)}
                disabled={savingPassword}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#183153',
  },
  userRole: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionBox: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#183153',
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183153',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#183153',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
    fontWeight: '600',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  successToastText: {
    fontSize: 12,
    color: '#183153',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  LogOut,
  ChevronLeft,
  KeyRound,
  Building,
  Mail,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [pwdModal, setPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      Alert.alert('Required Fields', 'Please enter your current and new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setPwdModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully. Please log in with your new credentials.');
      await handleLogout();
    } catch (err: any) {
      Alert.alert('Password Error', err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'Hospital Administrator';

  return (
    <View style={styles.container}>
      <AdminHeader title="Administrator Profile" subtitle="Identity & Governance" />

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color="#0F766E" />
          </View>
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.sub}>{user?.email || 'hospital_admin@demo.uyirinai.test'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{user?.role || 'HOSPITAL_ADMIN'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Building size={14} color="#64748B" />
            <Text style={styles.metaLabel}>Hospital Branch:</Text>
            <Text style={styles.metaVal}>{user?.branchId || 'Aalayam Main Hospital'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Mail size={14} color="#64748B" />
            <Text style={styles.metaLabel}>Registered Email:</Text>
            <Text style={styles.metaVal}>{user?.email}</Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => setPwdModal(true)}>
          <KeyRound size={18} color="#0F766E" />
          <Text style={styles.actionBtnText}>Update Account Password</Text>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Executive Console</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal visible={pwdModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Change Admin Password</Text>
              <TouchableOpacity onPress={() => setPwdModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.fieldInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.fieldInput}
              secureTextEntry
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.fieldInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleChangePassword}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Update Password & Sign Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  roleTag: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  roleTagText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

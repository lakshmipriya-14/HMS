import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Radio,
  Bell,
  PhoneCall,
  Save,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Password Modal
  const [pwdModal, setPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hospital Settings Modal
  const [settingsModal, setSettingsModal] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState('044-24567890');
  const [hotline, setHotline] = useState('108');
  const [hospitalEmail, setHospitalEmail] = useState('contact@uyirinai.test');

  // Broadcast Modal
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');

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

  const handleSaveSettings = async () => {
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateHospitalSettings('default', {
        contactPhone: emergencyPhone,
        emergencyHotline: hotline,
        email: hospitalEmail,
      });
      setSettingsModal(false);
      Alert.alert('Success', 'Hospital emergency settings updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      Alert.alert('Required Fields', 'Please provide broadcast title and announcement message.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.broadcastAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: 'ALL',
      });
      setBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      Alert.alert('Broadcast Sent', 'Announcement transmitted to all staff on duty.');
    } catch (err: any) {
      Alert.alert('Broadcast Failed', err.message || 'Failed to send announcement');
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color="#38845A" />
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

        {/* Executive Quick Actions */}
        <Text style={styles.sectionHeader}>Executive Administration</Text>

        {/* Broadcast Announcement Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setBroadcastModal(true)}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Bell size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionBtnTitle}>Staff Broadcast Alert</Text>
            <Text style={styles.actionBtnSub}>Push immediate notification to all active hospital staff</Text>
          </View>
        </TouchableOpacity>

        {/* Emergency Hotline Settings Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setSettingsModal(true)}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#EAF5ED' }]}>
            <PhoneCall size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionBtnTitle}>Emergency Hotline & Contacts</Text>
            <Text style={styles.actionBtnSub}>Configure 108 hotlines & clinical contact desk</Text>
          </View>
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setPwdModal(true)}
        >
          <View style={[styles.actionIconBox, { backgroundColor: '#EAF5ED' }]}>
            <KeyRound size={18} color="#38845A" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.actionBtnTitle}>Update Account Password</Text>
            <Text style={styles.actionBtnSub}>Rotate your administrator credential securely</Text>
          </View>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Executive Console</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Broadcast Announcement Modal */}
      <Modal visible={broadcastModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Broadcast Staff Announcement</Text>
              <TouchableOpacity onPress={() => setBroadcastModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Announcement Title</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Code Blue Drill at 3:00 PM"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />

            <Text style={styles.fieldLabel}>Message Content</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80 }]}
              placeholder="Detailed instructions for on-duty workforce..."
              multiline
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
            />

            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              {(['NORMAL', 'HIGH', 'CRITICAL'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.chip,
                    broadcastPriority === p && styles.chipActive,
                  ]}
                  onPress={() => setBroadcastPriority(p)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      broadcastPriority === p && styles.chipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleBroadcast}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Send Live Broadcast</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hospital Settings Modal */}
      <Modal visible={settingsModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Hospital Emergency Contacts</Text>
              <TouchableOpacity onPress={() => setSettingsModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Emergency 108 / Ambulance Hotline</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="108"
              value={hotline}
              onChangeText={setHotline}
            />

            <Text style={styles.fieldLabel}>Hospital Clinical Reception Desk</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="044-24567890"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
            />

            <Text style={styles.fieldLabel}>Administrative Email</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="contact@uyirinai.test"
              keyboardType="email-address"
              value={hospitalEmail}
              onChangeText={setHospitalEmail}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSaveSettings}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Emergency Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
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
    backgroundColor: '#EAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 3 },
  roleTag: {
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleTagText: { fontSize: 11, fontWeight: '800', color: '#38845A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', width: '100%', marginVertical: 14 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  metaLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  metaVal: { fontSize: 12, color: '#0F172A', fontWeight: '700', marginLeft: 'auto' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EAF5ED',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
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
    maxHeight: '90%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#38845A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { User, ShieldCheck, Lock, CheckCircle2, Phone, Mail, Building2 } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentAdminProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [passError, setPassError] = useState('');

  const loadProfile = async () => {
    try {
      const res = await mobileApiClient.departmentAdmin.getProfile();
      if (res.data) {
        setProfile(res.data);
        setPhone(res.data.phone || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdatePhone = async () => {
    try {
      setSavingPhone(true);
      await mobileApiClient.departmentAdmin.updateProfile({ phone });
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update phone:', err);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    setPassError('');
    setPassSaved(false);
    if (newPassword.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    try {
      setChangingPass(true);
      await mobileApiClient.departmentAdmin.changePassword({ currentPassword, newPassword });
      setPassSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSaved(false), 3000);
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38845A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader title="Account Profile" subtitle="Credentials & Security" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.firstName?.[0] || 'D'}
                {profile?.lastName?.[0] || 'A'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.firstName} {profile?.lastName}
              </Text>
              <Text style={styles.profileRole}>DEPARTMENT ADMIN</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Building2 size={14} color="#38845A" />
            <Text style={styles.metaText}>
              Assigned Dept: {profile?.department?.name || 'Department'}
            </Text>
          </View>
        </View>

        {/* Contact Info Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Contact Details</Text>
          {phoneSaved && (
            <View style={styles.successBox}>
              <CheckCircle2 size={14} color="#38845A" />
              <Text style={styles.successText}>Phone number updated successfully</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Mobile Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity
            style={[styles.saveBtn, savingPhone && { opacity: 0.6 }]}
            onPress={handleUpdatePhone}
            disabled={savingPhone}
          >
            <Text style={styles.saveBtnText}>{savingPhone ? 'Saving...' : 'Update Contact'}</Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Change Password</Text>

          {passSaved && (
            <View style={styles.successBox}>
              <CheckCircle2 size={14} color="#38845A" />
              <Text style={styles.successText}>Password updated successfully</Text>
            </View>
          )}

          {passError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{passError}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Min 8 characters"
            placeholderTextColor="#94A3B8"
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#334155' }, changingPass && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={changingPass}
          >
            <Text style={styles.saveBtnText}>{changingPass ? 'Updating...' : 'Change Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38845A',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38845A',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF5ED',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  successText: {
    fontSize: 11,
    color: '#38845A',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#EAF5ED',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
});

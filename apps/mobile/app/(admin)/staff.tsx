import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Users,
  Search,
  Plus,
  Shield,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

const ROLES = [
  'ALL',
  'NURSE',
  'RECEPTIONIST',
  'PHARMACIST',
  'LAB_TECHNICIAN',
  'RADIOLOGY_STAFF',
  'ACCOUNTANT',
  'AMBULANCE_COORDINATOR',
];

export default function AdminStaffScreen() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Add modal
  const [addModal, setAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Staff@123');
  const [formRole, setFormRole] = useState('NURSE');
  const [formDeptId, setFormDeptId] = useState('');
  const [formDesig, setFormDesig] = useState('');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [staffRes, deptRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getStaff(),
        mobileApiClient.hospitalAdmin.getDepartments(),
      ]);
      if (staffRes.data) setStaff(staffRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await mobileApiClient.hospitalAdmin.toggleStaffStatus(id);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle account status');
    }
  };

  const handleAddStaff = async () => {
    if (!formName || !formEmail) {
      Alert.alert('Required Fields', 'Please enter employee name and email.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createStaff({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        departmentId: formDeptId || undefined,
        designation: formDesig || formRole,
      });
      setAddModal(false);
      setFormName('');
      setFormEmail('');
      await loadData();
      Alert.alert('Success', 'Staff member provisioned successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = staff.filter((s) => {
    const roleMatches =
      selectedRole === 'ALL' ||
      s.role === selectedRole ||
      s.userRoles?.some((r: any) => r.role === selectedRole || r.role?.name === selectedRole);
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const searchMatches =
      fullName.includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());
    return roleMatches && searchMatches;
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Staff & HR Directory" subtitle="Hospital Workforce" />

      {/* Back button & Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/more')}
        >
          <ChevronLeft size={20} color="#0F766E" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
            onPress={() => setSelectedRole(role)}
          >
            <Text
              style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}
            >
              {role.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#0F766E" />
          }
        >
          {filtered.map((user) => {
            const role = user.role || user.userRoles?.[0]?.role?.name || user.userRoles?.[0]?.role || 'STAFF';
            const staffName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            return (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {staffName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.userName}>{staffName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleTagText}>{role.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBtn,
                      { backgroundColor: user.isActive ? '#D1FAE5' : '#FEE2E2' },
                    ]}
                    onPress={() => handleToggleStatus(user.id)}
                  >
                    <Text
                      style={[
                        styles.statusBtnText,
                        { color: user.isActive ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Staff Modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Provision Staff Member</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="R. Kavitha"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="kavitha@uyirinai.test"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formEmail}
                onChangeText={setFormEmail}
              />

              <Text style={styles.fieldLabel}>Role Assignment</Text>
              <View style={styles.roleGrid}>
                {ROLES.filter((r) => r !== 'ALL').map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleSelectChip, formRole === r && styles.roleSelectChipActive]}
                    onPress={() => setFormRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleSelectChipText,
                        formRole === r && styles.roleSelectChipTextActive,
                      ]}
                    >
                      {r.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Department Assignment</Text>
              <View style={styles.roleGrid}>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.roleSelectChip, formDeptId === d.id && styles.roleSelectChipActive]}
                    onPress={() => setFormDeptId(d.id)}
                  >
                    <Text
                      style={[
                        styles.roleSelectChipText,
                        formDeptId === d.id && styles.roleSelectChipTextActive,
                      ]}
                    >
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddStaff}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Provision Account</Text>
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
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: '#0F766E',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 50,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  roleChipActive: {
    backgroundColor: '#0F766E',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F766E',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  roleTag: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  roleSelectChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleSelectChipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  roleSelectChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  roleSelectChipTextActive: {
    color: '#0F766E',
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

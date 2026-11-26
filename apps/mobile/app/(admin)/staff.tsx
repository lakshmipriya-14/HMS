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
  Edit2,
  KeyRound,
  Power,
  CheckSquare,
  Square,
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
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [resetModal, setResetModal] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Staff@123');
  const [formRole, setFormRole] = useState('NURSE');
  const [formDeptId, setFormDeptId] = useState('');
  const [formDesig, setFormDesig] = useState('');

  // Edit states
  const [editDesig, setEditDesig] = useState('');
  const [editDeptId, setEditDeptId] = useState('');

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

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    Alert.alert(
      currentStatus ? 'Suspend Account' : 'Activate Account',
      `Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} ${name}'s login access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentStatus ? 'Suspend' : 'Activate',
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await mobileApiClient.hospitalAdmin.toggleStaffStatus(id);
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to toggle account status');
            }
          },
        },
      ]
    );
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      isActive ? 'Bulk Activate' : 'Bulk Deactivate',
      `Update login status for ${selectedIds.length} selected employee(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.bulkUpdateStaffStatus(selectedIds, isActive);
              setSelectedIds([]);
              setSelectionMode(false);
              await loadData();
              Alert.alert('Success', `Updated status for ${selectedIds.length} employee accounts.`);
            } catch (err: any) {
              Alert.alert('Bulk Action Failed', err.message || 'Failed to update accounts');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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

  const handleEditStaff = async () => {
    if (!editModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateStaff(editModal.id, {
        designation: editDesig,
        departmentId: editDeptId || undefined,
      });
      setEditModal(null);
      await loadData();
      Alert.alert('Updated', 'Employee details saved.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.resetStaffPassword(
        resetModal.id,
        newPassword || undefined
      );
      setResetModal(null);
      setNewPassword('');
      Alert.alert(
        'Password Reset',
        newPassword
          ? 'Password updated to specified value.'
          : 'Password reset to default credentials (Staff@123).'
      );
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = staff.filter((s) => {
    const roleMatches =
      selectedRole === 'ALL' ||
      s.role === selectedRole ||
      s.userRoles?.some((r: any) => r.role === selectedRole || r.role?.name === selectedRole);
    const deptMatches =
      selectedDeptId === 'ALL' ||
      s.employee?.departmentId === selectedDeptId ||
      s.departmentId === selectedDeptId;
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const searchMatches =
      fullName.includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());
    return roleMatches && deptMatches && searchMatches;
  });

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(admin)/more" title="Staff & HR Directory" subtitle="Hospital Workforce & Accounts" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/more')}
        >
          <ChevronLeft size={20} color="#38845A" />
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
        <TouchableOpacity
          style={[styles.selectToggleBtn, selectionMode && styles.selectToggleBtnActive]}
          onPress={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) setSelectedIds([]);
          }}
        >
          {selectionMode ? (
            <CheckSquare size={18} color="#FFFFFF" />
          ) : (
            <Square size={18} color="#38845A" />
          )}
        </TouchableOpacity>
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

      {/* Bulk Operations Toolbar */}
      {selectionMode && (
        <View style={styles.bulkToolbar}>
          <Text style={styles.bulkCountText}>
            {selectedIds.length} selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#059669' }]}
              onPress={() => handleBulkStatus(true)}
              disabled={selectedIds.length === 0 || submitting}
            >
              <Text style={styles.bulkBtnText}>Activate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => handleBulkStatus(false)}
              disabled={selectedIds.length === 0 || submitting}
            >
              <Text style={styles.bulkBtnText}>Deactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkBtn, { backgroundColor: '#64748B' }]}
              onPress={() => {
                if (selectedIds.length === filtered.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(filtered.map((u) => u.id));
                }
              }}
            >
              <Text style={styles.bulkBtnText}>
                {selectedIds.length === filtered.length ? 'None' : 'All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#38845A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#38845A" />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No staff members found.</Text>
            </View>
          ) : (
            filtered.map((user) => {
              const role =
                user.role ||
                user.userRoles?.[0]?.role?.name ||
                user.userRoles?.[0]?.role ||
                'STAFF';
              const staffName =
                `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
              const isSelected = selectedIds.includes(user.id);
              const isActive = user.isActive !== false;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                  onPress={() => {
                    if (selectionMode) toggleSelectId(user.id);
                  }}
                  activeOpacity={selectionMode ? 0.7 : 1}
                >
                  <View style={styles.cardHeader}>
                    {selectionMode ? (
                      <TouchableOpacity
                        style={{ marginRight: 8 }}
                        onPress={() => toggleSelectId(user.id)}
                      >
                        {isSelected ? (
                          <CheckSquare size={20} color="#38845A" />
                        ) : (
                          <Square size={20} color="#CBD5E1" />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {staffName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.userName}>{staffName}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{role.replace('_', ' ')}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        { backgroundColor: isActive ? '#D1FAE5' : '#EAF5ED' },
                      ]}
                      onPress={() => handleToggleStatus(user.id, isActive, staffName)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          { color: isActive ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.desigText}>
                      {user.employee?.designation || user.designation || 'Staff Member'}
                    </Text>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => {
                          setEditModal(user);
                          setEditDesig(user.employee?.designation || user.designation || '');
                          setEditDeptId(user.employee?.departmentId || user.departmentId || '');
                        }}
                      >
                        <Edit2 size={13} color="#38845A" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#E2E8F0' }]}
                        onPress={() => {
                          setResetModal(user);
                          setNewPassword('');
                        }}
                      >
                        <KeyRound size={13} color="#2563EB" />
                        <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Reset</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { borderColor: isActive ? '#FECDD3' : '#A7F3D0' },
                        ]}
                        onPress={() => handleToggleStatus(user.id, isActive, staffName)}
                      >
                        <Power size={13} color={isActive ? '#E11D48' : '#059669'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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

              <Text style={styles.fieldLabel}>Designation</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Senior Staff Nurse"
                value={formDesig}
                onChangeText={setFormDesig}
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

      {/* Edit Staff Modal */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Edit Staff Details</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Designation</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Designation"
              value={editDesig}
              onChangeText={setEditDesig}
            />

            <Text style={styles.fieldLabel}>Department Assignment</Text>
            <View style={styles.roleGrid}>
              {departments.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.roleSelectChip, editDeptId === d.id && styles.roleSelectChipActive]}
                  onPress={() => setEditDeptId(d.id)}
                >
                  <Text
                    style={[
                      styles.roleSelectChipText,
                      editDeptId === d.id && styles.roleSelectChipTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEditStaff}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={!!resetModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Reset Staff Password</Text>
              <TouchableOpacity onPress={() => setResetModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              Resetting password for: {resetModal?.firstName} {resetModal?.lastName} ({resetModal?.email})
            </Text>

            <Text style={styles.fieldLabel}>New Password (Optional, leave blank for Staff@123)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Staff@123"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleResetPassword}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Reset</Text>
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
  selectToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38845A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5ED',
  },
  selectToggleBtnActive: {
    backgroundColor: '#38845A',
  },
  addBtn: {
    backgroundColor: '#38845A',
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
    backgroundColor: '#38845A',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  bulkToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  bulkCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bulkBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: '#38845A',
    backgroundColor: '#EAF5ED',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38845A',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  desigText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAF5ED',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleSelectChipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  roleSelectChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  roleSelectChipTextActive: {
    color: '#38845A',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

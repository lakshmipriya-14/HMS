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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Search,
  Phone,
  Mail,
  Clock,
  Plus,
  Edit2,
  X,
  CheckCircle2,
  Calendar,
  CalendarOff,
  UserCheck,
  Shield,
  Briefcase,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentStaffScreen() {
  const router = useRouter();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Staff Modal
  const [addModal, setAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('NURSE');
  const [shift, setShift] = useState('MORNING');
  const [savingStaff, setSavingStaff] = useState(false);

  // Edit Staff Modal
  const [editModal, setEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editShift, setEditShift] = useState('');
  const [updatingStaff, setUpdatingStaff] = useState(false);

  // Staff Profile Detail Modal
  const [profileModal, setProfileModal] = useState(false);
  const [profileStaff, setProfileStaff] = useState<any | null>(null);

  const loadStaff = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getStaff();
      if (res.data) setStaff(res.data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleToggleAttendance = async (item: any) => {
    const currentStatus = item.attendanceStatus || 'PRESENT';
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';

    try {
      setStaff((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, attendanceStatus: nextStatus } : s))
      );
      if (profileStaff && profileStaff.id === item.id) {
        setProfileStaff({ ...profileStaff, attendanceStatus: nextStatus });
      }
      await mobileApiClient.departmentAdmin.saveAttendance([
        { userId: item.userId || item.id, status: nextStatus, date: new Date().toISOString() },
      ]);
      setSuccessMsg(`Attendance updated for ${item.firstName} ${item.lastName}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update attendance:', err);
      loadStaff();
    }
  };

  const handleAddStaff = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    try {
      setSavingStaff(true);
      await mobileApiClient.departmentAdmin.addStaff({
        firstName,
        lastName,
        email,
        phone,
        role,
        shift,
      });
      setAddModal(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSuccessMsg('Staff member enrolled successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadStaff();
    } catch (err) {
      console.error('Failed to add staff:', err);
    } finally {
      setSavingStaff(false);
    }
  };

  const openEditModal = (item: any) => {
    setSelectedStaff(item);
    setEditPhone(item.phone || '');
    setEditRole(item.role || 'NURSE');
    setEditShift(item.shift || 'MORNING');
    setProfileModal(false);
    setEditModal(true);
  };

  const openProfile = (item: any) => {
    setProfileStaff(item);
    setProfileModal(true);
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    try {
      setUpdatingStaff(true);
      await mobileApiClient.departmentAdmin.updateStaff(selectedStaff.id, {
        phone: editPhone,
        role: editRole,
        shift: editShift,
      });
      setEditModal(false);
      setSuccessMsg('Staff details updated');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadStaff();
    } catch (err) {
      console.error('Failed to update staff:', err);
    } finally {
      setUpdatingStaff(false);
    }
  };

  const filtered = staff.filter((s) => {
    if (!search) return true;
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const r = (s.role || '').toLowerCase();
    return name.includes(search.toLowerCase()) || r.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Staff" />

      {/* Top Bar with Search, Roll-call shortcut & Add Button */}
      <View style={styles.topBar}>
        <View style={styles.searchBarContainer}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search staff by name or role..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.navChip}
          onPress={() => router.push('/(department-admin)/attendance')}
          activeOpacity={0.8}
        >
          <Clock size={15} color="#38845A" />
          <Text style={styles.navChipText}>Roll-Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {successMsg ? (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadStaff} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department staff registered</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isPresent = item.attendanceStatus !== 'ABSENT';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => openProfile(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.firstName?.[0] || 'S'}
                      {item.lastName?.[0] || ''}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.staffName}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.staffRole}>{item.role || 'Nursing Staff'}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.attendanceBadge,
                      { backgroundColor: isPresent ? '#EAF5ED' : '#EAF5ED' },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleAttendance(item);
                    }}
                  >
                    <Text
                      style={[
                        styles.attendanceText,
                        { color: isPresent ? '#38845A' : '#DC2626' },
                      ]}
                    >
                      {isPresent ? 'Present' : 'Absent'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.metaItem}>
                    <Phone size={13} color="#64748B" />
                    <Text style={styles.metaText}>{item.phone || 'No phone'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.metaText}>{item.shift || 'General Shift'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={13} color="#38845A" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Staff Profile Detail Modal */}
      <Modal visible={profileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Staff Profile</Text>
              <TouchableOpacity onPress={() => setProfileModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {profileStaff && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.profileHeaderBox}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {profileStaff.firstName?.[0] || 'S'}
                      {profileStaff.lastName?.[0] || ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                      {profileStaff.firstName} {profileStaff.lastName}
                    </Text>
                    <Text style={styles.profileRole}>
                      {profileStaff.role || 'Staff Nurse'} • Shift: {profileStaff.shift || 'General'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>CONTACT & EMPLOYMENT</Text>
                  <View style={styles.detailRow}>
                    <Mail size={15} color="#38845A" />
                    <Text style={styles.detailValue}>{profileStaff.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={15} color="#38845A" />
                    <Text style={styles.detailValue}>{profileStaff.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Briefcase size={15} color="#38845A" />
                    <Text style={styles.detailValue}>
                      Employment Status: Active Department Staff
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>ATTENDANCE & DUTY</Text>
                  <View style={styles.detailRow}>
                    <Clock size={15} color="#38845A" />
                    <Text style={styles.detailValue}>
                      Assigned Shift: {profileStaff.shift || 'General Shift'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <UserCheck size={15} color="#38845A" />
                    <Text style={styles.detailValue}>
                      Today's Status: {profileStaff.attendanceStatus !== 'ABSENT' ? 'Present on Duty' : 'Absent'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.profileNavBtn}
                    onPress={() => {
                      setProfileModal(false);
                      router.push('/(department-admin)/attendance');
                    }}
                  >
                    <Clock size={16} color="#38845A" />
                    <Text style={styles.profileNavBtnText}>Attendance History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileNavBtn}
                    onPress={() => {
                      setProfileModal(false);
                      router.push('/(department-admin)/leaves');
                    }}
                  >
                    <CalendarOff size={16} color="#38845A" />
                    <Text style={styles.profileNavBtnText}>Staff Leave Requests</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileEditBtn}
                    onPress={() => openEditModal(profileStaff)}
                  >
                    <Edit2 size={16} color="#FFFFFF" />
                    <Text style={styles.profileEditBtnText}>Edit Staff Details</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Staff Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enroll Department Staff</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh"
                value={lastName}
                onChangeText={setLastName}
              />
              <Text style={styles.inputLabel}>Official Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. priya.n@hospital.org"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <Text style={styles.inputLabel}>Role / Designation</Text>
              <View style={styles.roleChips}>
                {['NURSE', 'TECHNICIAN', 'WARD_BOY', 'PHARMACIST'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Shift Assigned</Text>
              <View style={styles.roleChips}>
                {['MORNING', 'EVENING', 'NIGHT', 'GENERAL'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.roleChip, shift === s && styles.roleChipActive]}
                    onPress={() => setShift(s)}
                  >
                    <Text style={[styles.roleChipText, shift === s && styles.roleChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModal(false)}
                disabled={savingStaff}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddStaff}
                disabled={savingStaff}
              >
                {savingStaff ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Enroll Staff</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {selectedStaff?.firstName} {selectedStaff?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={editPhone}
                onChangeText={setEditPhone}
              />
              <Text style={styles.inputLabel}>Role Designation</Text>
              <TextInput
                style={styles.input}
                placeholder="Role"
                value={editRole}
                onChangeText={setEditRole}
              />
              <Text style={styles.inputLabel}>Shift Assignment</Text>
              <TextInput
                style={styles.input}
                placeholder="Shift (e.g. MORNING, NIGHT)"
                value={editShift}
                onChangeText={setEditShift}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}
                disabled={updatingStaff}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpdateStaff}
                disabled={updatingStaff}
              >
                {updatingStaff ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5ED',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  navChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38845A',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#38845A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toastText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  staffRole: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EAF5ED',
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
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
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  profileHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  profileActions: {
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  profileNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5ED',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  profileNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38845A',
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  profileEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
    color: '#0F172A',
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleChipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#38845A',
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
    backgroundColor: '#38845A',
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

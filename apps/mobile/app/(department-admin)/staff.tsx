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
  UserCheck,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentStaffScreen() {
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
    setEditModal(true);
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
      <AdminHeader
        title="Department Staff"
        subtitle="Attendance & Shift Duty"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
        }
      />

      {successMsg ? (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      <View style={styles.searchBarContainer}>
        <Search size={16} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search staff by name or role..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadStaff} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department staff registered</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isPresent = item.attendanceStatus !== 'ABSENT';

            return (
              <View key={item.id} style={styles.card}>
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
                      { backgroundColor: isPresent ? '#CCFBF1' : '#FEE2E2' },
                    ]}
                    onPress={() => handleToggleAttendance(item)}
                  >
                    <Text
                      style={[
                        styles.attendanceText,
                        { color: isPresent ? '#0F766E' : '#DC2626' },
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
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={13} color="#0F766E" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    backgroundColor: '#F0FDFA',
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
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
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#0F766E',
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
    backgroundColor: '#0F766E',
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

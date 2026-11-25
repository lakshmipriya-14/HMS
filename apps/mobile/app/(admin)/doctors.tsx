import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  UserCheck,
  Search,
  Plus,
  Stethoscope,
  Award,
  Clock,
  IndianRupee,
  X,
  Edit2,
  Power,
  Filter,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminDoctorsScreen() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dutyFilter, setDutyFilter] = useState<'ALL' | 'ON_DUTY' | 'OFF_DUTY'>('ALL');

  // Add doctor modal
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Doctor@123');
  const [formPhone, setFormPhone] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formFee, setFormFee] = useState('500');

  // Edit states
  const [editFee, setEditFee] = useState('500');
  const [editSpec, setEditSpec] = useState('');
  const [editShift, setEditShift] = useState('GENERAL');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [docRes, deptRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getDoctors(),
        mobileApiClient.hospitalAdmin.getDepartments(),
      ]);
      if (docRes.data) setDoctors(docRes.data);
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

  const handleToggleAvailability = async (doctor: any) => {
    const nextVal = !doctor.isAvailableToday;
    try {
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isAvailableToday: nextVal } : d))
      );
      await mobileApiClient.hospitalAdmin.updateDoctorSchedule(doctor.id, {
        isAvailableToday: nextVal,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update schedule');
      await loadData();
    }
  };

  const handleToggleDoctorStatus = (doctor: any) => {
    const isCurrentlyActive = doctor.user?.isActive !== false && doctor.employee?.user?.isActive !== false;
    const docName = doctor.employee?.user
      ? `${doctor.employee.user.firstName} ${doctor.employee.user.lastName}`.trim()
      : (doctor.user?.name || doctor.name || 'Doctor');

    Alert.alert(
      isCurrentlyActive ? 'Deactivate Doctor' : 'Activate Doctor',
      `Are you sure you want to ${isCurrentlyActive ? 'deactivate' : 'activate'} ${docName}? This validates that no pending appointments will be disrupted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Deactivate' : 'Activate',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.toggleDoctorStatus(doctor.id);
              await loadData();
              Alert.alert('Status Updated', `${docName} status has been updated.`);
            } catch (err: any) {
              Alert.alert('Conflict', err.message || 'Cannot change doctor status.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddDoctor = async () => {
    if (!formName || !formEmail || !formLicense || !formDeptId) {
      Alert.alert('Required Fields', 'Please complete name, email, medical license and department.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createDoctor({
        name: formName,
        email: formEmail,
        password: formPassword,
        phone: formPhone || '9876543210',
        licenseNumber: formLicense,
        specialization: formSpec || 'General Consultant',
        departmentId: formDeptId,
        consultationFee: parseFloat(formFee) || 500,
      });
      setAddModal(false);
      setFormName('');
      setFormEmail('');
      setFormLicense('');
      setFormSpec('');
      await loadData();
      Alert.alert('Success', 'Doctor provisioned successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to provision doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDoctor = async () => {
    if (!editModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateDoctor(editModal.id, {
        consultationFee: parseFloat(editFee) || 500,
        specialization: editSpec,
        shift: editShift,
      });
      setEditModal(null);
      await loadData();
      Alert.alert('Updated', 'Doctor profile and fees updated.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update doctor profile');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = doctors.filter((doc) => {
    const name = doc.employee?.user
      ? `${doc.employee.user.firstName} ${doc.employee.user.lastName}`.trim()
      : (doc.user?.name || doc.name || '');
    const spec = doc.specialization || '';
    const license = doc.licenseNumber || '';
    const searchMatches =
      name.toLowerCase().includes(search.toLowerCase()) ||
      spec.toLowerCase().includes(search.toLowerCase()) ||
      license.toLowerCase().includes(search.toLowerCase());

    const deptMatches = selectedDeptId === 'ALL' || doc.departmentId === selectedDeptId;

    const isActive = doc.user?.isActive !== false && doc.employee?.user?.isActive !== false;
    const statusMatches =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    const isAvail = doc.isAvailableToday !== false;
    const dutyMatches =
      dutyFilter === 'ALL' ||
      (dutyFilter === 'ON_DUTY' && isAvail) ||
      (dutyFilter === 'OFF_DUTY' && !isAvail);

    return searchMatches && deptMatches && statusMatches && dutyMatches;
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Doctor Directory" subtitle="Medical Staff Rostering & Status" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, speciality, license..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModal(true)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Status Filters */}
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.chip, statusFilter === tab && styles.chipActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text style={[styles.chipText, statusFilter === tab && styles.chipTextActive]}>
                {tab === 'ALL' ? 'All Status' : tab}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Duty Filters */}
          <TouchableOpacity
            style={[styles.chip, dutyFilter === 'ON_DUTY' && styles.chipActive]}
            onPress={() => setDutyFilter(dutyFilter === 'ON_DUTY' ? 'ALL' : 'ON_DUTY')}
          >
            <Text style={[styles.chipText, dutyFilter === 'ON_DUTY' && styles.chipTextActive]}>
              On Duty
            </Text>
          </TouchableOpacity>

          {/* Department Chips */}
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              style={[styles.chip, selectedDeptId === dept.id && styles.chipActive]}
              onPress={() => setSelectedDeptId(selectedDeptId === dept.id ? 'ALL' : dept.id)}
            >
              <Text style={[styles.chipText, selectedDeptId === dept.id && styles.chipTextActive]}>
                {dept.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No doctors match current filters.</Text>
            </View>
          ) : (
            filtered.map((doc) => {
              const isAvail = doc.isAvailableToday !== false;
              const isActive = doc.user?.isActive !== false && doc.employee?.user?.isActive !== false;
              const docName = doc.employee?.user
                ? `Dr. ${doc.employee.user.firstName} ${doc.employee.user.lastName}`.trim()
                : (doc.user?.name || doc.name || 'Dr. Consultant');

              return (
                <View key={doc.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Stethoscope size={18} color="#0F766E" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.docName}>{docName}</Text>
                        <View
                          style={[
                            styles.statusTag,
                            { backgroundColor: isActive ? '#D1FAE5' : '#FEE2E2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              { color: isActive ? '#059669' : '#DC2626' },
                            ]}
                          >
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.docSpec}>
                        {doc.specialization} • {doc.department?.name || 'Medical Dept'}
                      </Text>
                    </View>
                    <View style={styles.switchWrapper}>
                      <Text style={[styles.switchLabel, { color: isAvail ? '#059669' : '#94A3B8' }]}>
                        {isAvail ? 'ON DUTY' : 'OFF'}
                      </Text>
                      <Switch
                        value={isAvail}
                        onValueChange={() => handleToggleAvailability(doc)}
                        trackColor={{ false: '#E2E8F0', true: '#CCFBF1' }}
                        thumbColor={isAvail ? '#0F766E' : '#94A3B8'}
                      />
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Award size={12} color="#64748B" />
                      <Text style={styles.detailText}>Reg: {doc.licenseNumber}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <IndianRupee size={12} color="#64748B" />
                      <Text style={styles.detailText}>Fee: ₹ {doc.consultationFee || 500}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={12} color="#64748B" />
                      <Text style={styles.detailText}>{doc.shift || 'General Shift'}</Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setEditModal(doc);
                        setEditFee(String(doc.consultationFee || 500));
                        setEditSpec(doc.specialization || '');
                        setEditShift(doc.shift || 'GENERAL');
                      }}
                    >
                      <Edit2 size={13} color="#0F766E" />
                      <Text style={styles.actionBtnText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { borderColor: isActive ? '#FECDD3' : '#A7F3D0' },
                      ]}
                      onPress={() => handleToggleDoctorStatus(doc)}
                    >
                      <Power size={13} color={isActive ? '#E11D48' : '#059669'} />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: isActive ? '#E11D48' : '#059669' },
                        ]}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add Doctor Modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Provision Doctor</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Dr. S. Rajesh"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.fieldLabel}>Professional Email</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="doctor@uyirinai.test"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formEmail}
                onChangeText={setFormEmail}
              />

              <Text style={styles.fieldLabel}>Medical License / Reg No.</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="TMC-98765"
                value={formLicense}
                onChangeText={setFormLicense}
              />

              <Text style={styles.fieldLabel}>Specialization</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Senior Interventional Cardiologist"
                value={formSpec}
                onChangeText={setFormSpec}
              />

              <Text style={styles.fieldLabel}>Department Assignment</Text>
              <View style={styles.deptOptions}>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.deptChip,
                      formDeptId === d.id && styles.deptChipSelected,
                    ]}
                    onPress={() => setFormDeptId(d.id)}
                  >
                    <Text
                      style={[
                        styles.deptChipText,
                        formDeptId === d.id && styles.deptChipTextSelected,
                      ]}
                    >
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Consultation Fee (₹)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="500"
                keyboardType="numeric"
                value={formFee}
                onChangeText={setFormFee}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddDoctor}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Provision Doctor Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Edit Doctor Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Specialization</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Specialization"
              value={editSpec}
              onChangeText={setEditSpec}
            />

            <Text style={styles.fieldLabel}>Consultation Fee (₹)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="500"
              keyboardType="numeric"
              value={editFee}
              onChangeText={setEditFee}
            />

            <Text style={styles.fieldLabel}>Shift Timing</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. MORNING / EVENING / ROTATIONAL"
              value={editShift}
              onChangeText={setEditShift}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEditDoctor}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actionBar: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0F766E',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  docSpec: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  switchWrapper: {
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
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
    maxHeight: '85%',
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
  deptOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  deptChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptChipSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0F766E',
  },
  deptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  deptChipTextSelected: {
    color: '#0F766E',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
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

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
  Switch,
  Modal,
} from 'react-native';
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  Clock,
  Plus,
  Edit2,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentDoctorsScreen() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add Doctor Modal
  const [addModal, setAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [designation, setDesignation] = useState('Consultant');
  const [opdTiming, setOpdTiming] = useState('09:00 - 13:00');
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Edit Doctor Modal
  const [editModal, setEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  const [successMsg, setSuccessMsg] = useState('');

  const loadDoctors = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getDoctors();
      if (res.data) setDoctors(res.data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleToggleStatus = async (doctor: any) => {
    try {
      setUpdatingId(doctor.id);
      const newStatus = doctor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await mobileApiClient.departmentAdmin.toggleDoctorStatus(doctor.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error('Failed to toggle doctor status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddDoctor = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    try {
      setSavingDoctor(true);
      await mobileApiClient.departmentAdmin.addDoctor({
        firstName,
        lastName,
        email,
        phone,
        specialization,
        designation,
        opdTiming,
      });
      setAddModal(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSuccessMsg('Doctor assigned to department successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadDoctors();
    } catch (err) {
      console.error('Failed to add doctor:', err);
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleEditDoctor = async () => {
    if (!selectedDoctor) return;
    try {
      setSavingDoctor(true);
      await mobileApiClient.departmentAdmin.updateDoctor(selectedDoctor.id, {
        specialization,
        designation,
        opdTiming,
      });
      setEditModal(false);
      setSelectedDoctor(null);
      setSuccessMsg('Doctor profile updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadDoctors();
    } catch (err) {
      console.error('Failed to update doctor:', err);
    } finally {
      setSavingDoctor(false);
    }
  };

  const filtered = doctors.filter((doc) => {
    if (!search) return true;
    const name = `${doc.user?.firstName || ''} ${doc.user?.lastName || ''}`.toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    return name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Doctors" subtitle="Medical Staff Roster & Duty Desk" />

      {/* Top Bar with Add Button */}
      <View style={styles.topBar}>
        <View style={styles.searchBarContainer}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search doctors by name or specialty..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDoctors} tintColor="#0F766E" />
        }
      >
        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#0F766E" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <UserCheck size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department doctors found</Text>
          </View>
        ) : (
          filtered.map((doctor) => {
            const isActive = doctor.status === 'ACTIVE' || doctor.isAvailable;
            const isUpdating = updatingId === doctor.id;

            return (
              <View key={doctor.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {doctor.user?.firstName?.[0] || 'D'}
                      {doctor.user?.lastName?.[0] || ''}
                    </Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </Text>
                    <Text style={styles.docSpec}>
                      {doctor.designation || doctor.specialization || 'Consultant'}
                    </Text>
                  </View>
                  <View style={styles.switchCol}>
                    <Switch
                      value={isActive}
                      onValueChange={() => handleToggleStatus(doctor)}
                      disabled={isUpdating}
                      trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                      thumbColor={isActive ? '#0F766E' : '#F1F5F9'}
                    />
                    <Text style={[styles.statusText, { color: isActive ? '#0F766E' : '#94A3B8' }]}>
                      {isActive ? 'Available' : 'Off-Duty'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.metaItem}>
                    <Phone size={13} color="#64748B" />
                    <Text style={styles.metaText}>{doctor.user?.phone || 'No phone'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.metaText}>{doctor.opdTiming || '09:00 - 13:00'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => {
                      setSelectedDoctor(doctor);
                      setSpecialization(doctor.specialization || '');
                      setDesignation(doctor.designation || 'Consultant');
                      setOpdTiming(doctor.opdTiming || '09:00 - 13:00');
                      setEditModal(true);
                    }}
                  >
                    <Edit2 size={13} color="#0F766E" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Doctor Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Doctor to Department</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput style={styles.modalInput} value={firstName} onChangeText={setFirstName} placeholder="First name" />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput style={styles.modalInput} value={lastName} onChangeText={setLastName} placeholder="Last name" />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput style={styles.modalInput} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="doctor@hospital.test" />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.modalInput} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="+91 9876543210" />

              <Text style={styles.inputLabel}>Specialization / Qualification</Text>
              <TextInput style={styles.modalInput} value={specialization} onChangeText={setSpecialization} placeholder="e.g. MD, DM Cardiology" />

              <Text style={styles.inputLabel}>OPD Consultation Hours</Text>
              <TextInput style={styles.modalInput} value={opdTiming} onChangeText={setOpdTiming} placeholder="09:00 - 13:00" />

              <TouchableOpacity
                style={[styles.submitBtn, savingDoctor && { opacity: 0.6 }]}
                onPress={handleAddDoctor}
                disabled={savingDoctor}
              >
                <Text style={styles.submitBtnText}>{savingDoctor ? 'Adding...' : 'Assign to Department'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Doctor Details</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Physician Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
                editable={false}
                value={`Dr. ${selectedDoctor?.user?.firstName || ''} ${selectedDoctor?.user?.lastName || ''}`}
              />

              <Text style={styles.inputLabel}>Specialization</Text>
              <TextInput style={styles.modalInput} value={specialization} onChangeText={setSpecialization} />

              <Text style={styles.inputLabel}>Designation</Text>
              <TextInput style={styles.modalInput} value={designation} onChangeText={setDesignation} />

              <Text style={styles.inputLabel}>OPD Consultation Hours</Text>
              <TextInput style={styles.modalInput} value={opdTiming} onChangeText={setOpdTiming} />

              <TouchableOpacity
                style={[styles.submitBtn, savingDoctor && { opacity: 0.6 }]}
                onPress={handleEditDoctor}
                disabled={savingDoctor}
              >
                <Text style={styles.submitBtnText}>{savingDoctor ? 'Updating...' : 'Save Doctor Info'}</Text>
              </TouchableOpacity>
            </ScrollView>
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
    gap: 10,
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F766E',
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#CCFBF1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
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
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0F766E',
    fontWeight: '800',
    fontSize: 14,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpec: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 2,
  },
  switchCol: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
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
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  editIconBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

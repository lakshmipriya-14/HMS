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
import { useRouter } from 'expo-router';
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
  Eye,
  Building2,
  Award,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentDoctorsScreen() {
  const router = useRouter();
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

  // Doctor Profile Detail Modal
  const [profileModal, setProfileModal] = useState(false);
  const [profileDoc, setProfileDoc] = useState<any | null>(null);

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
      if (profileDoc && profileDoc.id === doctor.id) {
        setProfileDoc({ ...profileDoc, status: newStatus });
      }
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

  const openProfile = (doc: any) => {
    setProfileDoc(doc);
    setProfileModal(true);
  };

  const openEdit = (doc: any) => {
    setSelectedDoctor(doc);
    setSpecialization(doc.specialization || '');
    setDesignation(doc.designation || 'Consultant');
    setOpdTiming(doc.opdTiming || '09:00 - 13:00');
    setProfileModal(false);
    setEditModal(true);
  };

  const filtered = doctors.filter((doc) => {
    if (!search) return true;
    const name = `${doc.user?.firstName || ''} ${doc.user?.lastName || ''}`.toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    return name.includes(search.toLowerCase()) || spec.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Doctors" />

      {/* Top Bar with Search, Scheduling link & Add Button */}
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
          style={styles.scheduleNavBtn}
          onPress={() => router.push('/(department-admin)/scheduling')}
          activeOpacity={0.8}
        >
          <Calendar size={15} color="#0F766E" />
          <Text style={styles.scheduleNavBtnText}>Roster</Text>
        </TouchableOpacity>

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
              <TouchableOpacity
                key={doctor.id}
                style={styles.card}
                onPress={() => openProfile(doctor)}
                activeOpacity={0.85}
              >
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
                    onPress={(e) => {
                      e.stopPropagation();
                      openEdit(doctor);
                    }}
                  >
                    <Edit2 size={13} color="#0F766E" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Doctor Profile Detail Modal */}
      <Modal visible={profileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Doctor Profile</Text>
              <TouchableOpacity onPress={() => setProfileModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {profileDoc && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.profileHeaderBox}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {profileDoc.user?.firstName?.[0] || 'D'}
                      {profileDoc.user?.lastName?.[0] || ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                      Dr. {profileDoc.user?.firstName} {profileDoc.user?.lastName}
                    </Text>
                    <Text style={styles.profileDesignation}>
                      {profileDoc.designation || 'Consultant'} • {profileDoc.specialization || 'General Medicine'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>CONTACT & CREDENTIALS</Text>
                  <View style={styles.detailRow}>
                    <Mail size={15} color="#0F766E" />
                    <Text style={styles.detailValue}>{profileDoc.user?.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={15} color="#0F766E" />
                    <Text style={styles.detailValue}>{profileDoc.user?.phone || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Award size={15} color="#0F766E" />
                    <Text style={styles.detailValue}>
                      Qualifications: {profileDoc.qualification || profileDoc.specialization || 'MBBS, MD'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>OPERATIONAL DUTY</Text>
                  <View style={styles.detailRow}>
                    <Clock size={15} color="#0F766E" />
                    <Text style={styles.detailValue}>
                      OPD Hours: {profileDoc.opdTiming || '09:00 - 13:00'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <UserCheck size={15} color="#0F766E" />
                    <Text style={styles.detailValue}>
                      Status: {profileDoc.status === 'ACTIVE' ? 'Active & Available' : 'Off-Duty'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.profileRosterBtn}
                    onPress={() => {
                      setProfileModal(false);
                      router.push({
                        pathname: '/(department-admin)/scheduling',
                        params: { doctorId: profileDoc.id },
                      });
                    }}
                  >
                    <Calendar size={16} color="#0F766E" />
                    <Text style={styles.profileRosterBtnText}>Manage Weekly Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileEditBtn}
                    onPress={() => openEdit(profileDoc)}
                  >
                    <Edit2 size={16} color="#FFFFFF" />
                    <Text style={styles.profileEditBtnText}>Edit Doctor Info</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput style={styles.modalInput} value={firstName} onChangeText={setFirstName} placeholder="First name" />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput style={styles.modalInput} value={lastName} onChangeText={setLastName} placeholder="Last name" />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput style={styles.modalInput} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="doctor@hospital.test" />

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

            <ScrollView style={styles.modalBody}>
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
  scheduleNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  scheduleNavBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
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
    backgroundColor: '#CCFBF1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  switchCol: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
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
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F766E',
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
  profileDesignation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 16,
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
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  profileRosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFBF1',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  profileRosterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  profileEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
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
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

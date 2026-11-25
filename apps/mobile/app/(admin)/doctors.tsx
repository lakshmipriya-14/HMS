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
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminDoctorsScreen() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Add doctor modal
  const [addModal, setAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Doctor@123');
  const [formPhone, setFormPhone] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formFee, setFormFee] = useState('500');

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
      // optimistic update
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

  const filtered = doctors.filter((doc) => {
    const name = doc.employee?.user
      ? `${doc.employee.user.firstName} ${doc.employee.user.lastName}`.trim()
      : (doc.user?.name || doc.name || '');
    const spec = doc.specialization || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      spec.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Doctor Directory" subtitle="Medical Staff Rostering" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors or speciality..."
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
          {filtered.map((doc) => {
            const isAvail = doc.isAvailableToday !== false;
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
                    <Text style={styles.docName}>{docName}</Text>
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
              </View>
            );
          })}
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

            <ScrollView style={{ maxHeight: 400 }}>
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
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSpec: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
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
  deptOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  deptChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  deptChipSelected: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  deptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  deptChipTextSelected: {
    color: '#0F766E',
    fontWeight: '700',
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

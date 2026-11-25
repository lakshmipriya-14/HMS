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
  Building2,
  Plus,
  Search,
  UserCheck,
  Shield,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminDepartmentsScreen() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState<{ type: 'hod' | 'admin'; dept: any } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [deptRes, docRes, staffRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getDepartments(),
        mobileApiClient.hospitalAdmin.getDoctors(),
        mobileApiClient.hospitalAdmin.getStaff(),
      ]);
      if (deptRes.data) setDepartments(deptRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (staffRes.data) setStaff(staffRes.data);
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

  const handleCreate = async () => {
    if (!formName || !formCode) {
      Alert.alert('Required', 'Please enter both department name and unique code.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createDepartment({
        name: formName,
        code: formCode.toUpperCase(),
        description: formDesc,
      });
      setCreateModal(false);
      setFormName('');
      setFormCode('');
      setFormDesc('');
      await loadData();
      Alert.alert('Success', 'Department created successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedPersonId) {
      Alert.alert('Selection Required', 'Please select an individual to assign.');
      return;
    }
    try {
      setSubmitting(true);
      if (assignModal.type === 'hod') {
        await mobileApiClient.hospitalAdmin.assignHod(assignModal.dept.id, selectedPersonId);
        Alert.alert('Success', `Head of Department assigned.`);
      } else {
        await mobileApiClient.hospitalAdmin.assignDepartmentAdmin(assignModal.dept.id, selectedPersonId);
        Alert.alert('Success', `Department Admin assigned under mandatory 1-admin-per-department governance.`);
      }
      setAssignModal(null);
      setSelectedPersonId('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Governance Violation', err.message || 'Failed assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await mobileApiClient.hospitalAdmin.toggleDepartmentStatus(id);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle status');
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Management" subtitle="Clinical Governance" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search departments..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModal(true)}
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
          {filtered.map((dept) => {
            const admin = dept.departmentAdmins?.[0]?.user;
            return (
              <View key={dept.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{dept.code}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{dept.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {dept.description || 'Clinical speciality unit'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusPill,
                      { backgroundColor: dept.isActive ? '#D1FAE5' : '#FEE2E2' },
                    ]}
                    onPress={() => handleToggleStatus(dept.id)}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: dept.isActive ? '#059669' : '#DC2626' },
                      ]}
                    >
                      {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* HOD & Admin Details */}
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <UserCheck size={14} color="#0F766E" />
                    <Text style={styles.metaLabel}>Head of Dept:</Text>
                    <Text style={styles.metaVal}>
                      {dept.hod?.user?.name || 'Unassigned'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAssignModal({ type: 'hod', dept })}
                    >
                      <Text style={styles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.metaRow}>
                    <Shield size={14} color="#2563EB" />
                    <Text style={styles.metaLabel}>Dept Admin:</Text>
                    <Text style={styles.metaVal}>
                      {admin?.name || 'Unassigned (Required)'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAssignModal({ type: 'admin', dept })}
                    >
                      <Text style={[styles.changeLink, { color: '#2563EB' }]}>
                        {admin ? 'Replace' : 'Assign'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerStat}>
                    👨‍⚕️ {dept.doctors?.length || 0} Doctors
                  </Text>
                  <Text style={styles.footerStat}>
                    🛏️ {dept.wards?.length || 0} Wards
                  </Text>
                  <Text style={styles.footerStat}>
                    🏥 Branch: {dept.branch?.name || 'Main Campus'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Create Department Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Create Department</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Department Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Cardiology"
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={styles.fieldLabel}>Department Code</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. CARD"
              autoCapitalize="characters"
              value={formCode}
              onChangeText={setFormCode}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.fieldInput, { height: 60 }]}
              placeholder="Scope of clinical care..."
              multiline
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Department</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={!!assignModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {assignModal?.type === 'hod' ? 'Assign Head of Dept' : 'Assign Department Admin'}
              </Text>
              <TouchableOpacity onPress={() => setAssignModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.noticeText}>
              {assignModal?.type === 'hod'
                ? `Assign a senior consultant doctor to lead ${assignModal.dept?.name}.`
                : `Mandatory rule: Exactly 1 Department Admin per department. Selecting an individual will atomically update their governance assignment.`}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
              {(assignModal?.type === 'hod' ? doctors : staff).map((p: any) => {
                const personId = assignModal?.type === 'hod' ? p.id : (p.id || p.userId);
                const isSelected = selectedPersonId === personId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.personOption,
                      isSelected && styles.personOptionSelected,
                    ]}
                    onPress={() => setSelectedPersonId(personId)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName}>
                        {p.user?.name || p.name}
                      </Text>
                      <Text style={styles.personSub}>
                        {p.specialization || p.employee?.designation || p.email}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle size={18} color="#0F766E" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAssign}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Assignment</Text>
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
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  changeLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerStat: {
    fontSize: 10,
    color: '#64748B',
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
    maxHeight: '85%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  noticeText: {
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    lineHeight: 16,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
  },
  personOptionSelected: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  personName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  personSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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

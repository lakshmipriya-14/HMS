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
  Building2,
  User,
  ShieldCheck,
  Clock,
  BedDouble,
  FileText,
  Edit3,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentInfoScreen() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [workingHours, setWorkingHours] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('40');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadInfo = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getInfo();
      if (res.data) {
        setInfo(res.data);
        setWorkingHours(res.data.workingHours || '24/7 Emergency & OPD 08:00 - 18:00');
        setDescription(res.data.description || '');
        setCapacity(String(res.data.capacity || 40));
      }
    } catch (err) {
      console.error('Failed to load department info:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await mobileApiClient.departmentAdmin.updateInfo({
        workingHours,
        description,
        capacity: Number(capacity) || 40,
      });
      setEditModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadInfo();
    } catch (err) {
      console.error('Failed to update info:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38845A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Profile" subtitle="Operations & Leadership" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadInfo} tintColor="#38845A" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#38845A" />
            <Text style={styles.successText}>Department profile updated successfully</Text>
          </View>
        )}

        {/* Header Card */}
        <View style={styles.mainCard}>
          <View style={styles.iconBox}>
            <Building2 size={28} color="#38845A" />
          </View>
          <Text style={styles.deptTitle}>{info?.name || 'Department'}</Text>
          <Text style={styles.deptCode}>Code: {info?.code || 'DEPT'} • Clinical</Text>
          <Text style={styles.deptDesc}>
            {info?.description || 'Comprehensive clinical department providing patient care, OPD consultations, inpatient wards, and emergency response.'}
          </Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModal(true)}
            activeOpacity={0.8}
          >
            <Edit3 size={14} color="#FFFFFF" />
            <Text style={styles.editBtnText}>Edit Permitted Info</Text>
          </TouchableOpacity>
        </View>

        {/* Leadership & Admins */}
        <Text style={styles.sectionTitle}>Leadership & Governance</Text>
        <View style={styles.cardGroup}>
          <View style={styles.itemRow}>
            <View style={[styles.miniIconBox, { backgroundColor: '#EAF5ED' }]}>
              <User size={18} color="#38845A" />
            </View>
            <View style={styles.itemCol}>
              <Text style={styles.itemLabel}>Head of Department (HOD)</Text>
              <Text style={styles.itemVal}>
                {info?.headOfDepartment?.name ? `Dr. ${info.headOfDepartment.name}` : 'Senior Consultant / HOD Assigned'}
              </Text>
              <Text style={styles.itemSub}>
                {info?.headOfDepartment?.specialization || 'Clinical Specialist'}
              </Text>
            </View>
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
            <View style={[styles.miniIconBox, { backgroundColor: '#E0F2FE' }]}>
              <ShieldCheck size={18} color="#0284C7" />
            </View>
            <View style={styles.itemCol}>
              <Text style={styles.itemLabel}>Assigned Department Admin</Text>
              <Text style={styles.itemVal}>
                {info?.departmentAdmin?.name || 'Authorized Dept Administrator'}
              </Text>
              <Text style={styles.itemSub}>{info?.departmentAdmin?.email || 'admin@hospital.test'}</Text>
            </View>
          </View>
        </View>

        {/* Operational Constraints */}
        <Text style={styles.sectionTitle}>Operational Capacity & Hours</Text>
        <View style={styles.cardGroup}>
          <View style={styles.itemRow}>
            <View style={[styles.miniIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={18} color="#D97706" />
            </View>
            <View style={styles.itemCol}>
              <Text style={styles.itemLabel}>Operating Hours</Text>
              <Text style={styles.itemVal}>
                {info?.workingHours || '24 Hours Emergency • OPD 08:00 - 18:00'}
              </Text>
            </View>
          </View>

          <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
            <View style={[styles.miniIconBox, { backgroundColor: '#EAF5ED' }]}>
              <BedDouble size={18} color="#DC2626" />
            </View>
            <View style={styles.itemCol}>
              <Text style={styles.itemLabel}>Total Ward Bed Capacity</Text>
              <Text style={styles.itemVal}>{info?.capacity || 40} Approved Beds</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Department Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Working Hours & Shifts</Text>
              <TextInput
                style={styles.modalInput}
                value={workingHours}
                onChangeText={setWorkingHours}
                placeholder="e.g. 24/7 or 08:00 - 20:00"
              />

              <Text style={styles.inputLabel}>Department Capacity (Beds)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
                placeholder="40"
              />

              <Text style={styles.inputLabel}>Clinical Description / Scope</Text>
              <TextInput
                style={[styles.modalInput, { height: 90 }]}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                placeholder="Department medical mandate..."
              />

              <TouchableOpacity
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF5ED',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38845A',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EAF5ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deptTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  deptCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  deptDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38845A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  miniIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
    marginTop: 12,
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
    backgroundColor: '#38845A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

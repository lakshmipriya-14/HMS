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
  HeartPulse,
  Search,
  Phone,
  Calendar,
  User,
  ChevronRight,
  X,
  FileText,
  CalendarCheck,
  Shield,
  Clock,
  Droplet,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Patient Detail Modal
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [detailModal, setDetailModal] = useState(false);

  const loadPatients = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getPatients({ query: search || undefined });
      if (res.data) setPatients(res.data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const openPatientDetail = (pat: any) => {
    setSelectedPatient(pat);
    setDetailModal(true);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        showBack={true}
        fallbackHref="/(department-admin)/operations"
        title="Department Patients"
        subtitle="Department Patient Directory"
      />

      <View style={styles.searchBarContainer}>
        <Search size={16} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by UHID, patient name, phone..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPatients} tintColor="#1565C0" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <View style={styles.emptyState}>
            <HeartPulse size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department patients found</Text>
          </View>
        ) : (
          patients.map((pat) => (
            <TouchableOpacity
              key={pat.id}
              style={styles.card}
              onPress={() => openPatientDetail(pat)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {pat.firstName?.[0] || 'P'}
                    {pat.lastName?.[0] || ''}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.patientName}>
                    {pat.firstName} {pat.lastName}
                  </Text>
                  <Text style={styles.uhidText}>UHID: {pat.uhid || '—'}</Text>
                </View>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>
                    {pat.gender || 'M'} • {pat.age || 35}y
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.metaItem}>
                  <Phone size={13} color="#64748B" />
                  <Text style={styles.metaText}>{pat.phone || 'No phone'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Droplet size={13} color="#64748B" />
                  <Text style={styles.metaText}>
                    {pat.bloodGroup ? `Blood: ${pat.bloodGroup}` : 'Active File'}
                  </Text>
                </View>
                <View style={styles.viewBadge}>
                  <Text style={styles.viewBadgeText}>View File ›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Patient Detail Modal */}
      <Modal visible={detailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Information</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedPatient && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.profileHeaderBox}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selectedPatient.firstName?.[0] || 'P'}
                      {selectedPatient.lastName?.[0] || ''}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </Text>
                    <Text style={styles.profileUhid}>UHID: {selectedPatient.uhid || '—'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>DEMOGRAPHICS & CONTACT</Text>
                  <View style={styles.detailRow}>
                    <User size={15} color="#1565C0" />
                    <Text style={styles.detailValue}>
                      Gender: {selectedPatient.gender || 'Not specified'} • Age: {selectedPatient.age || 35} yrs
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={15} color="#1565C0" />
                    <Text style={styles.detailValue}>{selectedPatient.phone || 'No contact phone'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Droplet size={15} color="#1565C0" />
                    <Text style={styles.detailValue}>
                      Blood Group: {selectedPatient.bloodGroup || 'O+'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>CLINICAL & VISIT STATUS</Text>
                  <View style={styles.detailRow}>
                    <Clock size={15} color="#1565C0" />
                    <Text style={styles.detailValue}>
                      Status: {selectedPatient.admissions?.length ? 'Currently Admitted (IPD)' : 'Outpatient (OPD)'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FileText size={15} color="#1565C0" />
                    <Text style={styles.detailValue}>
                      Department: General Medicine Registry
                    </Text>
                  </View>
                </View>

                <View style={styles.profileActions}>
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => {
                      setDetailModal(false);
                      router.push('/(department-admin)/appointments');
                    }}
                  >
                    <CalendarCheck size={16} color="#FFFFFF" />
                    <Text style={styles.bookBtnText}>Manage Appointments</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
    color: '#183153',
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
    backgroundColor: '#E8F1FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#1565C0',
    fontWeight: '800',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#183153',
  },
  uhidText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  genderBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
  viewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1565C0',
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
    color: '#183153',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183153',
  },
  profileUhid: {
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
    color: '#183153',
    fontWeight: '600',
  },
  profileActions: {
    marginTop: 10,
    marginBottom: 20,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

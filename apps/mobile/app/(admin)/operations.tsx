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
  BedDouble,
  Users,
  CalendarCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Calendar,
  X,
  Edit2,
  Ban,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

type Tab = 'beds' | 'ipd' | 'opd';

export default function AdminOperationsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('beds');
  const [wards, setWards] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [opdStatusFilter, setOpdStatusFilter] = useState('ALL');
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('10:00');
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [wardRes, admRes, qRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getWards(),
        mobileApiClient.hospitalAdmin.getAdmissions(),
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
      ]);
      if (wardRes.data) setWards(wardRes.data);
      if (admRes.data) setAdmissions(admRes.data);
      if (qRes.data) setQueue(qRes.data);
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

  const handleReschedule = async () => {
    if (!rescheduleModal || !reschedDate) {
      Alert.alert('Required', 'Please enter new appointment date (YYYY-MM-DD).');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.reschedule(rescheduleModal.id, {
        appointmentDate: reschedDate,
        appointmentTime: reschedTime || '10:00',
      });
      setRescheduleModal(null);
      await loadData();
      Alert.alert('Success', 'Appointment rescheduled successfully.');
    } catch (err: any) {
      Alert.alert('Reschedule Failed', err.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.cancel(
        cancelModal.id,
        cancelReason || 'Cancelled by Hospital Admin'
      );
      setCancelModal(null);
      setCancelReason('');
      await loadData();
      Alert.alert('Cancelled', 'Appointment has been cancelled.');
    } catch (err: any) {
      Alert.alert('Cancellation Error', err.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Clinical Operations" subtitle="Bed Census & Live Flow" />

      {/* Segmented Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'beds' && styles.tabItemActive]}
          onPress={() => setActiveTab('beds')}
        >
          <BedDouble size={16} color={activeTab === 'beds' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'beds' && styles.tabLabelActive]}>
            Bed Census
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ipd' && styles.tabItemActive]}
          onPress={() => setActiveTab('ipd')}
        >
          <Users size={16} color={activeTab === 'ipd' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'ipd' && styles.tabLabelActive]}>
            Inpatients ({admissions.filter((a) => a.status === 'ADMITTED').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'opd' && styles.tabItemActive]}
          onPress={() => setActiveTab('opd')}
        >
          <CalendarCheck size={16} color={activeTab === 'opd' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'opd' && styles.tabLabelActive]}>
            OPD Queue
          </Text>
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
          {/* TAB 1: BED CENSUS */}
          {activeTab === 'beds' && (
            <View>
              {wards.map((ward) => {
                const totalBeds = ward.beds?.length || ward.totalBeds || 0;
                const occBeds = ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0;
                const occRate = totalBeds > 0 ? Math.round((occBeds / totalBeds) * 100) : 0;
                return (
                  <View key={ward.id} style={styles.card}>
                    <View style={styles.wardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wardName}>{ward.name}</Text>
                        <Text style={styles.wardMeta}>
                          Code: {ward.code} • Floor {ward.floorNumber} • Gender: {ward.genderAllowed}
                        </Text>
                      </View>
                      <View style={styles.occBadge}>
                        <Text style={styles.occBadgeText}>{occRate}% Occ</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${occRate}%`,
                            backgroundColor: occRate > 85 ? '#E11D48' : '#0F766E',
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.wardStat}>
                      {occBeds} occupied / {totalBeds} total beds ({totalBeds - occBeds} available)
                    </Text>

                    {/* Beds Grid Preview */}
                    <View style={styles.bedMiniGrid}>
                      {(ward.beds || []).slice(0, 8).map((b: any) => {
                        const isOcc = b.status === 'OCCUPIED';
                        const isMaint = b.status === 'MAINTENANCE';
                        return (
                          <View
                            key={b.id}
                            style={[
                              styles.bedChip,
                              isOcc && styles.bedChipOcc,
                              isMaint && styles.bedChipMaint,
                            ]}
                          >
                            <Text
                              style={[
                                styles.bedChipText,
                                isOcc && styles.bedChipTextOcc,
                                isMaint && styles.bedChipTextMaint,
                              ]}
                            >
                              {b.bedNumber}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: INPATIENT IPD */}
          {activeTab === 'ipd' && (
            <View>
              {admissions.length === 0 ? (
                <Text style={styles.emptyText}>No inpatient admissions recorded.</Text>
              ) : (
                admissions.map((adm) => {
                  const patientName = adm.patient
                    ? `${adm.patient.firstName || ''} ${adm.patient.lastName || ''}`.trim()
                    : (adm.currentPatientName || 'Patient');
                  const doctorName = adm.admittingDoctor?.employee?.user
                    ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`.trim()
                    : (adm.admittingDoctor?.user?.name || 'Dr. Consultant');

                  return (
                    <View key={adm.id} style={styles.card}>
                      <View style={styles.ipdHead}>
                        <View>
                          <Text style={styles.patientName}>{patientName}</Text>
                          <Text style={styles.uhidText}>UHID: {adm.patient?.uhid || adm.patientId}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            {
                              backgroundColor:
                                adm.status === 'ADMITTED' ? '#CCFBF1' : '#F1F5F9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              {
                                color:
                                  adm.status === 'ADMITTED' ? '#0F766E' : '#64748B',
                              },
                            ]}
                          >
                            {adm.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ipdDetailBox}>
                        <Text style={styles.ipdDetailText}>
                          🛏️ Ward: {adm.ward?.name || 'General Ward'} • Bed {adm.bed?.bedNumber || '-'}
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          👨‍⚕️ Attending: {doctorName}
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          📋 Diagnosis: {adm.initialDiagnosis || adm.admissionReason || 'Clinical Evaluation'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: OPD QUEUE */}
          {activeTab === 'opd' && (
            <View>
              {/* Status Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['ALL', 'SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.opdFilterChip,
                      opdStatusFilter === st && styles.opdFilterChipActive,
                    ]}
                    onPress={() => setOpdStatusFilter(st)}
                  >
                    <Text
                      style={[
                        styles.opdFilterChipText,
                        opdStatusFilter === st && styles.opdFilterChipTextActive,
                      ]}
                    >
                      {st.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {queue.filter((q) => opdStatusFilter === 'ALL' || q.status === opdStatusFilter).length === 0 ? (
                <Text style={styles.emptyText}>No OPD appointments match criteria.</Text>
              ) : (
                queue
                  .filter((q) => opdStatusFilter === 'ALL' || q.status === opdStatusFilter)
                  .map((q: any) => {
                    const qPatient = q.patient
                      ? `${q.patient.firstName || ''} ${q.patient.lastName || ''}`.trim()
                      : (q.patientName || 'Patient');
                    const qDoctor = q.doctor?.employee?.user
                      ? `Dr. ${q.doctor.employee.user.firstName} ${q.doctor.employee.user.lastName}`.trim()
                      : (q.doctor?.user?.name || 'Consultant');
                    const canModify = q.status !== 'CANCELLED' && q.status !== 'COMPLETED';

                    return (
                      <View key={q.id} style={styles.card}>
                        <View style={styles.queueRow}>
                          <View style={styles.tokenCircle}>
                            <Text style={styles.tokenText}>#{q.tokenNumber || q.id.slice(0, 4)}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.patientName}>{qPatient}</Text>
                            <Text style={styles.queueMeta}>
                              {q.department?.name || 'OPD'} • {qDoctor}
                            </Text>
                            <Text style={styles.queueTime}>Time: {q.slotTime || q.appointmentTime || 'Scheduled'}</Text>
                          </View>
                          <View style={styles.opdBadge}>
                            <Text style={styles.opdBadgeText}>{q.status}</Text>
                          </View>
                        </View>

                        {canModify && (
                          <View style={styles.opdActionsRow}>
                            <TouchableOpacity
                              style={styles.opdActionBtn}
                              onPress={() => {
                                setRescheduleModal(q);
                                setReschedDate(
                                  q.appointmentDate ? new Date(q.appointmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                                );
                                setReschedTime(q.slotTime || q.appointmentTime || '10:00');
                              }}
                            >
                              <Edit2 size={13} color="#0F766E" />
                              <Text style={styles.opdActionBtnText}>Reschedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.opdActionBtn, { borderColor: '#FECDD3' }]}
                              onPress={() => {
                                setCancelModal(q);
                                setCancelReason('');
                              }}
                            >
                              <Ban size={13} color="#DC2626" />
                              <Text style={[styles.opdActionBtnText, { color: '#DC2626' }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Reschedule Modal */}
      <Modal visible={!!rescheduleModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>New Appointment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              value={reschedDate}
              onChangeText={setReschedDate}
            />

            <Text style={styles.fieldLabel}>New Slot Time (HH:MM)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10:00"
              value={reschedTime}
              onChangeText={setReschedTime}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleReschedule}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Reschedule</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={!!cancelModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <TouchableOpacity onPress={() => setCancelModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Cancellation Reason</Text>
            <TextInput
              style={[styles.fieldInput, { height: 70 }]}
              placeholder="e.g. Doctor emergency leave / Patient request"
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleCancel}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Cancellation</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F766E',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F766E',
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
  wardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  wardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  occBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wardStat: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  bedMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  bedChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bedChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bedChipOcc: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  bedChipTextOcc: {
    color: '#E11D48',
  },
  bedChipMaint: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bedChipTextMaint: {
    color: '#D97706',
  },
  ipdHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  uhidText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ipdDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 4,
  },
  ipdDetailText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  queueMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  queueTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  opdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  opdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  opdFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  opdFilterChipActive: {
    backgroundColor: '#0F766E',
  },
  opdFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  opdFilterChipTextActive: {
    color: '#FFFFFF',
  },
  opdActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  opdActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  opdActionBtnText: {
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

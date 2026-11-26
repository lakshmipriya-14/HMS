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
  Plus,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  Wrench,
  UserCheck,
  CheckSquare,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

type Tab = 'beds' | 'ipd' | 'opd';

export default function AdminOperationsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('beds');
  const [wards, setWards] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [opdStatusFilter, setOpdStatusFilter] = useState('ALL');

  // OPD Modals
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('10:00');
  const [cancelModal, setCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [bookAppointmentModal, setBookAppointmentModal] = useState(false);
  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookPatientName, setBookPatientName] = useState('');
  const [bookPatientPhone, setBookPatientPhone] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('10:00');
  const [bookReason, setBookReason] = useState('');

  // IPD Modals
  const [newAdmissionModal, setNewAdmissionModal] = useState(false);
  const [admPatientId, setAdmPatientId] = useState('');
  const [admDoctorId, setAdmDoctorId] = useState('');
  const [admWardId, setAdmWardId] = useState('');
  const [admBedId, setAdmBedId] = useState('');
  const [admDiagnosis, setAdmDiagnosis] = useState('');
  const [admReason, setAdmReason] = useState('Inpatient clinical care');

  const [transferModal, setTransferModal] = useState<any>(null);
  const [targetWardId, setTargetWardId] = useState('');
  const [targetBedId, setTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('Medical necessity');

  const [dischargeModal, setDischargeModal] = useState<any>(null);
  const [dischargeSummary, setDischargeSummary] = useState('');

  // Bed Status Modal
  const [bedStatusModal, setBedStatusModal] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [wardRes, admRes, qRes, docRes, deptRes, patRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getWards(),
        mobileApiClient.hospitalAdmin.getAdmissions(),
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getDoctors().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getDepartments().catch(() => ({ data: [] })),
        mobileApiClient.hospitalAdmin.getPatients({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      if (wardRes.data) setWards(wardRes.data);
      if (admRes.data) setAdmissions(admRes.data);
      if (qRes.data) setQueue(qRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (patRes.data) setPatients(patRes.data);
    } catch (e) {
      console.error('Failed to load operational data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // OPD Actions
  const handleCheckIn = async (appointmentId: string) => {
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.checkIn(appointmentId);
      Alert.alert('Checked In', 'Patient marked checked in for consultation.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Check-In Error', err.message || 'Failed to check in appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      setSubmitting(true);
      await mobileApiClient.appointments.updateStatus(appointmentId, status);
      Alert.alert('Status Updated', `Appointment moved to ${status}.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update appointment status');
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleBookAppointment = async () => {
    if (!bookDoctorId || !bookDate || !bookTime) {
      Alert.alert('Required Fields', 'Please select a doctor, date, and appointment time.');
      return;
    }
    try {
      setSubmitting(true);
      const doc = doctors.find((d) => d.id === bookDoctorId);
      await mobileApiClient.appointments.book({
        doctorId: bookDoctorId,
        departmentId: doc?.departmentId || departments[0]?.id,
        appointmentDate: bookDate,
        appointmentTime: bookTime,
        reason: bookReason || 'Routine consultation',
        patientName: bookPatientName || undefined,
        patientPhone: bookPatientPhone || undefined,
      });
      setBookAppointmentModal(false);
      setBookPatientName('');
      setBookPatientPhone('');
      setBookReason('');
      Alert.alert('Success', 'OPD Appointment booked and token generated.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // IPD Actions
  const handleAdmitPatient = async () => {
    if (!admPatientId || !admDoctorId || !admWardId || !admBedId) {
      Alert.alert('Incomplete Form', 'Please select patient, doctor, ward, and bed.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.admitPatient({
        patientId: admPatientId,
        admittingDoctorId: admDoctorId,
        wardId: admWardId,
        bedId: admBedId,
        admissionReason: admReason || 'Inpatient medical observation',
        initialDiagnosis: admDiagnosis || 'Clinical investigation',
        admittedAt: new Date().toISOString(),
      });
      setNewAdmissionModal(false);
      setAdmPatientId('');
      setAdmDiagnosis('');
      setAdmBedId('');
      Alert.alert('Admitted', 'Inpatient admission completed successfully.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Admission Error', err.message || 'Failed to admit patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferBed = async () => {
    if (!transferModal || !targetWardId || !targetBedId) {
      Alert.alert('Select Bed', 'Please choose destination ward and available bed.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.transferBed(transferModal.id, {
        targetWardId,
        targetBedId,
        reason: transferReason,
      });
      setTransferModal(null);
      setTargetWardId('');
      setTargetBedId('');
      Alert.alert('Transferred', 'Patient transferred. Prior bed moved to housekeeping.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Transfer Error', err.message || 'Failed to transfer bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargePatient = async () => {
    if (!dischargeModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.dischargePatient(dischargeModal.id, {
        dischargeSummary: dischargeSummary || 'Patient clinically stable for discharge',
        dischargedAt: new Date().toISOString(),
      });
      setDischargeModal(null);
      setDischargeSummary('');
      Alert.alert('Discharged', 'Patient discharged. Bed released for housekeeping.');
      await loadData();
    } catch (err: any) {
      Alert.alert('Discharge Error', err.message || 'Failed to discharge patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAdmission = (adm: any) => {
    Alert.alert(
      'Cancel Admission',
      `Cancel admission for ${adm.patient?.firstName || 'patient'}? Bed will be released back to AVAILABLE.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.cancelAdmission(adm.id, 'Administrative cancellation');
              Alert.alert('Cancelled', 'Admission cancelled and bed released.');
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel admission');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateBedStatus = async (status: string) => {
    if (!bedStatusModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateBedStatus(bedStatusModal.id, status);
      setBedStatusModal(null);
      Alert.alert('Success', `Bed status updated to ${status}.`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: available beds in selected ward
  const availableBedsForWard = (wardId: string) => {
    const ward = wards.find((w) => w.id === wardId);
    return (ward?.beds || []).filter((b: any) => b.status === 'AVAILABLE');
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Clinical Operations" subtitle="OPD Live Queue, IPD Census & Bed Matrix" />

      {/* Segmented Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'beds' && styles.tabItemActive]}
          onPress={() => setActiveTab('beds')}
        >
          <BedDouble size={16} color={activeTab === 'beds' ? '#38845A' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'beds' && styles.tabLabelActive]}>
            Bed Census
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ipd' && styles.tabItemActive]}
          onPress={() => setActiveTab('ipd')}
        >
          <Users size={16} color={activeTab === 'ipd' ? '#38845A' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'ipd' && styles.tabLabelActive]}>
            IPD Inpatients ({admissions.filter((a) => a.status === 'ADMITTED').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'opd' && styles.tabItemActive]}
          onPress={() => setActiveTab('opd')}
        >
          <CalendarCheck size={16} color={activeTab === 'opd' ? '#38845A' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'opd' && styles.tabLabelActive]}>
            OPD Flow ({queue.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#38845A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#38845A" />
          }
        >
          {/* TAB 1: BED CENSUS */}
          {activeTab === 'beds' && (
            <View>
              {wards.map((ward) => {
                const totalBeds = ward.beds?.length || ward.totalBeds || 0;
                const occBeds = ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0;
                const cleanBeds = ward.beds?.filter((b: any) => b.status === 'HOUSEKEEPING' || b.status === 'CLEANING').length || 0;
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
                            backgroundColor: occRate > 85 ? '#E11D48' : '#38845A',
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.wardStat}>
                      {occBeds} occupied / {totalBeds} total beds ({totalBeds - occBeds} available
                      {cleanBeds > 0 ? `, ${cleanBeds} cleaning` : ''})
                    </Text>

                    {/* Beds Grid with Tap Action */}
                    <View style={styles.bedMiniGrid}>
                      {(ward.beds || []).map((b: any) => {
                        const isOcc = b.status === 'OCCUPIED';
                        const isMaint = b.status === 'MAINTENANCE';
                        const isClean = b.status === 'HOUSEKEEPING' || b.status === 'CLEANING';

                        return (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => setBedStatusModal(b)}
                            style={[
                              styles.bedChip,
                              isOcc && styles.bedChipOcc,
                              isMaint && styles.bedChipMaint,
                              isClean && styles.bedChipClean,
                            ]}
                          >
                            <Text
                              style={[
                                styles.bedChipText,
                                isOcc && styles.bedChipTextOcc,
                                isMaint && styles.bedChipTextMaint,
                                isClean && styles.bedChipTextClean,
                              ]}
                            >
                              Bed {b.bedNumber}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {wards.length === 0 && (
                <Text style={styles.emptyText}>No wards registered in hospital.</Text>
              )}
            </View>
          )}

          {/* TAB 2: INPATIENT IPD */}
          {activeTab === 'ipd' && (
            <View>
              {/* Header Action Button */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => {
                  setAdmPatientId(patients[0]?.id || '');
                  setAdmDoctorId(doctors[0]?.id || '');
                  setAdmWardId(wards[0]?.id || '');
                  setNewAdmissionModal(true);
                }}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>New Inpatient Admission</Text>
              </TouchableOpacity>

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
                  const isAdmitted = adm.status === 'ADMITTED';

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
                              backgroundColor: isAdmitted ? '#EAF5ED' : '#F1F5F9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              {
                                color: isAdmitted ? '#38845A' : '#64748B',
                              },
                            ]}
                          >
                            {adm.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ipdDetailBox}>
                        <Text style={styles.ipdDetailText}>
                          🛏️ Ward: {adm.ward?.name || 'General Ward'} • Bed {adm.bed?.bedNumber || '-'} (Rm {adm.bed?.roomNumber || '-'})
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          👨‍⚕️ Attending: {doctorName}
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          📋 Diagnosis: {adm.initialDiagnosis || adm.admissionReason || 'Clinical Evaluation'}
                        </Text>
                      </View>

                      {/* IPD Care Actions */}
                      {isAdmitted && (
                        <View style={styles.opdActionsRow}>
                          <TouchableOpacity
                            style={styles.opdActionBtn}
                            onPress={() => {
                              setTransferModal(adm);
                              setTargetWardId(wards[0]?.id || '');
                              setTargetBedId('');
                            }}
                          >
                            <ArrowRightLeft size={13} color="#4F46E5" />
                            <Text style={[styles.opdActionBtnText, { color: '#4F46E5' }]}>Transfer Bed</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.opdActionBtn, { borderColor: '#FECDD3' }]}
                            onPress={() => {
                              setDischargeModal(adm);
                              setDischargeSummary('');
                            }}
                          >
                            <LogOut size={13} color="#DC2626" />
                            <Text style={[styles.opdActionBtnText, { color: '#DC2626' }]}>Discharge</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.opdActionBtn, { borderColor: '#E2E8F0' }]}
                            onPress={() => handleCancelAdmission(adm)}
                          >
                            <Ban size={13} color="#64748B" />
                            <Text style={[styles.opdActionBtnText, { color: '#64748B' }]}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: OPD QUEUE */}
          {activeTab === 'opd' && (
            <View>
              {/* Header Action Button */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => {
                  setBookDoctorId(doctors[0]?.id || '');
                  setBookAppointmentModal(true);
                }}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Book OPD Appointment</Text>
              </TouchableOpacity>

              {/* Status Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['ALL', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
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
                    const isSched = q.status === 'SCHEDULED';
                    const isChecked = q.status === 'CHECKED_IN';
                    const isInProgress = q.status === 'IN_PROGRESS';
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

                        {/* Status Advancement Actions */}
                        {canModify && (
                          <View style={styles.opdActionsRow}>
                            {isSched && (
                              <TouchableOpacity
                                style={[styles.opdActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                                onPress={() => handleCheckIn(q.id)}
                              >
                                <CheckCircle size={13} color="#16A34A" />
                                <Text style={[styles.opdActionBtnText, { color: '#16A34A' }]}>Check-In</Text>
                              </TouchableOpacity>
                            )}

                            {isChecked && (
                              <TouchableOpacity
                                style={[styles.opdActionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                                onPress={() => handleUpdateAppointmentStatus(q.id, 'IN_PROGRESS')}
                              >
                                <Clock size={13} color="#2563EB" />
                                <Text style={[styles.opdActionBtnText, { color: '#2563EB' }]}>Start Consult</Text>
                              </TouchableOpacity>
                            )}

                            {isInProgress && (
                              <TouchableOpacity
                                style={[styles.opdActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                                onPress={() => handleUpdateAppointmentStatus(q.id, 'COMPLETED')}
                              >
                                <CheckSquare size={13} color="#16A34A" />
                                <Text style={[styles.opdActionBtnText, { color: '#16A34A' }]}>Complete</Text>
                              </TouchableOpacity>
                            )}

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
                              <Edit2 size={13} color="#38845A" />
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

      {/* ========================================================================= */}
      {/* MODAL: RESCHEDULE APPOINTMENT                                            */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: CANCEL APPOINTMENT                                                */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: BOOK NEW OPD APPOINTMENT                                          */}
      {/* ========================================================================= */}
      <Modal visible={bookAppointmentModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Book OPD Appointment</Text>
              <TouchableOpacity onPress={() => setBookAppointmentModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Attending Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {doctors.map((d) => {
                const name = d.employee?.user
                  ? `Dr. ${d.employee.user.firstName} ${d.employee.user.lastName}`
                  : 'Doctor';
                const isSelected = bookDoctorId === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setBookDoctorId(d.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Patient Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Patient Name"
              value={bookPatientName}
              onChangeText={setBookPatientName}
            />

            <Text style={styles.fieldLabel}>Patient Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10-digit Phone"
              keyboardType="phone-pad"
              value={bookPatientPhone}
              onChangeText={setBookPatientPhone}
            />

            <Text style={styles.fieldLabel}>Appointment Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              value={bookDate}
              onChangeText={setBookDate}
            />

            <Text style={styles.fieldLabel}>Slot Time (e.g. 10:00, 11:30)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="10:00"
              value={bookTime}
              onChangeText={setBookTime}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleBookAppointment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Generate Appointment Token</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NEW INPATIENT ADMISSION                                           */}
      {/* ========================================================================= */}
      <Modal visible={newAdmissionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Inpatient Admission</Text>
              <TouchableOpacity onPress={() => setNewAdmissionModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Patient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {patients.slice(0, 8).map((p) => {
                const isSelected = admPatientId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setAdmPatientId(p.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {p.firstName} {p.lastName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Ward</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {wards.map((w) => {
                const isSelected = admWardId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setAdmWardId(w.id);
                      setAdmBedId('');
                    }}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Available Bed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {availableBedsForWard(admWardId).map((b: any) => {
                const isSelected = admBedId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setAdmBedId(b.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      Rm {b.roomNumber} - Bed {b.bedNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {availableBedsForWard(admWardId).length === 0 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', padding: 4 }}>No available beds in this ward</Text>
              )}
            </ScrollView>

            <Text style={styles.fieldLabel}>Initial Diagnosis</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Acute Appendicitis, Fever..."
              value={admDiagnosis}
              onChangeText={setAdmDiagnosis}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAdmitPatient}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Inpatient Admission</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: TRANSFER INPATIENT BED                                            */}
      {/* ========================================================================= */}
      <Modal visible={!!transferModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Transfer Inpatient Bed</Text>
              <TouchableOpacity onPress={() => setTransferModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#38845A', fontWeight: '700', marginBottom: 12 }}>
              Patient: {transferModal?.patient?.firstName} {transferModal?.patient?.lastName}
            </Text>

            <Text style={styles.fieldLabel}>Select Target Ward</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {wards.map((w) => {
                const isSelected = targetWardId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setTargetWardId(w.id);
                      setTargetBedId('');
                    }}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Select Target Available Bed</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {availableBedsForWard(targetWardId).map((b: any) => {
                const isSelected = targetBedId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setTargetBedId(b.id)}
                    style={[styles.chipSelect, isSelected && styles.chipSelectActive]}
                  >
                    <Text style={[styles.chipSelectText, isSelected && styles.chipSelectTextActive]}>
                      Bed {b.bedNumber} (Rm {b.roomNumber})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Transfer Reason</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Medical necessity / ICU stepdown"
              value={transferReason}
              onChangeText={setTransferReason}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#4F46E5' }]}
              onPress={handleTransferBed}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Bed Transfer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DISCHARGE INPATIENT                                               */}
      {/* ========================================================================= */}
      <Modal visible={!!dischargeModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Inpatient Discharge</Text>
              <TouchableOpacity onPress={() => setDischargeModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '700', marginBottom: 12 }}>
              Patient: {dischargeModal?.patient?.firstName} {dischargeModal?.patient?.lastName} (Ward: {dischargeModal?.ward?.name})
            </Text>

            <Text style={styles.fieldLabel}>Discharge Summary / Clinical Instructions</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80 }]}
              placeholder="Patient clinically stable. Instructions given."
              multiline
              value={dischargeSummary}
              onChangeText={setDischargeSummary}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleDischargePatient}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign Clearances & Discharge</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: QUICK BED STATUS UPDATE                                           */}
      {/* ========================================================================= */}
      <Modal visible={!!bedStatusModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                Bed {bedStatusModal?.bedNumber} (Rm {bedStatusModal?.roomNumber})
              </Text>
              <TouchableOpacity onPress={() => setBedStatusModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              Current Status: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{bedStatusModal?.status}</Text>
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={() => handleUpdateBedStatus('AVAILABLE')}
              >
                <CheckCircle size={16} color="#059669" />
                <Text style={[styles.quickStatusBtnText, { color: '#059669' }]}>Mark AVAILABLE (Cleaned)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                onPress={() => handleUpdateBedStatus('HOUSEKEEPING')}
              >
                <Sparkles size={16} color="#D97706" />
                <Text style={[styles.quickStatusBtnText, { color: '#D97706' }]}>Mark HOUSEKEEPING (Cleaning)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickStatusBtn, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}
                onPress={() => handleUpdateBedStatus('MAINTENANCE')}
              >
                <Wrench size={16} color="#475569" />
                <Text style={[styles.quickStatusBtnText, { color: '#475569' }]}>Mark MAINTENANCE</Text>
              </TouchableOpacity>
            </View>
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
    borderBottomColor: '#38845A',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#38845A',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38845A',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
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
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38845A',
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
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  bedChipTextMaint: {
    color: '#475569',
  },
  bedChipClean: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bedChipTextClean: {
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
    backgroundColor: '#EAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38845A',
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
    backgroundColor: '#38845A',
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
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  opdActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAF5ED',
  },
  opdActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
  },
  chipSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  chipSelectActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  chipSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipSelectTextActive: {
    color: '#38845A',
    fontWeight: '700',
  },
  quickStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

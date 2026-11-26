import { Link } from 'expo-router';
import { UyirinaiTheme } from '../../constants/theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  FileText,
  Activity,
  Plus,
  Trash2,
  X,
  History,
  Pill,
  Calendar,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function DoctorOPDQueueScreen() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [queueError, setQueueError] = useState('');
  const [starting, setStarting] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('ALL');

  // Consultation Modal State
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'ORDERS' | 'RX' | 'HISTORY'>('NOTES');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<{ id: string; chiefComplaint: string; diagnosisNotes: string; treatmentPlan: string;
    amendments: { id: string; reason: string; note: string; createdAt: string }[] } | null>(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentNote, setAmendmentNote] = useState('');
  const [savingAmendment, setSavingAmendment] = useState(false);
  const [followDate, setFollowDate] = useState('');
  const [followTime, setFollowTime] = useState('');
  const [followInstructions, setFollowInstructions] = useState('');
  const [bookingFollowUp, setBookingFollowUp] = useState(false);
  const scheduleFollowUp = async () => {
    if (!summary || bookingFollowUp) return;
    setBookingFollowUp(true);
    try {
      await apiRequest(`/consultations/${encodeURIComponent(summary.id)}/follow-ups`, {
        method: 'POST', body: { date: followDate.trim(), time: followTime.trim(), instructions: followInstructions },
      });
      setFollowDate('');
      setFollowTime('');
      setFollowInstructions('');
      Alert.alert('Follow-up scheduled', 'The linked appointment is available in Patient History.');
    } catch (error) {
      Alert.alert('Follow-up could not be scheduled', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBookingFollowUp(false);
    }
  };

  const loadSummary = async (appointmentId: string) => {
    try {
      const response = await apiRequest(`/consultations/appointment/${encodeURIComponent(appointmentId)}`);
      if (!response.data) throw new Error('No finalized consultation is available.');
      setSummary(response.data);
      setFollowDate('');
      setFollowTime('');
      setFollowInstructions('');
      setAmendmentReason('');
      setAmendmentNote('');
    } catch (error) {
      Alert.alert('Could not load consultation', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const addAmendment = async () => {
    if (!summary || savingAmendment || !amendmentReason.trim() || !amendmentNote.trim()) return;
    setSavingAmendment(true);
    try {
      const response = await apiRequest(`/consultations/${encodeURIComponent(summary.id)}/amendments`, {
        method: 'POST', body: { reason: amendmentReason, note: amendmentNote },
      });
      setSummary({ ...summary, amendments: [...summary.amendments, response.data] });
      setAmendmentReason('');
      setAmendmentNote('');
    } catch (error) {
      Alert.alert('Amendment could not be saved', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSavingAmendment(false);
    }
  };

  // Clinical Consultation Fields
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [icd10, setIcd10] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [admissionRecommended, setAdmissionRecommended] = useState(false);
  const [admissionNotes, setAdmissionNotes] = useState('');

  // Diagnostic Orders Fields
  const [labCatalogue, setLabCatalogue] = useState<any[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [labPriority, setLabPriority] = useState<'ROUTINE' | 'STAT'>('ROUTINE');
  const [labNotes, setLabNotes] = useState('');

  const [radCatalogue, setRadCatalogue] = useState<any[]>([]);
  const [selectedRadId, setSelectedRadId] = useState<string>('');
  const [radPriority, setRadPriority] = useState<'ROUTINE' | 'STAT'>('ROUTINE');
  const [radIndication, setRadIndication] = useState('');

  // Prescription Items
  const [rxItems, setRxItems] = useState<any[]>([]);
  const [newMedName, setNewMedName] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<{ id: string; brandName: string; strength: string } | null>(null);
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [newMedDays, setNewMedDays] = useState('');
  const [newMedInstr, setNewMedInstr] = useState('');
  const [medicines, setMedicines] = useState<{ id: string; brandName: string; strength: string }[]>([]);
  const [medicineError, setMedicineError] = useState('');

  useEffect(() => {
    setMedicineError('');
    setMedicines([]);
    if (!consultModalOpen || activeTab !== 'RX' || selectedMedicine || newMedName.trim().length < 2) return;
    let current = true;
    const timer = setTimeout(() => {
      apiRequest('/prescriptions/medicines', { params: { search: newMedName.trim() } }).then(
        (result) => { if (current) setMedicines(result.data ?? []); },
        (error: Error) => { if (current) setMedicineError(error.message); },
      );
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [consultModalOpen, activeTab, selectedMedicine, newMedName]);

  // Past History
  const [pastConsultations, setPastConsultations] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch live queue from backend
  const fetchQueue = async () => {
    setLoading(true);
    setQueueError('');
    try {
      const res = await apiRequest('/appointments/queue');
      setQueue(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      setQueue([]);
      setQueueError(error instanceof Error ? error.message : 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch catalogues
  const fetchCatalogues = async () => {
    try {
      const labRes = await apiRequest('/laboratory/tests');
      if (labRes?.data && Array.isArray(labRes.data) && labRes.data.length > 0) {
        setLabCatalogue(labRes.data);
      }
    } catch {}

    try {
      const radRes = await apiRequest('/radiology/tests');
      if (radRes?.data && Array.isArray(radRes.data) && radRes.data.length > 0) {
        setRadCatalogue(radRes.data);
      }
    } catch {}
  };

  useEffect(() => {
    void fetchQueue();
    void fetchCatalogues();
  }, []);

  // Open consultation modal and prefill patient details
  const startConsultation = async (appointment: any) => {
    if (starting) return;
    setStarting(true);
    let draft: any;
    try {
      await apiRequest(`/appointments/${encodeURIComponent(appointment.id)}/start-consultation`, { method: 'POST' });
      const response = await apiRequest(`/consultations/appointment/${encodeURIComponent(appointment.id)}/draft`);
      draft = response.data;
    } catch (error) {
      Alert.alert('Could not start consultation', error instanceof Error ? error.message : 'Please try again.');
      return;
    } finally {
      setStarting(false);
    }
    await fetchQueue();
    setSelectedAppointment(appointment);
    setChiefComplaint(draft?.chiefComplaint ?? appointment.reasonForVisit ?? '');
    setHpi(draft?.historyOfPresentIllness ?? '');
    setPhysicalExam(draft?.physicalExamNotes ?? '');
    setDiagnosisNotes(draft?.diagnosisNotes ?? '');
    setIcd10(draft?.icd10Codes?.join(', ') ?? '');
    setTreatmentPlan(draft?.treatmentPlan ?? '');
    setAdmissionRecommended(draft?.admissionRecommended ?? false);
    setAdmissionNotes('');
    setSelectedLabIds([]);
    setLabPriority('ROUTINE');
    setLabNotes('');
    setSelectedRadId('');
    setRadPriority('ROUTINE');
    setRadIndication('');
    setRxItems([]);
    setSelectedMedicine(null);
    setNewMedName('');
    setNewMedDose('');
    setNewMedFreq('');
    setNewMedDays('');
    setNewMedInstr('');
    setPastConsultations([]);
    setActiveTab('NOTES');
    setConsultModalOpen(true);

    // Fetch past history
    if (appointment?.patient?.id) {
      setHistoryLoading(true);
      apiRequest(`/consultations/patient/${appointment.patient.id}`)
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setPastConsultations(res.data);
          }
        })
        .catch(() => setPastConsultations([]))
        .finally(() => setHistoryLoading(false));
    }
  };

  // Add medicine row to prescription
  const addRxItem = () => {
    const durationDays = Number(newMedDays);
    if (!selectedMedicine || !newMedDose.trim() || !newMedFreq.trim() || !Number.isSafeInteger(durationDays) || durationDays < 1) {
      Alert.alert('Incomplete prescription', 'Select a catalogue medicine and enter dosage, frequency and a positive number of days.');
      return;
    }
    setRxItems((previous) => [...previous, {
      medicineId: selectedMedicine.id,
      medicineName: `${selectedMedicine.brandName} ${selectedMedicine.strength}`,
      dosage: newMedDose.trim(), frequency: newMedFreq.trim(), durationDays, instructions: newMedInstr.trim(),
    }]);
    setSelectedMedicine(null);
    setNewMedName('');
  };

  const removeRxItem = (index: number) => {
    setRxItems((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLabTest = (id: string) => {
    setSelectedLabIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const consultationFields = () => ({
    appointmentId: selectedAppointment.id,
    patientId: selectedAppointment.patient?.id ?? selectedAppointment.patientId,
    doctorId: user?.doctorProfileId,
    chiefComplaint, historyOfPresentIllness: hpi, physicalExaminationNotes: physicalExam,
    diagnosisNotes, icd10Codes: icd10.split(',').map((code) => code.trim()).filter(Boolean),
    treatmentPlan, admissionRecommended,
  });

  const saveDraft = async () => {
    if (!selectedAppointment || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest('/consultations/draft', { method: 'POST', body: consultationFields() });
      Alert.alert('Draft saved', 'Clinical notes are saved. Orders and prescriptions are sent only when finalized.');
    } catch (error) {
      Alert.alert('Draft could not be saved', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Complete and submit clinical consultation
  const submitConsultation = async () => {
    if (!selectedAppointment || submitting || !user?.doctorProfileId) return;
    setSubmitting(true);

    const patientId = selectedAppointment.patient?.id || selectedAppointment.patientId;
    const doctorId = user.doctorProfileId;
    const failedOrders: string[] = [];

    try {
      // 1. Submit Consultation Note
      const completed = await apiRequest('/consultations', {
        method: 'POST',
        body: consultationFields(),
      });

      // 2. Submit Lab Order if tests selected
      if (selectedLabIds.length > 0) {
        try {
          await apiRequest('/laboratory/orders', {
            method: 'POST',
            body: {
              patientId,
              doctorId,
              priority: labPriority,
              clinicalNotes: labNotes || diagnosisNotes,
              testIds: selectedLabIds,
            },
          });
        } catch (err: any) {
          failedOrders.push('laboratory');
        }
      }

      // 3. Submit Radiology Order if scan selected
      if (selectedRadId) {
        try {
          await apiRequest('/radiology/orders', {
            method: 'POST',
            body: {
              patientId,
              doctorId,
              testId: selectedRadId,
              priority: radPriority,
              clinicalIndication: radIndication || diagnosisNotes,
            },
          });
        } catch (err: any) {
          failedOrders.push('radiology');
        }
      }

      // 4. Submit Electronic Prescription if items exist
      if (rxItems.length > 0) {
        try {
          await apiRequest('/prescriptions', {
            method: 'POST',
            body: {
              patientId,
              doctorId,
              consultationId: completed.data?.id,
              notes: treatmentPlan,
              items: rxItems.map((item) => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                durationDays: item.durationDays,
                instructions: item.instructions,
                route: 'Oral',
              })),
            },
          });
        } catch (err: any) {
          failedOrders.push('prescription');
        }
      }

      setConsultModalOpen(false);
      await fetchQueue();
      Alert.alert('Consultation saved', failedOrders.length
        ? `These requests could not be saved: ${failedOrders.join(', ')}.`
        : 'The consultation and any selected requests were saved.');
    } catch (error) {
      Alert.alert('Consultation could not be saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'WAITING') return item.status === 'WAITING' || item.status === 'CHECKED_IN';
    if (filter === 'IN_CONSULTATION') return item.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return item.status === 'COMPLETED';
    return true;
  });

  const waitingCount = queue.filter((q) => q.status !== 'COMPLETED').length;
  const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;

  return (
    <ScrollView style={styles.container}>
      {/* Doctor Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>OPD Consultation Clinic</Text>
          <TouchableOpacity onPress={fetchQueue} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerSub}>
          {user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. K. Senthil Nathan, MD, DM'} • Room 204
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{queue.length}</Text>
            <Text style={styles.statLabel}>Today's Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{waitingCount}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Queue Filter Bar */}
      <View style={styles.filterBar}>
        {(['ALL', 'WAITING', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterChipText, filter === tab && styles.filterChipTextActive]}>
              {tab === 'ALL' ? 'All Patients' : tab === 'WAITING' ? 'Waiting / Checked In' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Patient Queue Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's OPD Queue ({filteredQueue.length})</Text>

        {loading && <ActivityIndicator accessibilityLabel="Loading appointments" />}
        {!!queueError && <Text accessibilityRole="alert">{queueError}</Text>}
        {!loading && !queueError && filteredQueue.length === 0 && <Text>No appointments match this view.</Text>}
        {filteredQueue.map((item) => {
          const patient = item.patient || {};
          const isDone = item.status === 'COMPLETED';
          const token = item.tokenNumber ? `T-${item.tokenNumber}` : 'T-Queue';

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.tokenBadge, isDone && styles.tokenBadgeDone]}>
                  <Text style={[styles.tokenText, isDone && styles.tokenTextDone]}>{token}</Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={styles.patientName}>
                    {patient.firstName} {patient.lastName}
                  </Text>
                  <Text style={styles.patientMeta}>
                    UHID: {patient.uhid || 'KZN-2026-XXXX'} • {patient.gender || 'M'} • {item.appointmentTime}
                  </Text>
                </View>
              </View>

              <Text style={styles.reasonText}>
                <Text style={styles.boldLabel}>Chief Complaint: </Text>
                {item.reasonForVisit || 'Regular consultation'}
              </Text>

              {patient.allergies && patient.allergies.length > 0 && (
                <View style={styles.allergyWarning}>
                  <AlertCircle size={13} color="#B91C1C" />
                  <Text style={styles.allergyText}>
                    Allergies: {patient.allergies.join(', ')}
                  </Text>
                </View>
              )}

              {!!patient.id && <Link href={{ pathname: '/(doctor)/patient-history', params: { id: patient.id } }}
                style={styles.sectionTitle}>View patient history</Link>}
              <View style={styles.cardActions}>
                <View
                  style={[
                    styles.statusTag,
                    isDone ? styles.statusCompleted : styles.statusWaiting,
                  ]}
                >
                  <Text style={[styles.statusTagText, isDone ? styles.textCompleted : styles.textWaiting]}>
                    {String(item.status).replace(/_/g, ' ')}
                  </Text>
                </View>

                {['CHECKED_IN', 'IN_PROGRESS'].includes(item.status) ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    disabled={starting}
                    onPress={() => void startConsultation(item)}
                  >
                    <Stethoscope size={15} color="#fff" />
                    <Text style={styles.actionBtnText}>Open Consult</Text>
                    <ChevronRight size={15} color="#fff" />
                  </TouchableOpacity>
                ) : isDone ? (
                  <TouchableOpacity style={styles.doneIndicator} accessibilityRole="button" onPress={() => void loadSummary(item.id)}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.doneText}>View consultation</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* FULL-FEATURED CLINICAL CONSULTATION MODAL */}
      <Modal visible={!!summary} animationType="slide" onRequestClose={() => setSummary(null)}>
        <ScrollView contentContainerStyle={styles.summaryPage}>
          <Text style={styles.sectionTitle}>Finalized consultation</Text>
          <Text>Chief complaint: {summary?.chiefComplaint}</Text>
          <Text>Diagnosis: {summary?.diagnosisNotes}</Text>
          <Text>Treatment plan: {summary?.treatmentPlan}</Text>
          <Text style={styles.sectionTitle}>Amendments</Text>
          {summary?.amendments.map((item) => <View key={item.id} style={styles.summaryNote}>
            <Text>{item.reason} · {new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text>{item.note}</Text>
          </View>)}
          {user?.permissions.includes('CONSULTATIONS:UPDATE') && <>
            <TextInput style={styles.modalInput} accessibilityLabel="Amendment reason" placeholder="Reason for amendment"
              value={amendmentReason} onChangeText={setAmendmentReason} maxLength={500} />
            <TextInput style={styles.modalInput} accessibilityLabel="Amendment note" placeholder="Amendment note"
              value={amendmentNote} onChangeText={setAmendmentNote} multiline maxLength={8000} />
            <TouchableOpacity style={styles.actionBtn} disabled={savingAmendment || !amendmentReason.trim() || !amendmentNote.trim()}
              accessibilityRole="button" onPress={() => void addAmendment()}>
              <Text style={styles.actionBtnText}>{savingAmendment ? 'Saving…' : 'Add amendment'}</Text>
            </TouchableOpacity>
          </>}
          {user?.permissions.includes('APPOINTMENTS:UPDATE') && <>
            <Text style={styles.sectionTitle}>Schedule follow-up</Text>
            <TextInput style={styles.modalInput} accessibilityLabel="Follow-up date" placeholder="YYYY-MM-DD" value={followDate} onChangeText={setFollowDate} />
            <TextInput style={styles.modalInput} accessibilityLabel="Follow-up time" placeholder="HH:mm" value={followTime} onChangeText={setFollowTime} />
            <TextInput style={styles.modalInput} accessibilityLabel="Follow-up instructions" placeholder="Follow-up instructions"
              value={followInstructions} onChangeText={setFollowInstructions} multiline maxLength={2000} />
            <TouchableOpacity style={styles.actionBtn} accessibilityRole="button"
              disabled={bookingFollowUp || !followDate.trim() || !followTime.trim() || !followInstructions.trim()}
              onPress={() => void scheduleFollowUp()}>
              <Text style={styles.actionBtnText}>{bookingFollowUp ? 'Scheduling…' : 'Schedule follow-up'}</Text>
            </TouchableOpacity>
          </>}
          <TouchableOpacity accessibilityRole="button" disabled={savingAmendment || bookingFollowUp} onPress={() => setSummary(null)}>
            <Text style={styles.sectionTitle}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <Modal visible={consultModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>
                Consultation: {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName}
              </Text>
              <Text style={styles.modalHeaderSub}>
                UHID: {selectedAppointment?.patient?.uhid} • Token: T-{selectedAppointment?.tokenNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setConsultModalOpen(false)} style={styles.closeBtn}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Consultation Tabs Bar */}
          <View style={styles.modalTabBar}>
            <TouchableOpacity
              style={[styles.modalTab, activeTab === 'NOTES' && styles.modalTabActive]}
              onPress={() => setActiveTab('NOTES')}
            >
              <FileText size={16} color={activeTab === 'NOTES' ? UyirinaiTheme.colors.primary : '#64748B'} />
              <Text style={[styles.modalTabText, activeTab === 'NOTES' && styles.modalTabTextActive]}>
                Clinical Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalTab, activeTab === 'ORDERS' && styles.modalTabActive]}
              onPress={() => setActiveTab('ORDERS')}
            >
              <Activity size={16} color={activeTab === 'ORDERS' ? UyirinaiTheme.colors.primary : '#64748B'} />
              <Text style={[styles.modalTabText, activeTab === 'ORDERS' && styles.modalTabTextActive]}>
                Lab & Scans ({selectedLabIds.length + (selectedRadId ? 1 : 0)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalTab, activeTab === 'RX' && styles.modalTabActive]}
              onPress={() => setActiveTab('RX')}
            >
              <Pill size={16} color={activeTab === 'RX' ? UyirinaiTheme.colors.primary : '#64748B'} />
              <Text style={[styles.modalTabText, activeTab === 'RX' && styles.modalTabTextActive]}>
                Rx Pad ({rxItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalTab, activeTab === 'HISTORY' && styles.modalTabActive]}
              onPress={() => setActiveTab('HISTORY')}
            >
              <History size={16} color={activeTab === 'HISTORY' ? UyirinaiTheme.colors.primary : '#64748B'} />
              <Text style={[styles.modalTabText, activeTab === 'HISTORY' && styles.modalTabTextActive]}>
                Past History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Tab Content */}
          <ScrollView style={styles.modalScroll}>
            {/* TAB 1: CLINICAL NOTES */}
            {activeTab === 'NOTES' && (
              <View style={styles.tabContent}>
                <Text style={styles.inputLabel}>Chief Complaint</Text>
                <TextInput
                  style={styles.modalInput}
                  value={chiefComplaint}
                  onChangeText={setChiefComplaint}
                  placeholder="e.g. Chest discomfort, palpitations"
                />

                <Text style={styles.inputLabel}>History of Present Illness (HPI)</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={hpi}
                  onChangeText={setHpi}
                  multiline
                  placeholder="Duration, intensity, onset, relieving factors"
                />

                <Text style={styles.inputLabel}>Physical Examination & Vitals Review</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={physicalExam}
                  onChangeText={setPhysicalExam}
                  multiline
                  placeholder="Systemic examination findings..."
                />

                <Text style={styles.inputLabel}>Diagnosis & ICD-10 Classification</Text>
                <TextInput
                  style={styles.modalInput}
                  value={diagnosisNotes}
                  onChangeText={setDiagnosisNotes}
                  placeholder="Provisional or confirmed diagnosis"
                />
                <TextInput
                  style={[styles.modalInput, { backgroundColor: '#F1F5F9', marginTop: 4 }]}
                  value={icd10}
                  onChangeText={setIcd10}
                  placeholder="ICD-10 Code"
                />

                <Text style={styles.inputLabel}>Clinical Treatment Plan & Advice</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={treatmentPlan}
                  onChangeText={setTreatmentPlan}
                  multiline
                  placeholder="Doctor recommendations, lifestyle advice, diet..."
                />

                {/* Inpatient Admission Trigger */}
                <View style={styles.admissionCard}>
                  <TouchableOpacity
                    style={styles.admissionToggleRow}
                    onPress={() => setAdmissionRecommended(!admissionRecommended)}
                  >
                    <View style={[styles.checkbox, admissionRecommended && styles.checkboxActive]}>
                      {admissionRecommended && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.admissionToggleText}>Recommend Inpatient (IPD) Admission</Text>
                  </TouchableOpacity>

                  {admissionRecommended && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.subLabel}>Admission Indication & Ward Notes</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={admissionNotes}
                        onChangeText={setAdmissionNotes}
                        placeholder="e.g. Admit to Coronary Care Unit (CCU) for continuous telemetry"
                      />
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 2: INVESTIGATION ORDERS (LAB & RADIOLOGY) */}
            {activeTab === 'ORDERS' && (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeaderBox}>
                  <Text style={styles.sectionHeaderTitle}>Laboratory Investigations (Pathology)</Text>
                  <Text style={styles.sectionHeaderSub}>
                    Orders auto-route to Central Lab worklist & billing
                  </Text>
                </View>

                {/* Priority Selector */}
                <View style={styles.priorityRow}>
                  <Text style={styles.subLabel}>Order Priority:</Text>
                  <TouchableOpacity
                    style={[styles.priorityPill, labPriority === 'ROUTINE' && styles.priorityPillActive]}
                    onPress={() => setLabPriority('ROUTINE')}
                  >
                    <Text style={[styles.priorityPillText, labPriority === 'ROUTINE' && styles.priorityPillTextActive]}>
                      ROUTINE
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priorityPill, labPriority === 'STAT' && styles.priorityPillStat]}
                    onPress={() => setLabPriority('STAT')}
                  >
                    <Text style={[styles.priorityPillText, labPriority === 'STAT' && styles.priorityPillTextStat]}>
                      STAT / URGENT
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Lab Tests Catalogue List */}
                <View style={styles.testList}>
                  {labCatalogue.map((test) => {
                    const isSelected = selectedLabIds.includes(test.id);
                    return (
                      <TouchableOpacity
                        key={test.id}
                        style={[styles.testItem, isSelected && styles.testItemActive]}
                        onPress={() => toggleLabTest(test.id)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && <Check size={14} color="#fff" />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.testName}>{test.name ?? test.testName}</Text>
                          <Text style={styles.testMeta}>
                            Code: {test.testCode || 'LAB'} • {test.category || 'General'} • ₹{test.price || 400}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.modalInput, { marginTop: 10 }]}
                  placeholder="Special instructions for phlebotomist / lab..."
                  value={labNotes}
                  onChangeText={setLabNotes}
                />

                {/* RADIOLOGY SCANS */}
                <View style={[styles.sectionHeaderBox, { marginTop: 24 }]}>
                  <Text style={styles.sectionHeaderTitle}>Radiology & Specialized Imaging</Text>
                  <Text style={styles.sectionHeaderSub}>
                    Directly schedules scan in modality queue
                  </Text>
                </View>

                <View style={styles.testList}>
                  {radCatalogue.map((scan) => {
                    const isSelected = selectedRadId === scan.id;
                    return (
                      <TouchableOpacity
                        key={scan.id}
                        style={[styles.testItem, isSelected && styles.testItemActive]}
                        onPress={() => setSelectedRadId(isSelected ? '' : scan.id)}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && <Check size={14} color="#fff" />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.testName}>{scan.name ?? scan.testName}</Text>
                          <Text style={styles.testMeta}>
                            Modality: {scan.modality} • Code: {scan.testCode} • ₹{scan.price || 500}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.modalInput, { marginTop: 10 }]}
                  placeholder="Clinical indication for radiologist (e.g. Cardiomegaly evaluation)"
                  value={radIndication}
                  onChangeText={setRadIndication}
                />
              </View>
            )}

            {/* TAB 3: ELECTRONIC PRESCRIPTION (RX) */}
            {activeTab === 'RX' && (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeaderBox}>
                  <Text style={styles.sectionHeaderTitle}>Prescribed Medications</Text>
                  <Text style={styles.sectionHeaderSub}>
                    Directly sent to Hospital Pharmacy dispensing queue
                  </Text>
                </View>

                {/* Current Rx Items */}
                {rxItems.map((rx, idx) => (
                  <View key={idx} style={styles.rxCard}>
                    <View style={styles.rxCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rxDrugName}>{rx.medicineName}</Text>
                        <Text style={styles.rxDetails}>
                          Dosage: {rx.dosage} • Frequency: {rx.frequency} • Duration: {rx.durationDays} Days
                        </Text>
                        <Text style={styles.rxInstructions}>Instructions: {rx.instructions}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeRxItem(idx)} style={styles.deleteRxBtn}>
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add New Medicine Block */}
                <View style={styles.addMedBox}>
                  <Text style={styles.subLabel}>Add Another Medicine</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Drug Name & Strength (e.g. Atorvastatin 20mg)"
                    value={newMedName}
                    onChangeText={(value) => { setSelectedMedicine(null); setNewMedName(value); }}
                  />
                  {!!medicineError && <Text accessibilityRole="alert">{medicineError}</Text>}
                  {medicines.map((item) => (
                    <TouchableOpacity key={item.id} accessibilityRole="button" style={styles.modalInput}
                      onPress={() => { setSelectedMedicine(item); setNewMedName(`${item.brandName} ${item.strength}`); }}>
                      <Text>{item.brandName} · {item.strength}</Text>
                    </TouchableOpacity>
                  ))}


                  <View style={styles.grid2}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Dosage</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 1 Tab"
                        value={newMedDose}
                        onChangeText={setNewMedDose}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Frequency</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 1-0-1"
                        value={newMedFreq}
                        onChangeText={setNewMedFreq}
                      />
                    </View>
                  </View>

                  <View style={styles.grid2}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Duration (Days)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 10"
                        keyboardType="numeric"
                        value={newMedDays}
                        onChangeText={setNewMedDays}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Instruction</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. After food"
                        value={newMedInstr}
                        onChangeText={setNewMedInstr}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.addMedBtn} onPress={addRxItem}>
                    <Plus size={16} color="#38845A" />
                    <Text style={styles.addMedBtnText}>Add Item to Prescription</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 4: PAST MEDICAL HISTORY */}
            {activeTab === 'HISTORY' && (
              <View style={styles.tabContent}>
                <View style={styles.sectionHeaderBox}>
                  <Text style={styles.sectionHeaderTitle}>Patient Consultation History</Text>
                  <Text style={styles.sectionHeaderSub}>
                    Previous diagnoses, prescriptions, and physician round notes
                  </Text>
                </View>

                {historyLoading ? (
                  <ActivityIndicator size="small" color="#38845A" style={{ marginVertical: 20 }} />
                ) : pastConsultations.length > 0 ? (
                  pastConsultations.map((c) => (
                    <View key={c.id} style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <Text style={styles.historyDate}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Previous Visit'}
                        </Text>
                        <Text style={styles.historyDoc}>
                          {c.doctor?.employee?.user
                            ? `Dr. ${c.doctor.employee.user.firstName} ${c.doctor.employee.user.lastName}`
                            : 'Consulting Physician'}
                        </Text>
                      </View>
                      <Text style={styles.historyComplaint}>
                        <Text style={styles.boldLabel}>Complaint: </Text>
                        {c.chiefComplaint}
                      </Text>
                      <Text style={styles.historyDiagnosis}>
                        <Text style={styles.boldLabel}>Diagnosis: </Text>
                        {c.diagnosisNotes}
                      </Text>
                      {c.treatmentPlan && (
                        <Text style={styles.historyPlan}>
                          <Text style={styles.boldLabel}>Plan: </Text>
                          {c.treatmentPlan}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyHistoryBox}>
                    <Calendar size={28} color="#94A3B8" />
                    <Text style={styles.emptyHistoryText}>
                      No previous digital consultations recorded for this patient.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Modal Footer Action Button */}
          <View style={styles.modalFooter}>
            {user?.permissions.includes('CONSULTATIONS:UPDATE') && (
              <TouchableOpacity style={styles.draftButton} accessibilityRole="button" disabled={submitting} onPress={() => void saveDraft()}>
                <Text style={styles.sectionTitle}>Save draft</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.completeBtn}
              onPress={submitConsultation}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#fff" />
                  <Text style={styles.completeBtnText}>
                    Sign & Dispatch Consultation (Rx + Lab + Scans)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryPage: { backgroundColor: '#fff', padding: 20, gap: 12, flexGrow: 1 },
  summaryNote: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 },
  draftButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', marginBottom: 8 },

  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: UyirinaiTheme.colors.primary, padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#134E4A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  refreshText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  bannerSub: { color: '#CDE8D5', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#EAF5ED', fontSize: 11, marginTop: 2 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: UyirinaiTheme.colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  tokenBadge: { backgroundColor: '#EAF5ED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 12 },
  tokenBadgeDone: { backgroundColor: '#E2E8F0' },
  tokenText: { color: UyirinaiTheme.colors.primary, fontWeight: '800', fontSize: 15 },
  tokenTextDone: { color: '#64748B' },
  nameBlock: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  patientMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  reasonText: { fontSize: 13, color: '#334155', marginTop: 10 },
  boldLabel: { fontWeight: '700', color: '#0F172A' },
  allergyWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginTop: 8, gap: 6 },
  allergyText: { fontSize: 12, color: '#B91C1C', fontWeight: '600' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusWaiting: { backgroundColor: '#FEF3C7' },
  statusCompleted: { backgroundColor: '#D1FAE5' },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  textWaiting: { color: '#92400E' },
  textCompleted: { color: '#065F46' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: UyirinaiTheme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  doneIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: { fontSize: 12, color: '#059669', fontWeight: '600' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: UyirinaiTheme.colors.primary, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalHeaderSub: { color: '#CDE8D5', fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  modalTabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modalTabActive: { borderBottomColor: UyirinaiTheme.colors.primary },
  modalTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  modalTabTextActive: { color: UyirinaiTheme.colors.primary, fontWeight: '700' },
  modalScroll: { flex: 1 },
  tabContent: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 10, marginBottom: 4 },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  modalInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  admissionCard: { backgroundColor: '#EAF5ED', borderWidth: 1, borderColor: '#CDE8D5', borderRadius: 10, padding: 12, marginTop: 16 },
  admissionToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  admissionToggleText: { fontSize: 13, fontWeight: '700', color: UyirinaiTheme.colors.primary },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: UyirinaiTheme.colors.primary, borderColor: UyirinaiTheme.colors.primary },

  // Orders styles
  sectionHeaderBox: { marginBottom: 12 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  sectionHeaderSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  priorityPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#E2E8F0' },
  priorityPillActive: { backgroundColor: UyirinaiTheme.colors.primary },
  priorityPillStat: { backgroundColor: '#DC2626' },
  priorityPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  priorityPillTextActive: { color: '#fff' },
  priorityPillTextStat: { color: '#fff' },
  testList: { gap: 8 },
  testItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 8 },
  testItemActive: { borderColor: UyirinaiTheme.colors.primary, backgroundColor: '#EAF5ED' },
  testName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  testMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Rx styles
  rxCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 10 },
  rxCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rxDrugName: { fontSize: 15, fontWeight: '700', color: UyirinaiTheme.colors.primary },
  rxDetails: { fontSize: 12, color: '#334155', marginTop: 4, fontWeight: '500' },
  rxInstructions: { fontSize: 12, color: '#64748B', marginTop: 2, fontStyle: 'italic' },
  deleteRxBtn: { padding: 4 },
  addMedBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginTop: 10 },
  grid2: { flexDirection: 'row', gap: 10, marginTop: 6 },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF5ED', paddingVertical: 10, borderRadius: 8, marginTop: 12, gap: 6 },
  addMedBtnText: { color: UyirinaiTheme.colors.primary, fontSize: 13, fontWeight: '700' },

  // History styles
  historyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 10 },
  historyCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyDate: { fontSize: 12, fontWeight: '700', color: UyirinaiTheme.colors.primary },
  historyDoc: { fontSize: 12, color: '#64748B' },
  historyComplaint: { fontSize: 13, color: '#334155' },
  historyDiagnosis: { fontSize: 13, color: '#0F172A', marginTop: 4 },
  historyPlan: { fontSize: 12, color: '#64748B', marginTop: 4 },
  emptyHistoryBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },
  emptyHistoryText: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  // Footer Action
  modalFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: UyirinaiTheme.colors.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

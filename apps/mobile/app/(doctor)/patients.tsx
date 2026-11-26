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
  BedDouble,
  Activity,
  AlertCircle,
  FileText,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  User,
  HeartPulse,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function DoctorInpatientsScreen() {
  const { user } = useAuth();
  const [inpatients, setInpatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Round Note Modal State
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [progressNote, setProgressNote] = useState('');
  const [diagnosisUpdate, setDiagnosisUpdate] = useState('');
  const [treatmentPlanUpdate, setTreatmentPlanUpdate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchInpatients = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await mobileApiClient.doctor.getInpatients();
      setInpatients(response.data ?? []);
    } catch (error) {
      setInpatients([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load inpatients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInpatients();
  }, []);

  const openRoundModal = (adm: any) => {
    setSelectedAdmission(adm);
    setProgressNote('');
    setDiagnosisUpdate('');
    setTreatmentPlanUpdate('');
    setFollowUpInstructions('');
    setRoundModalOpen(true);
  };

  const submitRoundNote = async () => {
    if (!selectedAdmission || !progressNote.trim() || savingNote) return;
    setSavingNote(true);

    try {
      await mobileApiClient.doctor.saveRound({
        admissionId: selectedAdmission.id, progressNote,
        diagnosisUpdate: diagnosisUpdate || undefined,
        treatmentPlanUpdate: treatmentPlanUpdate || undefined,
        followUpInstructions: followUpInstructions || undefined,
      });
      setRoundModalOpen(false);
      await fetchInpatients();
      Alert.alert('Round note saved', 'The progress note was recorded.');
    } catch (error) {
      Alert.alert('Round note could not be saved', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const reviewNeededCount = inpatients.filter(
    (p) => p.vitals?.[0]?.isAbnormal === true
  ).length;

  return (
    <ScrollView style={styles.container}>
      {/* Ward Census Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Inpatient Ward Census</Text>
          <TouchableOpacity onPress={fetchInpatients} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerSub}>
          {inpatients.length} Admitted Patients Assigned to {user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. K. Senthil Nathan'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{inpatients.length}</Text>
            <Text style={styles.statLabel}>Total Inpatients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{reviewNeededCount}</Text>
            <Text style={styles.statLabel}>Review Needed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {inpatients.length - reviewNeededCount}
            </Text>
            <Text style={styles.statLabel}>No abnormal vitals flagged</Text>
          </View>
        </View>
      </View>

      {/* Inpatient Cards List */}
      <View style={styles.list}>
        {loading && <ActivityIndicator accessibilityLabel="Loading inpatients" />}
        {!!loadError && <Text accessibilityRole="alert">{loadError}</Text>}
        {!loading && !loadError && inpatients.length === 0 && <Text>No active inpatient assignments.</Text>}
        {inpatients.map((adm) => {
          const vital = adm.vitals?.[0];
          const vitalsSummary = vital ? [
            vital.systolicBp != null && vital.diastolicBp != null ? `BP ${vital.systolicBp}/${vital.diastolicBp}` : null,
            vital.pulseRate != null ? `Pulse ${vital.pulseRate}` : null,
            vital.oxygenSaturation != null ? `SpO₂ ${vital.oxygenSaturation}%` : null,
          ].filter(Boolean).join(' · ') : '';
          const patient = adm.patient || {};
          const isReview = adm.vitals?.[0]?.isAbnormal === true;
          const bedCode = adm.bed?.bedNumber || 'Bed-TBD';
          const wardName = adm.ward?.name || 'Inpatient Ward';

          return (
            <View key={adm.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.bedBadge}>
                  <BedDouble size={16} color="#38845A" />
                  <Text style={styles.bedText}>{bedCode}</Text>
                  <Text style={styles.wardText}>• {wardName}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isReview ? styles.statusAlert : styles.statusOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isReview ? styles.alertText : styles.okText,
                    ]}
                  >
                    {isReview ? 'Review Needed' : 'Admitted'}
                  </Text>
                </View>
              </View>

              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
                <Text style={styles.patientSubMeta}>
                  {' '}
                  ({patient.gender === 'FEMALE' ? 'F' : 'M'}, UHID: {patient.uhid})
                </Text>
              </Text>

              <Text style={styles.diagnosis}>
                <Text style={styles.boldLabel}>Diagnosis: </Text>
                {adm.initialDiagnosis}
              </Text>

              {vitalsSummary && (
                <View style={styles.vitalsBox}>
                  <Activity size={14} color="#38845A" />
                  <Text style={styles.vitalsText}>{vitalsSummary}</Text>
                </View>
              )}

              {!!patient.id && <Link href={{ pathname: '/(doctor)/patient-history', params: { id: patient.id } }}
                style={styles.historyLink}>View patient history</Link>}
              {adm.latestProgressNote && (
                <View style={styles.noteBox}>
                  <FileText size={13} color="#475569" />
                  <Text style={styles.noteText} numberOfLines={2}>
                    <Text style={styles.boldLabel}>Latest Note: </Text>
                    {adm.latestProgressNote}
                  </Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.roundBtn}
                  onPress={() => openRoundModal(adm)}
                >
                  <HeartPulse size={16} color="#fff" />
                  <Text style={styles.roundBtnText}>Record Daily Round Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* DAILY ROUND PROGRESS NOTE MODAL */}
      <Modal visible={roundModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalHeaderTitle}>
                Doctor Round Note: {selectedAdmission?.patient?.firstName} {selectedAdmission?.patient?.lastName}
              </Text>
              <Text style={styles.modalHeaderSub}>
                {selectedAdmission?.bed?.bedNumber} • {selectedAdmission?.ward?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setRoundModalOpen(false)}
              style={styles.closeBtn}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              <Text style={styles.inputLabel}>
                Clinical Observation & Progress Findings *
              </Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={progressNote}
                onChangeText={setProgressNote}
                multiline
                placeholder="Physical examination, subjective complaints, hemodynamic stability..."
              />

              <Text style={styles.inputLabel}>Updated Diagnosis (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={diagnosisUpdate}
                onChangeText={setDiagnosisUpdate}
                placeholder="e.g. Post PTCA Day 2 - stable rhythm"
              />

              <Text style={styles.inputLabel}>
                Treatment Plan & Medication Directives
              </Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={treatmentPlanUpdate}
                onChangeText={setTreatmentPlanUpdate}
                multiline
                placeholder="Updates to IV fluids, oral drugs, diet, mobilization..."
              />

              <Text style={styles.inputLabel}>Nursing Handover Instructions</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={followUpInstructions}
                onChangeText={setFollowUpInstructions}
                multiline
                placeholder="Instructions for shift nurse, critical escalation parameters..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.saveNoteBtn}
              onPress={submitRoundNote}
              disabled={savingNote}
            >
              {savingNote ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#fff" />
                  <Text style={styles.saveNoteBtnText}>
                    Sign & Save Doctor Round Note
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
  historyLink: { color: UyirinaiTheme.colors.primary, fontWeight: '700', paddingVertical: 8 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: UyirinaiTheme.colors.primary, padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#134E4A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  refreshText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  bannerSub: { color: '#CDE8D5', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#EAF5ED', fontSize: 11, marginTop: 2 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5ED', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  bedText: { color: UyirinaiTheme.colors.primary, fontSize: 13, fontWeight: '800', marginLeft: 6 },
  wardText: { color: UyirinaiTheme.colors.primary, fontSize: 11, marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusOk: { backgroundColor: '#D1FAE5' },
  statusAlert: { backgroundColor: '#EAF5ED' },
  statusText: { fontSize: 11, fontWeight: '600' },
  okText: { color: '#065F46' },
  alertText: { color: '#991B1B' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  patientSubMeta: { fontSize: 12, color: '#64748B', fontWeight: '400' },
  diagnosis: { fontSize: 13, color: '#334155', marginTop: 4 },
  boldLabel: { fontWeight: '700', color: '#0F172A' },
  vitalsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 8, borderRadius: 8, marginTop: 10 },
  vitalsText: { fontSize: 12, color: '#334155', fontWeight: '500', marginLeft: 6 },
  noteBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  noteText: { fontSize: 12, color: '#475569', flex: 1 },
  actionRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  roundBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: UyirinaiTheme.colors.primary, paddingVertical: 10, borderRadius: 8, gap: 6 },
  roundBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: UyirinaiTheme.colors.primary, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalHeaderSub: { color: '#CDE8D5', fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  modalScroll: { flex: 1 },
  formPadding: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 6 },
  modalInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  modalFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveNoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: UyirinaiTheme.colors.primary, paddingVertical: 14, borderRadius: 10, gap: 8 },
  saveNoteBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});


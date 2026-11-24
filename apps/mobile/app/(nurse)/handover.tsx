import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  FileText,
  Send,
  History,
} from 'lucide-react-native';

interface HandoverRecord {
  id: string;
  fromNurse: string;
  toNurse: string;
  shift: string;
  date: string;
  criticalPatientsSummary: string;
  pendingMedsSummary: string;
  pendingVitalsSummary: string;
  doctorInstructionsSummary: string;
  escalations: string;
  status: 'PENDING_ACKNOWLEDGEMENT' | 'ACKNOWLEDGED';
  acknowledgedAt?: string;
}

const INITIAL_HANDOVERS: HandoverRecord[] = [
  {
    id: 'ho-1',
    fromNurse: 'Sister Kavitha (Night Shift)',
    toNurse: 'Sister Anitha (Day Shift)',
    shift: 'Night (12:00 AM - 08:00 AM) ➔ Day (08:00 AM - 04:00 PM)',
    date: 'Today, 08:00 AM',
    criticalPatientsSummary: 'Muthuvel K. (Bed ICCU-01) had BP spike to 142/92 around 06:00 AM. Sorbitrate given. Stabilized.',
    pendingMedsSummary: 'Inj. Mixtard due at 12:30 PM for Bed SDW-04 (Meenakshi).',
    pendingVitalsSummary: 'Q4H neuro check for Bed ORTHO-12 (Saravanan).',
    doctorInstructionsSummary: 'Dr. Senthil Nathan ordered repeat 12-lead ECG for ICCU-01 at 04:00 PM.',
    escalations: 'B-02 suction unit cleaned and calibrated for incoming admission.',
    status: 'ACKNOWLEDGED',
    acknowledgedAt: 'Today, 08:15 AM',
  },
];

export default function NurseShiftHandoverScreen() {
  const { user } = useAuth();
  const [handovers, setHandovers] = useState<HandoverRecord[]>(INITIAL_HANDOVERS);
  const [activeTab, setActiveTab] = useState<'NEW_HANDOVER' | 'HISTORY'>('NEW_HANDOVER');

  // Form states
  const [targetShift, setTargetShift] = useState('Evening Shift (04:00 PM - 12:00 AM)');
  const [incomingNurse, setIncomingNurse] = useState('Sister Preethi (Duty Staff)');
  const [criticalSummary, setCriticalSummary] = useState(
    'Bed ICCU-01 (Muthuvel K): BP fluctuating between 136-142 systolic. Watch for angina or dyspnea.'
  );
  const [pendingMeds, setPendingMeds] = useState(
    'Bed ICCU-01: Tab. Atorvastatin 20mg due at 09:00 PM.\nBed ORTHO-12: Tab. Cefuroxime 500mg due at 01:00 PM.'
  );
  const [pendingVitals, setPendingVitals] = useState(
    'Pre-dinner GRBS check for Bed SDW-04 at 07:30 PM.'
  );
  const [doctorInstructions, setDoctorInstructions] = useState(
    'Dr. Rajesh Kumar requested cardiology cross-consultation review note for Bed SDW-04.'
  );
  const [escalation, setEscalation] = useState('No urgent maintenance escalations. Defibrillator self-check passed.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitHandover = () => {
    if (!criticalSummary.trim() || !pendingMeds.trim()) {
      Alert.alert('Required', 'Please document critical patient and pending medication handover details.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newEntry: HandoverRecord = {
        id: `ho-${Date.now()}`,
        fromNurse: `${user?.firstName || 'Staff'} ${user?.lastName || 'Nurse'} (Day Shift)`,
        toNurse: incomingNurse,
        shift: `Day Shift ➔ ${targetShift}`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        criticalPatientsSummary: criticalSummary.trim(),
        pendingMedsSummary: pendingMeds.trim(),
        pendingVitalsSummary: pendingVitals.trim(),
        doctorInstructionsSummary: doctorInstructions.trim(),
        escalations: escalation.trim(),
        status: 'PENDING_ACKNOWLEDGEMENT',
      };

      setHandovers([newEntry, ...handovers]);
      setIsSubmitting(false);
      setActiveTab('HISTORY');
      Alert.alert('Handover Logged', 'Digital nursing handover committed. Incoming shift nurse notified to review and acknowledge.');
    }, 600);
  };

  const handleAcknowledge = (id: string) => {
    setHandovers((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              status: 'ACKNOWLEDGED',
              acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : h
      )
    );
    Alert.alert('Handover Acknowledged', 'You have accepted care responsibility for this ward shift.');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Top Banner */}
      <View style={styles.banner}>
        <RotateCcw size={20} color="#0F766E" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.bannerTitle}>Digital Nursing Shift Handover</Text>
          <Text style={styles.bannerSub}>Continuity of patient care, medication, and clinical escalations</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'NEW_HANDOVER' && styles.tabActive]}
          onPress={() => setActiveTab('NEW_HANDOVER')}
        >
          <Text style={[styles.tabText, activeTab === 'NEW_HANDOVER' && styles.tabTextActive]}>
            Prepare Handover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'HISTORY' && styles.tabActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>
            Handover Log ({handovers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'NEW_HANDOVER' ? (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Outgoing Shift Documentation</Text>

          <Text style={styles.fieldLabel}>Incoming Shift</Text>
          <TextInput style={styles.input} value={targetShift} onChangeText={setTargetShift} />

          <Text style={styles.fieldLabel}>Relieving Sister / Nurse</Text>
          <TextInput style={styles.input} value={incomingNurse} onChangeText={setIncomingNurse} />

          <Text style={styles.fieldLabel}>1. Critical & High-Risk Patients *</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            multiline
            numberOfLines={3}
            value={criticalSummary}
            onChangeText={setCriticalSummary}
          />

          <Text style={styles.fieldLabel}>2. Pending Medication Administrations (MAR) *</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            multiline
            numberOfLines={3}
            value={pendingMeds}
            onChangeText={setPendingMeds}
          />

          <Text style={styles.fieldLabel}>3. Pending Vitals & Blood Glucose Checks</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            multiline
            numberOfLines={2}
            value={pendingVitals}
            onChangeText={setPendingVitals}
          />

          <Text style={styles.fieldLabel}>4. New Doctor Orders & Special Instructions</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            multiline
            numberOfLines={2}
            value={doctorInstructions}
            onChangeText={setDoctorInstructions}
          />

          <Text style={styles.fieldLabel}>5. Equipment & Ward Escalations</Text>
          <TextInput
            style={styles.input}
            value={escalation}
            onChangeText={setEscalation}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitHandover} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit & Transfer Shift Handover</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyList}>
          {handovers.map((h) => (
            <View key={h.id} style={styles.handoverCard}>
              <View style={styles.hTop}>
                <View style={styles.badgeShift}><Text style={styles.badgeShiftText}>{h.shift}</Text></View>
                <Text style={styles.hDate}>{h.date}</Text>
              </View>

              <Text style={styles.hStaff}>From: {h.fromNurse} ➔ To: {h.toNurse}</Text>

              <View style={styles.hSection}>
                <Text style={styles.hLabel}>Critical Patients:</Text>
                <Text style={styles.hVal}>{h.criticalPatientsSummary}</Text>
              </View>

              <View style={styles.hSection}>
                <Text style={styles.hLabel}>Pending Meds & Vitals:</Text>
                <Text style={styles.hVal}>{h.pendingMedsSummary}</Text>
              </View>

              <View style={styles.hSection}>
                <Text style={styles.hLabel}>Doctor Orders:</Text>
                <Text style={styles.hVal}>{h.doctorInstructionsSummary}</Text>
              </View>

              {h.status === 'PENDING_ACKNOWLEDGEMENT' ? (
                <TouchableOpacity style={styles.ackBtn} onPress={() => handleAcknowledge(h.id)}>
                  <CheckCircle2 size={16} color="#fff" />
                  <Text style={styles.ackBtnText}>Acknowledge & Accept Shift Responsibility</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ackBox}>
                  <CheckCircle2 size={14} color="#059669" />
                  <Text style={styles.ackText}>Handover Acknowledged at {h.acknowledgedAt}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', padding: 14, borderRadius: 12, marginBottom: 12 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#0F766E' },
  bannerSub: { fontSize: 11, color: '#115E59', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#0F766E' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 },
  cardHeader: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 12, backgroundColor: '#F8FAFC', color: '#0F172A' },
  submitBtn: { backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  historyList: { gap: 12 },
  handoverCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  hTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeShift: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeShiftText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  hDate: { fontSize: 10, color: '#64748B' },
  hStaff: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  hSection: { marginBottom: 8 },
  hLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800' },
  hVal: { fontSize: 12, color: '#334155', marginTop: 1, lineHeight: 16 },
  ackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 10, borderRadius: 8, gap: 6, marginTop: 8 },
  ackBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ackBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginTop: 8 },
  ackText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
});


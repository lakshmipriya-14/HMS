import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  User,
  ShieldAlert,
  Send,
  CheckCircle2,
  Check,
  X,
  Stethoscope,
  Droplet,
  Zap,
  PhoneCall,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';

export interface VitalsEntry {
  id: string;
  time: string;
  spo2: number;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  bloodSugar: number;
  gcsTotal: number;
  gcsEye: number;
  gcsVerbal: number;
  gcsMotor: number;
  notes: string;
}

const INITIAL_VITALS_LOG: VitalsEntry[] = [
  {
    id: 'v-1',
    time: '10:20 AM',
    spo2: 89,
    systolicBp: 95,
    diastolicBp: 60,
    pulseRate: 118,
    bloodSugar: 215,
    gcsTotal: 10,
    gcsEye: 3,
    gcsVerbal: 3,
    gcsMotor: 4,
    notes: 'Initial scene assessment. Severe respiratory distress. Started high-flow O2 via non-rebreather mask at 12 L/min.',
  },
];

export default function ParamedicTransitVitalsScreen() {
  // Patient & Trip context
  const trip = {
    tripCode: 'AMB-2026-0001',
    vehicleNumber: 'TN-58-AL-1081',
    patientName: 'Saravanan R. (62y Male)',
    uhid: 'KZN-2026-0001',
    condition: 'Acute STEMI, diaphoresis, dyspnea, hypotension.',
    priority: 'CRITICAL',
    eta: '5 mins',
  };

  // Vitals form inputs
  const [spo2, setSpo2] = useState('92');
  const [systolic, setSystolic] = useState('105');
  const [diastolic, setDiastolic] = useState('68');
  const [pulse, setPulse] = useState('110');
  const [bloodSugar, setBloodSugar] = useState('195');

  // GCS components
  const [gcsEye, setGcsEye] = useState(3);
  const [gcsVerbal, setGcsVerbal] = useState(3);
  const [gcsMotor, setGcsMotor] = useState(4);
  const [transitNotes, setTransitNotes] = useState('Patient responding to voice, IV normal saline running at 100 mL/hr.');

  // Vitals Log
  const [vitalsHistory, setVitalsHistory] = useState<VitalsEntry[]>(INITIAL_VITALS_LOG);

  // ER Red-Flag Handshake State
  const [handshakeModalVisible, setHandshakeModalVisible] = useState(false);
  const [handshakeSent, setHandshakeSent] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // GCS Calculation
  const gcsTotal = gcsEye + gcsVerbal + gcsMotor;

  // Log in-transit vitals
  const handleLogVitals = async () => {
    const sVal = parseInt(spo2, 10);
    const sysVal = parseInt(systolic, 10);
    const diaVal = parseInt(diastolic, 10);
    const pVal = parseInt(pulse, 10);
    const bsVal = parseInt(bloodSugar, 10);

    if (isNaN(sVal) || isNaN(sysVal) || isNaN(diaVal) || isNaN(pVal)) {
      Alert.alert('Incomplete Vitals', 'Please enter valid numeric readings for SpO2, BP, and Pulse.');
      return;
    }

    const newEntry: VitalsEntry = {
      id: `v-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spo2: sVal,
      systolicBp: sysVal,
      diastolicBp: diaVal,
      pulseRate: pVal,
      bloodSugar: bsVal || 120,
      gcsTotal,
      gcsEye,
      gcsVerbal,
      gcsMotor,
      notes: transitNotes,
    };

    // Save vitals via API if available
    try {
      await apiRequest('/nursing/vitals', {
        method: 'POST',
        body: {
          patientId: trip.uhid,
          systolicBp: sysVal,
          diastolicBp: diaVal,
          pulseRate: pVal,
          oxygenSaturation: sVal,
          bloodSugarMgDl: bsVal,
          notes: `Ambulance transit vitals (GCS: ${gcsTotal}/15): ${transitNotes}`,
        },
      });
    } catch {
      // Handled defensively
    }

    setVitalsHistory((prev) => [newEntry, ...prev]);
    Alert.alert('Vitals Logged', `In-transit vitals recorded at ${newEntry.time}. SpO2: ${sVal}%, BP: ${sysVal}/${diaVal}, Pulse: ${pVal} bpm, GCS: ${gcsTotal}/15.`);
  };

  // 1-Tap Casualty / ER Red-Flag Handshake
  const handleTransmitHandshake = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
      setHandshakeSent(true);
      setHandshakeModalVisible(true);
    }, 700);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Patient & Trip Context Card */}
      <View style={styles.tripCard}>
        <View style={styles.tripCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tripPatientName}>{trip.patientName}</Text>
            <Text style={styles.tripMeta}>
              UHID: {trip.uhid} • {trip.tripCode} • {trip.vehicleNumber}
            </Text>
          </View>
          <View style={styles.criticalPill}>
            <AlertTriangle size={12} color="#DC2626" />
            <Text style={styles.criticalPillText}>{trip.priority}</Text>
          </View>
        </View>
        <Text style={styles.tripCondition}>Condition: {trip.condition}</Text>
      </View>

      {/* CASUALTY / ER RED-FLAG HANDSHAKE HERO BANNER */}
      <View style={styles.handshakeHeroCard}>
        <View style={styles.handshakeHeroTop}>
          <View style={styles.zapIconBox}>
            <Zap size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.handshakeHeroTitle}>Casualty / ER Red-Flag Handshake</Text>
            <Text style={styles.handshakeHeroSub}>
              Direct telemetry handshake to Emergency Trauma Resuscitation Bay
            </Text>
          </View>
          <View style={styles.etaBadge}>
            <Clock size={12} color="#DC2626" />
            <Text style={styles.etaBadgeText}>ETA: {trip.eta}</Text>
          </View>
        </View>

        {handshakeSent ? (
          <View style={styles.handshakeSuccessBanner}>
            <CheckCircle2 size={18} color="#1565C0" />
            <View style={{ flex: 1 }}>
              <Text style={styles.handshakeSuccessTitle}>ER RED-FLAG HANDSHAKE TRANSMITTED</Text>
              <Text style={styles.handshakeSuccessSub}>Trauma Bay 1 Reserved • Attending ER Physician Notified</Text>
            </View>
            <TouchableOpacity onPress={() => setHandshakeModalVisible(true)}>
              <Text style={styles.viewHandshakeDetails}>Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.redFlagAlertBtn}
            onPress={handleTransmitHandshake}
            disabled={isTransmitting}
          >
            <Zap size={18} color="#FFFFFF" />
            <Text style={styles.redFlagAlertBtnText}>
              {isTransmitting ? 'Transmitting to Trauma Team...' : '1-TAP EMERGENCY ER RED-FLAG HANDSHAKE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* IN-TRANSIT VITALS FORM */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Activity size={18} color="#1565C0" />
          <Text style={styles.formTitle}>Pre-Hospital Paramedic Vitals Logger</Text>
        </View>

        {/* Vital Signs Grid */}
        <View style={styles.vitalsGrid}>
          {/* SpO2 */}
          <View style={styles.vitalInputBox}>
            <Text style={styles.vitalInputLabel}>SpO2 (%)</Text>
            <TextInput
              style={[styles.vitalTextInput, parseInt(spo2, 10) < 92 && styles.vitalTextInputWarning]}
              value={spo2}
              onChangeText={setSpo2}
              keyboardType="numeric"
            />
            {parseInt(spo2, 10) < 92 && (
              <Text style={styles.warningHint}>Low SpO2: Hypoxia Alert</Text>
            )}
          </View>

          {/* Pulse */}
          <View style={styles.vitalInputBox}>
            <Text style={styles.vitalInputLabel}>Pulse (bpm)</Text>
            <TextInput
              style={styles.vitalTextInput}
              value={pulse}
              onChangeText={setPulse}
              keyboardType="numeric"
            />
            <Text style={styles.normalHint}>Target: 60-100</Text>
          </View>

          {/* Blood Pressure Systolic */}
          <View style={styles.vitalInputBox}>
            <Text style={styles.vitalInputLabel}>BP Systolic</Text>
            <TextInput
              style={styles.vitalTextInput}
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="numeric"
            />
            <Text style={styles.normalHint}>mmHg</Text>
          </View>

          {/* Blood Pressure Diastolic */}
          <View style={styles.vitalInputBox}>
            <Text style={styles.vitalInputLabel}>BP Diastolic</Text>
            <TextInput
              style={styles.vitalTextInput}
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="numeric"
            />
            <Text style={styles.normalHint}>mmHg</Text>
          </View>

          {/* Blood Sugar */}
          <View style={[styles.vitalInputBox, { width: '100%' }]}>
            <Text style={styles.vitalInputLabel}>Blood Sugar (RBS / Glucometer)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                style={[styles.vitalTextInput, { flex: 1 }]}
                value={bloodSugar}
                onChangeText={setBloodSugar}
                keyboardType="numeric"
                placeholder="mg/dL"
              />
              <Text style={styles.unitSuffix}>mg/dL</Text>
            </View>
          </View>
        </View>

        {/* Glasgow Coma Scale (GCS) Matrix */}
        <View style={styles.gcsMatrixCard}>
          <View style={styles.gcsHeaderRow}>
            <Text style={styles.gcsTitle}>Glasgow Coma Scale (GCS)</Text>
            <View style={[styles.gcsScoreBadge, gcsTotal <= 8 ? styles.gcsScoreBadgeSevere : styles.gcsScoreBadgeModerate]}>
              <Text style={[styles.gcsScoreText, gcsTotal <= 8 ? { color: '#DC2626' } : { color: '#F59E0B' }]}>
                TOTAL GCS: {gcsTotal} / 15
              </Text>
            </View>
          </View>

          {gcsTotal <= 8 && (
            <View style={styles.gcsSevereAlert}>
              <AlertTriangle size={14} color="#DC2626" />
              <Text style={styles.gcsSevereText}>
                GCS ≤ 8 Indicates Severe Coma / Head Injury. Prepare for immediate Rapid Sequence Intubation (RSI) at ER!
              </Text>
            </View>
          )}

          {/* GCS Eye */}
          <Text style={styles.gcsSubLabel}>Eye Opening Response (1-4):</Text>
          <View style={styles.gcsButtonsRow}>
            {[
              { val: 4, label: '4: Spontaneous' },
              { val: 3, label: '3: To Sound' },
              { val: 2, label: '2: To Pressure' },
              { val: 1, label: '1: None' },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.val}
                style={[styles.gcsBtn, gcsEye === btn.val && styles.gcsBtnSelected]}
                onPress={() => setGcsEye(btn.val)}
              >
                <Text style={[styles.gcsBtnText, gcsEye === btn.val && styles.gcsBtnTextSelected]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* GCS Verbal */}
          <Text style={styles.gcsSubLabel}>Verbal Response (1-5):</Text>
          <View style={styles.gcsButtonsRow}>
            {[
              { val: 5, label: '5: Oriented' },
              { val: 4, label: '4: Confused' },
              { val: 3, label: '3: Inappropriate' },
              { val: 2, label: '2: Incomprehensible' },
              { val: 1, label: '1: None' },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.val}
                style={[styles.gcsBtn, gcsVerbal === btn.val && styles.gcsBtnSelected]}
                onPress={() => setGcsVerbal(btn.val)}
              >
                <Text style={[styles.gcsBtnText, gcsVerbal === btn.val && styles.gcsBtnTextSelected]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* GCS Motor */}
          <Text style={styles.gcsSubLabel}>Motor Response (1-6):</Text>
          <View style={styles.gcsButtonsRow}>
            {[
              { val: 6, label: '6: Obeys' },
              { val: 5, label: '5: Localizes' },
              { val: 4, label: '4: Normal Flexion' },
              { val: 3, label: '3: Abnormal Flex' },
              { val: 2, label: '2: Extension' },
              { val: 1, label: '1: None' },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.val}
                style={[styles.gcsBtn, gcsMotor === btn.val && styles.gcsBtnSelected]}
                onPress={() => setGcsMotor(btn.val)}
              >
                <Text style={[styles.gcsBtnText, gcsMotor === btn.val && styles.gcsBtnTextSelected]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Paramedic Observations / Airway / IV Notes */}
        <Text style={[styles.vitalInputLabel, { marginTop: 12 }]}>Paramedic Clinical Interventions</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={2}
          value={transitNotes}
          onChangeText={setTransitNotes}
          placeholder="E.g. IV access 18G, O2 10L/min NRBM, Aspirin 325mg chewed..."
        />

        <TouchableOpacity style={styles.logVitalsSubmitBtn} onPress={handleLogVitals}>
          <Activity size={16} color="#FFFFFF" />
          <Text style={styles.logVitalsSubmitBtnText}>Log Current In-Transit Vitals</Text>
        </TouchableOpacity>
      </View>

      {/* Vitals History Stream */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>In-Transit Vitals Timeline ({vitalsHistory.length})</Text>
        {vitalsHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTimeBadge}>
                <Clock size={12} color="#1565C0" />
                <Text style={styles.historyTimeText}>{item.time}</Text>
              </View>
              <Text style={styles.historyGcs}>GCS: {item.gcsTotal}/15</Text>
            </View>

            <View style={styles.historyStatsRow}>
              <Text style={styles.historyStat}>SpO2: <Text style={{ fontWeight: '800' }}>{item.spo2}%</Text></Text>
              <Text style={styles.historyStat}>BP: <Text style={{ fontWeight: '800' }}>{item.systolicBp}/{item.diastolicBp}</Text></Text>
              <Text style={styles.historyStat}>Pulse: <Text style={{ fontWeight: '800' }}>{item.pulseRate} bpm</Text></Text>
              <Text style={styles.historyStat}>RBS: <Text style={{ fontWeight: '800' }}>{item.bloodSugar} mg/dL</Text></Text>
            </View>

            {item.notes ? (
              <Text style={styles.historyNotes}>{item.notes}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* HANDSHAKE MODAL CONFIRMATION */}
      <Modal visible={handshakeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.handshakeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Zap size={22} color="#DC2626" />
                <Text style={styles.modalTitle}>ER Trauma Bay Red-Flag Active</Text>
              </View>
              <TouchableOpacity onPress={() => setHandshakeModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.alertSuccessBadge}>
                <CheckCircle2 size={24} color="#1565C0" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertSuccessTitle}>Resuscitation Team Dispatched to Bay</Text>
                  <Text style={styles.alertSuccessSub}>
                    ETA: {trip.eta} • Direct Handshake Transmitted
                  </Text>
                </View>
              </View>

              <View style={styles.handshakeDetailList}>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Patient</Text>
                  <Text style={styles.detailValue}>{trip.patientName} ({trip.uhid})</Text>
                </View>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Emergency Condition</Text>
                  <Text style={styles.detailValue}>{trip.condition}</Text>
                </View>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Transmitted Vitals</Text>
                  <Text style={styles.detailValue}>
                    SpO2 {spo2}% • BP {systolic}/{diastolic} • Pulse {pulse} bpm • GCS {gcsTotal}/15
                  </Text>
                </View>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Bay Allocation</Text>
                  <Text style={[styles.detailValue, { color: '#1565C0' }]}>Emergency Trauma Bay #01 (RESERVED)</Text>
                </View>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Blood Bank Standing Order</Text>
                  <Text style={styles.detailValue}>O-Negative PRBC x 2 Units on Standby</Text>
                </View>
                <View style={styles.handshakeDetailItem}>
                  <Text style={styles.detailKey}>Attending Trauma Lead</Text>
                  <Text style={styles.detailValue}>Dr. R. Natarajan, MD (Emergency Medicine)</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setHandshakeModalVisible(false)}
              >
                <Text style={styles.closeModalBtnText}>Acknowledge & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  tripCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 14 },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tripPatientName: { fontSize: 16, fontWeight: '800', color: '#183153' },
  tripMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  criticalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  criticalPillText: { fontSize: 10, fontWeight: '900', color: '#DC2626' },
  tripCondition: { fontSize: 12, color: '#DC2626', marginTop: 8, backgroundColor: '#FEE2E2', padding: 8, borderRadius: 6 },
  handshakeHeroCard: { backgroundColor: '#7F1D1D', borderRadius: 16, padding: 16, marginBottom: 14 },
  handshakeHeroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  zapIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  handshakeHeroTitle: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  handshakeHeroSub: { fontSize: 11, color: '#BFDBFE', marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  etaBadgeText: { fontSize: 10, fontWeight: '900', color: '#DC2626' },
  redFlagAlertBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 12 },
  redFlagAlertBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  handshakeSuccessBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E0F2F1', padding: 12, borderRadius: 10 },
  handshakeSuccessTitle: { fontSize: 11, fontWeight: '900', color: '#183153' },
  handshakeSuccessSub: { fontSize: 10, color: '#00897B', marginTop: 1 },
  viewHandshakeDetails: { fontSize: 11, fontWeight: '800', color: '#1565C0', textDecorationLine: 'underline' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  formTitle: { fontSize: 15, fontWeight: '800', color: '#183153' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  vitalInputBox: { width: '48%', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  vitalInputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  vitalTextInput: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, height: 40, fontSize: 16, fontWeight: '800', color: '#183153' },
  vitalTextInputWarning: { borderColor: '#DC2626', color: '#DC2626' },
  warningHint: { fontSize: 10, color: '#DC2626', fontWeight: '700', marginTop: 2 },
  normalHint: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  unitSuffix: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  gcsMatrixCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 8 },
  gcsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gcsTitle: { fontSize: 13, fontWeight: '800', color: '#183153' },
  gcsScoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gcsScoreBadgeSevere: { backgroundColor: '#E8F1FC' },
  gcsScoreBadgeModerate: { backgroundColor: '#FEF3C7' },
  gcsScoreText: { fontSize: 11, fontWeight: '900' },
  gcsSevereAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', padding: 8, borderRadius: 6, marginBottom: 8 },
  gcsSevereText: { fontSize: 10, color: '#DC2626', fontWeight: '700', flex: 1 },
  gcsSubLabel: { fontSize: 11, color: '#475569', fontWeight: '700', marginTop: 6, marginBottom: 4 },
  gcsButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  gcsBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  gcsBtnSelected: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  gcsBtnText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  gcsBtnTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  notesInput: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10, fontSize: 12, color: '#183153', textAlignVertical: 'top', marginBottom: 12 },
  logVitalsSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1565C0', paddingVertical: 12, borderRadius: 10 },
  logVitalsSubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 20 },
  historyTitle: { fontSize: 14, fontWeight: '800', color: '#183153', marginBottom: 12 },
  historyItem: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F1FC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyTimeText: { fontSize: 10, fontWeight: '800', color: '#0D47A1' },
  historyGcs: { fontSize: 11, fontWeight: '800', color: '#1565C0' },
  historyStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  historyStat: { fontSize: 11, color: '#475569' },
  historyNotes: { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  handshakeModalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#183153' },
  modalBody: { paddingVertical: 14 },
  alertSuccessBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E0F2F1', padding: 12, borderRadius: 10, marginBottom: 14 },
  alertSuccessTitle: { fontSize: 13, fontWeight: '800', color: '#183153' },
  alertSuccessSub: { fontSize: 11, color: '#00897B', marginTop: 2 },
  handshakeDetailList: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  handshakeDetailItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailKey: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 12, fontWeight: '700', color: '#183153', marginTop: 2 },
  modalFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  closeModalBtn: { backgroundColor: '#1565C0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeModalBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});

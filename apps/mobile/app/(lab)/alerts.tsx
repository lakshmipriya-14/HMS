import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Clock,
  User,
  Activity,
  FileCheck,
} from 'lucide-react-native';

interface PanicRecord {
  id: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  testName: string;
  paramName: string;
  measuredValue: string;
  unit: string;
  referenceRange: string;
  panicThreshold: string;
  clinicalRisk: string;
  doctorName: string;
  doctorPhone: string;
  detectedAt: string;
  status: 'PENDING_DOCTOR_ALERT' | 'DOCTOR_ALERTED' | 'ACKNOWLEDGED_BY_DOCTOR';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

const INITIAL_PANIC_RECORDS: PanicRecord[] = [
  {
    id: 'pr-1',
    orderNumber: 'LAB-2026-0841',
    patientName: 'Ramasamy Kuppusamy',
    uhid: 'KZN-2026-0001',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    paramName: 'Troponin I (High Sensitivity)',
    measuredValue: '2.84',
    unit: 'ng/mL',
    referenceRange: '0.00 - 0.04',
    panicThreshold: '> 1.5 ng/mL',
    clinicalRisk: 'Acute Myocardial Infarction / Impending Cardiogenic Shock',
    doctorName: 'Dr. Arun Kumar, MD (Cardiology)',
    doctorPhone: '+91 94432 10101',
    detectedAt: 'Today 10:28 AM',
    status: 'DOCTOR_ALERTED',
    acknowledgedBy: 'Dr. Arun Kumar, MD',
    acknowledgedAt: 'Today 10:31 AM (Verbal Read-Back Logged)',
  },
  {
    id: 'pr-2',
    orderNumber: 'LAB-2026-0842',
    patientName: 'Meenakshi Sundaram',
    uhid: 'KZN-2026-0014',
    testName: 'Serum Electrolytes (K+)',
    paramName: 'Serum Potassium (K+)',
    measuredValue: '6.7',
    unit: 'mmol/L',
    referenceRange: '3.5 - 5.1',
    panicThreshold: '> 6.0 mmol/L',
    clinicalRisk: 'Severe Hyperkalemia / Malignant Ventricular Arrhythmia Hazard',
    doctorName: 'Dr. Priya Ramanathan, MD (Nephrology)',
    doctorPhone: '+91 98421 55022',
    detectedAt: 'Today 11:14 AM',
    status: 'PENDING_DOCTOR_ALERT',
  },
  {
    id: 'pr-3',
    orderNumber: 'LAB-2026-0843',
    patientName: 'Karthik Raja',
    uhid: 'KZN-2026-0029',
    testName: 'Complete Blood Count (CBC)',
    paramName: 'Platelet Count',
    measuredValue: '16,000',
    unit: '/uL',
    referenceRange: '150,000 - 450,000',
    panicThreshold: '< 20,000 /uL',
    clinicalRisk: 'Critical Thrombocytopenia / High Risk of Spontaneous Intracranial Bleed',
    doctorName: 'Dr. Mohanraj C., MD (General Medicine)',
    doctorPhone: '+91 97890 33411',
    detectedAt: 'Today 11:45 AM',
    status: 'PENDING_DOCTOR_ALERT',
  },
  {
    id: 'pr-4',
    orderNumber: 'LAB-2026-0843',
    patientName: 'Karthik Raja',
    uhid: 'KZN-2026-0029',
    testName: 'Complete Blood Count (CBC)',
    paramName: 'Hemoglobin (Hb)',
    measuredValue: '6.4',
    unit: 'g/dL',
    referenceRange: '13.0 - 17.0',
    panicThreshold: '< 7.0 g/dL',
    clinicalRisk: 'Critical Severe Anemia / Urgent Packed Red Blood Cells (PRBC) Requirement',
    doctorName: 'Dr. Mohanraj C., MD (General Medicine)',
    doctorPhone: '+91 97890 33411',
    detectedAt: 'Today 11:45 AM',
    status: 'PENDING_DOCTOR_ALERT',
  },
];

export default function LabAlertsScreen() {
  const [alerts, setAlerts] = useState<PanicRecord[]>(INITIAL_PANIC_RECORDS);

  const handleCallDoctor = (record: PanicRecord) => {
    Alert.alert(
      'Urgent Doctor Handshake',
      `Calling ${record.doctorName} at ${record.doctorPhone} for immediate verbal communication of critical panic result for patient ${record.patientName} (${record.uhid}).`,
      [
        {
          text: 'Confirm Verbal Read-Back',
          onPress: () => {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === record.id
                  ? {
                      ...a,
                      status: 'ACKNOWLEDGED_BY_DOCTOR',
                      acknowledgedBy: record.doctorName,
                      acknowledgedAt: 'Just now (Verbal Read-Back Confirmed)',
                    }
                  : a
              )
            );
            Alert.alert('Read-Back Documented', `Critical alert read-back documented with ${record.doctorName} per NABL ISO-15189 compliance guidelines.`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconBox}>
            <ShieldAlert size={22} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Critical Panic Value Monitor</Text>
            <Text style={styles.subtitle}>Life-Threatening Result Highlighting & Mandatory Doctor Escalation</Text>
          </View>
        </View>

        <View style={styles.policyBox}>
          <Text style={styles.policyText}>
            ⚠️ <Text style={{ fontWeight: '700' }}>Hospital Panic Protocol:</Text> All critical laboratory findings must be communicated to the treating physician within 15 minutes of analyzer verification with mandatory verbal read-back.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {alerts.map((record) => {
          const isPending = record.status === 'PENDING_DOCTOR_ALERT';
          const isAcknowledged = record.status === 'ACKNOWLEDGED_BY_DOCTOR';

          return (
            <View key={record.id} style={[styles.card, isPending && styles.cardPending]}>
              <View style={styles.cardHeader}>
                <View style={styles.orderNoPill}>
                  <Text style={styles.orderNoText}>{record.orderNumber}</Text>
                </View>
                <View style={styles.panicPill}>
                  <AlertTriangle size={12} color="#DC2626" />
                  <Text style={styles.panicPillText}>CRITICAL PANIC</Text>
                </View>
              </View>

              {/* Patient */}
              <View style={styles.patientRow}>
                <Text style={styles.patientName}>{record.patientName}</Text>
                <Text style={styles.uhidText}>UHID: {record.uhid}</Text>
              </View>

              {/* Parameter & Measured Value */}
              <View style={styles.paramBox}>
                <Text style={styles.paramName}>{record.paramName}</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.valueText}>{record.measuredValue} {record.unit}</Text>
                  <Text style={styles.thresholdText}>Panic Threshold: {record.panicThreshold}</Text>
                </View>
                <Text style={styles.refText}>Reference Range: {record.referenceRange} {record.unit}</Text>
              </View>

              {/* Clinical Hazard */}
              <View style={styles.riskBox}>
                <Text style={styles.riskLabel}>Immediate Clinical Risk:</Text>
                <Text style={styles.riskText}>{record.clinicalRisk}</Text>
              </View>

              {/* Treating Doctor */}
              <View style={styles.doctorRow}>
                <User size={13} color="#64748B" />
                <Text style={styles.doctorText}>Treating Doctor: <Text style={{ fontWeight: '700', color: '#183153' }}>{record.doctorName}</Text></Text>
              </View>

              {/* Acknowledgment status */}
              {isAcknowledged ? (
                <View style={styles.ackBox}>
                  <CheckCircle2 size={14} color="#1565C0" />
                  <Text style={styles.ackText}>Acknowledged by {record.acknowledgedBy} ({record.acknowledgedAt})</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.callDoctorBtn} onPress={() => handleCallDoctor(record)}>
                  <PhoneCall size={14} color="#FFFFFF" />
                  <Text style={styles.callDoctorBtnText}>1-Tap Urgent Doctor Alert Handshake</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F1FC', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#183153' },
  subtitle: { fontSize: 11, color: '#64748B' },
  policyBox: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  policyText: { fontSize: 11, color: '#DC2626', lineHeight: 16 },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  cardPending: { borderColor: '#DC2626', borderWidth: 1.5, backgroundColor: '#FFFFFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNoPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  orderNoText: { fontSize: 11, fontWeight: '800', color: '#475569', fontFamily: 'monospace' },
  panicPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  panicPillText: { fontSize: 10, fontWeight: '900', color: '#DC2626' },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#183153' },
  uhidText: { fontSize: 11, color: '#1565C0', fontWeight: '700' },
  paramBox: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#FECACA' },
  paramName: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 },
  valueText: { fontSize: 18, fontWeight: '900', color: '#DC2626' },
  thresholdText: { fontSize: 11, color: '#DC2626', fontWeight: '700' },
  refText: { fontSize: 10, color: '#7F1D1D', marginTop: 2 },
  riskBox: { marginTop: 8, backgroundColor: '#FEF3C7', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FED7AA' },
  riskLabel: { fontSize: 10, fontWeight: '700', color: '#C2410C', textTransform: 'uppercase' },
  riskText: { fontSize: 11, color: '#9A3412', marginTop: 2 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  doctorText: { fontSize: 12, color: '#64748B' },
  callDoctorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  callDoctorBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  ackBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2F1', padding: 10, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#B2DFDB' },
  ackText: { fontSize: 11, color: '#183153', fontWeight: '700', flex: 1 },
});

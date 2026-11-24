import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronRight,
  AlertTriangle,
  Phone,
  Navigation,
  Clock,
  CheckCircle2,
  BedDouble,
  CreditCard,
  HeartPulse,
  Users,
  ShieldCheck,
  X,
  FileText,
} from 'lucide-react-native';

interface FamilyProfile {
  id: string;
  name: string;
  relation: string;
  uhid: string;
  age: number;
  gender: string;
}

const FAMILY_PROFILES: FamilyProfile[] = [
  { id: '1', name: 'Muthuvel Karuppiah', relation: 'Self (Primary)', uhid: 'KZN-2026-0001', age: 48, gender: 'Male' },
  { id: '2', name: 'Meena Muthuvel', relation: 'Spouse', uhid: 'KZN-2026-0002', age: 45, gender: 'Female' },
  { id: '3', name: 'Karuppiah S.', relation: 'Father', uhid: 'KZN-2026-0003', age: 74, gender: 'Male' },
  { id: '4', name: 'Ananya Muthuvel', relation: 'Daughter', uhid: 'KZN-2026-0004', age: 16, gender: 'Female' },
];

export default function PatientHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Family profile switcher (P16)
  const [activeProfile, setActiveProfile] = useState<FamilyProfile>(FAMILY_PROFILES[0]);
  const [familyModal, setFamilyModal] = useState(false);

  // 1-Tap Emergency Ambulance SOS State (P12)
  const [sosModal, setSosModal] = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [dispatchTime, setDispatchTime] = useState<string | null>(null);

  // Simulated GPS coordinates
  const gpsCoords = {
    latitude: '9.9252° N',
    longitude: '78.1198° E',
    address: 'Near Anna Nagar 80ft Road, Madurai Apex Zone',
  };

  const handleTriggerSOS = () => {
    setSosDispatched(true);
    setDispatchTime(new Date().toLocaleTimeString());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* UHID Card with Family Switcher (P01 & P16) */}
      <View style={styles.uhidCard}>
        <View style={styles.uhidTopRow}>
          <Text style={styles.hospital}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
          <TouchableOpacity style={styles.familySwitchBtn} onPress={() => setFamilyModal(true)}>
            <Users size={12} color="#0F766E" />
            <Text style={styles.familySwitchText}>Switch Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.patientName}>{activeProfile.name}</Text>
        <Text style={styles.patientSub}>
          {activeProfile.relation} • {activeProfile.gender}, {activeProfile.age} yrs
        </Text>

        <View style={styles.uhidBadgeRow}>
          <View style={styles.uhidPill}>
            <Text style={styles.uhidLabel}>UHID:</Text>
            <Text style={styles.uhidCode}>{activeProfile.uhid}</Text>
          </View>
          <View style={styles.verifiedPill}>
            <CheckCircle2 size={12} color="#059669" />
            <Text style={styles.verifiedText}>Aadhaar & OTP Linked</Text>
          </View>
        </View>
      </View>

      {/* P12: 1-Tap Emergency Ambulance SOS Widget */}
      <TouchableOpacity style={styles.sosCard} onPress={() => setSosModal(true)}>
        <View style={styles.sosLeft}>
          <View style={styles.sosIconCircle}>
            <AlertTriangle size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>1-TAP EMERGENCY AMBULANCE SOS</Text>
            <Text style={styles.sosSub}>Dispatch Nearest ICU Ambulance with GPS</Text>
          </View>
        </View>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>

      {/* P03: Live Token Queue Tracker */}
      <View style={styles.tokenCard}>
        <View style={styles.tokenHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color="#0F766E" />
            <Text style={styles.tokenCardTitle}>Live OPD Queue Tracker</Text>
          </View>
          <View style={styles.livePulseBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.livePulseText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.tokenGrid}>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenBoxLabel}>Your Token</Text>
            <Text style={styles.myTokenNum}>#14</Text>
            <Text style={styles.tokenStatusWaiting}>3 Ahead of You</Text>
          </View>

          <View style={styles.tokenDivider} />

          <View style={styles.tokenBox}>
            <Text style={styles.tokenBoxLabel}>Now Serving</Text>
            <Text style={styles.nowServingNum}>#11</Text>
            <Text style={styles.tokenRoom}>Room 104 • 1st Floor</Text>
          </View>
        </View>

        <View style={styles.tokenMeta}>
          <Text style={styles.tokenDoc}>Dr. Senthil Nathan (Interventional Cardiology)</Text>
          <Text style={styles.tokenWait}>Estimated Wait Time: ~12 mins</Text>
        </View>

        {/* Queue Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: '75%' }]} />
        </View>
        <Text style={styles.progressNote}>You will receive an SMS alert when Token #13 enters.</Text>
      </View>

      {/* P08: Active Inpatient (IPD) Stay Tracker */}
      <View style={styles.ipdCard}>
        <View style={styles.ipdHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BedDouble size={16} color="#0284C7" />
            <Text style={styles.ipdTitle}>Active Inpatient (IPD) Stay Tracker</Text>
          </View>
          <View style={styles.admittedBadge}>
            <Text style={styles.admittedBadgeText}>ADMITTED</Text>
          </View>
        </View>

        <View style={styles.ipdDetailsGrid}>
          <View style={styles.ipdDetailItem}>
            <Text style={styles.ipdLabel}>Admitted Ward</Text>
            <Text style={styles.ipdVal}>Cardiology ICCU</Text>
          </View>
          <View style={styles.ipdDetailItem}>
            <Text style={styles.ipdLabel}>Bed Number</Text>
            <Text style={styles.ipdVal}>Bed 04 (ICU)</Text>
          </View>
          <View style={styles.ipdDetailItem}>
            <Text style={styles.ipdLabel}>Attending Doctor</Text>
            <Text style={styles.ipdVal}>Dr. Rajesh Kannan</Text>
          </View>
          <View style={styles.ipdDetailItem}>
            <Text style={styles.ipdLabel}>Admission Date</Text>
            <Text style={styles.ipdVal}>21 Nov 2026</Text>
          </View>
        </View>

        {/* Daily Logged Vitals */}
        <View style={styles.ipdVitalsBox}>
          <Text style={styles.ipdVitalsTitle}>Today's Nursing Vitals Log</Text>
          <View style={styles.ipdVitalsRow}>
            <Text style={styles.vitalsTag}>BP: 124/82</Text>
            <Text style={styles.vitalsTag}>SpO2: 98%</Text>
            <Text style={styles.vitalsTag}>Pulse: 74 bpm</Text>
            <Text style={styles.vitalsTag}>Temp: 98.4 °F</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dischargeSummaryBtn}
          onPress={() => router.push('/(patient)/records')}
        >
          <FileText size={14} color="#0284C7" />
          <Text style={styles.dischargeSummaryText}>View Clinical Progress & Discharge Summary</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionTitle}>Patient Services & Health Desks</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/appointments')}
        >
          <Calendar color="#0F766E" size={22} />
          <Text style={styles.actionText}>Book Doctor</Text>
          <Text style={styles.actionSub}>OPD Slots</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/records')}
        >
          <Pill color="#0284C7" size={22} />
          <Text style={styles.actionText}>Prescriptions</Text>
          <Text style={styles.actionSub}>Dosage & Pickup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/records')}
        >
          <FlaskConical color="#8B5CF6" size={22} />
          <Text style={styles.actionText}>Lab & Scans</Text>
          <Text style={styles.actionSub}>PDF Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/billing')}
        >
          <CreditCard color="#059669" size={22} />
          <Text style={styles.actionText}>Pay Bills</Text>
          <Text style={styles.actionSub}>TPA Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/profile')}
        >
          <HeartPulse color="#DC2626" size={22} />
          <Text style={styles.actionText}>Log Vitals</Text>
          <Text style={styles.actionSub}>BP & Sugar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(patient)/profile')}
        >
          <ShieldCheck color="#D97706" size={22} />
          <Text style={styles.actionText}>Feedback Desk</Text>
          <Text style={styles.actionSub}>Support & Rating</Text>
        </TouchableOpacity>
      </View>

      {/* Family Profile Switcher Modal (P16) */}
      <Modal visible={familyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Family Member Profiles</Text>
                <Text style={styles.modalSub}>Switch active patient view under this account</Text>
              </View>
              <TouchableOpacity onPress={() => setFamilyModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {FAMILY_PROFILES.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.profileOption,
                  activeProfile.id === f.id && styles.profileOptionActive,
                ]}
                onPress={() => {
                  setActiveProfile(f);
                  setFamilyModal(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.profName}>{f.name}</Text>
                  <Text style={styles.profMeta}>
                    {f.relation} • {f.gender}, {f.age} yrs
                  </Text>
                  <Text style={styles.profUhid}>UHID: {f.uhid}</Text>
                </View>
                {activeProfile.id === f.id && <CheckCircle2 size={20} color="#0F766E" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* P12: 1-Tap Emergency Ambulance SOS Modal */}
      <Modal visible={sosModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={22} color="#DC2626" />
                <Text style={styles.sosModalTitle}>24/7 Trauma & Ambulance SOS</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSosModal(false);
                  setSosDispatched(false);
                }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* GPS Location Box */}
            <View style={styles.gpsBox}>
              <Navigation size={18} color="#0F766E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsCoords}>
                  GPS: {gpsCoords.latitude}, {gpsCoords.longitude}
                </Text>
                <Text style={styles.gpsAddress}>{gpsCoords.address}</Text>
              </View>
            </View>

            {!sosDispatched ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.sosAlertText}>
                  Pressing Dispatch will instantly alert the Kizuna Central Emergency Room and route the
                  nearest Advanced Cardiac Life Support (ACLS) Ambulance to your GPS coordinates.
                </Text>

                <TouchableOpacity style={styles.triggerSosBtn} onPress={handleTriggerSOS}>
                  <AlertTriangle size={20} color="#fff" />
                  <Text style={styles.triggerSosBtnText}>DISPATCH AMBULANCE NOW</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.directCallBtn}
                  onPress={() => Alert.alert('Calling Emergency', 'Connecting to 108 Emergency Helpline...')}
                >
                  <Phone size={16} color="#DC2626" />
                  <Text style={styles.directCallText}>Call Hospital Emergency Directly: +91 452 2500108</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dispatchedBox}>
                <View style={styles.dispatchedHeader}>
                  <CheckCircle2 size={24} color="#059669" />
                  <Text style={styles.dispatchedTitle}>AMBULANCE DISPATCHED!</Text>
                </View>
                <Text style={styles.dispatchedSub}>
                  Vehicle: <Text style={{ fontWeight: '800' }}>TN-59-AMB-2026 (ACLS Unit 02)</Text>
                </Text>
                <Text style={styles.dispatchedSub}>
                  Driver: <Text style={{ fontWeight: '800' }}>M. Murugan (+91 98401 22334)</Text>
                </Text>
                <Text style={styles.dispatchedSub}>
                  Dispatched at: <Text style={{ fontWeight: '800' }}>{dispatchTime}</Text>
                </Text>
                <Text style={styles.etaText}>Estimated Arrival: ~7 Minutes</Text>

                <TouchableOpacity
                  style={styles.driverCallBtn}
                  onPress={() => Alert.alert('Calling Driver', 'Connecting to Ambulance Driver Murugan...')}
                >
                  <Phone size={16} color="#fff" />
                  <Text style={styles.driverCallText}>Call Ambulance Driver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  uhidCard: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  uhidTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hospital: { color: '#CCFBF1', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  familySwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  familySwitchText: { fontSize: 10, fontWeight: '800', color: '#0F766E' },
  patientName: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 8 },
  patientSub: { color: '#CCFBF1', fontSize: 12, marginTop: 2 },
  uhidBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  uhidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  uhidLabel: { color: '#99F6E4', fontSize: 11, fontWeight: '700' },
  uhidCode: { color: '#fff', fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: { color: '#065F46', fontSize: 10, fontWeight: '700' },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sosLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  sosSub: { color: '#FEE2E2', fontSize: 11, marginTop: 1 },
  tokenCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tokenCardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626' },
  livePulseText: { fontSize: 9, fontWeight: '900', color: '#DC2626' },
  tokenGrid: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  tokenBox: { flex: 1, alignItems: 'center' },
  tokenBoxLabel: { fontSize: 11, color: '#64748B' },
  myTokenNum: { fontSize: 26, fontWeight: '900', color: '#0F766E' },
  tokenStatusWaiting: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  tokenDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  nowServingNum: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  tokenRoom: { fontSize: 11, color: '#64748B' },
  tokenMeta: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 8 },
  tokenDoc: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  tokenWait: { fontSize: 11, color: '#0F766E', fontWeight: '600', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#0F766E', borderRadius: 3 },
  progressNote: { fontSize: 10, color: '#94A3B8', marginTop: 6 },
  ipdCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  ipdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ipdTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  admittedBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  admittedBadgeText: { fontSize: 9, fontWeight: '800', color: '#0284C7' },
  ipdDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  ipdDetailItem: { width: '47%' },
  ipdLabel: { fontSize: 10, color: '#64748B' },
  ipdVal: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginTop: 1 },
  ipdVitalsBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginTop: 10 },
  ipdVitalsTitle: { fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 4 },
  ipdVitalsRow: { flexDirection: 'row', gap: 8 },
  vitalsTag: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F766E',
  },
  dischargeSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dischargeSummaryText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionText: { fontSize: 11, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  actionSub: { fontSize: 9, color: '#64748B', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  profileOptionActive: { borderColor: '#0F766E', backgroundColor: '#F0FDFA' },
  profName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  profMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  profUhid: { fontSize: 10, color: '#0F766E', fontWeight: '700', fontFamily: 'monospace' },
  sosModalTitle: { fontSize: 16, fontWeight: '900', color: '#DC2626' },
  gpsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  gpsCoords: { fontSize: 11, fontWeight: '800', color: '#0F766E', fontFamily: 'monospace' },
  gpsAddress: { fontSize: 11, color: '#334155', marginTop: 1 },
  sosAlertText: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 14 },
  triggerSosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  triggerSosBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  directCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
    paddingVertical: 8,
  },
  directCallText: { fontSize: 11, color: '#DC2626', fontWeight: '700' },
  dispatchedBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    gap: 6,
  },
  dispatchedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dispatchedTitle: { fontSize: 15, fontWeight: '900', color: '#065F46' },
  dispatchedSub: { fontSize: 12, color: '#334155' },
  etaText: { fontSize: 16, fontWeight: '900', color: '#059669', marginTop: 6 },
  driverCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  driverCallText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});


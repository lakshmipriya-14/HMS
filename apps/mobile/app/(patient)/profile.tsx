import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  LogOut,
  Phone,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Plus,
  Star,
  MessageSquare,
  AlertCircle,
  Clock,
  X,
  Users,
  Building,
  KeyRound,
} from 'lucide-react-native';

interface HealthVitalLog {
  id: string;
  date: string;
  bpSystolic: number;
  bpDiastolic: number;
  bloodSugarFasting: number; // mg/dL
  bloodSugarPostPrandial?: number;
  weightKg: number;
  pulseBpm: number;
  notes?: string;
  status: 'Normal' | 'Attention Required';
}

interface ComplaintTicket {
  id: string;
  ticketNo: string;
  department: string;
  date: string;
  rating: number;
  category: string;
  description: string;
  status: 'Under Review' | 'Resolved';
  resolution?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  uhid: string;
  dob: string;
  bloodGroup: string;
  allergies: string;
}

const INITIAL_VITALS: HealthVitalLog[] = [
  {
    id: 'v-1',
    date: 'Today, 24 Nov 2026',
    bpSystolic: 120,
    bpDiastolic: 80,
    bloodSugarFasting: 98,
    bloodSugarPostPrandial: 135,
    weightKg: 72.5,
    pulseBpm: 72,
    status: 'Normal',
    notes: 'Morning readings after 8hr fasting. Vitals optimal.',
  },
  {
    id: 'v-2',
    date: '21 Nov 2026',
    bpSystolic: 138,
    bpDiastolic: 88,
    bloodSugarFasting: 115,
    weightKg: 73.0,
    pulseBpm: 80,
    status: 'Attention Required',
    notes: 'Slightly elevated systolic BP and fasting sugar.',
  },
  {
    id: 'v-3',
    date: '15 Nov 2026',
    bpSystolic: 122,
    bpDiastolic: 82,
    bloodSugarFasting: 94,
    weightKg: 72.8,
    pulseBpm: 70,
    status: 'Normal',
  },
];

const INITIAL_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'comp-1',
    ticketNo: 'TKT-2026-081',
    department: 'Outpatient Pharmacy',
    date: '22 Nov 2026',
    rating: 3,
    category: 'Wait Time',
    description: 'Pharmacy Counter 2 wait time was 25 mins for cardiac prescription dispensing.',
    status: 'Resolved',
    resolution: 'Additional pharmacist assigned to Counter 2 during peak hours.',
  },
];

const FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'fm-1',
    name: 'Muthuvel Karuppiah',
    relationship: 'Self (Primary)',
    uhid: 'KZN-2026-0001',
    dob: '14 May 1978',
    bloodGroup: 'O Positive',
    allergies: 'Penicillin, Sulfa',
  },
  {
    id: 'fm-2',
    name: 'Meena Muthuvel',
    relationship: 'Spouse',
    uhid: 'KZN-2026-0002',
    dob: '22 Aug 1981',
    bloodGroup: 'B Positive',
    allergies: 'None',
  },
  {
    id: 'fm-3',
    name: 'Karuppiah S.',
    relationship: 'Father',
    uhid: 'KZN-2026-0003',
    dob: '10 Jan 1952',
    bloodGroup: 'O Positive',
    allergies: 'Aspirin (Mild Gastric)',
  },
];

export default function PatientProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Family profile state (P16)
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember>(FAMILY_MEMBERS[0]);

  // UHID Linking with Phone OTP (P01)
  const [otpModal, setOtpModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('+91 98401 22334');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isUhidLinked, setIsUhidLinked] = useState(true);

  // Health Vitals State (P13)
  const [vitalsList, setVitalsList] = useState<HealthVitalLog[]>(INITIAL_VITALS);
  const [vitalsModal, setVitalsModal] = useState(false);
  const [newSys, setNewSys] = useState('120');
  const [newDia, setNewDia] = useState('80');
  const [newSugar, setNewSugar] = useState('95');
  const [newWeight, setNewWeight] = useState('72');
  const [newPulse, setNewPulse] = useState('72');

  // Feedback & Complaints State (P15)
  const [complaints, setComplaints] = useState<ComplaintTicket[]>(INITIAL_COMPLAINTS);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [feedbackDept, setFeedbackDept] = useState('Doctor Consultation');
  const [feedbackText, setFeedbackText] = useState('');

  const handleSendOtp = () => {
    setOtpSent(true);
    Alert.alert('OTP Sent', `A 6-digit confirmation code was sent to ${phoneInput}. (Demo: 554433)`);
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 4 && otpCode !== '554433') {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP code.');
      return;
    }
    setIsUhidLinked(true);
    setOtpModal(false);
    setOtpSent(false);
    setOtpCode('');
    Alert.alert('UHID Verified', `UHID ${selectedFamilyMember.uhid} has been securely verified and linked.`);
  };

  const handleSaveVitals = () => {
    const sys = Number(newSys) || 120;
    const dia = Number(newDia) || 80;
    const sugar = Number(newSugar) || 95;
    const weight = Number(newWeight) || 70;
    const pulse = Number(newPulse) || 72;

    const isAbnormal = sys > 130 || dia > 85 || sugar > 110;

    const newLog: HealthVitalLog = {
      id: `v-${Date.now()}`,
      date: 'Today, Just now',
      bpSystolic: sys,
      bpDiastolic: dia,
      bloodSugarFasting: sugar,
      weightKg: weight,
      pulseBpm: pulse,
      status: isAbnormal ? 'Attention Required' : 'Normal',
      notes: isAbnormal ? 'Recorded reading above normal threshold.' : 'Healthy baseline vitals.',
    };

    setVitalsList([newLog, ...vitalsList]);
    setVitalsModal(false);
    Alert.alert('Vitals Logged', 'Your personal health metrics have been saved.');
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText) {
      Alert.alert('Empty Comments', 'Please share a brief note about your experience.');
      return;
    }

    const newTicket: ComplaintTicket = {
      id: `comp-${Date.now()}`,
      ticketNo: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      department: feedbackDept,
      date: 'Today',
      rating: starRating,
      category: starRating <= 2 ? 'Complaint' : 'Appreciation & Feedback',
      description: feedbackText,
      status: 'Under Review',
    };

    setComplaints([newTicket, ...complaints]);
    setFeedbackModal(false);
    setFeedbackText('');
    Alert.alert('Feedback Submitted', `Thank you! Ticket ${newTicket.ticketNo} registered with Patient Care.`);
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* P16: Family Members Profile Switcher Pill Header */}
      <View style={styles.familySwitcherSection}>
        <View style={styles.secRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={16} color="#0F766E" />
            <Text style={styles.sectionHeaderTitle}>Family Members Profile Switcher</Text>
          </View>
          <Text style={styles.switchCount}>{FAMILY_MEMBERS.length} Registered</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familyScroll}>
          {FAMILY_MEMBERS.map((fm) => (
            <TouchableOpacity
              key={fm.id}
              style={[
                styles.familyPill,
                selectedFamilyMember.id === fm.id && styles.familyPillActive,
              ]}
              onPress={() => setSelectedFamilyMember(fm)}
            >
              <Text
                style={[
                  styles.familyPillText,
                  selectedFamilyMember.id === fm.id && styles.familyPillTextActive,
                ]}
              >
                {fm.name} ({fm.relationship})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* P01: Official Digital UHID Card */}
      <View style={styles.uhidCard}>
        <View style={styles.uhidCardTop}>
          <View>
            <Text style={styles.hospTitle}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
            <Text style={styles.hospSub}>Government & ABDM Certified Health Record</Text>
          </View>
          <QrCode size={40} color="#fff" />
        </View>

        <Text style={styles.cardName}>{selectedFamilyMember.name}</Text>
        <Text style={styles.cardRelation}>
          {selectedFamilyMember.relationship} • Blood: {selectedFamilyMember.bloodGroup}
        </Text>

        <View style={styles.uhidBar}>
          <Text style={styles.uhidBarLabel}>PERMANENT UHID:</Text>
          <Text style={styles.uhidBarVal}>{selectedFamilyMember.uhid}</Text>
        </View>

        <View style={styles.uhidCardFooter}>
          <View style={styles.verifiedTag}>
            <CheckCircle2 size={12} color="#059669" />
            <Text style={styles.verifiedTagText}>
              {isUhidLinked ? 'Phone OTP Linked' : 'Unlinked'}
            </Text>
          </View>

          <TouchableOpacity style={styles.relinkBtn} onPress={() => setOtpModal(true)}>
            <KeyRound size={12} color="#0F766E" />
            <Text style={styles.relinkBtnText}>Verify / Re-link Phone OTP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Clinical Info Box */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Demographics & Medical Profile</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date of Birth</Text>
          <Text style={styles.infoVal}>{selectedFamilyMember.dob}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoVal}>{selectedFamilyMember.bloodGroup}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Known Allergies</Text>
          <Text style={[styles.infoVal, { color: '#DC2626' }]}>
            {selectedFamilyMember.allergies}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Emergency Contact</Text>
          <Text style={styles.infoVal}>Meena K (+91 98401 99999)</Text>
        </View>
      </View>

      {/* P13: Personal Health Vitals Logger */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <HeartPulse size={18} color="#0F766E" />
            <Text style={styles.cardSectionTitle}>Personal Health Vitals Logger (P13)</Text>
          </View>
          <TouchableOpacity style={styles.addVitalBtn} onPress={() => setVitalsModal(true)}>
            <Plus size={14} color="#fff" />
            <Text style={styles.addVitalBtnText}>Log Today</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardSub}>Self-monitoring Blood Pressure, Blood Sugar, and Weight</Text>

        {vitalsList.map((v) => (
          <View key={v.id} style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <Text style={styles.vitalDate}>{v.date}</Text>
              <View
                style={[
                  styles.vitalBadge,
                  v.status === 'Normal' ? styles.badgeNormal : styles.badgeAttention,
                ]}
              >
                <Text
                  style={[
                    styles.vitalBadgeText,
                    v.status === 'Normal' ? styles.textNormal : styles.textAttention,
                  ]}
                >
                  {v.status}
                </Text>
              </View>
            </View>

            <View style={styles.vitalMetricsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vItemLabel}>Blood Pressure</Text>
                <Text style={styles.vItemVal}>
                  {v.bpSystolic}/{v.bpDiastolic} <Text style={styles.vUnit}>mmHg</Text>
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vItemLabel}>Blood Sugar</Text>
                <Text style={styles.vItemVal}>
                  {v.bloodSugarFasting} <Text style={styles.vUnit}>mg/dL</Text>
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vItemLabel}>Weight</Text>
                <Text style={styles.vItemVal}>
                  {v.weightKg} <Text style={styles.vUnit}>kg</Text>
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vItemLabel}>Pulse</Text>
                <Text style={styles.vItemVal}>
                  {v.pulseBpm} <Text style={styles.vUnit}>bpm</Text>
                </Text>
              </View>
            </View>

            {v.notes && <Text style={styles.vitalNotes}>{v.notes}</Text>}
          </View>
        ))}
      </View>

      {/* P15: Patient Feedback & Complaint Submission Desk */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={18} color="#0F766E" />
            <Text style={styles.cardSectionTitle}>Feedback & Complaints Desk (P15)</Text>
          </View>
          <TouchableOpacity style={styles.addVitalBtn} onPress={() => setFeedbackModal(true)}>
            <Plus size={14} color="#fff" />
            <Text style={styles.addVitalBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardSub}>Rate hospital departments or raise service complaints</Text>

        {complaints.map((c) => (
          <View key={c.id} style={styles.complaintCard}>
            <View style={styles.compTop}>
              <View>
                <Text style={styles.compTicket}>{c.ticketNo}</Text>
                <Text style={styles.compDept}>{c.department}</Text>
              </View>
              <View
                style={[
                  styles.compBadge,
                  c.status === 'Resolved' ? styles.compResolved : styles.compReview,
                ]}
              >
                <Text
                  style={[
                    styles.compBadgeText,
                    c.status === 'Resolved' ? styles.compTextResolved : styles.compTextReview,
                  ]}
                >
                  {c.status}
                </Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((st) => (
                <Star
                  key={st}
                  size={14}
                  color={st <= c.rating ? '#F59E0B' : '#CBD5E1'}
                  fill={st <= c.rating ? '#F59E0B' : 'transparent'}
                />
              ))}
              <Text style={styles.ratingLabel}>{c.category} • {c.date}</Text>
            </View>

            <Text style={styles.compDesc}>{c.description}</Text>

            {c.resolution && (
              <View style={styles.resBox}>
                <CheckCircle2 size={12} color="#059669" />
                <Text style={styles.resText}><Text style={{ fontWeight: '700' }}>Hospital Response: </Text>{c.resolution}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <LogOut size={16} color="#DC2626" />
        <Text style={styles.logoutText}>Sign Out of Patient Account</Text>
      </TouchableOpacity>

      {/* P01: Phone OTP Confirmation Modal */}
      <Modal visible={otpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>UHID Phone OTP Verification</Text>
                <Text style={styles.modalSub}>Two-Factor Authentication for Patient Health Records</Text>
              </View>
              <TouchableOpacity onPress={() => setOtpModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Registered Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={phoneInput}
                onChangeText={setPhoneInput}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.sendOtpBtn} onPress={handleSendOtp}>
                <Text style={styles.sendOtpText}>{otpSent ? 'Resend' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </View>

            {otpSent && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalInputLabel}>Enter 6-Digit OTP Code</Text>
                <TextInput
                  style={[styles.modalInput, { textAlign: 'center', fontSize: 18, letterSpacing: 6 }]}
                  placeholder="554433"
                  maxLength={6}
                  keyboardType="numeric"
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <Text style={styles.otpPrompt}>Enter demo code 554433 to confirm identity.</Text>

                <TouchableOpacity style={styles.verifyOtpBtn} onPress={handleVerifyOtp}>
                  <CheckCircle2 size={16} color="#fff" />
                  <Text style={styles.verifyOtpBtnText}>Confirm OTP & Link UHID</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* P13: Log Vitals Modal */}
      <Modal visible={vitalsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Personal Vitals</Text>
                <Text style={styles.modalSub}>Self-monitoring log for {selectedFamilyMember.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setVitalsModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.vitalsInputGrid}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Systolic BP (mmHg)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={newSys} onChangeText={setNewSys} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Diastolic BP (mmHg)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={newDia} onChangeText={setNewDia} />
              </View>
            </View>

            <View style={[styles.vitalsInputGrid, { marginTop: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Blood Sugar (mg/dL)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={newSugar} onChangeText={setNewSugar} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>Weight (kg)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={newWeight} onChangeText={setNewWeight} />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.modalInputLabel}>Pulse Rate (bpm)</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={newPulse} onChangeText={setNewPulse} />
            </View>

            <TouchableOpacity style={styles.saveVitalsBtn} onPress={handleSaveVitals}>
              <CheckCircle2 size={16} color="#fff" />
              <Text style={styles.saveVitalsBtnText}>Save Today's Vitals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* P15: Feedback & Complaints Modal */}
      <Modal visible={feedbackModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Patient Feedback Desk</Text>
                <Text style={styles.modalSub}>Share your hospital experience or lodge a ticket</Text>
              </View>
              <TouchableOpacity onPress={() => setFeedbackModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Star Rating Selector */}
            <Text style={styles.modalInputLabel}>Rating</Text>
            <View style={styles.starSelectorRow}>
              {[1, 2, 3, 4, 5].map((st) => (
                <TouchableOpacity key={st} onPress={() => setStarRating(st)}>
                  <Star
                    size={28}
                    color={st <= starRating ? '#F59E0B' : '#CBD5E1'}
                    fill={st <= starRating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Department Selection */}
            <Text style={[styles.modalInputLabel, { marginTop: 12 }]}>Department Category</Text>
            <View style={styles.deptPillsRow}>
              {['Doctor Consultation', 'Nursing Care', 'Outpatient Pharmacy', 'Pathology Lab', 'Cleanliness'].map(
                (d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.fDeptPill, feedbackDept === d && styles.fDeptPillActive]}
                    onPress={() => setFeedbackDept(d)}
                  >
                    <Text
                      style={[styles.fDeptText, feedbackDept === d && styles.fDeptTextActive]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Comments */}
            <Text style={[styles.modalInputLabel, { marginTop: 12 }]}>Comments / Details</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              multiline
              placeholder="Describe your feedback, query, or complaint..."
              value={feedbackText}
              onChangeText={setFeedbackText}
            />

            <TouchableOpacity style={styles.submitFeedbackBtn} onPress={handleSubmitFeedback}>
              <MessageSquare size={16} color="#fff" />
              <Text style={styles.submitFeedbackBtnText}>Submit to Hospital Relations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  familySwitcherSection: { marginBottom: 12 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  switchCount: { fontSize: 11, color: '#64748B' },
  familyScroll: { flexDirection: 'row' },
  familyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  familyPillActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  familyPillText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  familyPillTextActive: { color: '#fff', fontWeight: '800' },
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
  uhidCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hospTitle: { color: '#CCFBF1', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  hospSub: { color: '#99F6E4', fontSize: 9, marginTop: 1 },
  cardName: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 10 },
  cardRelation: { color: '#CCFBF1', fontSize: 12, marginTop: 2 },
  uhidBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  uhidBarLabel: { color: '#99F6E4', fontSize: 10, fontWeight: '700' },
  uhidBarVal: { color: '#fff', fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
  uhidCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  verifiedTagText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  relinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  relinkBtnText: { fontSize: 10, fontWeight: '700', color: '#0F766E' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  cardHeaderWithBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSub: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 10 },
  addVitalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0F766E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  addVitalBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 11, color: '#64748B' },
  infoVal: { fontSize: 11, fontWeight: '700', color: '#1E293B' },
  vitalCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  vitalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vitalDate: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  vitalBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeNormal: { backgroundColor: '#D1FAE5' },
  badgeAttention: { backgroundColor: '#FEE2E2' },
  vitalBadgeText: { fontSize: 9, fontWeight: '800' },
  textNormal: { color: '#065F46' },
  textAttention: { color: '#DC2626' },
  vitalMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  vitalItem: { alignItems: 'center' },
  vItemLabel: { fontSize: 9, color: '#64748B' },
  vItemVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  vUnit: { fontSize: 9, fontWeight: '400', color: '#64748B' },
  vitalNotes: { fontSize: 10, color: '#64748B', marginTop: 6, fontStyle: 'italic' },
  complaintCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  compTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  compTicket: { fontSize: 11, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  compDept: { fontSize: 11, color: '#0F766E', fontWeight: '600', marginTop: 1 },
  compBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  compResolved: { backgroundColor: '#D1FAE5' },
  compReview: { backgroundColor: '#FEF3C7' },
  compBadgeText: { fontSize: 9, fontWeight: '800' },
  compTextResolved: { color: '#065F46' },
  compTextReview: { color: '#B45309' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingLabel: { fontSize: 10, color: '#64748B', marginLeft: 6 },
  compDesc: { fontSize: 11, color: '#334155', marginTop: 6 },
  resBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', padding: 6, borderRadius: 4, marginTop: 6 },
  resText: { fontSize: 10, color: '#065F46', flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  modalInputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  phoneInputRow: { flexDirection: 'row', gap: 8 },
  sendOtpBtn: { backgroundColor: '#0F766E', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  sendOtpText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  otpPrompt: { fontSize: 10, color: '#64748B', marginTop: 4 },
  verifyOtpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 6 },
  verifyOtpBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  vitalsInputGrid: { flexDirection: 'row', gap: 10 },
  saveVitalsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 6 },
  saveVitalsBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  starSelectorRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  deptPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  fDeptPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  fDeptPillActive: { backgroundColor: '#CCFBF1', borderColor: '#0F766E' },
  fDeptText: { fontSize: 10, color: '#475569' },
  fDeptTextActive: { color: '#0F766E', fontWeight: '700' },
  submitFeedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, marginTop: 14, gap: 6 },
  submitFeedbackBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


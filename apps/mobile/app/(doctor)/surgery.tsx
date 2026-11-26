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
  ActivityIndicator,
} from 'react-native';
import {
  Scissors,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Plus,
  X,
  User,
  Calendar,
  FileCheck,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

interface SurgeryCase {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  procedureName: string;
  otRoom: string;
  scheduledDate: string;
  scheduledTime: string;
  anaesthesiaType: string;
  priority: 'ELECTIVE' | 'URGENT' | 'EMERGENCY';
  status: 'SCHEDULED' | 'SIGN_IN_DONE' | 'TIME_OUT_DONE' | 'POST_OP_DONE' | 'COMPLETED';
  surgeon: string;
  anaesthetist: string;
}

const INITIAL_SURGERY_CASES: SurgeryCase[] = [
  {
    id: 'surg-01',
    uhid: 'KZN-2026-0001',
    patientName: 'Ramasamy Kuppusamy',
    age: 58,
    gender: 'Male',
    procedureName: 'Coronary Angioplasty (PTCA with DES Stent)',
    otRoom: 'OT-1 (Cath Lab & Cardio)',
    scheduledDate: '2026-11-24',
    scheduledTime: '10:00 AM',
    anaesthesiaType: 'Monitored Anaesthesia Care (MAC) + Local',
    priority: 'URGENT',
    status: 'SCHEDULED',
    surgeon: 'Dr. K. Senthil Nathan',
    anaesthetist: 'Dr. R. Anand (Anaesthesiology)',
  },
  {
    id: 'surg-02',
    uhid: 'KZN-2026-0019',
    patientName: 'Muthukumar Thyagarajan',
    age: 49,
    gender: 'Male',
    procedureName: 'Diagnostic Coronary Angiogram (CAG)',
    otRoom: 'OT-1 (Cath Lab & Cardio)',
    scheduledDate: '2026-11-24',
    scheduledTime: '12:30 PM',
    anaesthesiaType: 'Local Anaesthesia',
    priority: 'ELECTIVE',
    status: 'SCHEDULED',
    surgeon: 'Dr. K. Senthil Nathan',
    anaesthetist: 'Dr. R. Anand (Anaesthesiology)',
  },
  {
    id: 'surg-03',
    uhid: 'KZN-2026-0022',
    patientName: 'Kuppan G.',
    age: 63,
    gender: 'Male',
    procedureName: 'Emergency Pericardiocentesis',
    otRoom: 'OT-3 (Emergency Theatre)',
    scheduledDate: '2026-11-23',
    scheduledTime: '04:00 PM',
    anaesthesiaType: 'Local with Sedation',
    priority: 'EMERGENCY',
    status: 'SIGN_IN_DONE',
    surgeon: 'Dr. K. Senthil Nathan',
    anaesthetist: 'Dr. S. Vani (Critical Care)',
  },
];

export default function DoctorSurgeryScreen() {
  const { user } = useAuth();
  const [cases, setCases] = useState<SurgeryCase[]>(INITIAL_SURGERY_CASES);
  const [selectedCase, setSelectedCase] = useState<SurgeryCase | null>(null);

  // Booking Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookUhid, setBookUhid] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookProc, setBookProc] = useState('');
  const [bookRoom, setBookRoom] = useState('OT-1 (Cath Lab)');
  const [bookDate, setBookDate] = useState('2026-11-25');
  const [bookTime, setBookTime] = useState('11:00 AM');
  const [bookAnaesth, setBookAnaesth] = useState('General Anaesthesia');
  const [bookPriority, setBookPriority] = useState<'ELECTIVE' | 'URGENT' | 'EMERGENCY'>('ELECTIVE');

  // WHO Checklist Modal
  const [whoModalOpen, setWhoModalOpen] = useState(false);
  const [whoStage, setWhoStage] = useState<'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'>('SIGN_IN');

  // Sign-In Checks
  const [siIdentity, setSiIdentity] = useState(true);
  const [siSiteMarked, setSiSiteMarked] = useState(true);
  const [siAnaesthCheck, setSiAnaesthCheck] = useState(true);
  const [siPulseOx, setSiPulseOx] = useState(true);
  const [siAllergy, setSiAllergy] = useState(true);
  const [siAirwayRisk, setSiAirwayRisk] = useState(false);
  const [siBloodLossRisk, setSiBloodLossRisk] = useState(false);

  // Time-Out Checks
  const [toTeamIntro, setToTeamIntro] = useState(true);
  const [toPatientConfirm, setToPatientConfirm] = useState(true);
  const [toAntibiotic, setToAntibiotic] = useState(true);
  const [toCriticalEvents, setToCriticalEvents] = useState(true);
  const [toImagingDisplayed, setToImagingDisplayed] = useState(true);

  // Sign-Out Checks
  const [soProcedureRecorded, setSoProcedureRecorded] = useState(true);
  const [soCountCorrect, setSoCountCorrect] = useState(true);
  const [soSpecimenLabeled, setSoSpecimenLabeled] = useState(true);
  const [soEquipmentOk, setSoEquipmentOk] = useState(true);
  const [soPacuPlan, setSoPacuPlan] = useState(true);

  // Post-Op Modal
  const [postOpModalOpen, setPostOpModalOpen] = useState(false);
  const [findings, setFindings] = useState('');
  const [implants, setImplants] = useState('');
  const [bloodLoss, setBloodLoss] = useState('50 ml');
  const [pacuInstructions, setPacuInstructions] = useState('');

  const openWhoModal = (c: SurgeryCase) => {
    setSelectedCase(c);
    if (c.status === 'SCHEDULED') setWhoStage('SIGN_IN');
    else if (c.status === 'SIGN_IN_DONE') setWhoStage('TIME_OUT');
    else setWhoStage('SIGN_OUT');
    setWhoModalOpen(true);
  };

  const completeWhoStage = () => {
    if (!selectedCase) return;
    if (whoStage === 'SIGN_IN') {
      setCases((prev) =>
        prev.map((item) =>
          item.id === selectedCase.id ? { ...item, status: 'SIGN_IN_DONE' } : item
        )
      );
      setWhoStage('TIME_OUT');
      Alert.alert('Sign-In Verified', 'WHO Stage 1 (Before Induction) verified by Surgeon & Anaesthetist.');
    } else if (whoStage === 'TIME_OUT') {
      setCases((prev) =>
        prev.map((item) =>
          item.id === selectedCase.id ? { ...item, status: 'TIME_OUT_DONE' } : item
        )
      );
      setWhoStage('SIGN_OUT');
      Alert.alert('Time-Out Verified', 'WHO Stage 2 (Before Skin Incision) confirmed with surgical team.');
    } else {
      setCases((prev) =>
        prev.map((item) =>
          item.id === selectedCase.id ? { ...item, status: 'POST_OP_DONE' } : item
        )
      );
      setWhoModalOpen(false);
      Alert.alert('Sign-Out Verified', 'WHO Stage 3 complete. Patient ready for transfer to PACU.');
    }
  };

  const openPostOpModal = (c: SurgeryCase) => {
    setSelectedCase(c);
    setFindings('LAD 90% stenosis dilated with 3.0 x 18 mm Drug-Eluting Stent (DES). TIMI III flow achieved.');
    setImplants('Resolute Onyx DES (SN: RO-88392)');
    setBloodLoss('30 ml');
    setPacuInstructions('Keep right radial puncture site compressed for 4 hours. Telemetry for 24h.');
    setPostOpModalOpen(true);
  };

  const savePostOpNote = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((item) =>
        item.id === selectedCase.id ? { ...item, status: 'COMPLETED' } : item
      )
    );
    setPostOpModalOpen(false);
    Alert.alert(
      'Post-Op Note Signed',
      `Surgical report and PACU orders finalized for ${selectedCase.patientName}.`
    );
  };

  const handleBookSurgery = () => {
    if (!bookUhid || !bookProc) {
      Alert.alert('Required', 'Please enter Patient UHID and Procedure Name.');
      return;
    }

    const newCase: SurgeryCase = {
      id: `surg-${Date.now()}`,
      uhid: bookUhid,
      patientName: bookName || 'Admitted Patient',
      age: 50,
      gender: 'M/F',
      procedureName: bookProc,
      otRoom: bookRoom,
      scheduledDate: bookDate,
      scheduledTime: bookTime,
      anaesthesiaType: bookAnaesth,
      priority: bookPriority,
      status: 'SCHEDULED',
      surgeon: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. K. Senthil Nathan',
      anaesthetist: 'Dr. R. Anand (Anaesthesiology)',
    };

    setCases((prev) => [newCase, ...prev]);
    setBookModalOpen(false);
    Alert.alert('OT Slot Reserved', `Procedure booked in ${bookRoom} for ${bookDate} at ${bookTime}.`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* OT Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Operation Theatre (OT) Desk</Text>
          <TouchableOpacity onPress={() => setBookModalOpen(true)} style={styles.bookBtn}>
            <Plus size={14} color="#38845A" />
            <Text style={styles.bookBtnText}>Book OT</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerSub}>
          WHO Surgical Safety Protocol & Operative Workflow • Room 204
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{cases.length}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {cases.filter((c) => c.status === 'SIGN_IN_DONE' || c.status === 'TIME_OUT_DONE').length}
            </Text>
            <Text style={styles.statLabel}>In OT Progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {cases.filter((c) => c.status === 'COMPLETED').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Case List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Surgical Worklist & OT Schedule</Text>

        {cases.map((c) => {
          const isDone = c.status === 'COMPLETED';
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.otBadge}>
                  <Scissors size={14} color="#38845A" />
                  <Text style={styles.otBadgeText}>{c.otRoom}</Text>
                </View>
                <View
                  style={[
                    styles.priorityTag,
                    c.priority === 'EMERGENCY'
                      ? styles.tagEmergency
                      : c.priority === 'URGENT'
                      ? styles.tagUrgent
                      : styles.tagElective,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      c.priority === 'EMERGENCY'
                        ? styles.textEmergency
                        : c.priority === 'URGENT'
                        ? styles.textUrgent
                        : styles.textElective,
                    ]}
                  >
                    {c.priority}
                  </Text>
                </View>
              </View>

              <Text style={styles.procedureName}>{c.procedureName}</Text>
              <Text style={styles.patientLine}>
                {c.patientName} ({c.gender}, {c.age} yrs) • UHID: {c.uhid}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Schedule:</Text>
                  <Text style={styles.metaVal}>{c.scheduledDate} at {c.scheduledTime}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Anaesthesia:</Text>
                  <Text style={styles.metaVal}>{c.anaesthesiaType}</Text>
                </View>
              </View>

              <View style={styles.teamBox}>
                <Text style={styles.teamText}>Surgeon: {c.surgeon}</Text>
                <Text style={styles.teamText}>Anaesthetist: {c.anaesthetist}</Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusRow}>
                <View style={styles.statusIndicator}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.statusIndicatorText}>
                    Status: {c.status.replace(/_/g, ' ')}
                  </Text>
                </View>

                {isDone ? (
                  <View style={styles.doneTag}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.doneTagText}>Surgery Completed</Text>
                  </View>
                ) : (
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={styles.whoBtn}
                      onPress={() => openWhoModal(c)}
                    >
                      <ShieldCheck size={14} color="#38845A" />
                      <Text style={styles.whoBtnText}>WHO Checklist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.postOpBtn}
                      onPress={() => openPostOpModal(c)}
                    >
                      <FileCheck size={14} color="#fff" />
                      <Text style={styles.postOpBtnText}>Post-Op Note</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* BOOK OT MODAL */}
      <Modal visible={bookModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request OT Slot & Surgical Booking</Text>
            <TouchableOpacity onPress={() => setBookModalOpen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              <Text style={styles.label}>Patient UHID *</Text>
              <TextInput
                style={styles.input}
                value={bookUhid}
                onChangeText={setBookUhid}
                placeholder="e.g. KZN-2026-0001"
              />

              <Text style={styles.label}>Patient Name</Text>
              <TextInput
                style={styles.input}
                value={bookName}
                onChangeText={setBookName}
                placeholder="Patient Full Name"
              />

              <Text style={styles.label}>Surgical Procedure Name *</Text>
              <TextInput
                style={styles.input}
                value={bookProc}
                onChangeText={setBookProc}
                placeholder="e.g. Laparoscopic Appendectomy / PTCA"
              />

              <Text style={styles.label}>Select Operation Theatre</Text>
              <TextInput
                style={styles.input}
                value={bookRoom}
                onChangeText={setBookRoom}
                placeholder="OT-1 (Cath Lab), OT-2 (General), OT-3 (Emergency)"
              />

              <View style={styles.grid2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={bookDate}
                    onChangeText={setBookDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Time Slot</Text>
                  <TextInput
                    style={styles.input}
                    value={bookTime}
                    onChangeText={setBookTime}
                  />
                </View>
              </View>

              <Text style={styles.label}>Anaesthesia Type</Text>
              <TextInput
                style={styles.input}
                value={bookAnaesth}
                onChangeText={setBookAnaesth}
                placeholder="General / Spinal / Local"
              />

              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.prioritySelector}>
                {(['ELECTIVE', 'URGENT', 'EMERGENCY'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      bookPriority === p && styles.priorityOptionActive,
                    ]}
                    onPress={() => setBookPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityOptionText,
                        bookPriority === p && styles.priorityOptionTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleBookSurgery}>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Confirm OT Reservation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WHO SURGICAL SAFETY CHECKLIST MODAL */}
      <Modal visible={whoModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>WHO Surgical Safety Checklist</Text>
              <Text style={styles.modalSub}>{selectedCase?.procedureName}</Text>
            </View>
            <TouchableOpacity onPress={() => setWhoModalOpen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 3 Stages Tab Indicator */}
          <View style={styles.stageTabs}>
            <View style={[styles.stageTab, whoStage === 'SIGN_IN' && styles.stageTabActive]}>
              <Text style={[styles.stageTabText, whoStage === 'SIGN_IN' && styles.stageTabTextActive]}>
                1. Sign-In
              </Text>
            </View>
            <View style={[styles.stageTab, whoStage === 'TIME_OUT' && styles.stageTabActive]}>
              <Text style={[styles.stageTabText, whoStage === 'TIME_OUT' && styles.stageTabTextActive]}>
                2. Time-Out
              </Text>
            </View>
            <View style={[styles.stageTab, whoStage === 'SIGN_OUT' && styles.stageTabActive]}>
              <Text style={[styles.stageTabText, whoStage === 'SIGN_OUT' && styles.stageTabTextActive]}>
                3. Sign-Out
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              {/* STAGE 1: SIGN-IN */}
              {whoStage === 'SIGN_IN' && (
                <View>
                  <Text style={styles.stageHeading}>Before Induction of Anaesthesia</Text>
                  <Text style={styles.stageSub}>Must be verified by Anaesthetist & Nurse</Text>

                  <CheckItem label="Patient identity, site, procedure & consent confirmed" checked={siIdentity} onToggle={() => setSiIdentity(!siIdentity)} />
                  <CheckItem label="Surgical site marked by operating surgeon" checked={siSiteMarked} onToggle={() => setSiSiteMarked(!siSiteMarked)} />
                  <CheckItem label="Anaesthesia machine and medication check completed" checked={siAnaesthCheck} onToggle={() => setSiAnaesthCheck(!siAnaesthCheck)} />
                  <CheckItem label="Pulse oximeter on patient and functioning" checked={siPulseOx} onToggle={() => setSiPulseOx(!siPulseOx)} />
                  <CheckItem label="Known allergies verified with patient wristband" checked={siAllergy} onToggle={() => setSiAllergy(!siAllergy)} />
                  <CheckItem label="Difficult airway or aspiration risk assessed & equipment ready" checked={siAirwayRisk} onToggle={() => setSiAirwayRisk(!siAirwayRisk)} />
                  <CheckItem label="Risk of >500ml blood loss assessed & adequate IV access verified" checked={siBloodLossRisk} onToggle={() => setSiBloodLossRisk(!siBloodLossRisk)} />
                </View>
              )}

              {/* STAGE 2: TIME-OUT */}
              {whoStage === 'TIME_OUT' && (
                <View>
                  <Text style={styles.stageHeading}>Before Skin Incision</Text>
                  <Text style={styles.stageSub}>Entire surgical team pause and confirm verbally</Text>

                  <CheckItem label="All team members introduced by name and role" checked={toTeamIntro} onToggle={() => setToTeamIntro(!toTeamIntro)} />
                  <CheckItem label="Surgeon, Anaesthetist & Nurse confirm patient, site & procedure" checked={toPatientConfirm} onToggle={() => setToPatientConfirm(!toPatientConfirm)} />
                  <CheckItem label="Antibiotic prophylaxis administered within past 60 minutes" checked={toAntibiotic} onToggle={() => setToAntibiotic(!toAntibiotic)} />
                  <CheckItem label="Surgeon reviews anticipated critical steps, duration & blood loss" checked={toCriticalEvents} onToggle={() => setToCriticalEvents(!toCriticalEvents)} />
                  <CheckItem label="Essential diagnostic imaging displayed in theatre" checked={toImagingDisplayed} onToggle={() => setToImagingDisplayed(!toImagingDisplayed)} />
                </View>
              )}

              {/* STAGE 3: SIGN-OUT */}
              {whoStage === 'SIGN_OUT' && (
                <View>
                  <Text style={styles.stageHeading}>Before Patient Leaves Operating Theatre</Text>
                  <Text style={styles.stageSub}>Nurse, Surgeon & Anaesthetist final review</Text>

                  <CheckItem label="Nurse verbally confirms name of procedure recorded" checked={soProcedureRecorded} onToggle={() => setSoProcedureRecorded(!soProcedureRecorded)} />
                  <CheckItem label="Instrument, sponge and needle counts verified complete" checked={soCountCorrect} onToggle={() => setSoCountCorrect(!soCountCorrect)} />
                  <CheckItem label="Specimen labeled with patient UHID and full name" checked={soSpecimenLabeled} onToggle={() => setSoSpecimenLabeled(!soSpecimenLabeled)} />
                  <CheckItem label="Equipment problems or failures identified and reported" checked={soEquipmentOk} onToggle={() => setSoEquipmentOk(!soEquipmentOk)} />
                  <CheckItem label="Key concerns for PACU recovery and post-op care reviewed" checked={soPacuPlan} onToggle={() => setSoPacuPlan(!soPacuPlan)} />
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitBtn} onPress={completeWhoStage}>
              <ShieldCheck size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {whoStage === 'SIGN_IN' ? 'Verify Sign-In → Proceed to Time-Out' : whoStage === 'TIME_OUT' ? 'Verify Time-Out → Proceed to Sign-Out' : 'Finalize WHO Checklist & Send to PACU'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POST-OPERATIVE NOTE MODAL */}
      <Modal visible={postOpModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post-Operative Clinical Note</Text>
            <TouchableOpacity onPress={() => setPostOpModalOpen(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formPadding}>
              <Text style={styles.label}>Operative Findings & Procedure Summary *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={findings}
                onChangeText={setFindings}
                multiline
                placeholder="Detailed surgical findings, lesions, stenting, resections..."
              />

              <Text style={styles.label}>Implants / Prosthesis Placed</Text>
              <TextInput
                style={styles.input}
                value={implants}
                onChangeText={setImplants}
                placeholder="Serial number, manufacturer, size"
              />

              <Text style={styles.label}>Estimated Blood Loss</Text>
              <TextInput
                style={styles.input}
                value={bloodLoss}
                onChangeText={setBloodLoss}
                placeholder="e.g. 50 ml"
              />

              <Text style={styles.label}>PACU Recovery & Nursing Directives *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={pacuInstructions}
                onChangeText={setPacuInstructions}
                multiline
                placeholder="Extubation, puncture site monitoring, post-op analgesia, telemetry..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.submitBtn} onPress={savePostOpNote}>
              <FileCheck size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Sign Operative Note & Release to Inpatient Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Check size={14} color="#fff" />}
      </View>
      <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: { backgroundColor: '#38845A', padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSub: { color: '#CDE8D5', fontSize: 12, marginTop: 4 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5ED', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  bookBtnText: { color: '#38845A', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.12)', flex: 1, marginHorizontal: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#EAF5ED', fontSize: 11, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  otBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 6 },
  otBadgeText: { color: '#38845A', fontSize: 12, fontWeight: '700' },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagEmergency: { backgroundColor: '#EAF5ED' },
  tagUrgent: { backgroundColor: '#FEF3C7' },
  tagElective: { backgroundColor: '#E0E7FF' },
  priorityText: { fontSize: 11, fontWeight: '700' },
  textEmergency: { color: '#991B1B' },
  textUrgent: { color: '#92400E' },
  textElective: { color: '#3730A3' },
  procedureName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  patientLine: { fontSize: 13, color: '#475569', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginTop: 10 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 11, color: '#64748B' },
  metaVal: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  teamBox: { marginTop: 8, padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
  teamText: { fontSize: 11, color: '#334155' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusIndicatorText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  whoBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#38845A', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, gap: 4 },
  whoBtnText: { color: '#38845A', fontSize: 11, fontWeight: '700' },
  postOpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#38845A', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, gap: 4 },
  postOpBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  doneTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneTagText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { backgroundColor: '#38845A', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalSub: { color: '#CDE8D5', fontSize: 12, marginTop: 2 },
  modalScroll: { flex: 1 },
  formPadding: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  grid2: { flexDirection: 'row', gap: 10 },
  prioritySelector: { flexDirection: 'row', gap: 8, marginTop: 6 },
  priorityOption: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#E2E8F0' },
  priorityOptionActive: { backgroundColor: '#38845A' },
  priorityOptionText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  priorityOptionTextActive: { color: '#fff' },
  modalFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38845A', paddingVertical: 14, borderRadius: 10, gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // WHO Checklist Styles
  stageTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  stageTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  stageTabActive: { borderBottomColor: '#38845A' },
  stageTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  stageTabTextActive: { color: '#38845A', fontWeight: '700' },
  stageHeading: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  stageSub: { fontSize: 12, color: '#64748B', marginBottom: 16, marginTop: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#38845A', borderColor: '#38845A' },
  checkLabel: { fontSize: 13, color: '#334155', flex: 1 },
  checkLabelChecked: { color: '#0F172A', fontWeight: '500' },
});

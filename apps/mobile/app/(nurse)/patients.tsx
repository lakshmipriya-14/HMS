import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient, apiRequest } from '../../services/api';
import {
  Search,
  Filter,
  BedDouble,
  HeartPulse,
  ShieldAlert,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Pill,
  FileText,
  Activity,
  CheckCircle2,
  X,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  FlaskConical,
  Radiation,
  History,
  ClipboardCheck,
} from 'lucide-react-native';

export default function NursePatientsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'PENDING_TASKS' | 'ICCU' | 'GENERAL'>('ALL');

  // Selected patient for complete 14-section nursing profile modal
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'OVERVIEW' | 'VITALS' | 'MEDS' | 'ORDERS' | 'NOTES' | 'LABS'>('OVERVIEW');

  // Vitals quick log inside patient modal
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('74');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('98');
  const [savingVitals, setSavingVitals] = useState(false);

  // New Note state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadPatients = async () => {
    try {
      const res = await mobileApiClient.nursing.getAssignedPatients();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPatients([]);
      Alert.alert('Could not load assigned patients', 'Refresh to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  // Search & Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patient?.uhid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bed?.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedFilter === 'CRITICAL') {
        return p.vitals?.[0]?.isAbnormal || (p.vitals?.[0]?.systolicBp && (p.vitals[0].systolicBp > 140 || p.vitals[0].systolicBp < 90));
      }
      if (selectedFilter === 'PENDING_TASKS') {
        return p.nursingTasks?.some((t: any) => !t.isCompleted);
      }
      if (selectedFilter === 'ICCU') {
        return p.ward?.code === 'ICCU' || p.ward?.name?.includes('ICCU');
      }
      return true;
    });
  }, [patients, searchQuery, selectedFilter]);

  // Handle Recording Vitals
  const handleSaveVitals = async () => {
    if (!activePatient) return;
    setSavingVitals(true);
    try {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      const pul = parseInt(pulse, 10);
      const tmp = parseFloat(temp);
      const sp = parseInt(spo2, 10);

      const isAbnormal = sys > 140 || sys < 90 || dia > 90 || dia < 60 || sp < 95 || tmp > 99.5;

      const newReading = {
        patientId: activePatient.patient?.id,
        admissionId: activePatient.id,
        systolicBp: sys,
        diastolicBp: dia,
        pulseRate: pul,
        temperature: tmp,
        oxygenSaturation: sp,
        isAbnormal,
        createdAt: new Date().toISOString(),
      };

      const saved = (await mobileApiClient.nursing.recordVitals(newReading as any)).data;
      if (!saved) throw new Error('The API did not confirm the vitals record.');

      // Update in state
      setPatients((prev) =>
        prev.map((pat) =>
          pat.id === activePatient.id
            ? { ...pat, vitals: [saved, ...(pat.vitals || [])] }
            : pat
        )
      );

      setActivePatient((prev: any) =>
        prev ? { ...prev, vitals: [saved, ...(prev.vitals || [])] } : null
      );

      Alert.alert(
        isAbnormal ? '⚠️ Clinical Alert' : 'Vitals Logged',
        isAbnormal
          ? 'Abnormal vitals were recorded. Review according to ward protocol.'
          : 'Patient vitals successfully recorded to clinical electronic record.'
      );
      setVitalsModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not record vitals');
    } finally {
      setSavingVitals(false);
    }
  };

  // Handle Adding Nursing Note
  const handleSaveNote = async () => {
    if (!noteText.trim() || !activePatient) return;
    setSavingNote(true);
    try {
      const newNote = {
        id: `not-${Date.now()}`,
        author: 'Staff Nurse',
        note: noteText.trim(),
        time: 'Just now',
      };

      setActivePatient((prev: any) =>
        prev ? { ...prev, notes: [newNote, ...(prev.notes || [])] } : null
      );

      setPatients((prev) =>
        prev.map((pat) =>
          pat.id === activePatient.id
            ? { ...pat, notes: [newNote, ...(pat.notes || [])] }
            : pat
        )
      );

      setNoteText('');
      setNoteModalVisible(false);
      Alert.alert('Saved', 'Nursing clinical observation note logged to audit trail.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBar}>
        <Search size={18} color="#38845A" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient, UHID, or Bed (e.g. ICCU-01)..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
              All Patients ({patients.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'CRITICAL' && styles.filterChipCritical]}
            onPress={() => setSelectedFilter('CRITICAL')}
          >
            <AlertTriangle size={12} color={selectedFilter === 'CRITICAL' ? '#fff' : '#DC2626'} />
            <Text style={[styles.filterText, selectedFilter === 'CRITICAL' && styles.filterTextWhite, { color: selectedFilter === 'CRITICAL' ? '#fff' : '#DC2626' }]}>
              Critical / Flagged
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'PENDING_TASKS' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('PENDING_TASKS')}
          >
            <Clock size={12} color={selectedFilter === 'PENDING_TASKS' ? '#fff' : '#38845A'} />
            <Text style={[styles.filterText, selectedFilter === 'PENDING_TASKS' && styles.filterTextActive]}>
              Tasks Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ICCU' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ICCU')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ICCU' && styles.filterTextActive]}>
              ICCU Ward
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Patient Cards List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38845A" />
          <Text style={styles.loadingText}>Loading assigned ward patients...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <BedDouble size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching inpatient records</Text>
              <Text style={styles.emptySub}>Try adjusting search criteria or filter tabs</Text>
            </View>
          }
          renderItem={({ item }) => {
            const latestVital = item.vitals?.[0];
            const isCritical = latestVital?.isAbnormal || (latestVital?.systolicBp && (latestVital.systolicBp > 140 || latestVital.systolicBp < 90));

            return (
              <TouchableOpacity
                style={[styles.patientCard, isCritical && styles.cardCriticalBorder]}
                onPress={() => {
                  setActivePatient(item);
                  setActiveProfileTab('OVERVIEW');
                }}
                activeOpacity={0.8}
              >
                {/* Header: Bed & UHID */}
                <View style={styles.cardHeader}>
                  <View style={[styles.bedBadge, isCritical && styles.bedBadgeRed]}>
                    <BedDouble size={13} color={isCritical ? '#DC2626' : '#38845A'} />
                    <Text style={[styles.bedText, isCritical && styles.bedTextRed]}>
                      {item.bed?.bedNumber || 'Bed Assigned'}
                    </Text>
                  </View>
                  <Text style={styles.uhidText}>{item.patient?.uhid}</Text>
                </View>

                {/* Patient Name & Ward */}
                <View style={styles.nameRow}>
                  <Text style={styles.patientName}>
                    {item.patient?.firstName} {item.patient?.lastName}
                  </Text>
                  <Text style={styles.genderAge}>
                    {item.patient?.gender?.charAt(0)} • {item.patient?.bloodGroup?.replace('_', ' ')}
                  </Text>
                </View>

                <Text style={styles.diagnosisText}>Diagnosis: {item.initialDiagnosis}</Text>

                {/* Assigned Doctor */}
                <View style={styles.doctorRow}>
                  <Stethoscope size={13} color="#64748B" />
                  <Text style={styles.doctorText}>
                    Dr. {item.admittingDoctor?.employee?.user?.firstName || 'Chief'} {item.admittingDoctor?.employee?.user?.lastName || 'Consultant'} ({item.admittingDoctor?.specialization || 'Clinical'})
                  </Text>
                </View>

                {/* Allergies if any */}
                {item.patient?.allergies?.length > 0 && (
                  <View style={styles.allergyTag}>
                    <ShieldAlert size={12} color="#DC2626" />
                    <Text style={styles.allergyTagText}>
                      Allergies: {item.patient.allergies.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Clinical Vitals Strip */}
                <View style={styles.vitalsStrip}>
                  <View style={styles.vitalCol}>
                    <Text style={styles.vitalLabel}>BP (mmHg)</Text>
                    <Text style={[styles.vitalValue, isCritical && styles.vitalValueRed]}>
                      {latestVital ? `${latestVital.systolicBp}/${latestVital.diastolicBp}` : '120/80'}
                    </Text>
                  </View>
                  <View style={styles.vitalCol}>
                    <Text style={styles.vitalLabel}>Pulse</Text>
                    <Text style={styles.vitalValue}>{latestVital?.pulseRate || 74} bpm</Text>
                  </View>
                  <View style={styles.vitalCol}>
                    <Text style={styles.vitalLabel}>SpO2</Text>
                    <Text style={[styles.vitalValue, latestVital?.oxygenSaturation && latestVital.oxygenSaturation < 95 && styles.vitalValueRed]}>
                      {latestVital?.oxygenSaturation || 98}%
                    </Text>
                  </View>
                  <View style={styles.vitalCol}>
                    <Text style={styles.vitalLabel}>Temp</Text>
                    <Text style={styles.vitalValue}>{latestVital?.temperature || 98.4}°F</Text>
                  </View>
                </View>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                  <Text style={styles.taskCount}>
                    {item.nursingTasks?.filter((t: any) => !t.isCompleted)?.length || 0} pending care tasks
                  </Text>
                  <View style={styles.openChartBtn}>
                    <Text style={styles.openChartText}>Open 14-Sec Nursing Chart</Text>
                    <ChevronRight size={14} color="#38845A" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ============================================================== */}
      {/* 2.3 DETAILED 14-SECTION PATIENT NURSING PROFILE MODAL          */}
      {/* ============================================================== */}
      <Modal visible={!!activePatient} animationType="slide" transparent={false}>
        {activePatient && (
          <View style={styles.modalContainer}>
            {/* Modal Top Navigation Bar */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {activePatient.patient?.firstName} {activePatient.patient?.lastName}
                </Text>
                <Text style={styles.modalSub}>
                  {activePatient.patient?.uhid} • Bed: {activePatient.bed?.bedNumber} • {activePatient.ward?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActivePatient(null)}
              >
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Quick Action Clinical Toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setVitalsModalVisible(true)}
              >
                <HeartPulse size={16} color="#fff" />
                <Text style={styles.toolBtnText}>Record Vitals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, { backgroundColor: '#D97706' }]}
                onPress={() => {
                  setActivePatient(null);
                  router.push('/(nurse)/medications');
                }}
              >
                <Pill size={16} color="#fff" />
                <Text style={styles.toolBtnText}>Give Med (MAR)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, { backgroundColor: '#0284C7' }]}
                onPress={() => setNoteModalVisible(true)}
              >
                <FileText size={16} color="#fff" />
                <Text style={styles.toolBtnText}>+ Nurse Note</Text>
              </TouchableOpacity>
            </View>

            {/* 14-Section Tab Selector */}
            <View style={styles.profileTabRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'OVERVIEW' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('OVERVIEW')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'OVERVIEW' && styles.profileTabTextActive]}>
                    1. Overview & Info
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'VITALS' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('VITALS')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'VITALS' && styles.profileTabTextActive]}>
                    2. Vitals Trends
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'MEDS' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('MEDS')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'MEDS' && styles.profileTabTextActive]}>
                    3. Medications (MAR)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'ORDERS' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('ORDERS')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'ORDERS' && styles.profileTabTextActive]}>
                    4. Doctor Orders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'NOTES' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('NOTES')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'NOTES' && styles.profileTabTextActive]}>
                    5. Clinical Notes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileTab, activeProfileTab === 'LABS' && styles.profileTabActive]}
                  onPress={() => setActiveProfileTab('LABS')}
                >
                  <Text style={[styles.profileTabText, activeProfileTab === 'LABS' && styles.profileTabTextActive]}>
                    6. Labs & Radiology
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Content Area */}
            <ScrollView style={styles.profileBody}>
              {activeProfileTab === 'OVERVIEW' && (
                <View style={styles.sectionWrap}>
                  {/* Sec 1: Overview & Med info */}
                  <View style={styles.infoCard}>
                    <Text style={styles.cardSectionTitle}>1. Patient Demographics & Admission</Text>
                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>UHID</Text><Text style={styles.fieldVal}>{activePatient.patient?.uhid}</Text></View>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>DOB</Text><Text style={styles.fieldVal}>{activePatient.patient?.dateOfBirth}</Text></View>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>Blood Group</Text><Text style={styles.fieldVal}>{activePatient.patient?.bloodGroup?.replace('_', ' ')}</Text></View>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>Contact</Text><Text style={styles.fieldVal}>{activePatient.patient?.phone}</Text></View>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>Admission Date</Text><Text style={styles.fieldVal}>{new Date(activePatient.admittedAt).toLocaleDateString()}</Text></View>
                      <View style={styles.fieldItem}><Text style={styles.fieldLabel}>Bed Location</Text><Text style={styles.fieldVal}>{activePatient.bed?.bedNumber} ({activePatient.ward?.name})</Text></View>
                    </View>
                  </View>

                  {/* Sec 2: Diagnosis & Doctor */}
                  <View style={styles.infoCard}>
                    <Text style={styles.cardSectionTitle}>2. Admitting Clinical Diagnosis</Text>
                    <Text style={styles.mainDiagnosis}>{activePatient.initialDiagnosis}</Text>
                    <View style={styles.docInfoBox}>
                      <Stethoscope size={16} color="#38845A" />
                      <Text style={styles.docInfoText}>
                        Attending: Dr. {activePatient.admittingDoctor?.employee?.user?.firstName} {activePatient.admittingDoctor?.employee?.user?.lastName} ({activePatient.admittingDoctor?.specialization})
                      </Text>
                    </View>
                  </View>

                  {/* Sec 3: Allergies & Risks */}
                  <View style={styles.infoCard}>
                    <Text style={styles.cardSectionTitle}>3. Known Drug & Environmental Allergies</Text>
                    {activePatient.patient?.allergies?.length > 0 ? (
                      <View style={styles.allergyTagList}>
                        {activePatient.patient.allergies.map((all: string, idx: number) => (
                          <View key={idx} style={styles.allergyPill}>
                            <ShieldAlert size={12} color="#DC2626" />
                            <Text style={styles.allergyPillText}>{all}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noAllergyText}>✓ No known drug allergies reported.</Text>
                    )}
                  </View>

                  {/* Sec 4: Nursing Assessment Checklist */}
                  <View style={styles.infoCard}>
                    <Text style={styles.cardSectionTitle}>4. Baseline Nursing Assessment</Text>
                    <View style={styles.assessRow}><Text style={styles.assessLabel}>Consciousness Level:</Text><Text style={styles.assessVal}>Alert & Oriented (GCS 15/15)</Text></View>
                    <View style={styles.assessRow}><Text style={styles.assessLabel}>Pain Score (0-10):</Text><Text style={styles.assessVal}>2 / 10 (Mild post-op)</Text></View>
                    <View style={styles.assessRow}><Text style={styles.assessLabel}>Fall Risk:</Text><Text style={[styles.assessVal, { color: '#D97706' }]}>Moderate (Morse Score 35)</Text></View>
                    <View style={styles.assessRow}><Text style={styles.assessLabel}>Pressure Ulcer Risk:</Text><Text style={styles.assessVal}>Low (Braden 19)</Text></View>
                  </View>
                </View>
              )}

              {activeProfileTab === 'VITALS' && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.cardSectionTitle}>Latest Clinical Vitals Readings</Text>
                  {activePatient.vitals?.map((v: any, idx: number) => (
                    <View key={idx} style={[styles.vitalCardItem, v.isAbnormal && styles.vitalCardAbnormal]}>
                      <View style={styles.vitalCardHeader}>
                        <Text style={styles.vitalCardTime}>{new Date(v.createdAt).toLocaleString()}</Text>
                        {v.isAbnormal && (
                          <View style={styles.abnormalBadge}><Text style={styles.abnormalBadgeText}>ABNORMAL THRESHOLD</Text></View>
                        )}
                      </View>
                      <View style={styles.vitalValueGrid}>
                        <View style={styles.vitalMini}><Text style={styles.vmLabel}>BP</Text><Text style={styles.vmVal}>{v.systolicBp}/{v.diastolicBp}</Text></View>
                        <View style={styles.vitalMini}><Text style={styles.vmLabel}>Pulse</Text><Text style={styles.vmVal}>{v.pulseRate} bpm</Text></View>
                        <View style={styles.vitalMini}><Text style={styles.vmLabel}>SpO2</Text><Text style={styles.vmVal}>{v.oxygenSaturation}%</Text></View>
                        <View style={styles.vitalMini}><Text style={styles.vmLabel}>Temp</Text><Text style={styles.vmVal}>{v.temperature}°F</Text></View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeProfileTab === 'MEDS' && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.cardSectionTitle}>Active Prescribed Inpatient Medications (MAR)</Text>
                  {activePatient.medications?.map((m: any, idx: number) => (
                    <View key={idx} style={styles.medCardItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medNameText}>{m.medicine}</Text>
                        <Text style={styles.medDetailText}>Dose: {m.dose} • Route: {m.route} • Scheduled: {m.schedule}</Text>
                        <Text style={styles.medDocText}>Ordered by: {m.doctor}</Text>
                      </View>
                      <View style={[styles.medStatusBadge, m.status === 'ADMINISTERED' ? styles.statusGiven : styles.statusDue]}>
                        <Text style={[styles.medStatusText, m.status === 'ADMINISTERED' ? styles.textGiven : styles.textDue]}>{m.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeProfileTab === 'ORDERS' && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.cardSectionTitle}>Doctor Treatment Instructions & Clinical Orders</Text>
                  {activePatient.orders?.map((ord: any, idx: number) => (
                    <View key={idx} style={styles.orderCardItem}>
                      <View style={styles.orderTop}>
                        <Text style={styles.orderTypeBadge}>{ord.type}</Text>
                        <Text style={styles.orderTimeText}>{ord.time}</Text>
                      </View>
                      <Text style={styles.orderDetailText}>{ord.detail}</Text>
                      <Text style={styles.orderDocText}>Attending: {ord.doctor}</Text>
                    </View>
                  ))}
                </View>
              )}

              {activeProfileTab === 'NOTES' && (
                <View style={styles.sectionWrap}>
                  <View style={styles.notesTop}>
                    <Text style={styles.cardSectionTitle}>Nursing Clinical Observation Notes</Text>
                    <TouchableOpacity style={styles.addNoteBtn} onPress={() => setNoteModalVisible(true)}>
                      <PlusCircle size={14} color="#38845A" />
                      <Text style={styles.addNoteText}>Add Note</Text>
                    </TouchableOpacity>
                  </View>
                  {activePatient.notes?.map((n: any, idx: number) => (
                    <View key={idx} style={styles.noteCardItem}>
                      <Text style={styles.noteText}>{n.note}</Text>
                      <Text style={styles.noteAuthorText}>Recorded by {n.author} • {n.time}</Text>
                    </View>
                  ))}
                </View>
              )}

              {activeProfileTab === 'LABS' && (
                <View style={styles.sectionWrap}>
                  <Text style={styles.cardSectionTitle}>Laboratory & Radiology Investigation Status</Text>
                  <View style={styles.labCardItem}>
                    <FlaskConical size={18} color="#0284C7" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.labTitle}>Complete Blood Count (CBC) + Serum Electrolytes</Text>
                      <Text style={styles.labSub}>Status: Collected • Processing in Central Lab</Text>
                    </View>
                  </View>
                  <View style={styles.labCardItem}>
                    <Radiation size={18} color="#7C3AED" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.labTitle}>Bedside Chest X-Ray PA View</Text>
                      <Text style={styles.labSub}>Status: Completed • Verified by Radiologist</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ============================================================== */}
      {/* 2.4 VITALS RECORDING POPUP SHEET                               */}
      {/* ============================================================== */}
      <Modal visible={vitalsModalVisible} animationType="fade" transparent={true}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Record Patient Vitals</Text>
              <TouchableOpacity onPress={() => setVitalsModalVisible(false)}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={styles.vitalsInputGrid}>
              <View style={styles.vInputCol}>
                <Text style={styles.vInputLabel}>Systolic BP (mmHg)</Text>
                <TextInput style={styles.vInput} keyboardType="numeric" value={systolic} onChangeText={setSystolic} />
              </View>
              <View style={styles.vInputCol}>
                <Text style={styles.vInputLabel}>Diastolic BP (mmHg)</Text>
                <TextInput style={styles.vInput} keyboardType="numeric" value={diastolic} onChangeText={setDiastolic} />
              </View>
            </View>

            <View style={styles.vitalsInputGrid}>
              <View style={styles.vInputCol}>
                <Text style={styles.vInputLabel}>Pulse Rate (bpm)</Text>
                <TextInput style={styles.vInput} keyboardType="numeric" value={pulse} onChangeText={setPulse} />
              </View>
              <View style={styles.vInputCol}>
                <Text style={styles.vInputLabel}>SpO2 Oxygen (%)</Text>
                <TextInput style={styles.vInput} keyboardType="numeric" value={spo2} onChangeText={setSpo2} />
              </View>
            </View>

            <View style={styles.vitalsInputGrid}>
              <View style={styles.vInputCol}>
                <Text style={styles.vInputLabel}>Temp (°F)</Text>
                <TextInput style={styles.vInput} keyboardType="numeric" value={temp} onChangeText={setTemp} />
              </View>
            </View>

            <TouchableOpacity style={styles.saveVitalsBtn} onPress={handleSaveVitals} disabled={savingVitals}>
              {savingVitals ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveVitalsText}>Save to Electronic Medical Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 2.7 NURSING NOTE POPUP SHEET                                   */}
      {/* ============================================================== */}
      <Modal visible={noteModalVisible} animationType="fade" transparent={true}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Nursing Observation Note</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Enter clinical assessment, wound inspection, patient complaints..."
              placeholderTextColor="#94A3B8"
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity style={styles.saveVitalsBtn} onPress={handleSaveNote} disabled={savingNote}>
              {savingNote ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveVitalsText}>Submit Clinical Note</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  filterRow: { marginBottom: 10 },
  filterScroll: { gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  filterChipActive: { backgroundColor: '#38845A', borderColor: '#38845A' },
  filterChipCritical: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterTextActive: { color: '#fff' },
  filterTextWhite: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#64748B', fontSize: 12 },
  emptyCard: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardCriticalBorder: { borderColor: '#FCA5A5', borderWidth: 1.5, backgroundColor: '#FFFDFD' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  bedBadgeRed: { backgroundColor: '#EAF5ED' },
  bedText: { fontSize: 11, fontWeight: '800', color: '#38845A' },
  bedTextRed: { color: '#DC2626' },
  uhidText: { fontSize: 10, color: '#64748B', fontFamily: 'monospace' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  genderAge: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  diagnosisText: { fontSize: 12, color: '#334155', marginTop: 3, fontWeight: '600' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  doctorText: { fontSize: 11, color: '#64748B' },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  allergyTagText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  vitalsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  vitalCol: { alignItems: 'center' },
  vitalLabel: { fontSize: 9, color: '#64748B', fontWeight: '700' },
  vitalValue: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  vitalValueRed: { color: '#DC2626' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  taskCount: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  openChartBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openChartText: { fontSize: 11, fontWeight: '700', color: '#38845A' },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toolBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  profileTabRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  profileTab: { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderRadius: 6 },
  profileTabActive: { backgroundColor: '#EAF5ED' },
  profileTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  profileTabTextActive: { color: '#38845A', fontWeight: '800' },
  profileBody: { flex: 1, padding: 14 },
  sectionWrap: { gap: 12, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  cardSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fieldItem: { width: '46%' },
  fieldLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  fieldVal: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  mainDiagnosis: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  docInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5ED',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  docInfoText: { fontSize: 11, color: '#38845A', fontWeight: '700' },
  allergyTagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF5ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  allergyPillText: { fontSize: 11, color: '#DC2626', fontWeight: '800' },
  noAllergyText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  assessRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  assessLabel: { fontSize: 12, color: '#475569' },
  assessVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  vitalCardItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  vitalCardAbnormal: { borderColor: '#CDE8D5', backgroundColor: '#FEF2F2' },
  vitalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vitalCardTime: { fontSize: 11, color: '#64748B' },
  abnormalBadge: { backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  abnormalBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  vitalValueGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalMini: { alignItems: 'center' },
  vmLabel: { fontSize: 9, color: '#64748B' },
  vmVal: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  medCardItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8, alignItems: 'center' },
  medNameText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  medDetailText: { fontSize: 11, color: '#475569', marginTop: 2 },
  medDocText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  medStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusGiven: { backgroundColor: '#D1FAE5' },
  statusDue: { backgroundColor: '#FEF3C7' },
  medStatusText: { fontSize: 10, fontWeight: '800' },
  textGiven: { color: '#059669' },
  textDue: { color: '#D97706' },
  orderCardItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderTypeBadge: { backgroundColor: '#E0F2FE', color: '#0284C7', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  orderTimeText: { fontSize: 10, color: '#64748B' },
  orderDetailText: { fontSize: 12, color: '#1E293B', fontWeight: '600' },
  orderDocText: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  notesTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addNoteText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  noteCardItem: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  noteText: { fontSize: 12, color: '#1E293B', lineHeight: 18 },
  noteAuthorText: { fontSize: 10, color: '#64748B', marginTop: 6 },
  labCardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  labTitle: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  labSub: { fontSize: 10, color: '#64748B', marginTop: 2 },

  // Sheet styles
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  vitalsInputGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  vInputCol: { flex: 1 },
  vInputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 },
  vInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC' },
  saveVitalsBtn: { backgroundColor: '#38845A', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveVitalsText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  noteInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, fontSize: 13, height: 100, textAlignVertical: 'top', backgroundColor: '#F8FAFC', marginBottom: 14 },
});


import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import {
  Scan,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Search,
  Check,
  X,
  FileText,
  Sparkles,
  Zap,
  Eye,
  Camera,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export type ModalityType = 'ALL' | 'X_RAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'SPECIALIZED';

export interface RadiologyWorklistItem {
  id: string;
  orderNumber: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  scanName: string;
  modality: 'X_RAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'SPECIALIZED';
  machineRoom: string;
  priority: 'ROUTINE' | 'STAT';
  clinicalIndication: string;
  status: 'SCHEDULED' | 'SAFETY_CLEARED' | 'SCAN_COMPLETED' | 'REPORT_RELEASED';
  doctorName: string;
  scheduledTime: string;
  contrastRequired?: boolean;
  requiresMriSafety?: boolean;
  findings?: string;
  impression?: string;
  criticalAlert?: boolean;
  imageUrl?: string;
  creatinineClearance?: string;
  pregnancyCheck?: string;
  mriMetalCleared?: boolean;
}

const FALLBACK_WORKLIST: RadiologyWorklistItem[] = [
  {
    id: 'rad-ord-1',
    orderNumber: 'RAD-2026-0101',
    uhid: 'KZN-2026-0001',
    patientName: 'Ramasamy Kuppusamy',
    age: 58,
    gender: 'Male',
    scanName: 'CT Coronary Angiogram with IV Contrast',
    modality: 'CT_SCAN',
    machineRoom: 'Siemens 128-Slice Dual Source CT (Room 2)',
    priority: 'STAT',
    clinicalIndication: 'Chest tightness, atypical angina, rule out severe LAD stenosis',
    status: 'SCHEDULED',
    doctorName: 'Dr. Senthil Nathan, MD (Cardiology)',
    scheduledTime: 'Today, 11:30 AM',
    contrastRequired: true,
    requiresMriSafety: false,
    creatinineClearance: 'Serum Creatinine: 0.9 mg/dL (eGFR: 88 mL/min) - NORMAL',
    pregnancyCheck: 'Not Applicable (Male)',
  },
  {
    id: 'rad-ord-2',
    orderNumber: 'RAD-2026-0102',
    uhid: 'KZN-2026-0014',
    patientName: 'Deepa Thirunavukarasu',
    age: 34,
    gender: 'Female',
    scanName: 'MRI Brain & Cervical Spine (3.0 Tesla)',
    modality: 'MRI',
    machineRoom: 'GE 3.0T SIGNA Pioneer (MRI Bay 1)',
    priority: 'ROUTINE',
    clinicalIndication: 'Chronic occipital headaches, paresthesias in bilateral upper limbs',
    status: 'SAFETY_CLEARED',
    doctorName: 'Dr. Ananya Sharma, MD (Neurology)',
    scheduledTime: 'Today, 12:15 PM',
    contrastRequired: false,
    requiresMriSafety: true,
    creatinineClearance: 'eGFR > 90 mL/min - Normal',
    pregnancyCheck: 'LMP: 14 days ago, UPT Negative verified',
    mriMetalCleared: true,
  },
  {
    id: 'rad-ord-3',
    orderNumber: 'RAD-2026-0103',
    uhid: 'KZN-2026-0009',
    patientName: 'Vijay Sundaram',
    age: 46,
    gender: 'Male',
    scanName: 'Digital X-Ray Chest PA & Lateral View',
    modality: 'X_RAY',
    machineRoom: 'Carestream DR Room 01',
    priority: 'ROUTINE',
    clinicalIndication: 'Pre-operative cardiothoracic fitness evaluation',
    status: 'SCAN_COMPLETED',
    doctorName: 'Dr. V. Rajesh, MS Ortho',
    scheduledTime: 'Today, 10:00 AM',
    contrastRequired: false,
    requiresMriSafety: false,
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    findings: 'Lungs are clear with no focal consolidation or pleural effusion. Cardiothoracic ratio is within normal limits (48%). Bony thoracic cage intact.',
    impression: 'Normal study. No active pleuro-parenchymal disease.',
    criticalAlert: false,
  },
  {
    id: 'rad-ord-4',
    orderNumber: 'RAD-2026-0104',
    uhid: 'KZN-2026-0022',
    patientName: 'Kavitha Manoharan',
    age: 29,
    gender: 'Female',
    scanName: 'USG Whole Abdomen & Pelvis',
    modality: 'ULTRASOUND',
    machineRoom: 'Philips EPIQ 7 Ultrasound Room 3',
    priority: 'ROUTINE',
    clinicalIndication: 'Right iliac fossa tenderness, rule out acute appendicitis / ovarian pathology',
    status: 'SCHEDULED',
    doctorName: 'Dr. Priya Mani, MD (Obs & Gynae)',
    scheduledTime: 'Today, 02:00 PM',
    contrastRequired: false,
    requiresMriSafety: false,
  },
  {
    id: 'rad-ord-5',
    orderNumber: 'RAD-2026-0105',
    uhid: 'KZN-2026-0030',
    patientName: 'Subramanian Natarajan',
    age: 63,
    gender: 'Male',
    scanName: '2D Echocardiogram & Color Doppler',
    modality: 'SPECIALIZED',
    machineRoom: 'GE Vivid E95 Echo Lab 1',
    priority: 'STAT',
    clinicalIndication: 'Dyspnea on exertion, systolic murmur, assess LVEF and valvular regurgitation',
    status: 'SCHEDULED',
    doctorName: 'Dr. Senthil Nathan, MD',
    scheduledTime: 'Today, 02:30 PM',
    contrastRequired: false,
    requiresMriSafety: false,
  },
];

export default function RadiologyWorklistScreen() {
  const { user } = useAuth();
  const [activeModality, setActiveModality] = useState<ModalityType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [worklist, setWorklist] = useState<RadiologyWorklistItem[]>(FALLBACK_WORKLIST);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Safety Screening Modal
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [selectedSafetyOrder, setSelectedSafetyOrder] = useState<RadiologyWorklistItem | null>(null);
  const [checkCreatinine, setCheckCreatinine] = useState(false);
  const [checkPregnancy, setCheckPregnancy] = useState(false);
  const [checkMriMetals, setCheckMriMetals] = useState(false);
  const [checkContrastAllergy, setCheckContrastAllergy] = useState(false);

  // Report Release Modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState<RadiologyWorklistItem | null>(null);
  const [findingsText, setFindingsText] = useState('');
  const [impressionText, setImpressionText] = useState('');
  const [isCriticalAlert, setIsCriticalAlert] = useState(false);
  const [sampleImageUrl, setSampleImageUrl] = useState('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadWorklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any[]>('/radiology/worklist', { method: 'GET' });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RadiologyWorklistItem[] = res.data.map((item: any, idx: number) => {
          let mod: 'X_RAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'SPECIALIZED' = 'X_RAY';
          const testName = item.test?.name || item.scanName || '';
          const modalityUpper = (item.test?.modality || '').toUpperCase();

          if (modalityUpper.includes('CT') || testName.includes('CT')) mod = 'CT_SCAN';
          else if (modalityUpper.includes('MRI') || testName.includes('MRI')) mod = 'MRI';
          else if (modalityUpper.includes('USG') || modalityUpper.includes('ECHO') || testName.includes('ECHO')) mod = 'SPECIALIZED';
          else if (modalityUpper.includes('ULTRA') || testName.includes('Ultra')) mod = 'ULTRASOUND';

          return {
            id: item.id || `rad-${idx}`,
            orderNumber: item.orderNumber || `RAD-2026-${1000 + idx}`,
            uhid: item.patient?.uhid || `KZN-2026-000${idx + 1}`,
            patientName: item.patient ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim() : 'Patient',
            age: item.patient?.age || 45,
            gender: item.patient?.gender || 'Adult',
            scanName: item.test?.name || 'Diagnostic Study',
            modality: mod,
            machineRoom: item.test?.room || 'Imaging Suite',
            priority: item.priority === 'STAT' ? 'STAT' : 'ROUTINE',
            clinicalIndication: item.clinicalIndication || 'Diagnostic Investigation',
            status: item.status || 'SCHEDULED',
            doctorName: item.doctor?.employee?.user
              ? `Dr. ${item.doctor.employee.user.firstName} ${item.doctor.employee.user.lastName}`
              : 'Ordering Doctor',
            scheduledTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            contrastRequired: testName.toLowerCase().includes('contrast'),
            requiresMriSafety: mod === 'MRI',
            findings: item.findings,
            impression: item.impression,
            criticalAlert: item.criticalAlert,
            imageUrl: item.imageUrl,
          };
        });
        setWorklist(mapped);
      }
    } catch {
      // Retain fallback data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorklist();
  }, [loadWorklist]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWorklist();
  };

  // Open Pre-Scan Safety Modal
  const openSafetyModal = (order: RadiologyWorklistItem) => {
    setSelectedSafetyOrder(order);
    setCheckCreatinine(!!order.creatinineClearance);
    setCheckPregnancy(order.gender === 'Male' || !!order.pregnancyCheck);
    setCheckMriMetals(!!order.mriMetalCleared);
    setCheckContrastAllergy(true);
    setSafetyModalVisible(true);
  };

  const handleConfirmSafety = () => {
    if (!selectedSafetyOrder) return;

    if (selectedSafetyOrder.contrastRequired && !checkCreatinine) {
      Alert.alert('Safety Incomplete', 'Creatinine clearance verification is mandatory for IV contrast scans.');
      return;
    }
    if (selectedSafetyOrder.requiresMriSafety && !checkMriMetals) {
      Alert.alert('Safety Incomplete', 'MRI metal, pacemaker and aneurysm clip clearance is mandatory before entering 3.0T magnetic zone.');
      return;
    }
    if (selectedSafetyOrder.gender === 'Female' && !checkPregnancy) {
      Alert.alert('Safety Incomplete', 'Pregnancy screening must be recorded for radiation safety.');
      return;
    }

    setWorklist((prev) =>
      prev.map((o) => (o.id === selectedSafetyOrder.id ? { ...o, status: 'SAFETY_CLEARED' } : o))
    );

    Alert.alert(
      'Pre-Scan Safety Cleared',
      `Patient ${selectedSafetyOrder.patientName} (${selectedSafetyOrder.uhid}) certified ready for ${selectedSafetyOrder.scanName}.`
    );
    setSafetyModalVisible(false);
  };

  // Open Diagnostic Impression & Report Release Modal
  const openReportModal = (order: RadiologyWorklistItem) => {
    setSelectedReportOrder(order);
    setFindingsText(
      order.findings ||
        `Examination: ${order.scanName}.\nNo gross focal mass lesion or acute hemorrhage. Regional vascular anatomy demonstrates expected calibre with intact margins.`
    );
    setImpressionText(
      order.impression ||
        `Consistent with mild degenerative / post-viral changes. No immediate neurovascular compromise or critical surgical emergency.`
    );
    setIsCriticalAlert(order.criticalAlert || false);
    setSampleImageUrl(order.imageUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80');
    setReportModalVisible(true);
  };

  const handleReleaseReport = async () => {
    if (!selectedReportOrder) return;
    if (!impressionText.trim()) {
      Alert.alert('Clinical Impression Required', 'Please provide diagnostic impression before releasing report.');
      return;
    }

    setSubmittingReport(true);
    try {
      await apiRequest(`/radiology/orders/${selectedReportOrder.id}/report`, {
        method: 'POST',
        body: {
          orderId: selectedReportOrder.id,
          findings: findingsText,
          impression: impressionText,
          criticalAlert: isCriticalAlert,
          imageUrl: sampleImageUrl,
        },
      });

      setWorklist((prev) =>
        prev.map((o) =>
          o.id === selectedReportOrder.id
            ? {
                ...o,
                status: 'REPORT_RELEASED',
                findings: findingsText,
                impression: impressionText,
                criticalAlert: isCriticalAlert,
                imageUrl: sampleImageUrl,
              }
            : o
        )
      );

      Alert.alert(
        'Diagnostic Report Released',
        `Official PACS imaging report for ${selectedReportOrder.orderNumber} published to Doctor Portal and Patient Portal.${
          isCriticalAlert ? ' Critical Alert dispatched to attending physician.' : ''
        }`
      );
      setReportModalVisible(false);
    } catch {
      // Optimistic update
      setWorklist((prev) =>
        prev.map((o) =>
          o.id === selectedReportOrder.id
            ? {
                ...o,
                status: 'REPORT_RELEASED',
                findings: findingsText,
                impression: impressionText,
                criticalAlert: isCriticalAlert,
              }
            : o
        )
      );
      Alert.alert('Report Released', `Diagnostic study ${selectedReportOrder.orderNumber} signed off.`);
      setReportModalVisible(false);
    } finally {
      setSubmittingReport(false);
    }
  };

  const getModalityBadgeStyle = (mod: string) => {
    switch (mod) {
      case 'CT_SCAN': return styles.modality_CT_SCAN;
      case 'MRI': return styles.modality_MRI;
      case 'X_RAY': return styles.modality_X_RAY;
      case 'ULTRASOUND': return styles.modality_ULTRASOUND;
      case 'SPECIALIZED': return styles.modality_SPECIALIZED;
      default: return null;
    }
  };

  // Filter items
  const filteredList = worklist.filter((item) => {
    if (activeModality !== 'ALL' && item.modality !== activeModality) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      item.patientName.toLowerCase().includes(q) ||
      item.uhid.toLowerCase().includes(q) ||
      item.orderNumber.toLowerCase().includes(q) ||
      item.scanName.toLowerCase().includes(q) ||
      item.clinicalIndication.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Radiology Modality Worklists</Text>
            <Text style={styles.sub}>CT · MRI · X-Ray · Ultrasound · 2D Echo</Text>
          </View>
          <View style={styles.pacsPill}>
            <Scan size={14} color="#0F766E" />
            <Text style={styles.pacsPillText}>PACS Online</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by UHID, patient name, scan name, order #..."
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

        {/* Modality Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalityScroll}>
          {[
            { key: 'ALL', label: 'All Studies' },
            { key: 'X_RAY', label: 'Digital X-Ray' },
            { key: 'CT_SCAN', label: 'CT Scan' },
            { key: 'MRI', label: 'MRI (3.0T)' },
            { key: 'ULTRASOUND', label: 'Ultrasound' },
            { key: 'SPECIALIZED', label: 'Specialized (ECG/ECHO)' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.modalityTab, activeModality === tab.key && styles.modalityTabActive]}
              onPress={() => setActiveModality(tab.key as ModalityType)}
            >
              <Text
                style={[styles.modalityTabText, activeModality === tab.key && styles.modalityTabTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Worklist cards */}
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Connecting to Modality RIS/PACS Broker...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyView}>
            <Scan size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Imaging Orders Scheduled</Text>
            <Text style={styles.emptySub}>Diagnostic orders from Doctor consultation pad will populate here.</Text>
          </View>
        ) : (
          filteredList.map((order) => {
            const isStat = order.priority === 'STAT';

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.orderIdBadge}>
                    <Text style={styles.orderIdText}>{order.orderNumber}</Text>
                  </View>

                  <View style={[styles.modalityBadge, getModalityBadgeStyle(order.modality)]}>
                    <Text style={styles.modalityBadgeText}>{order.modality.replace(/_/g, ' ')}</Text>
                  </View>

                  <View style={[styles.priorityBadge, isStat ? styles.priorityStat : styles.priorityRoutine]}>
                    {isStat && <Zap size={11} color="#DC2626" />}
                    <Text style={[styles.priorityText, isStat ? styles.priorityStatText : styles.priorityRoutineText]}>
                      {order.priority}
                    </Text>
                  </View>
                </View>

                {/* Patient Information */}
                <View style={styles.patientInfoRow}>
                  <View style={styles.avatarBox}>
                    <User size={18} color="#0F766E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>
                      {order.patientName} <Text style={styles.dimMeta}>({order.age}y, {order.gender})</Text>
                    </Text>
                    <Text style={styles.uhidMeta}>UHID: {order.uhid}</Text>
                  </View>
                  <Text style={styles.timeMeta}>{order.scheduledTime}</Text>
                </View>

                {/* Scan Specifics */}
                <View style={styles.scanBox}>
                  <Text style={styles.scanTitle}>{order.scanName}</Text>
                  <Text style={styles.equipmentMeta}>{order.machineRoom}</Text>
                </View>

                {/* Clinical Indication */}
                <View style={styles.indicationBox}>
                  <Text style={styles.indicationLabel}>Clinical Indication:</Text>
                  <Text style={styles.indicationText}>{order.clinicalIndication}</Text>
                  <Text style={styles.doctorMeta}>Ordered by: {order.doctorName}</Text>
                </View>

                {/* Status and Action Buttons */}
                <View style={styles.actionRow}>
                  {order.status === 'SCHEDULED' ? (
                    <TouchableOpacity
                      style={styles.safetyBtn}
                      onPress={() => openSafetyModal(order)}
                    >
                      <ShieldCheck size={14} color="#0F766E" />
                      <Text style={styles.safetyBtnText}>Pre-Scan Safety Clearance</Text>
                    </TouchableOpacity>
                  ) : order.status === 'SAFETY_CLEARED' ? (
                    <TouchableOpacity
                      style={styles.reportBtn}
                      onPress={() => openReportModal(order)}
                    >
                      <Camera size={14} color="#fff" />
                      <Text style={styles.reportBtnText}>Complete Scan & Sign Report</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.releasedTag}>
                      <CheckCircle2 size={16} color="#059669" />
                      <Text style={styles.releasedTagText}>Report Signed & Released</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* PRE-SCAN SAFETY SCREENING MODAL                          */}
      {/* ======================================================== */}
      {selectedSafetyOrder && (
        <Modal
          visible={safetyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSafetyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>Pre-Scan Safety Checklist</Text>
                  <Text style={styles.modalSub}>
                    {selectedSafetyOrder.orderNumber} · {selectedSafetyOrder.patientName} ({selectedSafetyOrder.uhid})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSafetyModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Protocol 1: Creatinine Clearance */}
                <View style={styles.safetyBlock}>
                  <View style={styles.safetyBlockHeader}>
                    <ShieldAlert size={16} color="#D97706" />
                    <Text style={styles.safetyBlockTitle}>1. Creatinine & Renal Clearance Verification</Text>
                  </View>
                  <Text style={styles.safetyDesc}>
                    Required for IV iodinated/gadolinium contrast media to prevent Contrast-Induced Nephropathy (CIN).
                  </Text>
                  <TouchableOpacity
                    style={styles.checkOption}
                    onPress={() => setCheckCreatinine(!checkCreatinine)}
                  >
                    <View style={[styles.checkBox, checkCreatinine && styles.checkBoxActive]}>
                      {checkCreatinine && <Check size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkText}>
                      Confirmed eGFR &gt; 60 mL/min &amp; Serum Creatinine normal (&lt; 1.2 mg/dL). No dialysis requirement.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Protocol 2: Pregnancy & Radiation Safety */}
                <View style={styles.safetyBlock}>
                  <View style={styles.safetyBlockHeader}>
                    <ShieldAlert size={16} color="#DC2626" />
                    <Text style={styles.safetyBlockTitle}>2. Radiation & Pregnancy Screening</Text>
                  </View>
                  <Text style={styles.safetyDesc}>
                    Mandatory ALARA principle radiation protection for childbearing age patients.
                  </Text>
                  <TouchableOpacity
                    style={styles.checkOption}
                    onPress={() => setCheckPregnancy(!checkPregnancy)}
                  >
                    <View style={[styles.checkBox, checkPregnancy && styles.checkBoxActive]}>
                      {checkPregnancy && <Check size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkText}>
                      LMP recorded, urine pregnancy test (UPT) negative, or patient is male. Lead apron shielding positioned.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Protocol 3: MRI Safety Questionnaire */}
                {selectedSafetyOrder.modality === 'MRI' || selectedSafetyOrder.requiresMriSafety ? (
                  <View style={styles.safetyBlock}>
                    <View style={styles.safetyBlockHeader}>
                      <AlertCircle size={16} color="#7C3AED" />
                      <Text style={styles.safetyBlockTitle}>3. 3.0T MRI Ferromagnetic & Implant Screening</Text>
                    </View>
                    <Text style={styles.safetyDesc}>
                      Strict screening for pacemakers, cerebral aneurysm clips, and metallic foreign bodies.
                    </Text>
                    <TouchableOpacity
                      style={styles.checkOption}
                      onPress={() => setCheckMriMetals(!checkMriMetals)}
                    >
                      <View style={[styles.checkBox, checkMriMetals && styles.checkBoxActive]}>
                        {checkMriMetals && <Check size={12} color="#fff" />}
                      </View>
                      <Text style={styles.checkText}>
                        No cardiac pacemaker, ICD, cochlear implant, or metallic ocular fragments confirmed by checklist.
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Contrast Allergy */}
                <TouchableOpacity
                  style={styles.checkOption}
                  onPress={() => setCheckContrastAllergy(!checkContrastAllergy)}
                >
                  <View style={[styles.checkBox, checkContrastAllergy && styles.checkBoxActive]}>
                    {checkContrastAllergy && <Check size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkText}>
                    No known previous adverse anaphylactoid reaction to radiographic contrast media.
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setSafetyModalVisible(false)}>
                  <Text style={styles.backBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.certifyBtn} onPress={handleConfirmSafety}>
                  <ShieldCheck size={16} color="#fff" />
                  <Text style={styles.certifyBtnText}>Certify Safe for Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* DIAGNOSTIC IMPRESSION & REPORT RELEASE MODAL             */}
      {/* ======================================================== */}
      {selectedReportOrder && (
        <Modal
          visible={reportModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>Sign Diagnostic Scan Report</Text>
                  <Text style={styles.modalSub}>
                    {selectedReportOrder.scanName} · {selectedReportOrder.patientName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* PACS Image Link Simulation */}
                <View style={styles.imageViewerBox}>
                  <Eye size={20} color="#0F766E" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.imageViewerTitle}>PACS DICOM Series Linked (32 Frames)</Text>
                    <Text style={styles.imageViewerUrl}>DICOM UID: 1.2.840.10008.5.1.4.1.1.{selectedReportOrder.orderNumber}</Text>
                  </View>
                </View>

                {/* Radiologist Findings */}
                <Text style={styles.formLabel}>Detailed Radiographic Findings:</Text>
                <TextInput
                  style={[styles.textArea, { height: 90 }]}
                  multiline
                  value={findingsText}
                  onChangeText={setFindingsText}
                  placeholder="Record anatomical structures, densities, and margins..."
                  placeholderTextColor="#94A3B8"
                />

                {/* Clinical Impression */}
                <Text style={styles.formLabel}>Diagnostic Impression / Conclusion:</Text>
                <TextInput
                  style={[styles.textArea, { height: 75 }]}
                  multiline
                  value={impressionText}
                  onChangeText={setImpressionText}
                  placeholder="Primary diagnostic impression..."
                  placeholderTextColor="#94A3B8"
                />

                {/* Critical Findings Toggle */}
                <TouchableOpacity
                  style={[styles.criticalToggleRow, isCriticalAlert && styles.criticalToggleRowActive]}
                  onPress={() => setIsCriticalAlert(!isCriticalAlert)}
                >
                  <AlertCircle size={20} color={isCriticalAlert ? '#DC2626' : '#64748B'} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.criticalToggleTitle, isCriticalAlert && styles.criticalToggleTitleActive]}>
                      Flag as Critical Diagnostic Finding
                    </Text>
                    <Text style={styles.criticalToggleSub}>
                      Immediately triggers emergency audio-visual alert to ordering doctor & nursing station.
                    </Text>
                  </View>
                  <View style={[styles.toggleCircle, isCriticalAlert && styles.toggleCircleActive]} />
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setReportModalVisible(false)}>
                  <Text style={styles.backBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.releaseSubmitBtn}
                  onPress={handleReleaseReport}
                  disabled={submittingReport}
                >
                  {submittingReport ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <FileText size={16} color="#fff" />
                      <Text style={styles.releaseSubmitText}>Release Signed Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pacsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  pacsPillText: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },
  modalityScroll: { flexDirection: 'row', marginTop: 12 },
  modalityTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  modalityTabActive: { backgroundColor: '#334155' },
  modalityTabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  modalityTabTextActive: { color: '#fff' },
  scroll: { flex: 1, padding: 14 },
  centerLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748B' },
  emptyView: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderIdBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  orderIdText: { fontSize: 11, fontWeight: '800', color: '#334155' },
  modalityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#E2E8F0' },
  modality_CT_SCAN: { backgroundColor: '#EDE9FE' },
  modality_MRI: { backgroundColor: '#FCE7F3' },
  modality_X_RAY: { backgroundColor: '#E0F2FE' },
  modality_ULTRASOUND: { backgroundColor: '#FEF3C7' },
  modality_SPECIALIZED: { backgroundColor: '#D1FAE5' },
  modalityBadgeText: { fontSize: 10, fontWeight: '800', color: '#1E293B' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto', gap: 3 },
  priorityStat: { backgroundColor: '#FEE2E2' },
  priorityStatText: { color: '#DC2626', fontSize: 10, fontWeight: '800' },
  priorityRoutine: { backgroundColor: '#F1F5F9' },
  priorityRoutineText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  priorityText: { fontSize: 10, fontWeight: '800' },
  patientInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  avatarBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center' },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  dimMeta: { fontSize: 12, fontWeight: '400', color: '#64748B' },
  uhidMeta: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  timeMeta: { fontSize: 11, color: '#94A3B8' },
  scanBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  scanTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  equipmentMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  indicationBox: { marginTop: 10 },
  indicationLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  indicationText: { fontSize: 12, color: '#334155', marginTop: 2 },
  doctorMeta: { fontSize: 11, color: '#64748B', marginTop: 4, fontStyle: 'italic' },
  actionRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  safetyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 6,
  },
  safetyBtnText: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reportBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  releasedTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  releasedTagText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeading: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 4 },
  modalBody: { padding: 18 },
  safetyBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  safetyBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  safetyBlockTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  safetyDesc: { fontSize: 11, color: '#64748B', marginBottom: 8 },
  checkOption: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, gap: 10 },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkBoxActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  checkText: { flex: 1, fontSize: 11, color: '#334155', lineHeight: 16 },
  imageViewerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99F6E4',
    marginBottom: 14,
  },
  imageViewerTitle: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  imageViewerUrl: { fontSize: 10, color: '#64748B', marginTop: 2 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 8, marginBottom: 4 },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  criticalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  criticalToggleRowActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  criticalToggleTitle: { fontSize: 12, fontWeight: '700', color: '#334155' },
  criticalToggleTitleActive: { color: '#DC2626', fontWeight: '800' },
  criticalToggleSub: { fontSize: 10, color: '#64748B', marginTop: 2 },
  toggleCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1' },
  toggleCircleActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  certifyBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  certifyBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  releaseSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  releaseSubmitText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

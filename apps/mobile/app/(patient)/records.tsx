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
import {
  FileText,
  Pill,
  FlaskConical,
  Scan,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  ChevronRight,
  Eye,
  Calendar,
  X,
  Stethoscope,
  Printer,
  ShieldCheck,
} from 'lucide-react-native';
import { downloadFile } from '../../services/downloadHelper';

interface Prescription {
  id: string;
  rxNumber: string;
  doctor: string;
  department: string;
  date: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    schedule: { morning: boolean; afternoon: boolean; night: boolean };
    timing: 'Before Food' | 'After Food';
    duration: string;
    remainingDays: number;
    instructions: string;
  }[];
  dispensedStatus: 'Dispensed' | 'Partially Dispensed' | 'Processing';
}

interface PharmacyOrder {
  orderId: string;
  rxNumber: string;
  orderDate: string;
  mode: 'Counter Pickup' | 'Home Delivery';
  counterNo?: string;
  deliveryAddress?: string;
  deliveryAgent?: { name: string; phone: string };
  currentStep: 1 | 2 | 3 | 4; // 1: Received, 2: Verified, 3: Packed, 4: Ready/Delivered
  eta: string;
}

interface LabReport {
  id: string;
  testName: string;
  orderId: string;
  department: string;
  sampleType: string;
  collectedAt: string;
  authorizedAt: string;
  pathologist: string;
  status: 'Normal' | 'Elevated' | 'Critical';
  parameters: {
    paramName: string;
    resultValue: string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }[];
}

interface RadiologyStudy {
  id: string;
  studyName: string;
  modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | '2D Echo';
  region: string;
  scanDate: string;
  radiologist: string;
  impression: string;
  findings: string;
  imageThumbnail: string; // descriptive placeholder or simulation
}

interface DischargeSummary {
  id: string;
  admissionId: string;
  uhid: string;
  patientName: string;
  wardInfo: string;
  admitDate: string;
  dischargeDate: string;
  attendingPhysician: string;
  finalDiagnosis: string;
  treatmentSummary: string;
  proceduresPerformed: string;
  dischargeAdvice: string;
  followUpDate: string;
}

const PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-01',
    rxNumber: 'RX-2026-0001',
    doctor: 'Dr. Senthil Nathan',
    department: 'Cardiology',
    date: '22 Nov 2026',
    diagnosis: 'Coronary Artery Disease • Post PTCA Monitoring',
    dispensedStatus: 'Dispensed',
    medicines: [
      {
        name: 'Tab. Ecosprin 75mg',
        dosage: '1 Tablet',
        schedule: { morning: true, afternoon: false, night: false },
        timing: 'After Food',
        duration: '30 Days',
        remainingDays: 28,
        instructions: 'Take daily after breakfast. Do not miss dose.',
      },
      {
        name: 'Tab. Atorva 20mg (Atorvastatin)',
        dosage: '1 Tablet',
        schedule: { morning: false, afternoon: false, night: true },
        timing: 'After Food',
        duration: '30 Days',
        remainingDays: 28,
        instructions: 'Take at bedtime for lipid stabilization.',
      },
      {
        name: 'Tab. Pan 40mg (Pantoprazole)',
        dosage: '1 Tablet',
        schedule: { morning: true, afternoon: false, night: false },
        timing: 'Before Food',
        duration: '15 Days',
        remainingDays: 13,
        instructions: 'Take 30 mins before morning breakfast.',
      },
    ],
  },
  {
    id: 'rx-02',
    rxNumber: 'RX-2026-0042',
    doctor: 'Dr. Meenakshi Sundaram',
    department: 'Diabetology',
    date: '10 Nov 2026',
    diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension',
    dispensedStatus: 'Dispensed',
    medicines: [
      {
        name: 'Tab. Glycomet GP 1 (Glimepiride + Metformin)',
        dosage: '1 Tablet',
        schedule: { morning: true, afternoon: false, night: true },
        timing: 'Before Food',
        duration: '60 Days',
        remainingDays: 46,
        instructions: 'Take immediately prior to breakfast and dinner.',
      },
      {
        name: 'Tab. Telma 40mg (Telmisartan)',
        dosage: '1 Tablet',
        schedule: { morning: true, afternoon: false, night: false },
        timing: 'After Food',
        duration: '60 Days',
        remainingDays: 46,
        instructions: 'BP maintenance medication. Monitor pulse.',
      },
    ],
  },
];

const PHARMACY_ORDERS: PharmacyOrder[] = [
  {
    orderId: 'ORD-PHARM-8941',
    rxNumber: 'RX-2026-0001',
    orderDate: 'Today, 09:30 AM',
    mode: 'Counter Pickup',
    counterNo: 'Central Outpatient Pharmacy - Counter 03',
    currentStep: 4,
    eta: 'Ready for Immediate Counter Pickup',
  },
  {
    orderId: 'ORD-PHARM-8995',
    rxNumber: 'RX-2026-0042',
    orderDate: '23 Nov 2026',
    mode: 'Home Delivery',
    deliveryAddress: 'Flat 4B, Meenakshi Towers, Anna Nagar, Madurai',
    deliveryAgent: { name: 'K. Saravanan', phone: '+91 94432 11099' },
    currentStep: 3,
    eta: 'Out for Delivery • Expected by 02:00 PM',
  },
];

const LAB_REPORTS: LabReport[] = [
  {
    id: 'lab-01',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    orderId: 'LAB-ORD-2026-041',
    department: 'Pathology & Biochemistry',
    sampleType: 'Serum Blood Sample',
    collectedAt: '24 Nov 2026, 07:30 AM',
    authorizedAt: '24 Nov 2026, 09:15 AM',
    pathologist: 'Dr. K. Malathi, MD (Path)',
    status: 'Critical',
    parameters: [
      {
        paramName: 'Troponin I (hs-cTnI)',
        resultValue: '0.12',
        unit: 'ng/mL',
        referenceRange: '0.00 - 0.04',
        isAbnormal: true,
      },
      {
        paramName: 'Creatine Kinase-MB (CK-MB)',
        resultValue: '28.4',
        unit: 'U/L',
        referenceRange: '0.0 - 25.0',
        isAbnormal: true,
      },
    ],
  },
  {
    id: 'lab-02',
    testName: 'Complete Blood Count (CBC) with ESR',
    orderId: 'LAB-ORD-2026-042',
    department: 'Hematology',
    sampleType: 'Whole Blood EDTA',
    collectedAt: '23 Nov 2026, 08:00 AM',
    authorizedAt: '23 Nov 2026, 11:30 AM',
    pathologist: 'Dr. Vigneshwaran S, MD',
    status: 'Normal',
    parameters: [
      { paramName: 'Hemoglobin (Hb)', resultValue: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', isAbnormal: false },
      { paramName: 'Total WBC Count', resultValue: '7,800', unit: '/cu.mm', referenceRange: '4,000 - 11,000', isAbnormal: false },
      { paramName: 'Platelet Count', resultValue: '2.45', unit: 'lakhs/cu.mm', referenceRange: '1.50 - 4.50', isAbnormal: false },
      { paramName: 'Erythrocyte Sedimentation (ESR)', resultValue: '12', unit: 'mm/1st hr', referenceRange: '0 - 15', isAbnormal: false },
    ],
  },
  {
    id: 'lab-03',
    testName: 'Comprehensive Metabolic & Lipid Panel',
    orderId: 'LAB-ORD-2026-039',
    department: 'Clinical Biochemistry',
    sampleType: 'Fasting Plasma',
    collectedAt: '20 Nov 2026, 07:45 AM',
    authorizedAt: '20 Nov 2026, 12:00 PM',
    pathologist: 'Dr. K. Malathi, MD (Path)',
    status: 'Elevated',
    parameters: [
      { paramName: 'Fasting Blood Glucose', resultValue: '118', unit: 'mg/dL', referenceRange: '70 - 100', isAbnormal: true },
      { paramName: 'HbA1c (Glycated Hb)', resultValue: '6.8', unit: '%', referenceRange: '4.0 - 5.6', isAbnormal: true },
      { paramName: 'Serum Total Cholesterol', resultValue: '215', unit: 'mg/dL', referenceRange: '< 200', isAbnormal: true },
      { paramName: 'Serum Creatinine', resultValue: '0.94', unit: 'mg/dL', referenceRange: '0.7 - 1.3', isAbnormal: false },
    ],
  },
];

const RADIOLOGY_STUDIES: RadiologyStudy[] = [
  {
    id: 'rad-01',
    studyName: 'Chest X-Ray PA View (Digital)',
    modality: 'X-Ray',
    region: 'Thorax / Chest',
    scanDate: '24 Nov 2026, 08:30 AM',
    radiologist: 'Dr. Balamurugan S, MD, DNB',
    impression: 'Mild cardiomegaly noted. Costophrenic angles clear. No focal consolidation or pneumothorax.',
    findings: 'Trachea midline. Bronchovascular markings prominent in bilateral hilar regions.',
    imageThumbnail: 'CHEST-XRAY-DICOM-01',
  },
  {
    id: 'rad-02',
    studyName: '2D Echocardiogram with Color Doppler',
    modality: '2D Echo',
    region: 'Heart & Great Vessels',
    scanDate: '23 Nov 2026, 11:15 AM',
    radiologist: 'Dr. Senthil Nathan, MD, DM (Cardio)',
    impression: 'LVEF 55%. Normal LV systolic function. No regional wall motion abnormalities at rest.',
    findings: 'Grade 1 LV diastolic dysfunction. Normal aortic root and pericardium.',
    imageThumbnail: '2D-ECHO-DOPPLER-02',
  },
  {
    id: 'rad-03',
    studyName: 'MRI Brain with Contrast (1.5 Tesla)',
    modality: 'MRI',
    region: 'Brain & Neuroaxis',
    scanDate: '18 Nov 2026, 03:00 PM',
    radiologist: 'Dr. Balamurugan S, MD, DNB',
    impression: 'No acute intracranial hemorrhage or territorial infarct. Age-related cerebral microvascular changes.',
    findings: 'Ventricular system normal size and configuration. Basal cisterns patent.',
    imageThumbnail: 'MRI-BRAIN-AXIAL-03',
  },
];

const DISCHARGE_SUMMARY: DischargeSummary = {
  id: 'ds-01',
  admissionId: 'ADM-2026-091',
  uhid: 'KZN-2026-0001',
  patientName: 'Muthuvel Karuppiah',
  wardInfo: 'Cardiology ICCU • Bed 04',
  admitDate: '19 Nov 2026',
  dischargeDate: '23 Nov 2026',
  attendingPhysician: 'Dr. Senthil Nathan, MD, DM',
  finalDiagnosis: 'Coronary Artery Disease, Unstable Angina, Single Vessel Disease (LAD)',
  treatmentSummary:
    'Patient presented with acute retrosternal chest pain. Coronary Angiogram performed on 20 Nov 2026 revealed 85% proximal LAD stenosis. Successful Percutaneous Transluminal Coronary Angioplasty (PTCA) with Drug Eluting Stent (DES) deployed. Post-procedure vitals remained stable.',
  proceduresPerformed: 'Coronary Angiography + PTCA with DES to proximal LAD.',
  dischargeAdvice:
    'Low salt, cardiac-prudent diet. Regular daily light walking. Avoid strenuous heavy lifting for 2 weeks.',
  followUpDate: '30 Nov 2026 at Cardiology OPD Room 104.',
};

export default function PatientRecordsScreen() {
  const [activeTab, setActiveTab] = useState<'RX' | 'LAB' | 'RAD' | 'PHARM_TRACK' | 'DISCHARGE'>('RX');

  // Selected Detail Modals
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [selectedLab, setSelectedLab] = useState<LabReport | null>(null);
  const [selectedRad, setSelectedRad] = useState<RadiologyStudy | null>(null);
  const [dischargeModal, setDischargeModal] = useState(false);

  const handleDownloadReport = (title: string, orderId: string) => {
    downloadFile({
      filename: `${title.replace(/\s+/g, '_')}_${orderId}.txt`,
      content: `KIZUNA MULTISPECIALITY HOSPITALS\nOFFICIAL CLINICAL REPORT\nRecord: ${title}\nReference: ${orderId}\nGenerated: ${new Date().toLocaleString()}\nVerified by Central Hospital Pathology & Diagnostics`,
      mimeType: 'text/plain',
    });
    Alert.alert('Report Downloaded', `${title} report has been saved to your device.`);
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation Header */}
      <View style={styles.tabHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { key: 'RX', label: 'Prescriptions (P07)' },
            { key: 'PHARM_TRACK', label: 'Medicine Pickup (P09)' },
            { key: 'LAB', label: 'Lab Reports (P05/P08)' },
            { key: 'RAD', label: 'Radiology Scans (P06)' },
            { key: 'DISCHARGE', label: 'Discharge Summary (P14)' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabPill, activeTab === t.key && styles.tabPillActive]}
              onPress={() => setActiveTab(t.key as any)}
            >
              <Text style={[styles.tabPillText, activeTab === t.key && styles.tabPillTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ================= P07: ACTIVE E-PRESCRIPTIONS ================= */}
        {activeTab === 'RX' && (
          <View>
            <Text style={styles.sectionHeading}>Active E-Prescriptions & Dosage Schedule</Text>
            <Text style={styles.sectionSub}>View scheduled medicine doses, food timings, and refill alerts</Text>

            {PRESCRIPTIONS.map((rx) => (
              <View key={rx.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pill size={16} color="#0F766E" />
                    <Text style={styles.rxNo}>{rx.rxNumber}</Text>
                  </View>
                  <View style={styles.dispensedBadge}>
                    <Text style={styles.dispensedBadgeText}>{rx.dispensedStatus}</Text>
                  </View>
                </View>

                <Text style={styles.rxDoctor}>{rx.doctor} • {rx.department}</Text>
                <Text style={styles.rxDate}>Prescribed on: {rx.date}</Text>
                <Text style={styles.rxDiagnosis}>Diagnosis: {rx.diagnosis}</Text>

                {/* Medicine Items & Dosage Timing Schedule */}
                <View style={styles.medsBox}>
                  {rx.medicines.map((med, idx) => (
                    <View key={idx} style={styles.medRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDosage}>
                          {med.dosage} • <Text style={{ fontWeight: '700' }}>{med.timing}</Text>
                        </Text>
                        <Text style={styles.medInst}>{med.instructions}</Text>
                      </View>

                      {/* Dosage schedule pill badges (Morning, Afternoon, Night) */}
                      <View style={styles.scheduleBadges}>
                        <View style={[styles.timeBadge, med.schedule.morning ? styles.timeBadgeOn : styles.timeBadgeOff]}>
                          <Text style={[styles.timeBadgeText, med.schedule.morning ? styles.timeTextOn : styles.timeTextOff]}>
                            Morn
                          </Text>
                        </View>
                        <View style={[styles.timeBadge, med.schedule.afternoon ? styles.timeBadgeOn : styles.timeBadgeOff]}>
                          <Text style={[styles.timeBadgeText, med.schedule.afternoon ? styles.timeTextOn : styles.timeTextOff]}>
                            Noon
                          </Text>
                        </View>
                        <View style={[styles.timeBadge, med.schedule.night ? styles.timeBadgeOn : styles.timeBadgeOff]}>
                          <Text style={[styles.timeBadgeText, med.schedule.night ? styles.timeTextOn : styles.timeTextOff]}>
                            Night
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.downloadCardBtn}
                  onPress={() => handleDownloadReport(`Rx_${rx.rxNumber}`, rx.rxNumber)}
                >
                  <Download size={14} color="#0F766E" />
                  <Text style={styles.downloadCardText}>Download Official E-Prescription PDF</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ================= P09: PHARMACY TRACKER ================= */}
        {activeTab === 'PHARM_TRACK' && (
          <View>
            <Text style={styles.sectionHeading}>Pharmacy Order Pickup & Delivery Tracker</Text>
            <Text style={styles.sectionSub}>Live status of hospital pharmacy dispensing and dispatch</Text>

            {PHARMACY_ORDERS.map((ord) => (
              <View key={ord.orderId} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderId}>{ord.orderId}</Text>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{ord.mode}</Text>
                  </View>
                </View>
                <Text style={styles.orderRx}>Prescription: {ord.rxNumber} • {ord.orderDate}</Text>

                {/* 4-Step Progress Indicator */}
                <View style={styles.stepperContainer}>
                  <View style={styles.stepperRow}>
                    <View style={[styles.stepDot, ord.currentStep >= 1 && styles.stepDotActive]}>
                      <Text style={styles.stepNum}>1</Text>
                    </View>
                    <View style={[styles.stepLine, ord.currentStep >= 2 && styles.stepLineActive]} />
                    <View style={[styles.stepDot, ord.currentStep >= 2 && styles.stepDotActive]}>
                      <Text style={styles.stepNum}>2</Text>
                    </View>
                    <View style={[styles.stepLine, ord.currentStep >= 3 && styles.stepLineActive]} />
                    <View style={[styles.stepDot, ord.currentStep >= 3 && styles.stepDotActive]}>
                      <Text style={styles.stepNum}>3</Text>
                    </View>
                    <View style={[styles.stepLine, ord.currentStep >= 4 && styles.stepLineActive]} />
                    <View style={[styles.stepDot, ord.currentStep >= 4 && styles.stepDotActive]}>
                      <Text style={styles.stepNum}>4</Text>
                    </View>
                  </View>
                  <View style={styles.stepLabelsRow}>
                    <Text style={styles.stepLabel}>Received</Text>
                    <Text style={styles.stepLabel}>Verified</Text>
                    <Text style={styles.stepLabel}>Dispensed</Text>
                    <Text style={styles.stepLabel}>{ord.mode === 'Counter Pickup' ? 'Ready' : 'Delivered'}</Text>
                  </View>
                </View>

                {/* Status and ETA */}
                <View style={styles.etaBox}>
                  <Clock size={16} color="#059669" />
                  <Text style={styles.etaText}>{ord.eta}</Text>
                </View>

                {ord.counterNo && (
                  <Text style={styles.counterText}>Pickup Counter: {ord.counterNo}</Text>
                )}
                {ord.deliveryAddress && (
                  <Text style={styles.counterText}>Delivery To: {ord.deliveryAddress}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ================= P05 & P08: LAB REPORTS ================= */}
        {activeTab === 'LAB' && (
          <View>
            <Text style={styles.sectionHeading}>Diagnostic Pathology Reports</Text>
            <Text style={styles.sectionSub}>Review verified clinical parameters, biological ranges, and PDF results</Text>

            {LAB_REPORTS.map((lab) => (
              <View key={lab.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FlaskConical size={16} color="#0284C7" />
                    <Text style={styles.labTestName}>{lab.testName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      lab.status === 'Critical'
                        ? styles.pillCritical
                        : lab.status === 'Elevated'
                          ? styles.pillElevated
                          : styles.pillNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        lab.status === 'Critical'
                          ? styles.textCritical
                          : lab.status === 'Elevated'
                            ? styles.textElevated
                            : styles.textNormal,
                      ]}
                    >
                      {lab.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.labMeta}>
                  {lab.department} • {lab.sampleType} • Sampled: {lab.collectedAt}
                </Text>

                {/* Parameter Table */}
                <View style={styles.paramTable}>
                  <View style={styles.tableHead}>
                    <Text style={[styles.thText, { flex: 2 }]}>Investigation</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Result</Text>
                    <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Reference</Text>
                  </View>
                  {lab.parameters.map((p, pIdx) => (
                    <View key={pIdx} style={styles.tableRow}>
                      <Text style={[styles.tdParam, { flex: 2 }]}>{p.paramName}</Text>
                      <Text
                        style={[
                          styles.tdVal,
                          { flex: 1, textAlign: 'center' },
                          p.isAbnormal && styles.tdAbnormal,
                        ]}
                      >
                        {p.resultValue} {p.unit}
                      </Text>
                      <Text style={[styles.tdRef, { flex: 1.5, textAlign: 'right' }]}>
                        {p.referenceRange} {p.unit}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.pathologistRow}>
                  <CheckCircle2 size={12} color="#059669" />
                  <Text style={styles.pathologistText}>
                    Authorized by {lab.pathologist} ({lab.authorizedAt})
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadCardBtn}
                  onPress={() => handleDownloadReport(lab.testName, lab.orderId)}
                >
                  <Download size={14} color="#0284C7" />
                  <Text style={[styles.downloadCardText, { color: '#0284C7' }]}>
                    Download Verified Lab Report PDF
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ================= P06: RADIOLOGY SCANS ================= */}
        {activeTab === 'RAD' && (
          <View>
            <Text style={styles.sectionHeading}>Radiology Scan Impressions & Imaging</Text>
            <Text style={styles.sectionSub}>X-Ray, CT, MRI, and 2D Echo clinical impressions & viewer</Text>

            {RADIOLOGY_STUDIES.map((rad) => (
              <View key={rad.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Scan size={16} color="#D97706" />
                    <Text style={styles.radName}>{rad.studyName}</Text>
                  </View>
                  <View style={styles.modalityPill}>
                    <Text style={styles.modalityPillText}>{rad.modality}</Text>
                  </View>
                </View>

                <Text style={styles.radMeta}>
                  Anatomical Region: {rad.region} • Scanned: {rad.scanDate}
                </Text>

                {/* Imaging Preview Box */}
                <View style={styles.dicomViewer}>
                  <Scan size={44} color="#38BDF8" />
                  <Text style={styles.dicomTitle}>High-Resolution Imaging Study Available</Text>
                  <Text style={styles.dicomSub}>DICOM 3.0 Standard • Verified by PACS Server</Text>
                </View>

                {/* Impression Box */}
                <View style={styles.impressionBox}>
                  <Text style={styles.impressionHeader}>Radiologist Impression</Text>
                  <Text style={styles.impressionBody}>{rad.impression}</Text>
                  <Text style={styles.findingsBody}><Text style={{ fontWeight: '700' }}>Findings: </Text>{rad.findings}</Text>
                </View>

                <View style={styles.pathologistRow}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.pathologistText}>
                    Report certified by {rad.radiologist}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadCardBtn}
                  onPress={() => handleDownloadReport(rad.studyName, rad.id)}
                >
                  <Download size={14} color="#D97706" />
                  <Text style={[styles.downloadCardText, { color: '#D97706' }]}>
                    Download Scan Impression & Study
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ================= P14: DIGITAL DISCHARGE SUMMARY ================= */}
        {activeTab === 'DISCHARGE' && (
          <View>
            <Text style={styles.sectionHeading}>Digital Inpatient Discharge Summary</Text>
            <Text style={styles.sectionSub}>Comprehensive inpatient stay course, diagnosis, and medical advice</Text>

            <View style={styles.card}>
              <View style={styles.dischargeTop}>
                <Building size={20} color="#0F766E" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.dischargeHospital}>KIZUNA MULTISPECIALITY HOSPITALS</Text>
                  <Text style={styles.dischargeDocTitle}>Official IPD Discharge Summary</Text>
                </View>
              </View>

              <View style={styles.dsGrid}>
                <View style={styles.dsItem}>
                  <Text style={styles.dsLabel}>Admission ID</Text>
                  <Text style={styles.dsVal}>{DISCHARGE_SUMMARY.admissionId}</Text>
                </View>
                <View style={styles.dsItem}>
                  <Text style={styles.dsLabel}>UHID</Text>
                  <Text style={styles.dsVal}>{DISCHARGE_SUMMARY.uhid}</Text>
                </View>
                <View style={styles.dsItem}>
                  <Text style={styles.dsLabel}>Admit Date</Text>
                  <Text style={styles.dsVal}>{DISCHARGE_SUMMARY.admitDate}</Text>
                </View>
                <View style={styles.dsItem}>
                  <Text style={styles.dsLabel}>Discharge Date</Text>
                  <Text style={styles.dsVal}>{DISCHARGE_SUMMARY.dischargeDate}</Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sumSecTitle}>Final Diagnosis</Text>
                <Text style={styles.sumSecBody}>{DISCHARGE_SUMMARY.finalDiagnosis}</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sumSecTitle}>Procedures Performed</Text>
                <Text style={styles.sumSecBody}>{DISCHARGE_SUMMARY.proceduresPerformed}</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sumSecTitle}>Hospital Course & Clinical Summary</Text>
                <Text style={styles.sumSecBody}>{DISCHARGE_SUMMARY.treatmentSummary}</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.sumSecTitle}>Discharge Advice & Activity</Text>
                <Text style={styles.sumSecBody}>{DISCHARGE_SUMMARY.dischargeAdvice}</Text>
              </View>

              <View style={styles.followUpCard}>
                <Calendar size={14} color="#0F766E" />
                <Text style={styles.followUpText}>
                  Scheduled Follow-up: {DISCHARGE_SUMMARY.followUpDate}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.downloadDischargeBtn}
                onPress={() => handleDownloadReport('Discharge_Summary', DISCHARGE_SUMMARY.admissionId)}
              >
                <Printer size={16} color="#fff" />
                <Text style={styles.downloadDischargeBtnText}>Download Official Discharge Summary PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  tabHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10 },
  tabScroll: { paddingHorizontal: 16 },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  tabPillActive: { backgroundColor: '#0F766E' },
  tabPillText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabPillTextActive: { color: '#fff', fontWeight: '800' },
  contentScroll: { padding: 16 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rxNo: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  dispensedBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  dispensedBadgeText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  rxDoctor: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 6 },
  rxDate: { fontSize: 11, color: '#64748B', marginTop: 2 },
  rxDiagnosis: { fontSize: 12, color: '#0F766E', fontWeight: '600', marginTop: 4 },
  medsBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginTop: 10, gap: 10 },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  medName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  medDosage: { fontSize: 11, color: '#475569', marginTop: 2 },
  medInst: { fontSize: 10, color: '#64748B', marginTop: 2 },
  scheduleBadges: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  timeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  timeBadgeOn: { backgroundColor: '#CCFBF1' },
  timeBadgeOff: { backgroundColor: '#F1F5F9' },
  timeBadgeText: { fontSize: 9, fontWeight: '800' },
  timeTextOn: { color: '#0F766E' },
  timeTextOff: { color: '#94A3B8' },
  downloadCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  downloadCardText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  orderId: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  modeBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  modeBadgeText: { fontSize: 10, fontWeight: '800', color: '#0369A1' },
  orderRx: { fontSize: 12, color: '#64748B', marginTop: 4 },
  stepperContainer: { marginVertical: 14 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#059669' },
  stepNum: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepLine: { flex: 1, height: 3, backgroundColor: '#E2E8F0' },
  stepLineActive: { backgroundColor: '#059669' },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 },
  stepLabel: { fontSize: 9, color: '#64748B', fontWeight: '600' },
  etaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6, marginTop: 8 },
  etaText: { fontSize: 12, fontWeight: '800', color: '#065F46' },
  counterText: { fontSize: 11, color: '#475569', marginTop: 6 },
  labTestName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  pillCritical: { backgroundColor: '#FEE2E2' },
  pillElevated: { backgroundColor: '#FEF3C7' },
  pillNormal: { backgroundColor: '#D1FAE5' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  textCritical: { color: '#DC2626' },
  textElevated: { color: '#B45309' },
  textNormal: { color: '#059669' },
  labMeta: { fontSize: 11, color: '#64748B', marginTop: 4 },
  paramTable: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, marginTop: 10 },
  tableHead: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
  thText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tdParam: { fontSize: 11, color: '#334155' },
  tdVal: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  tdAbnormal: { color: '#DC2626' },
  tdRef: { fontSize: 10, color: '#64748B' },
  pathologistRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  pathologistText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  radName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  modalityPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  modalityPillText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  radMeta: { fontSize: 11, color: '#64748B', marginTop: 4 },
  dicomViewer: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 18,
    marginVertical: 10,
    gap: 4,
  },
  dicomTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dicomSub: { color: '#94A3B8', fontSize: 10 },
  impressionBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 8 },
  impressionHeader: { fontSize: 11, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  impressionBody: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
  findingsBody: { fontSize: 11, color: '#475569', marginTop: 4 },
  dischargeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dischargeHospital: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  dischargeDocTitle: { fontSize: 11, color: '#0F766E', fontWeight: '700' },
  dsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 10 },
  dsItem: { width: '47%' },
  dsLabel: { fontSize: 10, color: '#64748B' },
  dsVal: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  summarySection: { marginTop: 8 },
  sumSecTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  sumSecBody: { fontSize: 11, color: '#334155', marginTop: 2, lineHeight: 16 },
  followUpCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDFA', padding: 8, borderRadius: 6, marginVertical: 10 },
  followUpText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  downloadDischargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  downloadDischargeBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

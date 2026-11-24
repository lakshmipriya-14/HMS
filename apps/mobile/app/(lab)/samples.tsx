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
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Check,
  X,
  TestTube,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react-native';

interface SampleRecord {
  id: string;
  barcode: string;
  orderNumber: string;
  patientName: string;
  uhid: string;
  testName: string;
  tubeType: string;
  specimenType: string;
  status: 'Pending Collection' | 'Collected at Bedside' | 'Received in Lab' | 'Rejected';
  collectedAt?: string;
  collectorName?: string;
  rejectionReason?: string;
}

const INITIAL_SAMPLES: SampleRecord[] = [
  {
    id: 's-1',
    barcode: 'BAR-782101',
    orderNumber: 'LAB-2026-0841',
    patientName: 'Ramasamy Kuppusamy',
    uhid: 'KZN-2026-0001',
    testName: 'Cardiac Troponin I (High Sensitivity)',
    tubeType: 'Serum / SST (Yellow Top)',
    specimenType: 'Venous Blood / Serum',
    status: 'Received in Lab',
    collectedAt: 'Today 10:15 AM',
    collectorName: 'Phleb. Saravanan K.',
  },
  {
    id: 's-2',
    barcode: 'BAR-782102',
    orderNumber: 'LAB-2026-0842',
    patientName: 'Meenakshi Sundaram',
    uhid: 'KZN-2026-0014',
    testName: 'Serum Electrolytes (K+, Na+) & Creatinine',
    tubeType: 'Serum / SST (Yellow Top)',
    specimenType: 'Venous Blood / Serum',
    status: 'Received in Lab',
    collectedAt: 'Today 11:00 AM',
    collectorName: 'Phleb. Saravanan K.',
  },
  {
    id: 's-3',
    barcode: 'BAR-782103',
    orderNumber: 'LAB-2026-0843',
    patientName: 'Karthik Raja',
    uhid: 'KZN-2026-0029',
    testName: 'Complete Blood Count (CBC) with Platelets',
    tubeType: 'EDTA (Purple Top)',
    specimenType: 'Whole Blood EDTA',
    status: 'Pending Collection',
  },
  {
    id: 's-4',
    barcode: 'BAR-782104',
    orderNumber: 'LAB-2026-0844',
    patientName: 'Sangeetha Murugan',
    uhid: 'KZN-2026-0035',
    testName: 'Complete Urine Examination (CUE)',
    tubeType: 'Sterile Container',
    specimenType: 'Midstream Clean Urine',
    status: 'Collected at Bedside',
    collectedAt: 'Today 09:30 AM',
    collectorName: 'Nurse Priya S.',
  },
  {
    id: 's-5',
    barcode: 'BAR-782105',
    orderNumber: 'LAB-2026-0845',
    patientName: 'Balamurugan A.',
    uhid: 'KZN-2026-0048',
    testName: 'Sputum for Acid Fast Bacilli (AFB)',
    tubeType: 'Sterile Container',
    specimenType: 'Early Morning Sputum',
    status: 'Pending Collection',
  },
  {
    id: 's-6',
    barcode: 'BAR-782088',
    orderNumber: 'LAB-2026-0830',
    patientName: 'Kavitha S.',
    uhid: 'KZN-2026-0060',
    testName: 'Coagulation PT / INR',
    tubeType: 'Sodium Citrate (Blue Top)',
    specimenType: 'Citrated Plasma',
    status: 'Rejected',
    collectedAt: 'Today 08:45 AM',
    collectorName: 'Phleb. Saravanan K.',
    rejectionReason: 'Clotted Specimen (Micro-clots visible)',
  },
];

export default function LabSamplesScreen() {
  const [samples, setSamples] = useState<SampleRecord[]>(INITIAL_SAMPLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTubeFilter, setSelectedTubeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Barcode Accessioning Modal
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [inputBarcode, setInputBarcode] = useState('');
  const [selectedSample, setSelectedSample] = useState<SampleRecord | null>(null);

  // Mark received in analyzer queue
  const markReceived = (id: string) => {
    setSamples((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Received in Lab' } : s))
    );
    Alert.alert('Specimen Accessioned', 'Sample marked as Received in Central Lab Analyzer Queue.');
  };

  // Reject specimen
  const handleReject = (id: string) => {
    Alert.alert(
      'Confirm Sample Rejection',
      'Select rejection reason:',
      [
        {
          text: 'Hemolyzed',
          onPress: () => applyRejection(id, 'Hemolyzed (Red/Brown Serum)'),
        },
        {
          text: 'Insufficient Quantity (QNS)',
          onPress: () => applyRejection(id, 'Insufficient Quantity (QNS)'),
        },
        {
          text: 'Clotted',
          onPress: () => applyRejection(id, 'Clotted Specimen'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const applyRejection = (id: string, reason: string) => {
    setSamples((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Rejected', rejectionReason: reason } : s))
    );
    Alert.alert('Sample Rejected', `Specimen marked as REJECTED (${reason}). Recollection request sent to ward.`);
  };

  const handleScanLookup = () => {
    if (!inputBarcode.trim()) return;
    const match = samples.find(
      (s) => s.barcode.toLowerCase() === inputBarcode.trim().toLowerCase()
    );
    if (match) {
      setSelectedSample(match);
      setScanModalVisible(true);
    } else {
      Alert.alert('Barcode Not Found', `No registered specimen matches barcode ${inputBarcode}.`);
    }
  };

  // Filtered samples
  const filteredSamples = samples.filter((s) => {
    if (selectedTubeFilter !== 'ALL' && !s.tubeType.toLowerCase().includes(selectedTubeFilter.toLowerCase())) {
      return false;
    }
    if (selectedStatusFilter !== 'ALL' && s.status !== selectedStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.barcode.toLowerCase().includes(q) ||
        s.patientName.toLowerCase().includes(q) ||
        s.uhid.toLowerCase().includes(q) ||
        s.orderNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.iconBox}>
            <QrCode size={22} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Specimen Barcode Accessioning</Text>
            <Text style={styles.subtitle}>Chain of Custody, Tube Tracking & Rejection Control</Text>
          </View>
        </View>

        {/* Scan / Barcode Search Input */}
        <View style={styles.scanBarRow}>
          <View style={styles.scanInputBox}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              style={styles.scanInput}
              placeholder="Enter Barcode (e.g. BAR-782101) or UHID"
              placeholderTextColor="#94A3B8"
              value={inputBarcode || searchQuery}
              onChangeText={(text) => {
                setInputBarcode(text);
                setSearchQuery(text);
              }}
            />
            {inputBarcode || searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setInputBarcode('');
                  setSearchQuery('');
                }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={handleScanLookup}>
            <QrCode size={16} color="#fff" />
            <Text style={styles.scanBtnText}>Verify</Text>
          </TouchableOpacity>
        </View>

        {/* Tube Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['ALL', 'EDTA', 'Serum', 'Fluoride', 'Citrate', 'Sterile'].map((tube) => {
            const isActive = selectedTubeFilter === tube;
            return (
              <TouchableOpacity
                key={tube}
                style={[styles.tubePill, isActive && styles.tubePillActive]}
                onPress={() => setSelectedTubeFilter(tube)}
              >
                <Text style={[styles.tubePillText, isActive && styles.tubePillTextActive]}>{tube}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List of Specimens */}
      <ScrollView style={styles.list}>
        {filteredSamples.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.barcodeWrap}>
                <QrCode size={18} color="#EA580C" />
                <Text style={styles.barcodeText}>{s.barcode}</Text>
              </View>
              <View style={[styles.statusTag, getSampleStatusStyle(s.status)]}>
                <Text style={[styles.statusTagText, getSampleStatusTextStyle(s.status)]}>{s.status}</Text>
              </View>
            </View>

            <View style={styles.patientRow}>
              <Text style={styles.patientName}>{s.patientName}</Text>
              <Text style={styles.uhidText}>UHID: {s.uhid}</Text>
            </View>

            <Text style={styles.testName}>{s.testName}</Text>

            <View style={styles.metaRow}>
              <View style={styles.tubeBadge}>
                <TestTube size={12} color="#EA580C" />
                <Text style={styles.tubeBadgeText}>{s.tubeType}</Text>
              </View>
              {s.collectedAt ? (
                <View style={styles.timeBadge}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.timeBadgeText}>{s.collectedAt}</Text>
                </View>
              ) : null}
            </View>

            {s.rejectionReason && (
              <View style={styles.rejectionNotice}>
                <Ban size={14} color="#DC2626" />
                <Text style={styles.rejectionNoticeText}>Rejected: {s.rejectionReason}</Text>
              </View>
            )}

            {/* Accessioning Actions */}
            <View style={styles.cardFooter}>
              {s.status === 'Collected at Bedside' && (
                <TouchableOpacity style={styles.receiveBtn} onPress={() => markReceived(s.id)}>
                  <CheckCircle2 size={14} color="#fff" />
                  <Text style={styles.receiveBtnText}>Receive in Lab Analyzer</Text>
                </TouchableOpacity>
              )}
              {s.status !== 'Rejected' && (
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(s.id)}>
                  <Ban size={13} color="#DC2626" />
                  <Text style={styles.rejectBtnText}>Reject Specimen</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Barcode Quick Detail Modal */}
      <Modal visible={scanModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Specimen Verified</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {selectedSample && (
              <View style={styles.modalContent}>
                <View style={styles.qrVisualBox}>
                  <QrCode size={56} color="#0F172A" />
                  <Text style={styles.modalBarcode}>{selectedSample.barcode}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient</Text>
                  <Text style={styles.detailVal}>{selectedSample.patientName} ({selectedSample.uhid})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Investigation</Text>
                  <Text style={styles.detailVal}>{selectedSample.testName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Specimen Tube</Text>
                  <Text style={styles.detailVal}>{selectedSample.tubeType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailVal, { color: '#0F766E' }]}>{selectedSample.status}</Text>
                </View>

                {selectedSample.status !== 'Received in Lab' && selectedSample.status !== 'Rejected' && (
                  <TouchableOpacity
                    style={styles.modalReceiveBtn}
                    onPress={() => {
                      markReceived(selectedSample.id);
                      setScanModalVisible(false);
                    }}
                  >
                    <Check size={16} color="#fff" />
                    <Text style={styles.modalReceiveBtnText}>Accept Sample in Analyzer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getSampleStatusStyle(status: string) {
  switch (status) {
    case 'Received in Lab':
      return { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1 };
    case 'Collected at Bedside':
      return { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD', borderWidth: 1 };
    case 'Pending Collection':
      return { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 };
    case 'Rejected':
      return { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 };
    default:
      return { backgroundColor: '#F1F5F9' };
  }
}

function getSampleStatusTextStyle(status: string) {
  switch (status) {
    case 'Received in Lab':
      return { color: '#047857' };
    case 'Collected at Bedside':
      return { color: '#0369A1' };
    case 'Pending Collection':
      return { color: '#B45309' };
    case 'Rejected':
      return { color: '#B91C1C' };
    default:
      return { color: '#475569' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B' },
  scanBarRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  scanInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, height: 38 },
  scanInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#0F172A' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EA580C', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  scanBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row' },
  tubePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 6 },
  tubePillActive: { backgroundColor: '#FFEDD5' },
  tubePillText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  tubePillTextActive: { color: '#EA580C', fontWeight: '800' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barcodeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barcodeText: { fontSize: 13, fontWeight: '800', color: '#0F172A', fontFamily: 'monospace' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  uhidText: { fontSize: 11, color: '#0F766E', fontWeight: '700' },
  testName: { fontSize: 13, color: '#475569', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tubeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tubeBadgeText: { fontSize: 11, color: '#EA580C', fontWeight: '600' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  timeBadgeText: { fontSize: 11, color: '#64748B' },
  rejectionNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 6, marginTop: 8 },
  rejectionNoticeText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  receiveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', paddingVertical: 8, borderRadius: 6 },
  receiveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  rejectBtnText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  detailCard: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalContent: { marginTop: 14 },
  qrVisualBox: { alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 14 },
  modalBarcode: { marginTop: 8, fontSize: 14, fontWeight: '800', fontFamily: 'monospace', color: '#EA580C' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel: { fontSize: 12, color: '#64748B' },
  detailVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  modalReceiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  modalReceiveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});


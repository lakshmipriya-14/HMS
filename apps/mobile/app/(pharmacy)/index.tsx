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
  Pill,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  Search,
  Check,
  X,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export interface BatchOption {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  sellingPrice?: number;
}

export interface PrescribedDrug {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
  dispensedQuantity?: number;
  batches?: BatchOption[];
}

export interface PrescriptionOrder {
  id: string;
  prescriptionNumber: string;
  tokenNumber: string;
  uhid: string;
  patientName: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  doctorName: string;
  department?: string;
  status: 'PENDING_VERIFICATION' | 'READY_FOR_DISPENSE' | 'DISPENSED';
  createdAt: string;
  items: PrescribedDrug[];
}

export default function PharmacyDispenseScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PENDING_VERIFICATION' | 'READY_FOR_DISPENSE' | 'DISPENSED'>('READY_FOR_DISPENSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Verification & Dispensing
  const [selectedRx, setSelectedRx] = useState<PrescriptionOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  // Keyed by prescription item ID -> selected Batch ID
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({});
  // Keyed by prescription item ID -> confirmed quantity
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({});
  const [dispensingInProgress, setDispensingInProgress] = useState(false);

  // Helper to calculate standard total count from dosage frequency and duration
  const calculateTotalUnits = (freq: string, days: number): number => {
    let dosesPerDay = 1;
    if (freq.includes('1-0-1') || freq.includes('Twice')) dosesPerDay = 2;
    else if (freq.includes('1-1-1') || freq.includes('Thrice')) dosesPerDay = 3;
    else if (freq.includes('1-1-1-1')) dosesPerDay = 4;
    return dosesPerDay * (days || 1);
  };

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setQueueError(false);
      const res = await apiRequest<any[]>('/pharmacy/prescriptions');
      if (!Array.isArray(res.data)) throw new Error('Invalid prescription queue response.');
      setPrescriptions(res.data.map((rx: any) => {
        const clinician = rx.doctor?.employee?.user;
        const patient = rx.patient;
        return {
          id: rx.id, prescriptionNumber: rx.prescriptionNumber,
          tokenNumber: rx.consultation?.appointment?.tokenNumber == null ? '' : 'Token #' + rx.consultation.appointment.tokenNumber,
          uhid: patient.uhid, patientName: patient.firstName + ' ' + patient.lastName,
          age: patient.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31_557_600_000) : 0,
          gender: patient.gender, allergies: patient.allergies ?? [],
          doctorName: clinician ? clinician.firstName + ' ' + clinician.lastName : 'Prescriber unavailable',
          department: rx.doctor?.department?.name ?? '',
          status: rx.dispensingStatus === 'DISPENSED' ? 'DISPENSED' : 'READY_FOR_DISPENSE',
          createdAt: new Date(rx.createdAt).toLocaleString(),
          items: rx.items.map((item: any) => ({
            id: item.id, medicineId: item.medicineId, medicineName: item.medicine.brandName,
            dosage: item.dosage, frequency: item.frequency, durationDays: item.durationDays, instructions: item.instructions,
            dispensedQuantity: item.dispensedQuantity,
            batches: item.medicine.batches.map((batch: any) => ({
              id: batch.id, batchNumber: batch.batchNumber, expiryDate: batch.expiryDate.slice(0, 10),
              quantity: batch.quantity, sellingPrice: Number(batch.sellingPrice),
            })),
          })),
        };
      }));
    } catch {
      setPrescriptions([]);
      setQueueError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  // Open Verification & FEFO Dispense Modal
  const openDispenseModal = (rx: PrescriptionOrder) => {
    setSelectedRx(rx);
    setVerificationChecked(rx.status === 'READY_FOR_DISPENSE');

    const defaultBatches: Record<string, string> = {};
    const defaultQtys: Record<string, number> = {};

    rx.items.forEach((item) => {
      // FEFO Logic: Sort available non-zero batches by expiryDate ascending
      if (item.batches && item.batches.length > 0) {
        const sorted = [...item.batches]
          .filter((b) => b.quantity > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        if (sorted.length > 0) {
          defaultBatches[item.id] = sorted[0].id; // Pick closest expiry
        }
      }
      defaultQtys[item.id] = calculateTotalUnits(item.frequency, item.durationDays);
    });

    setSelectedBatches(defaultBatches);
    setDispenseQuantities(defaultQtys);
    setModalVisible(true);
  };

  // Execute Dispense API call
  const handleConfirmDispense = async () => {
    if (!selectedRx) return;
    if (!verificationChecked) {
      Alert.alert('Clinical Safety Required', 'Please confirm that you have verified drug names, dosages, and allergy alerts before dispensing.');
      return;
    }

    setDispensingInProgress(true);
    try {
      if (!user?.id) throw new Error('Sign in again to dispense medication.');
      const pharmacistId = user.id;
      const itemsPayload = selectedRx.items.map((item) => {
        const selectedBatchId =
          selectedBatches[item.id] ||
          item.batches[0]?.id;
        if (!selectedBatchId) throw new Error('Select an available batch for every item.');
        const qty = dispenseQuantities[item.id] || calculateTotalUnits(item.frequency, item.durationDays);

        return {
          prescriptionItemId: item.id,
          batchId: selectedBatchId,
          dispensedQuantity: qty,
        };
      });

      await apiRequest(`/pharmacy/prescriptions/${selectedRx.id}/dispense`, {
        method: 'POST', body: { prescriptionId: selectedRx.id, pharmacistId, items: itemsPayload },
      });
      setModalVisible(false);
      await loadPrescriptions();
      Alert.alert('Dispensing recorded', `Prescription ${selectedRx.prescriptionNumber} was updated by the pharmacy API.`);
    } catch (error) {
      Alert.alert('Dispensing failed', error instanceof Error ? error.message : 'Refresh and try again.');
    } finally {
      setDispensingInProgress(false);
    }
  };

  // Filter Prescriptions by Tab & Search Query
  const filteredList = prescriptions.filter((rx) => {
    const matchesTab = rx.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rx.patientName.toLowerCase().includes(q) ||
      rx.uhid.toLowerCase().includes(q) ||
      rx.prescriptionNumber.toLowerCase().includes(q) ||
      rx.tokenNumber.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>OPD Prescription Queue</Text>
            <Text style={styles.sub}>Electronic Clinical Orders · FEFO Picker</Text>
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>Counter #01</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by UHID, Patient name or Token..."
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

        {/* 3 State Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'PENDING_VERIFICATION' && styles.tabButtonActive]}
            onPress={() => setActiveTab('PENDING_VERIFICATION')}
          >
            <Text style={[styles.tabText, activeTab === 'PENDING_VERIFICATION' && styles.tabTextActive]}>
              Pending Verification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'READY_FOR_DISPENSE' && styles.tabButtonActive]}
            onPress={() => setActiveTab('READY_FOR_DISPENSE')}
          >
            <Text style={[styles.tabText, activeTab === 'READY_FOR_DISPENSE' && styles.tabTextActive]}>
              Ready to Dispense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'DISPENSED' && styles.tabButtonActive]}
            onPress={() => setActiveTab('DISPENSED')}
          >
            <Text style={[styles.tabText, activeTab === 'DISPENSED' && styles.tabTextActive]}>
              Dispensed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        style={styles.scrollArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
      >
        {queueError ? (
          <Text accessibilityRole="button" onPress={loadPrescriptions}>Could not load prescriptions. Tap to retry.</Text>
        ) : loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#38845A" />
            <Text style={styles.loadingText}>Syncing Central Pharmacy Queue...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Pill size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Orders in this Section</Text>
            <Text style={styles.emptySub}>Prescriptions issued from Doctor consultations appear here automatically.</Text>
          </View>
        ) : (
          filteredList.map((rx) => (
            <View key={rx.id} style={styles.orderCard}>
              {/* Card Header */}
              <View style={styles.cardTop}>
                <View style={styles.tokenPill}>
                  <Text style={styles.tokenText}>{rx.tokenNumber}</Text>
                </View>
                <View style={styles.rxNumberBox}>
                  <Text style={styles.rxNumber}>{rx.prescriptionNumber}</Text>
                  <Text style={styles.timestamp}>{rx.createdAt}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    rx.status === 'DISPENSED'
                      ? styles.statusDispensed
                      : rx.status === 'READY_FOR_DISPENSE'
                      ? styles.statusReady
                      : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      rx.status === 'DISPENSED'
                        ? styles.statusDispensedText
                        : rx.status === 'READY_FOR_DISPENSE'
                        ? styles.statusReadyText
                        : styles.statusPendingText,
                    ]}
                  >
                    {rx.status === 'DISPENSED'
                      ? 'Handed Over'
                      : rx.status === 'READY_FOR_DISPENSE'
                      ? 'Ready to Pick'
                      : 'Needs Verify'}
                  </Text>
                </View>
              </View>

              {/* Patient Details */}
              <View style={styles.patientRow}>
                <View style={styles.avatarCircle}>
                  <User size={18} color="#38845A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>
                    {rx.patientName}{' '}
                    {rx.age ? <Text style={styles.metaDim}>({rx.age}y, {rx.gender})</Text> : null}
                  </Text>
                  <Text style={styles.uhidText}>UHID: {rx.uhid}</Text>
                </View>
              </View>

              {/* Ordering Doctor */}
              <View style={styles.doctorInfoRow}>
                <Text style={styles.doctorLabel}>Prescriber:</Text>
                <Text style={styles.doctorName}>{rx.doctorName}</Text>
                {rx.department && <Text style={styles.deptBadge}>· {rx.department}</Text>}
              </View>

              {/* Allergy Warning Strip */}
              {rx.allergies && rx.allergies.length > 0 && !rx.allergies[0].includes('NKDA') ? (
                <View style={styles.allergyBanner}>
                  <ShieldAlert size={14} color="#DC2626" />
                  <Text style={styles.allergyText}>
                    Allergy Alert: {rx.allergies.join(', ')}
                  </Text>
                </View>
              ) : null}

              {/* Prescribed Items Table */}
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsHeader}>Prescribed Formulations ({rx.items.length})</Text>
                {rx.items.map((item, idx) => (
                  <View key={item.id || idx} style={styles.itemRow}>
                    <View style={styles.itemBullet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemDrugName}>{item.medicineName}</Text>
                      <Text style={styles.itemDoseInfo}>
                        {item.dosage} · {item.frequency} · {item.durationDays} Days ({item.instructions})
                      </Text>
                    </View>
                    <View style={styles.qtyBubble}>
                      <Text style={styles.qtyBubbleText}>
                        Qty: {calculateTotalUnits(item.frequency, item.durationDays)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <View style={styles.cardFooter}>
                {rx.status !== 'DISPENSED' ? (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => openDispenseModal(rx)}
                  >
                    <Sparkles size={16} color="#fff" />
                    <Text style={styles.reviewBtnText}>Verify & Pick FEFO Batches</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedTag}>
                    <CheckCircle2 size={16} color="#38845A" />
                    <Text style={styles.completedText}>Dispensed & Stock Adjusted</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* VERIFICATION & FEFO DISPENSE MODAL                       */}
      {/* ======================================================== */}
      {selectedRx && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Top Bar */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>FEFO Dispense Verification</Text>
                  <Text style={styles.modalSub}>
                    {selectedRx.prescriptionNumber} · {selectedRx.patientName} ({selectedRx.uhid})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Allergy Check Warning */}
                {selectedRx.allergies && selectedRx.allergies.length > 0 && (
                  <View
                    style={[
                      styles.modalAllergyNotice,
                      selectedRx.allergies[0].includes('NKDA')
                        ? styles.noticeGreen
                        : styles.noticeRed,
                    ]}
                  >
                    <ShieldAlert
                      size={18}
                      color={selectedRx.allergies[0].includes('NKDA') ? '#38845A' : '#DC2626'}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.noticeTitle}>Patient Allergy Profile</Text>
                      <Text style={styles.noticeDesc}>{selectedRx.allergies.join(', ')}</Text>
                    </View>
                  </View>
                )}

                {/* Drugs & FEFO Picker List */}
                <Text style={styles.sectionHeading}>Medicine Items & Batch Allocation</Text>

                {selectedRx.items.map((item) => {
                  const calculatedQty = calculateTotalUnits(item.frequency, item.durationDays);
                  const activeBatchId = selectedBatches[item.id];
                  const currentBatch = item.batches?.find((b) => b.id === activeBatchId);

                  return (
                    <View key={item.id} style={styles.fefoCard}>
                      <View style={styles.fefoCardHeader}>
                        <Text style={styles.fefoDrugTitle}>{item.medicineName}</Text>
                        <Text style={styles.fefoDosageMeta}>
                          {item.dosage} · {item.frequency} for {item.durationDays} Days
                        </Text>
                      </View>

                      {/* Batches available in FEFO Order */}
                      <Text style={styles.batchSelectorLabel}>Select Inventory Batch (FEFO Prioritized):</Text>
                      <View style={styles.batchesList}>
                        {item.batches && item.batches.length > 0 ? (
                          item.batches.map((batch, bIdx) => {
                            const isSelected = activeBatchId === batch.id;
                            const isFefoPick = bIdx === 0;

                            return (
                              <TouchableOpacity
                                key={batch.id}
                                style={[
                                  styles.batchPill,
                                  isSelected && styles.batchPillSelected,
                                  batch.quantity < calculatedQty && styles.batchPillLow,
                                ]}
                                onPress={() =>
                                  setSelectedBatches((prev) => ({ ...prev, [item.id]: batch.id }))
                                }
                              >
                                <View style={styles.batchPillTop}>
                                  <Text
                                    style={[
                                      styles.batchNumberText,
                                      isSelected && styles.batchNumberTextSelected,
                                    ]}
                                  >
                                    {batch.batchNumber}
                                  </Text>
                                  {isFefoPick && (
                                    <View style={styles.fefoTag}>
                                      <Text style={styles.fefoTagText}>FEFO Pick</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.batchMetaSub}>
                                  Exp: {batch.expiryDate} · Stock: {batch.quantity} units
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <View style={styles.batchDefaultPill}>
                            <Text style={styles.batchNumberText}>General Central Stock</Text>
                            <Text style={styles.batchMetaSub}>Authoritative branch inventory available</Text>
                          </View>
                        )}
                      </View>

                      {/* Dispensing Quantity Confirmation */}
                      <View style={styles.qtyControlRow}>
                        <Text style={styles.qtyControlLabel}>Quantity to Dispense:</Text>
                        <View style={styles.qtyInputBox}>
                          <TextInput
                            style={styles.qtyInput}
                            keyboardType="numeric"
                            value={String(dispenseQuantities[item.id] ?? calculatedQty)}
                            onChangeText={(txt) => {
                              const parsed = parseInt(txt, 10);
                              setDispenseQuantities((prev) => ({
                                ...prev,
                                [item.id]: isNaN(parsed) ? 0 : parsed,
                              }));
                            }}
                          />
                          <Text style={styles.unitSuffix}>units</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Pharmacist Clinical Sign-off Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setVerificationChecked(!verificationChecked)}
                >
                  <View style={[styles.checkboxBox, verificationChecked && styles.checkboxBoxChecked]}>
                    {verificationChecked && <Check size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm drug formulations, dosages, and allergy screenings are verified in accordance with Hospital Formulary Protocols.
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmDispenseBtn, !verificationChecked && styles.confirmDisabled]}
                  onPress={handleConfirmDispense}
                  disabled={dispensingInProgress || !verificationChecked}
                >
                  {dispensingInProgress ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#fff" />
                      <Text style={styles.confirmDispenseText}>Deduct Stock & Dispense</Text>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  counterBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  counterText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  searchBox: {
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginTop: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#38845A', fontWeight: '800' },
  scrollArea: { flex: 1, padding: 14 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748B' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4 },
  orderCard: {
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tokenPill: {
    backgroundColor: '#38845A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tokenText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  rxNumberBox: { flex: 1 },
  rxNumber: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  timestamp: { fontSize: 11, color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPendingText: { color: '#92400E', fontSize: 10, fontWeight: '800' },
  statusReady: { backgroundColor: '#EAF5ED' },
  statusReadyText: { color: '#6D28D9', fontSize: 10, fontWeight: '800' },
  statusDispensed: { backgroundColor: '#D1FAE5' },
  statusDispensedText: { color: '#065F46', fontSize: 10, fontWeight: '800' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  patientRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  metaDim: { fontSize: 12, fontWeight: '400', color: '#64748B' },
  uhidText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  doctorInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  doctorLabel: { fontSize: 11, color: '#94A3B8' },
  doctorName: { fontSize: 12, fontWeight: '600', color: '#334155' },
  deptBadge: { fontSize: 11, color: '#64748B' },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  allergyText: { fontSize: 11, color: '#DC2626', fontWeight: '700' },
  itemsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemsHeader: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, gap: 8 },
  itemBullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#38845A', marginTop: 6 },
  itemDrugName: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  itemDoseInfo: { fontSize: 11, color: '#64748B', marginTop: 1 },
  qtyBubble: { backgroundColor: '#EAF5ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  qtyBubbleText: { fontSize: 10, fontWeight: '700', color: '#6D28D9' },
  cardFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  reviewBtn: {
    flexDirection: 'row',
    backgroundColor: '#38845A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  completedTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  completedText: { color: '#38845A', fontSize: 12, fontWeight: '700' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalBody: { padding: 18 },
  modalAllergyNotice: { flexDirection: 'row', padding: 12, borderRadius: 10, marginBottom: 14 },
  noticeGreen: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  noticeRed: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#CDE8D5' },
  noticeTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  noticeDesc: { fontSize: 12, color: '#334155', marginTop: 2 },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 10, textTransform: 'uppercase' },
  fefoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fefoCardHeader: { marginBottom: 8 },
  fefoDrugTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  fefoDosageMeta: { fontSize: 11, color: '#64748B', marginTop: 1 },
  batchSelectorLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  batchesList: { gap: 6 },
  batchPill: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  batchPillSelected: { borderColor: '#38845A', backgroundColor: '#FAF5FF' },
  batchPillLow: { borderColor: '#FCA5A5' },
  batchPillTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchNumberText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  batchNumberTextSelected: { color: '#38845A' },
  fefoTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  fefoTagText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  batchMetaSub: { fontSize: 10, color: '#64748B', marginTop: 2 },
  batchDefaultPill: { backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  qtyControlLabel: { fontSize: 12, color: '#334155', fontWeight: '600' },
  qtyInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 8 },
  qtyInput: { width: 44, paddingVertical: 4, textAlign: 'center', fontSize: 13, fontWeight: '800', color: '#0F172A' },
  unitSuffix: { fontSize: 11, color: '#64748B' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 14, gap: 10 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: { backgroundColor: '#38845A', borderColor: '#38845A' },
  checkboxLabel: { flex: 1, fontSize: 11, color: '#475569', lineHeight: 16 },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  confirmDispenseBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmDispenseText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


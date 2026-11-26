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
  Boxes,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Calendar,
  Layers,
  ArrowUpDown,
  Check,
  X,
  Clock,
  ShieldCheck,
  Package,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export interface MedicineBatchItem {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  isNearExpiry?: boolean;
}

export interface MedicineStockItem {
  id: string;
  code: string;
  brandName: string;
  genericName: string;
  category: string;
  strength: string;
  dosageForm: string;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  batches: MedicineBatchItem[];
}

const FALLBACK_MEDICINES: MedicineStockItem[] = [
  {
    id: 'med-pcm',
    code: 'MED-001',
    brandName: 'Paracetamol 650mg Dolo',
    genericName: 'Paracetamol',
    category: 'ANALGESIC',
    strength: '650mg',
    dosageForm: 'TABLET',
    currentStock: 3260,
    reorderLevel: 500,
    unitPrice: 2.2,
    batches: [
      { id: 'b-pcm-1', batchNumber: 'BT-PCM-2025D', expiryDate: '2026-03-25', quantity: 60, purchasePrice: 1.2, sellingPrice: 2.2, isNearExpiry: true },
      { id: 'b-pcm-2', batchNumber: 'BT-PCM-2026A', expiryDate: '2027-09-30', quantity: 3200, purchasePrice: 1.1, sellingPrice: 2.2, isNearExpiry: false },
    ],
  },
  {
    id: 'med-amox',
    code: 'MED-002',
    brandName: 'Amoxicillin + Clav 625mg Augmentin',
    genericName: 'Amoxicillin + Potassium Clavulanate',
    category: 'ANTIBIOTIC',
    strength: '625mg',
    dosageForm: 'TABLET',
    currentStock: 42,
    reorderLevel: 100,
    unitPrice: 24.5,
    batches: [
      { id: 'b-amx-1', batchNumber: 'BT-AMX-2025C', expiryDate: '2026-04-15', quantity: 42, purchasePrice: 16.0, sellingPrice: 24.5, isNearExpiry: true },
    ],
  },
  {
    id: 'med-amlo',
    code: 'MED-003',
    brandName: 'Amlodipine 5mg Norvasc',
    genericName: 'Amlodipine Besylate',
    category: 'ANTIHYPERTENSIVE',
    strength: '5mg',
    dosageForm: 'TABLET',
    currentStock: 2370,
    reorderLevel: 300,
    unitPrice: 4.5,
    batches: [
      { id: 'b-aml-1', batchNumber: 'BT-AML-2025A', expiryDate: '2026-04-30', quantity: 120, purchasePrice: 2.5, sellingPrice: 4.5, isNearExpiry: true },
      { id: 'b-aml-2', batchNumber: 'BT-AML-2025B', expiryDate: '2026-11-30', quantity: 850, purchasePrice: 2.4, sellingPrice: 4.5, isNearExpiry: false },
      { id: 'b-aml-3', batchNumber: 'BT-AML-2026A', expiryDate: '2027-08-15', quantity: 1400, purchasePrice: 2.3, sellingPrice: 4.5, isNearExpiry: false },
    ],
  },
  {
    id: 'med-panto',
    code: 'MED-004',
    brandName: 'Pantoprazole 40mg Pan-D',
    genericName: 'Pantoprazole Sodium',
    category: 'ANTACID',
    strength: '40mg',
    dosageForm: 'TABLET',
    currentStock: 1550,
    reorderLevel: 250,
    unitPrice: 8.5,
    batches: [
      { id: 'b-pan-1', batchNumber: 'BT-PAN-2025X', expiryDate: '2026-05-20', quantity: 450, purchasePrice: 4.8, sellingPrice: 8.5, isNearExpiry: false },
      { id: 'b-pan-2', batchNumber: 'BT-PAN-2026B', expiryDate: '2027-01-10', quantity: 1100, purchasePrice: 4.6, sellingPrice: 8.5, isNearExpiry: false },
    ],
  },
  {
    id: 'med-ceft',
    code: 'MED-005',
    brandName: 'Ceftriaxone 1g Monocef',
    genericName: 'Ceftriaxone Sodium Injection',
    category: 'ANTIBIOTIC',
    strength: '1g',
    dosageForm: 'INJECTION',
    currentStock: 18,
    reorderLevel: 50,
    unitPrice: 65.0,
    batches: [
      { id: 'b-cef-1', batchNumber: 'BT-CEF-2024Z', expiryDate: '2026-02-28', quantity: 18, purchasePrice: 42.0, sellingPrice: 65.0, isNearExpiry: true },
    ],
  },
  {
    id: 'med-met',
    code: 'MED-006',
    brandName: 'Metformin 500mg Glycomet',
    genericName: 'Metformin HCl',
    category: 'ANTIDIABETIC',
    strength: '500mg',
    dosageForm: 'TABLET',
    currentStock: 1890,
    reorderLevel: 300,
    unitPrice: 3.2,
    batches: [
      { id: 'b-met-1', batchNumber: 'BT-MET-2026A', expiryDate: '2027-10-31', quantity: 1890, purchasePrice: 1.8, sellingPrice: 3.2, isNearExpiry: false },
    ],
  },
];

export default function PharmacyInventoryScreen() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineStockItem[]>(FALLBACK_MEDICINES);
  const [filterType, setFilterType] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Adjustment Modal State
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicineStockItem | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [quantityDelta, setQuantityDelta] = useState('10');
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [adjustReason, setAdjustReason] = useState('Physical Stock Audit Reconciliation');
  const [adjusting, setAdjusting] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any[]>('/pharmacy/medicines', { method: 'GET' });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: MedicineStockItem[] = res.data.map((m: any) => ({
          id: m.id,
          code: m.code || 'MED',
          brandName: m.brandName,
          genericName: m.genericName,
          category: m.category || 'GENERAL',
          strength: m.strength || 'Standard',
          dosageForm: m.dosageForm || 'TABLET',
          currentStock: m.currentStock ?? 0,
          reorderLevel: m.reorderLevel ?? 50,
          unitPrice: Number(m.unitPrice) || 0,
          batches: (m.batches || []).map((b: any) => {
            const exp = b.expiryDate ? b.expiryDate.split('T')[0] : '2027-12-31';
            const expDate = new Date(exp);
            const in90Days = new Date();
            in90Days.setDate(in90Days.getDate() + 90);
            return {
              id: b.id,
              batchNumber: b.batchNumber,
              expiryDate: exp,
              quantity: b.quantity ?? 0,
              purchasePrice: Number(b.purchasePrice) || 0,
              sellingPrice: Number(b.sellingPrice) || 0,
              isNearExpiry: expDate <= in90Days,
            };
          }),
        }));
        setMedicines(mapped);
      }
    } catch {
      // Fallback data retains
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const openAdjustModal = (med: MedicineStockItem) => {
    setSelectedMed(med);
    setSelectedBatchId(med.batches.length > 0 ? med.batches[0].id : '');
    setQuantityDelta('10');
    setAdjustmentType('INCREASE');
    setAdjustReason('Physical Stock Audit Reconciliation');
    setAdjustModalVisible(true);
  };

  const submitStockAdjustment = async () => {
    if (!selectedMed) return;
    const deltaNumber = parseInt(quantityDelta, 10);
    if (isNaN(deltaNumber) || deltaNumber <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number.');
      return;
    }

    const finalDelta = adjustmentType === 'INCREASE' ? deltaNumber : -deltaNumber;

    setAdjusting(true);
    try {
      await apiRequest('/pharmacy/inventory/adjust', {
        method: 'POST',
        body: {
          medicineId: selectedMed.id,
          batchId: selectedBatchId || undefined,
          quantityChange: finalDelta,
          reason: adjustReason,
        },
      });

      // Update local state
      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === selectedMed.id) {
            const updatedStock = Math.max(0, m.currentStock + finalDelta);
            const updatedBatches = m.batches.map((b) =>
              b.id === selectedBatchId ? { ...b, quantity: Math.max(0, b.quantity + finalDelta) } : b
            );
            return { ...m, currentStock: updatedStock, batches: updatedBatches };
          }
          return m;
        })
      );

      Alert.alert('Stock Adjusted', `Inventory for ${selectedMed.brandName} adjusted by ${finalDelta > 0 ? '+' : ''}${finalDelta} units.`);
      setAdjustModalVisible(false);
    } catch {
      // Optimistic local update
      setMedicines((prev) =>
        prev.map((m) => {
          if (m.id === selectedMed.id) {
            const updatedStock = Math.max(0, m.currentStock + finalDelta);
            return { ...m, currentStock: updatedStock };
          }
          return m;
        })
      );
      Alert.alert('Stock Adjusted (Local)', `Stock updated by ${finalDelta > 0 ? '+' : ''}${finalDelta} units.`);
      setAdjustModalVisible(false);
    } finally {
      setAdjusting(false);
    }
  };

  // Filter medicines
  const filteredMedicines = medicines.filter((m) => {
    const isLow = m.currentStock <= m.reorderLevel;
    const hasExpiringBatch = m.batches.some((b) => b.isNearExpiry);

    if (filterType === 'LOW_STOCK' && !isLow) return false;
    if (filterType === 'EXPIRING' && !hasExpiringBatch) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      m.brandName.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Formulary Stock & Batches</Text>
            <Text style={styles.sub}>FEFO Batch Surveillance Matrix · Central Store</Text>
          </View>
          <View style={styles.statsPill}>
            <Package size={14} color="#38845A" />
            <Text style={styles.statsPillText}>{medicines.length} Drugs</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by brand name, generic formulation or code..."
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

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilterType('ALL')}
          >
            <Text style={[styles.filterText, filterType === 'ALL' && styles.filterTextActive]}>
              All Formulary ({medicines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'LOW_STOCK' && styles.filterPillActiveLow]}
            onPress={() => setFilterType('LOW_STOCK')}
          >
            <AlertTriangle size={12} color={filterType === 'LOW_STOCK' ? '#DC2626' : '#EF4444'} />
            <Text style={[styles.filterText, filterType === 'LOW_STOCK' && styles.filterTextActiveLow]}>
              Low Stock ({medicines.filter((m) => m.currentStock <= m.reorderLevel).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'EXPIRING' && styles.filterPillActiveExp]}
            onPress={() => setFilterType('EXPIRING')}
          >
            <Clock size={12} color={filterType === 'EXPIRING' ? '#D97706' : '#F59E0B'} />
            <Text style={[styles.filterText, filterType === 'EXPIRING' && styles.filterTextActiveExp]}>
              Near Expiry ({medicines.filter((m) => m.batches.some((b) => b.isNearExpiry)).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drug List */}
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#38845A" />
            <Text style={styles.loadingLabel}>Loading Formulary Ledgers...</Text>
          </View>
        ) : filteredMedicines.length === 0 ? (
          <View style={styles.emptyView}>
            <Boxes size={44} color="#CBD5E1" />
            <Text style={styles.emptyHeading}>No Matching Medicines</Text>
            <Text style={styles.emptyDetail}>Try refining your search filter query.</Text>
          </View>
        ) : (
          filteredMedicines.map((med) => {
            const isLowStock = med.currentStock <= med.reorderLevel;

            return (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryCodeRow}>
                      <Text style={styles.medCode}>{med.code}</Text>
                      <Text style={styles.categoryBadge}>{med.category}</Text>
                      <Text style={styles.dosageBadge}>{med.dosageForm}</Text>
                    </View>
                    <Text style={styles.brandTitle}>{med.brandName}</Text>
                    <Text style={styles.genericSub}>{med.genericName} · {med.strength}</Text>
                  </View>

                  {/* Stock summary badge */}
                  <View style={styles.stockSummaryBox}>
                    <Text style={[styles.stockNumber, isLowStock && styles.stockNumberLow]}>
                      {med.currentStock}
                    </Text>
                    <Text style={styles.stockUnitsLabel}>units on hand</Text>
                    {isLowStock && (
                      <View style={styles.lowAlertTag}>
                        <AlertTriangle size={10} color="#DC2626" />
                        <Text style={styles.lowAlertText}>Low Stock</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Batches Table (FEFO View) */}
                <View style={styles.batchesSection}>
                  <Text style={styles.batchSectionTitle}>Active Batches (FEFO Order):</Text>
                  {med.batches.map((batch, bIdx) => (
                    <View key={batch.id || bIdx} style={styles.batchRow}>
                      <View style={styles.batchLeft}>
                        <Text style={styles.batchIdText}>{batch.batchNumber}</Text>
                        {bIdx === 0 && (
                          <View style={styles.earliestBadge}>
                            <Text style={styles.earliestText}>Next to Expire</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.batchRight}>
                        <Text style={[styles.expiryText, batch.isNearExpiry && styles.expiryAlertText]}>
                          Exp: {batch.expiryDate}
                        </Text>
                        <Text style={styles.batchQtyText}>{batch.quantity} units</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Card Action Row */}
                <View style={styles.actionRow}>
                  <Text style={styles.priceMeta}>
                    Unit MRP: <Text style={styles.priceBold}>₹{med.unitPrice.toFixed(2)}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => openAdjustModal(med)}
                  >
                    <ArrowUpDown size={14} color="#38845A" />
                    <Text style={styles.adjustBtnText}>Adjust Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* STOCK ADJUSTMENT MODAL                                   */}
      {/* ======================================================== */}
      {selectedMed && (
        <Modal
          visible={adjustModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setAdjustModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalTop}>
                <View>
                  <Text style={styles.modalHeading}>Stock Adjustment Memo</Text>
                  <Text style={styles.modalDrugName}>{selectedMed.brandName}</Text>
                </View>
                <TouchableOpacity onPress={() => setAdjustModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* Select Batch */}
                <Text style={styles.inputLabel}>Target Batch:</Text>
                <View style={styles.batchPickerBox}>
                  {selectedMed.batches.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.pickerPill,
                        selectedBatchId === b.id && styles.pickerPillActive,
                      ]}
                      onPress={() => setSelectedBatchId(b.id)}
                    >
                      <Text style={[styles.pickerPillText, selectedBatchId === b.id && styles.pickerPillTextActive]}>
                        {b.batchNumber} (Bal: {b.quantity})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Adjustment Direction */}
                <Text style={styles.inputLabel}>Adjustment Type:</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      adjustmentType === 'INCREASE' && styles.typeBtnActiveInc,
                    ]}
                    onPress={() => setAdjustmentType('INCREASE')}
                  >
                    <Plus size={16} color={adjustmentType === 'INCREASE' ? '#38845A' : '#64748B'} />
                    <Text
                      style={[
                        styles.typeBtnText,
                        adjustmentType === 'INCREASE' && styles.typeBtnTextInc,
                      ]}
                    >
                      Add Stock (+ Inflow)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      adjustmentType === 'DECREASE' && styles.typeBtnActiveDec,
                    ]}
                    onPress={() => setAdjustmentType('DECREASE')}
                  >
                    <Minus size={16} color={adjustmentType === 'DECREASE' ? '#DC2626' : '#64748B'} />
                    <Text
                      style={[
                        styles.typeBtnText,
                        adjustmentType === 'DECREASE' && styles.typeBtnTextDec,
                      ]}
                    >
                      Deduct / Shrinkage (- Outflow)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quantity */}
                <Text style={styles.inputLabel}>Quantity Difference (units):</Text>
                <TextInput
                  style={styles.textInputBox}
                  keyboardType="numeric"
                  value={quantityDelta}
                  onChangeText={setQuantityDelta}
                  placeholder="e.g. 50"
                  placeholderTextColor="#94A3B8"
                />

                {/* Reason Selection */}
                <Text style={styles.inputLabel}>Audit Adjustment Reason:</Text>
                {[
                  'Physical Stock Audit Reconciliation',
                  'New Shipment / Goods Received Note (GRN)',
                  'Damage / Broken Vials in Transit',
                  'Expired Stock Safe Disposal',
                  'Emergency Transfer to Ward Stash',
                ].map((reasonOption) => (
                  <TouchableOpacity
                    key={reasonOption}
                    style={[
                      styles.reasonOptionPill,
                      adjustReason === reasonOption && styles.reasonOptionPillSelected,
                    ]}
                    onPress={() => setAdjustReason(reasonOption)}
                  >
                    <Text
                      style={[
                        styles.reasonOptionText,
                        adjustReason === reasonOption && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {reasonOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelActionBtn}
                  onPress={() => setAdjustModalVisible(false)}
                >
                  <Text style={styles.cancelActionText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={submitStockAdjustment}
                  disabled={adjusting}
                >
                  {adjusting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Check size={16} color="#fff" />
                      <Text style={styles.saveActionText}>Post Adjustment</Text>
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
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  statsPillText: { fontSize: 11, fontWeight: '800', color: '#38845A' },
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
  filterPillsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  filterPillActive: { backgroundColor: '#38845A' },
  filterPillActiveLow: { backgroundColor: '#EAF5ED', borderWidth: 1, borderColor: '#FCA5A5' },
  filterPillActiveExp: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#fff' },
  filterTextActiveLow: { color: '#DC2626' },
  filterTextActiveExp: { color: '#D97706' },
  scroll: { flex: 1, padding: 14 },
  centerLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingLabel: { marginTop: 10, fontSize: 13, color: '#64748B' },
  emptyView: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyHeading: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptyDetail: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  medCard: {
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryCodeRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 4 },
  medCode: { fontSize: 10, fontWeight: '800', color: '#38845A', backgroundColor: '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryBadge: { fontSize: 10, fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dosageBadge: { fontSize: 10, fontWeight: '700', color: '#38845A', backgroundColor: '#EAF5ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  brandTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  genericSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  stockSummaryBox: { alignItems: 'flex-end', marginLeft: 10 },
  stockNumber: { fontSize: 20, fontWeight: '900', color: '#38845A' },
  stockNumberLow: { color: '#DC2626' },
  stockUnitsLabel: { fontSize: 10, color: '#94A3B8' },
  lowAlertTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, gap: 3 },
  lowAlertText: { fontSize: 9, fontWeight: '800', color: '#DC2626' },
  batchesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  batchSectionTitle: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 6 },
  batchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  batchLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  batchIdText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  earliestBadge: { backgroundColor: '#EAF5ED', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4 },
  earliestText: { fontSize: 9, fontWeight: '800', color: '#6D28D9' },
  batchRight: { alignItems: 'flex-end' },
  expiryText: { fontSize: 11, color: '#64748B' },
  expiryAlertText: { color: '#DC2626', fontWeight: '700' },
  batchQtyText: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceMeta: { fontSize: 12, color: '#64748B' },
  priceBold: { fontWeight: '800', color: '#0F172A' },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  adjustBtnText: { fontSize: 12, fontWeight: '700', color: '#38845A' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, maxHeight: '85%', paddingBottom: 16 },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalDrugName: { fontSize: 12, color: '#38845A', fontWeight: '700', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalScroll: { padding: 18 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 6 },
  batchPickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  pickerPillActive: { borderColor: '#38845A', backgroundColor: '#FAF5FF' },
  pickerPillText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  pickerPillTextActive: { color: '#38845A', fontWeight: '800' },
  typeSelectorRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  typeBtnActiveInc: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  typeBtnActiveDec: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  typeBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  typeBtnTextInc: { color: '#38845A' },
  typeBtnTextDec: { color: '#DC2626' },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  reasonOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginVertical: 3,
  },
  reasonOptionPillSelected: { borderColor: '#38845A', backgroundColor: '#FAF5FF' },
  reasonOptionText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  reasonOptionTextSelected: { color: '#38845A', fontWeight: '800' },
  modalActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  cancelActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  cancelActionText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  saveActionBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


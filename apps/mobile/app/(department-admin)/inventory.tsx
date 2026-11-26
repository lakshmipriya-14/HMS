import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Pill, Search, AlertTriangle, Plus, CheckCircle2, X, Package } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentInventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [requisitionModal, setRequisitionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadInventory = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getInventory({
        lowStockOnly: lowStockOnly || undefined,
      });
      if (res.data) setItems(res.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [lowStockOnly]);

  const handleSubmitRequisition = async () => {
    if (!selectedItem || Number(quantity) <= 0) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.submitInventoryRequest({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: Number(quantity),
        reason,
      });
      setRequisitionModal(false);
      setSelectedItem(null);
      setQuantity('10');
      setReason('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadInventory();
    } catch (err) {
      console.error('Failed to submit inventory request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const name = (item.name || '').toLowerCase();
    const code = (item.code || item.sku || '').toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Supplies" subtitle="Sub-Stock & Restock Requests" />

      {/* Filter and Search */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search supplies, drugs, consumables..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={[styles.lowStockBtn, lowStockOnly && styles.lowStockBtnActive]}
          onPress={() => setLowStockOnly(!lowStockOnly)}
        >
          <AlertTriangle size={13} color={lowStockOnly ? '#FFFFFF' : '#D97706'} />
          <Text style={[styles.lowStockText, lowStockOnly && styles.lowStockTextActive]}>
            Low Stock Only
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadInventory} tintColor="#38845A" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#38845A" />
            <Text style={styles.successText}>Restock requisition sent to central stores</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No supply items match your search</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const stock = item.currentStock ?? 0;
            const min = item.minimumStock ?? 5;
            const isLow = stock <= min;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoCol}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>
                      SKU: {item.code || item.sku || 'GEN'} • Category: {item.category || 'Supplies'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stockPill,
                      { backgroundColor: isLow ? '#EAF5ED' : '#EAF5ED' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockPillText,
                        { color: isLow ? '#DC2626' : '#38845A' },
                      ]}
                    >
                      {stock} {item.unit || 'units'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.minStockText}>Min Threshold: {min} units</Text>
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => {
                      setSelectedItem(item);
                      setQuantity(String(Math.max(min * 2, 10)));
                      setRequisitionModal(true);
                    }}
                  >
                    <Plus size={12} color="#38845A" />
                    <Text style={styles.reorderBtnText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Requisition Modal */}
      <Modal visible={requisitionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Restock Requisition</Text>
              <TouchableOpacity onPress={() => setRequisitionModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Requested Item</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
              editable={false}
              value={selectedItem?.name || ''}
            />

            <Text style={styles.inputLabel}>Restock Quantity *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="10"
            />

            <Text style={styles.inputLabel}>Requisition Justification</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Depleted emergency tray, expected patient surge..."
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitRequisition}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Dispatch Requisition'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },
  lowStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  lowStockBtnActive: {
    backgroundColor: '#D97706',
  },
  lowStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  lowStockTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF5ED',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38845A',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemSku: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  minStockText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reorderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

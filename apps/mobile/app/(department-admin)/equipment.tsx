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
import { Wrench, Search, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function EquipmentManagementScreen() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<any | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadEquipment = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getEquipment();
      if (res.data) setEquipment(res.data);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleSubmitMaintenance = async () => {
    if (!issueDescription.trim() || !selectedEquip) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.submitMaintenanceRequest({
        equipmentId: selectedEquip.id,
        equipmentName: selectedEquip.name,
        description: issueDescription,
        priority,
      });
      setReportModal(false);
      setSelectedEquip(null);
      setIssueDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadEquipment();
    } catch (err) {
      console.error('Failed to report equipment issue:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = equipment.filter((e) => {
    if (!search) return true;
    const name = (e.name || '').toLowerCase();
    const serial = (e.serialNumber || e.model || '').toLowerCase();
    return name.includes(search.toLowerCase()) || serial.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Equipment" subtitle="Biomedical Assets & Maintenance" />

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          placeholder="Search equipment by name, model, serial..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadEquipment} tintColor="#38845A" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#38845A" />
            <Text style={styles.successText}>Biomedical maintenance ticket created</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No equipment found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isOperational = ['OPERATIONAL', 'FUNCTIONAL', 'ACTIVE'].includes(item.status);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.equipName}>{item.name}</Text>
                    <Text style={styles.equipMeta}>
                      Model: {item.model || 'Standard'} • Serial: {item.serialNumber || item.id.slice(0, 8)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isOperational ? '#EAF5ED' : '#EAF5ED' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isOperational ? '#38845A' : '#DC2626' },
                      ]}
                    >
                      {item.status || 'OPERATIONAL'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.locationText}>
                    Room: {item.location || item.room || 'Department Floor'}
                  </Text>
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={() => {
                      setSelectedEquip(item);
                      setReportModal(true);
                    }}
                  >
                    <Wrench size={12} color="#D97706" />
                    <Text style={styles.reportBtnText}>Report Issue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Report Maintenance Modal */}
      <Modal visible={reportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Equipment Issue</Text>
              <TouchableOpacity onPress={() => setReportModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Equipment</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
              editable={false}
              value={`${selectedEquip?.name || ''} (${selectedEquip?.serialNumber || ''})`}
            />

            <Text style={styles.inputLabel}>Malfunction Description *</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              numberOfLines={3}
              value={issueDescription}
              onChangeText={setIssueDescription}
              placeholder="Describe error code, defect, or breakdown..."
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitMaintenance}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Dispatch Maintenance'}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  equipName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  equipMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reportBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { BedDouble, Wrench, AlertTriangle, CheckCircle2, X } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function WardBedOverviewScreen() {
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadBeds = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getWardsAndBeds();
      if (res.data) setWards(res.data);
    } catch (err) {
      console.error('Failed to load wards and beds:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const handleReportMaintenance = async () => {
    if (!selectedBed || !maintenanceNotes.trim()) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.createRequest({
        type: 'MAINTENANCE',
        title: `Bed #${selectedBed.bedNumber} Maintenance`,
        description: `Bed #${selectedBed.bedNumber} (${selectedBed.wardName || 'Ward'}) issue: ${maintenanceNotes}`,
        priority: 'HIGH',
      });
      setReportModal(false);
      setSelectedBed(null);
      setMaintenanceNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to report bed maintenance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalBeds = wards.reduce((acc, w) => acc + (w.beds?.length || 0), 0);
  const occupiedBeds = wards.reduce(
    (acc, w) => acc + (w.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0),
    0
  );
  const freeBeds = totalBeds - occupiedBeds;

  return (
    <View style={styles.container}>
      <AdminHeader title="Wards & Bed Map" subtitle="Department Occupancy & Census" />

      {/* Summary KPI Strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#0F766E' }]}>{totalBeds}</Text>
          <Text style={styles.kpiLbl}>Total Beds</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{occupiedBeds}</Text>
          <Text style={styles.kpiLbl}>Occupied</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#059669' }]}>{freeBeds}</Text>
          <Text style={styles.kpiLbl}>Available</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadBeds} tintColor="#0F766E" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#0F766E" />
            <Text style={styles.successText}>Bed maintenance ticket dispatched to facilities</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : wards.length === 0 ? (
          <View style={styles.emptyState}>
            <BedDouble size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No wards or beds registered in this department</Text>
          </View>
        ) : (
          wards.map((ward) => (
            <View key={ward.id} style={styles.wardCard}>
              <View style={styles.wardHeader}>
                <View>
                  <Text style={styles.wardTitle}>{ward.name}</Text>
                  <Text style={styles.wardMeta}>
                    Type: {ward.type || 'General'} • Floor: {ward.floorNumber || 1}
                  </Text>
                </View>
                <Text style={styles.occupancyRatio}>
                  {ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0}/
                  {ward.beds?.length || 0}
                </Text>
              </View>

              <View style={styles.bedGrid}>
                {(ward.beds || []).map((bed: any) => {
                  const isOcc = bed.status === 'OCCUPIED';
                  const isMaint = bed.status === 'MAINTENANCE';

                  return (
                    <TouchableOpacity
                      key={bed.id}
                      style={[
                        styles.bedTile,
                        {
                          backgroundColor: isOcc
                            ? '#FEE2E2'
                            : isMaint
                            ? '#F1F5F9'
                            : '#CCFBF1',
                        },
                      ]}
                      onPress={() => {
                        setSelectedBed({ ...bed, wardName: ward.name });
                        setReportModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.bedNum,
                          {
                            color: isOcc
                              ? '#DC2626'
                              : isMaint
                              ? '#64748B'
                              : '#0F766E',
                          },
                        ]}
                      >
                        {bed.bedNumber}
                      </Text>
                      <Text style={styles.bedType}>{bed.type || 'Standard'}</Text>
                      <Text
                        style={[
                          styles.bedStatusLabel,
                          { color: isOcc ? '#DC2626' : '#0F766E' },
                        ]}
                      >
                        {isOcc ? 'Occupied' : isMaint ? 'Maintenance' : 'Available'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bed Maintenance Modal */}
      <Modal visible={reportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bed #{selectedBed?.bedNumber} Issue Report
              </Text>
              <TouchableOpacity onPress={() => setReportModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Ward Location</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
              editable={false}
              value={`${selectedBed?.wardName || 'Ward'} • Bed #${selectedBed?.bedNumber || ''}`}
            />

            <Text style={styles.inputLabel}>Maintenance Issue / Breakdown Description *</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              multiline
              numberOfLines={3}
              value={maintenanceNotes}
              onChangeText={setMaintenanceNotes}
              placeholder="e.g. Electrical adjustment motor stuck, side rail broken..."
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleReportMaintenance}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Dispatch Maintenance Ticket'}
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
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  kpiVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
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
    backgroundColor: '#CCFBF1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
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
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  wardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  occupancyRatio: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedTile: {
    width: '31%',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  bedNum: {
    fontSize: 13,
    fontWeight: '900',
  },
  bedType: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  bedStatusLabel: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
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
    backgroundColor: '#0F766E',
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

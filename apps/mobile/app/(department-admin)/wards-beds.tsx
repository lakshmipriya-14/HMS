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
import { BedDouble, Wrench, AlertTriangle, CheckCircle2, X, User, Shield, Info } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function WardBedOverviewScreen() {
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bed Detail Modal
  const [bedDetailModal, setBedDetailModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<any | null>(null);

  // Maintenance Work Order Modal
  const [reportModal, setReportModal] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [priority, setPriority] = useState('HIGH');
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

  const handleOpenBedDetail = (bed: any, ward: any) => {
    setSelectedBed({ ...bed, wardName: ward.name, wardType: ward.type, floor: ward.floorNumber });
    setBedDetailModal(true);
  };

  const handleOpenReportModal = () => {
    setBedDetailModal(false);
    setMaintenanceNotes('');
    setReportModal(true);
  };

  const handleReportMaintenance = async () => {
    if (!selectedBed || !maintenanceNotes.trim()) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.createRequest({
        type: 'MAINTENANCE',
        title: `Bed #${selectedBed.bedNumber} Maintenance`,
        description: `Bed #${selectedBed.bedNumber} (${selectedBed.wardName || 'Ward'}) issue: ${maintenanceNotes}`,
        priority,
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
      <AdminHeader title="Wards & Bed Map" />

      {/* Summary KPI Strip */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiVal, { color: '#38845A' }]}>{totalBeds}</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={loadBeds} tintColor="#38845A" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.successText}>Bed maintenance ticket dispatched to Engineering</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : wards.length === 0 ? (
          <View style={styles.emptyState}>
            <BedDouble size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department wards configured</Text>
          </View>
        ) : (
          wards.map((ward) => {
            const wardOcc = ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0;
            const wardTotal = ward.beds?.length || 0;
            const occPercent = wardTotal > 0 ? Math.round((wardOcc / wardTotal) * 100) : 0;

            return (
              <View key={ward.id} style={styles.wardCard}>
                <View style={styles.wardHeader}>
                  <View>
                    <Text style={styles.wardTitle}>{ward.name}</Text>
                    <Text style={styles.wardMeta}>
                      Type: {ward.type || 'General'} • Floor {ward.floorNumber || 1} • {occPercent}% Occupancy
                    </Text>
                  </View>
                  <Text style={styles.occupancyRatio}>
                    {wardOcc}/{wardTotal}
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
                              ? '#EAF5ED'
                              : isMaint
                              ? '#F1F5F9'
                              : '#EAF5ED',
                          },
                        ]}
                        onPress={() => handleOpenBedDetail(bed, ward)}
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
                                : '#38845A',
                            },
                          ]}
                        >
                          {bed.bedNumber}
                        </Text>
                        <Text style={styles.bedType}>{bed.type || 'Standard'}</Text>
                        <Text
                          style={[
                            styles.bedStatusLabel,
                            { color: isOcc ? '#DC2626' : '#38845A' },
                          ]}
                        >
                          {isOcc ? 'Occupied' : isMaint ? 'Maintenance' : 'Available'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bed Detail Modal */}
      <Modal visible={bedDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bed #{selectedBed?.bedNumber} Information
              </Text>
              <TouchableOpacity onPress={() => setBedDetailModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedBed && (
              <View style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>LOCATION & CATEGORY</Text>
                  <Text style={styles.detailText}>Ward: {selectedBed.wardName}</Text>
                  <Text style={styles.detailText}>Floor: Floor {selectedBed.floor || 1}</Text>
                  <Text style={styles.detailText}>Category: {selectedBed.type || 'Standard Care'}</Text>
                  <Text style={styles.detailText}>
                    Status:{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color:
                          selectedBed.status === 'OCCUPIED'
                            ? '#DC2626'
                            : selectedBed.status === 'MAINTENANCE'
                            ? '#64748B'
                            : '#059669',
                      }}
                    >
                      {selectedBed.status || 'AVAILABLE'}
                    </Text>
                  </Text>
                </View>

                {selectedBed.status === 'OCCUPIED' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>INPATIENT OCCUPANT</Text>
                    <Text style={styles.detailText}>
                      Patient: {selectedBed.admission?.patient?.firstName || 'Admitted Patient'}
                    </Text>
                    <Text style={styles.detailText}>
                      UHID: {selectedBed.admission?.patient?.uhid || 'Active IPD'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleOpenReportModal}
                >
                  <Wrench size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Report Bed Maintenance Issue</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Report Maintenance Issue Modal */}
      <Modal visible={reportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Report Bed #{selectedBed?.bedNumber} Issue
              </Text>
              <TouchableOpacity onPress={() => setReportModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Ward Location</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: '#F1F5F9' }]}
                editable={false}
                value={`${selectedBed?.wardName || 'Ward'} • Bed ${selectedBed?.bedNumber}`}
              />

              <Text style={styles.inputLabel}>Problem Description *</Text>
              <TextInput
                style={[styles.modalInput, { height: 90 }]}
                multiline
                numberOfLines={3}
                placeholder="e.g. Guardrail mechanism broken, remote control malfunctioning, hydraulic leak..."
                value={maintenanceNotes}
                onChangeText={setMaintenanceNotes}
              />

              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.priorityRow}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((pr) => (
                  <TouchableOpacity
                    key={pr}
                    style={[
                      styles.prChip,
                      priority === pr && styles.prChipActive,
                    ]}
                    onPress={() => setPriority(pr)}
                  >
                    <Text
                      style={[
                        styles.prChipText,
                        priority === pr && styles.prChipTextActive,
                      ]}
                    >
                      {pr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleReportMaintenance}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Dispatch Maintenance Work Order</Text>
                )}
              </TouchableOpacity>
            </View>
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
    gap: 12,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
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
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
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
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  wardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  wardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  occupancyRatio: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38845A',
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedTile: {
    width: '31%',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  bedNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  bedType: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  bedStatusLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 4,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  prChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  prChipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#EF4444',
  },
  prChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  prChipTextActive: {
    color: '#DC2626',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

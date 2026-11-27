import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  BedDouble,
  Plus,
  ChevronLeft,
  X,
  CheckCircle,
  Wrench,
  Sparkles,
  User,
  Building,
  Activity,
  Layers,
  Calendar,
  IndianRupee,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminWardsScreen() {
  const router = useRouter();
  const [censusData, setCensusData] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Bed for details / status update
  const [selectedBed, setSelectedBed] = useState<any>(null);

  // Add bed modal
  const [addBedModal, setAddBedModal] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [roomNum, setRoomNum] = useState('');
  const [bedNum, setBedNum] = useState('');
  const [bedType, setBedType] = useState('STANDARD');
  const [dailyRate, setDailyRate] = useState('1000');

  // Edit bed modal
  const [editBedModal, setEditBedModal] = useState<any>(null);
  const [editRoomNum, setEditRoomNum] = useState('');
  const [editBedNum, setEditBedNum] = useState('');
  const [editBedType, setEditBedType] = useState('STANDARD');
  const [editDailyRate, setEditDailyRate] = useState('1000');

  // Add ward modal
  const [addWardModal, setAddWardModal] = useState(false);
  const [wardName, setWardName] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardFloor, setWardFloor] = useState('1');
  const [wardGender, setWardGender] = useState('ANY');
  const [wardDeptId, setWardDeptId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [censusRes, deptRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getBedCensus(),
        mobileApiClient.hospitalAdmin.getDepartments(),
      ]);
      if (censusRes.data) setCensusData(censusRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Census Error', e.message || 'Failed to load bed census');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (bedId: string, status: string) => {
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateBedStatus(bedId, status);
      setSelectedBed(null);
      await loadData();
      Alert.alert('Status Updated', `Bed status marked as ${status}.`);
    } catch (err: any) {
      Alert.alert('Update Error', err.message || 'Failed to update bed status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBed = async () => {
    if (!selectedWardId || !roomNum || !bedNum) {
      Alert.alert('Required Fields', 'Please select a ward, room number, and bed identifier.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createBed(selectedWardId, {
        roomNumber: roomNum,
        bedNumber: bedNum,
        type: bedType,
        dailyRate: parseFloat(dailyRate) || 1000,
      });
      setAddBedModal(false);
      setRoomNum('');
      setBedNum('');
      await loadData();
      Alert.alert('Success', 'Bed added to ward inventory.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWard = async () => {
    if (!wardName || !wardCode) {
      Alert.alert('Required Fields', 'Please provide ward name and unique code.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createWard({
        name: wardName,
        code: wardCode.toUpperCase(),
        floorNumber: parseInt(wardFloor, 10) || 1,
        genderAllowed: wardGender,
        departmentId: wardDeptId || undefined,
      });
      setAddWardModal(false);
      setWardName('');
      setWardCode('');
      await loadData();
      Alert.alert('Success', 'Ward created successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create ward');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = (bed: any) => {
    if (bed.status === 'OCCUPIED') {
      Alert.alert('Cannot Delete', 'Occupied beds cannot be removed while a patient is admitted.');
      return;
    }
    Alert.alert(
      'Delete Bed',
      `Are you sure you want to permanently remove Bed ${bed.bedNumber} (Room ${bed.roomNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.deleteBed(bed.id);
              setSelectedBed(null);
              await loadData();
              Alert.alert('Deleted', `Bed ${bed.bedNumber} removed.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Cannot delete bed.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleEditBed = async () => {
    if (!editBedModal) return;
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.updateBed(editBedModal.id, {
        roomNumber: editRoomNum,
        bedNumber: editBedNum,
        type: editBedType,
        dailyRate: parseFloat(editDailyRate) || 1000,
      });
      setEditBedModal(null);
      setSelectedBed(null);
      await loadData();
      Alert.alert('Updated', 'Bed details updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update bed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchClean = (ward: any) => {
    const unoccBeds = (ward.beds || []).filter((b: any) => b.status === 'AVAILABLE');
    if (unoccBeds.length === 0) {
      Alert.alert('No Available Beds', 'All beds in this ward are either occupied or already cleaning/maintenance.');
      return;
    }
    Alert.alert(
      'Batch Turnover',
      `Mark all ${unoccBeds.length} unoccupied beds in ${ward.name} as CLEANING for housekeeping turnover?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Turnover',
          onPress: async () => {
            try {
              setSubmitting(true);
              await mobileApiClient.hospitalAdmin.bulkUpdateBedStatus(
                unoccBeds.map((b: any) => b.id),
                'CLEANING'
              );
              await loadData();
              Alert.alert('Housekeeping Triggered', `${unoccBeds.length} beds marked for cleaning.`);
            } catch (err: any) {
              Alert.alert('Turnover Error', err.message || 'Failed to bulk update beds.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const summary = censusData?.summary || {};
  const deptUtilization: any[] = censusData?.departmentUtilization || [];
  const wards: any[] = censusData?.wards || [];

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(admin)/more"
        title="Bed Census & Wards"
        subtitle="Hospital Inpatient Capacity"
        alertsCount={summary.maintenanceBeds || 0}
      />

      {/* Top Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/more')}
        >
          <ChevronLeft size={20} color="#1565C0" />
        </TouchableOpacity>
        <Text style={styles.actionTitle}>Ward Census & Bed Matrix</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#F1F5F9' }]}
            onPress={() => setAddWardModal(true)}
          >
            <Text style={[styles.addBtnText, { color: '#1565C0' }]}>+ Ward</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (wards.length > 0) setSelectedWardId(wards[0].id);
              setAddBedModal(true);
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Bed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Loading live bed census...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#1565C0" />
          }
        >
          {/* EXECUTIVE CENSUS KPI CARD */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={styles.kpiIconWrapper}>
                <BedDouble size={20} color="#1565C0" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.kpiSub}>Hospital Bed Occupancy</Text>
                <Text style={styles.kpiMain}>
                  {summary.bedOccupancyRate || 0}% Occupied
                </Text>
              </View>
              <View style={styles.kpiBadge}>
                <Text style={styles.kpiBadgeText}>
                  {summary.occupiedBeds || 0} / {summary.totalBeds || 0} Beds
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiColLabel}>Available</Text>
                <Text style={[styles.kpiColVal, { color: '#00897B' }]}>
                  {summary.availableBeds || 0}
                </Text>
              </View>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiColLabel}>Occupied</Text>
                <Text style={[styles.kpiColVal, { color: '#1565C0' }]}>
                  {summary.occupiedBeds || 0}
                </Text>
              </View>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiColLabel}>Cleaning</Text>
                <Text style={[styles.kpiColVal, { color: '#F59E0B' }]}>
                  {summary.cleaningBeds || 0}
                </Text>
              </View>
              <View style={styles.kpiCol}>
                <Text style={styles.kpiColLabel}>Maintenance</Text>
                <Text style={[styles.kpiColVal, { color: '#DC2626' }]}>
                  {summary.maintenanceBeds || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* DEPARTMENT-WISE BED UTILIZATION */}
          {deptUtilization.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>Department Bed Utilization</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
                {deptUtilization.map((d) => (
                  <View key={d.departmentId} style={styles.deptUtilCard}>
                    <Text style={styles.deptUtilName}>{d.departmentName}</Text>
                    <Text style={styles.deptUtilStat}>
                      {d.occupiedBeds} / {d.totalBeds} Beds ({d.occupancyRate}%)
                    </Text>
                    <View style={styles.miniProgressBg}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${Math.min(d.occupancyRate, 100)}%`,
                            backgroundColor: d.occupancyRate > 80 ? '#DC2626' : '#1565C0',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* WARDS AND BEDS INVENTORY */}
          <Text style={[styles.sectionHeader, { marginTop: 14 }]}>
            Hospital Wards & Bed Grid ({wards.length})
          </Text>

          {wards.map((ward) => (
            <View key={ward.id} style={styles.wardCard}>
              <View style={styles.wardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wardName}>{ward.name}</Text>
                  <Text style={styles.wardSub}>
                    Code: {ward.code} • Floor {ward.floorNumber} • Gender: {ward.genderAllowed}
                  </Text>
                  {ward.department && (
                    <Text style={styles.wardDept}>Department: {ward.department.name}</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.wardBatchBtn}
                    onPress={() => handleBatchClean(ward)}
                  >
                    <Sparkles size={12} color="#F59E0B" />
                    <Text style={styles.wardBatchBtnText}>Turnover</Text>
                  </TouchableOpacity>
                  <View style={styles.occBadge}>
                    <Text style={styles.occBadgeText}>{ward.bedOccupancyRate}% Occ</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.wardStatsText}>
                {ward.occupiedBeds} occupied • {ward.availableBeds} available •{' '}
                {ward.cleaningBeds + ward.maintenanceBeds} cleaning/maint
              </Text>

              {/* Beds Matrix */}
              <View style={styles.bedGrid}>
                {(ward.beds || []).map((bed: any) => {
                  const isOcc = bed.status === 'OCCUPIED';
                  const isMaint = bed.status === 'MAINTENANCE';
                  const isClean = bed.status === 'CLEANING';
                  return (
                    <TouchableOpacity
                      key={bed.id}
                      style={[
                        styles.bedItem,
                        isOcc && styles.bedItemOcc,
                        isMaint && styles.bedItemMaint,
                        isClean && styles.bedItemClean,
                      ]}
                      onPress={() => setSelectedBed({ ...bed, wardName: ward.name })}
                    >
                      <View style={styles.bedTop}>
                        <Text style={styles.bedNumber}>{bed.bedNumber}</Text>
                        <Text style={styles.bedRoom}>Rm {bed.roomNumber}</Text>
                      </View>
                      <Text style={styles.bedStatusText}>{bed.status}</Text>
                      {bed.currentPatientName && (
                        <Text style={styles.bedPatientName} numberOfLines={1}>
                          {bed.currentPatientName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* BED & PATIENT ALLOCATION DETAILS MODAL */}
      <Modal visible={!!selectedBed} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                Bed {selectedBed?.bedNumber} ({selectedBed?.wardName})
              </Text>
              <TouchableOpacity onPress={() => setSelectedBed(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Room Number:</Text>
              <Text style={styles.modalMetaVal}>{selectedBed?.roomNumber}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Bed Type:</Text>
              <Text style={styles.modalMetaVal}>{selectedBed?.type || 'STANDARD'}</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Daily Rate:</Text>
              <Text style={styles.modalMetaVal}>₹ {selectedBed?.dailyRate || 1000}/day</Text>
            </View>
            <View style={styles.modalMetaRow}>
              <Text style={styles.modalMetaLabel}>Status:</Text>
              <Text
                style={[
                  styles.modalMetaVal,
                  {
                    color:
                      selectedBed?.status === 'OCCUPIED'
                        ? '#1565C0'
                        : selectedBed?.status === 'AVAILABLE'
                        ? '#00897B'
                        : '#DC2626',
                  },
                ]}
              >
                {selectedBed?.status}
              </Text>
            </View>

            {/* PATIENT ALLOCATION DETAILS IF OCCUPIED */}
            {selectedBed?.status === 'OCCUPIED' ? (
              <View style={styles.patientBox}>
                <View style={styles.patientBoxHead}>
                  <User size={16} color="#1565C0" />
                  <Text style={styles.patientBoxTitle}>Inpatient Allocation Details</Text>
                </View>
                <Text style={styles.patientField}>
                  👤 Patient:{' '}
                  {selectedBed?.currentPatientName ||
                    (selectedBed?.patientDetails
                      ? `${selectedBed.patientDetails.firstName} ${selectedBed.patientDetails.lastName}`
                      : 'Admitted Patient')}
                </Text>
                {selectedBed?.patientDetails?.uhid && (
                  <Text style={styles.patientField}>
                    🆔 UHID: {selectedBed.patientDetails.uhid}
                  </Text>
                )}
                {selectedBed?.activeAdmission?.doctorName && (
                  <Text style={styles.patientField}>
                    👨‍⚕️ Attending: {selectedBed.activeAdmission.doctorName}
                  </Text>
                )}
                {selectedBed?.activeAdmission?.initialDiagnosis && (
                  <Text style={styles.patientField}>
                    📋 Diagnosis: {selectedBed.activeAdmission.initialDiagnosis}
                  </Text>
                )}
                {selectedBed?.activeAdmission?.admittedAt && (
                  <Text style={styles.patientField}>
                    📅 Admitted: {new Date(selectedBed.activeAdmission.admittedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ) : (
              /* STATUS CHANGER BUTTONS IF NOT OCCUPIED */
              <View style={styles.statusActionWrap}>
                <Text style={styles.statusActionTitle}>Update Bed Status</Text>
                <View style={styles.statusBtnRow}>
                  {selectedBed?.status !== 'AVAILABLE' && (
                    <TouchableOpacity
                      style={[styles.statusChoiceBtn, { backgroundColor: '#DCFCE7' }]}
                      onPress={() => handleUpdateStatus(selectedBed.id, 'AVAILABLE')}
                      disabled={submitting}
                    >
                      <CheckCircle size={14} color="#00897B" />
                      <Text style={[styles.statusChoiceText, { color: '#00897B' }]}>
                        Available
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedBed?.status !== 'CLEANING' && (
                    <TouchableOpacity
                      style={[styles.statusChoiceBtn, { backgroundColor: '#FEF3C7' }]}
                      onPress={() => handleUpdateStatus(selectedBed.id, 'CLEANING')}
                      disabled={submitting}
                    >
                      <Sparkles size={14} color="#F59E0B" />
                      <Text style={[styles.statusChoiceText, { color: '#F59E0B' }]}>
                        Cleaning
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedBed?.status !== 'MAINTENANCE' && (
                    <TouchableOpacity
                      style={[styles.statusChoiceBtn, { backgroundColor: '#E8F1FC' }]}
                      onPress={() => handleUpdateStatus(selectedBed.id, 'MAINTENANCE')}
                      disabled={submitting}
                    >
                      <Wrench size={14} color="#DC2626" />
                      <Text style={[styles.statusChoiceText, { color: '#DC2626' }]}>
                        Maintenance
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* BED MANAGEMENT ACTIONS */}
            <View style={styles.bedManageRow}>
              <TouchableOpacity
                style={styles.bedManageBtn}
                onPress={() => {
                  setEditBedModal(selectedBed);
                  setEditRoomNum(selectedBed.roomNumber);
                  setEditBedNum(selectedBed.bedNumber);
                  setEditBedType(selectedBed.type || 'STANDARD');
                  setEditDailyRate(String(selectedBed.dailyRate || 1000));
                }}
              >
                <Edit2 size={14} color="#1565C0" />
                <Text style={styles.bedManageBtnText}>Edit Bed Details</Text>
              </TouchableOpacity>

              {selectedBed?.status !== 'OCCUPIED' && (
                <TouchableOpacity
                  style={[styles.bedManageBtn, { borderColor: '#FEE2E2' }]}
                  onPress={() => handleDeleteBed(selectedBed)}
                >
                  <Trash2 size={14} color="#DC2626" />
                  <Text style={[styles.bedManageBtnText, { color: '#DC2626' }]}>Delete Bed</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD BED MODAL */}
      <Modal visible={addBedModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add Bed to Ward</Text>
              <TouchableOpacity onPress={() => setAddBedModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Ward</Text>
            <View style={styles.chipRow}>
              {wards.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.chip, selectedWardId === w.id && styles.chipActive]}
                  onPress={() => setSelectedWardId(w.id)}
                >
                  <Text style={[styles.chipText, selectedWardId === w.id && styles.chipTextActive]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Room Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 102"
              value={roomNum}
              onChangeText={setRoomNum}
            />

            <Text style={styles.fieldLabel}>Bed Identifier</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. B-102-A"
              value={bedNum}
              onChangeText={setBedNum}
            />

            <Text style={styles.fieldLabel}>Daily Rate (₹)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="1000"
              keyboardType="numeric"
              value={dailyRate}
              onChangeText={setDailyRate}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateBed}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Add Bed to Inventory</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD WARD MODAL */}
      <Modal visible={addWardModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Create Hospital Ward</Text>
              <TouchableOpacity onPress={() => setAddWardModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Ward Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Intensive Cardiac Care Unit"
              value={wardName}
              onChangeText={setWardName}
            />

            <Text style={styles.fieldLabel}>Ward Code</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. ICCU"
              autoCapitalize="characters"
              value={wardCode}
              onChangeText={setWardCode}
            />

            <Text style={styles.fieldLabel}>Floor Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="1"
              keyboardType="numeric"
              value={wardFloor}
              onChangeText={setWardFloor}
            />

            <Text style={styles.fieldLabel}>Department Assignment</Text>
            <View style={styles.chipRow}>
              {departments.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.chip, wardDeptId === d.id && styles.chipActive]}
                  onPress={() => setWardDeptId(d.id)}
                >
                  <Text style={[styles.chipText, wardDeptId === d.id && styles.chipTextActive]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateWard}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Create Ward</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT BED MODAL */}
      <Modal visible={!!editBedModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                Edit Bed {editBedModal?.bedNumber}
              </Text>
              <TouchableOpacity onPress={() => setEditBedModal(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Room Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 102"
              value={editRoomNum}
              onChangeText={setEditRoomNum}
            />

            <Text style={styles.fieldLabel}>Bed Identifier</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. B-102-A"
              value={editBedNum}
              onChangeText={setEditBedNum}
            />

            <Text style={styles.fieldLabel}>Daily Rate (₹)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="1000"
              keyboardType="numeric"
              value={editDailyRate}
              onChangeText={setEditDailyRate}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEditBed}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Bed Details</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, color: '#64748B', marginTop: 10, fontWeight: '600' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  actionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#183153',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1565C0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F1FC',
    marginBottom: 16,
    shadowColor: '#1565C0',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1565C0',
    marginTop: 1,
  },
  kpiBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCol: {
    alignItems: 'center',
  },
  kpiColLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  kpiColVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionWrap: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deptScroll: {
    maxHeight: 90,
  },
  deptUtilCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    minWidth: 160,
  },
  deptUtilName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#183153',
  },
  deptUtilStat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  miniProgressBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  wardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#183153',
  },
  wardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  wardDept: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '600',
    marginTop: 2,
  },
  occBadge: {
    backgroundColor: '#E8F1FC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1565C0',
  },
  wardStatsText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 10,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedItem: {
    width: '31%',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  bedItemOcc: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FEE2E2',
  },
  bedItemMaint: {
    backgroundColor: '#E8F1FC',
    borderColor: '#FECACA',
  },
  bedItemClean: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bedNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#183153',
  },
  bedRoom: {
    fontSize: 9,
    color: '#64748B',
  },
  bedStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    marginTop: 3,
  },
  bedPatientName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183153',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalMetaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#183153',
  },
  patientBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  patientBoxHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  patientBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1565C0',
  },
  patientField: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  statusActionWrap: {
    marginTop: 16,
  },
  statusActionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#183153',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#E8F1FC',
    borderColor: '#1565C0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#1565C0',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  wardBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  wardBatchBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  bedManageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bedManageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F1FC',
  },
  bedManageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
  },
});

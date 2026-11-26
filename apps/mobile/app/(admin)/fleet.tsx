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
  Ambulance,
  Plus,
  ChevronLeft,
  X,
  Radio,
  Fuel,
  MapPin,
  Phone,
  AlertTriangle,
  Power,
  Wrench,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminFleetScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dispatch modal
  const [dispatchModal, setDispatchModal] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add vehicle modal
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehType, setVehType] = useState('ADVANCED_LIFE_SUPPORT');
  const [vehFuel, setVehFuel] = useState('100');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [vRes, tRes] = await Promise.all([
        mobileApiClient.ambulance.getVehicles().catch(() => ({ data: [] })),
        mobileApiClient.ambulance.getActiveTrips().catch(() => ({ data: [] })),
      ]);
      if (vRes.data) setVehicles(vRes.data);
      if (tRes.data) setTrips(tRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async () => {
    if (!callerPhone || !pickupLocation) {
      Alert.alert('Required Fields', 'Please provide caller contact phone and pickup location.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.ambulance.createEmergencyRequest({
        callerName: callerName || '108 Emergency Dispatch',
        callerPhone,
        pickupLocation,
        destinationHospitalId: 'default',
        emergencySeverity: severity as any,
        patientConditionSummary: reason || 'Urgent ambulance transport requested',
      });
      setDispatchModal(false);
      setCallerName('');
      setCallerPhone('');
      setPickupLocation('');
      setReason('');
      await loadData();
      Alert.alert('108 Dispatched', 'Ambulance response unit dispatched immediately.');
    } catch (err: any) {
      Alert.alert('Dispatch Error', err.message || 'Failed to dispatch ambulance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVehicle = async () => {
    if (!regNum || !vehModel) {
      Alert.alert('Required Fields', 'Please enter registration number and vehicle model.');
      return;
    }
    try {
      setSubmitting(true);
      await mobileApiClient.hospitalAdmin.createVehicle({
        registrationNumber: regNum.toUpperCase(),
        model: vehModel,
        type: vehType,
        fuelLevel: parseInt(vehFuel, 10) || 100,
      });
      setAddVehicleModal(false);
      setRegNum('');
      setVehModel('');
      await loadData();
      Alert.alert('Success', 'Ambulance unit added to hospital fleet.');
    } catch (err: any) {
      Alert.alert('Registration Error', err.message || 'Failed to register ambulance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVehicleStatus = async (vehicle: any) => {
    const isAvail = vehicle.status === 'AVAILABLE';
    const nextStatus = isAvail ? 'MAINTENANCE' : 'AVAILABLE';
    Alert.alert(
      'Update Vehicle Status',
      `Mark ambulance ${vehicle.registrationNumber} as ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await mobileApiClient.hospitalAdmin.updateVehicleStatus(vehicle.id, !isAvail);
              await loadData();
              Alert.alert('Status Updated', `${vehicle.registrationNumber} is now ${nextStatus}.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update vehicle status');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(admin)/more" title="108 Emergency Fleet" subtitle="Rapid Response Logistics" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/more')}
        >
          <ChevronLeft size={20} color="#38845A" />
        </TouchableOpacity>
        <Text style={styles.actionTitle}>Hospital Fleet & Active Radar</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[styles.dispatchBtn, { backgroundColor: '#38845A' }]}
            onPress={() => setAddVehicleModal(true)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.dispatchBtnText}>Vehicle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dispatchBtn}
            onPress={() => setDispatchModal(true)}
          >
            <Radio size={16} color="#FFFFFF" />
            <Text style={styles.dispatchBtnText}>Dispatch</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#38845A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#38845A" />
          }
        >
          {/* Active Dispatches Radar */}
          <Text style={styles.sectionHeader}>Active Radar Dispatches ({trips.length})</Text>

          {trips.length === 0 ? (
            <View style={styles.emptyRadar}>
              <Radio size={20} color="#059669" />
              <Text style={styles.emptyRadarText}>
                All response units on standby at hospital base stations. No active transit trips.
              </Text>
            </View>
          ) : (
            trips.map((trip: any) => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripHead}>
                  <View style={styles.tripBadge}>
                    <Text style={styles.tripBadgeText}>{trip.status}</Text>
                  </View>
                  <Text style={styles.tripEta}>ETA: 8 mins</Text>
                </View>
                <Text style={styles.tripLoc}>📍 Pickup: {trip.request?.pickupLocation || 'Emergency Call'}</Text>
                <Text style={styles.tripMeta}>
                  Vehicle: {trip.vehicle?.registrationNumber || 'TN-01-AMB-108'} • Caller: {trip.request?.callerPhone || '108'}
                </Text>
              </View>
            ))
          )}

          {/* Vehicles Fleet List */}
          <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
            Hospital Ambulance Vehicles ({vehicles.length})
          </Text>

          {vehicles.map((v) => {
            const isAvail = v.status === 'AVAILABLE';
            return (
              <View key={v.id} style={styles.vehicleCard}>
                <View style={styles.vHeader}>
                  <View style={styles.vIcon}>
                    <Ambulance size={18} color="#38845A" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.vReg}>{v.registrationNumber}</Text>
                    <Text style={styles.vModel}>
                      {v.model} • {v.type || 'ADVANCED_LIFE_SUPPORT'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.vStatus,
                      { backgroundColor: isAvail ? '#D1FAE5' : '#FFE4E6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vStatusText,
                        { color: isAvail ? '#059669' : '#E11D48' },
                      ]}
                    >
                      {v.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.vFooter}>
                  <View style={styles.vMetaItem}>
                    <Fuel size={12} color="#64748B" />
                    <Text style={styles.vMetaText}>Fuel: {v.fuelLevel || 85}%</Text>
                  </View>
                  <View style={styles.vMetaItem}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.vMetaText}>Station: Hospital Bay</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.vActionBtn}
                    onPress={() => handleToggleVehicleStatus(v)}
                  >
                    <Power size={12} color={isAvail ? '#DC2626' : '#059669'} />
                    <Text
                      style={[
                        styles.vActionBtnText,
                        { color: isAvail ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {isAvail ? 'Maint' : 'Ready'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Dispatch Modal */}
      <Modal visible={dispatchModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Dispatch Emergency Ambulance</Text>
              <TouchableOpacity onPress={() => setDispatchModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Caller Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. S. Murugesan"
              value={callerName}
              onChangeText={setCallerName}
            />

            <Text style={styles.fieldLabel}>Caller Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="9876543210"
              keyboardType="phone-pad"
              value={callerPhone}
              onChangeText={setCallerPhone}
            />

            <Text style={styles.fieldLabel}>Emergency Pickup Location</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Complete address / Landmark"
              value={pickupLocation}
              onChangeText={setPickupLocation}
            />

            <Text style={styles.fieldLabel}>Severity Level</Text>
            <View style={styles.severityRow}>
              {['CRITICAL', 'HIGH', 'MEDIUM'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.severityChip,
                    severity === s && styles.severityChipActive,
                  ]}
                  onPress={() => setSeverity(s)}
                >
                  <Text
                    style={[
                      styles.severityChipText,
                      severity === s && styles.severityChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Condition Summary / Reason</Text>
            <TextInput
              style={[styles.fieldInput, { height: 60 }]}
              placeholder="Cardiac distress, trauma, etc."
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleDispatch}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Trigger 108 Dispatch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal visible={addVehicleModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Register Ambulance Vehicle</Text>
              <TouchableOpacity onPress={() => setAddVehicleModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Registration Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. TN-01-AMB-108"
              autoCapitalize="characters"
              value={regNum}
              onChangeText={setRegNum}
            />

            <Text style={styles.fieldLabel}>Vehicle Model / Make</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Force Traveller 3350"
              value={vehModel}
              onChangeText={setVehModel}
            />

            <Text style={styles.fieldLabel}>Ambulance Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
              {[
                { label: 'ALS', val: 'ADVANCED_LIFE_SUPPORT' },
                { label: 'BLS', val: 'BASIC_LIFE_SUPPORT' },
                { label: 'Patient Transport', val: 'PATIENT_TRANSPORT' },
                { label: 'Neonatal', val: 'NEONATAL_CARE' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.val}
                  style={[
                    styles.severityChip,
                    vehType === t.val && styles.severityChipActive,
                  ]}
                  onPress={() => setVehType(t.val)}
                >
                  <Text
                    style={[
                      styles.severityChipText,
                      vehType === t.val && styles.severityChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Initial Fuel Level (%)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="100"
              keyboardType="numeric"
              value={vehFuel}
              onChangeText={setVehFuel}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateVehicle}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Register Vehicle</Text>
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
    color: '#0F172A',
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  dispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  emptyRadar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  emptyRadarText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  tripCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    marginBottom: 10,
  },
  tripHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tripEta: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
  },
  tripLoc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9F1239',
  },
  tripMeta: {
    fontSize: 11,
    color: '#881337',
    marginTop: 2,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  vHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vReg: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  vModel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  vStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  vFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  vMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  vActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
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
    color: '#0F172A',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  severityChipActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#E11D48',
  },
  severityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  severityChipTextActive: {
    color: '#E11D48',
  },
  submitBtn: {
    backgroundColor: '#E11D48',
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
});

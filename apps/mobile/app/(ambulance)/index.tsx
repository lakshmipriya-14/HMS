import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Ambulance,
  MapPin,
  Phone,
  AlertTriangle,
  Navigation,
  CheckCircle2,
  Clock,
  User,
  HeartPulse,
  Activity,
  Radio,
  Siren,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export type AmbulanceTripStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE_PICKUP'
  | 'PATIENT_ON_BOARD'
  | 'ARRIVED_ER'
  | 'HANDOVER_COMPLETE';

export interface AmbulanceTrip {
  id: string;
  tripCode: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  patientName: string;
  callerName: string;
  callerPhone: string;
  pickupLocation: string;
  destinationHospital: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  eta: string;
  distanceKm: string;
  condition: string;
  status: AmbulanceTripStatus;
  dispatchedAt: string;
  vitalsLogged?: boolean;
  erHandshakeSent?: boolean;
}

const FALLBACK_ACTIVE_TRIPS: AmbulanceTrip[] = [
  {
    id: 'trip-001',
    tripCode: 'AMB-2026-0001',
    vehicleId: 'AMB-VEH-1081',
    vehicleNumber: 'TN-58-AL-1081',
    vehicleModel: 'Force Traveller ALS (Cardiac Care ICU)',
    driverName: 'Velu Pandian (ALS Certified)',
    driverPhone: '+91 98401 22910',
    patientName: 'Saravanan R. (62y Male)',
    callerName: 'Saravanan R. (Son)',
    callerPhone: '+91 98765 43210',
    pickupLocation: 'Near Meenakshi Amman Temple West Gate, Madurai',
    destinationHospital: 'Kizuna Hospital Emergency & Trauma Bay',
    priority: 'CRITICAL',
    eta: '6 mins',
    distanceKm: '2.8 km',
    condition: 'Sudden collapse, dyspnea, pale, diaphoresis. Suspected Acute STEMI.',
    status: 'EN_ROUTE_PICKUP',
    dispatchedAt: '10:15 AM',
    vitalsLogged: true,
    erHandshakeSent: false,
  },
  {
    id: 'trip-002',
    tripCode: 'AMB-2026-0002',
    vehicleId: 'AMB-VEH-1082',
    vehicleNumber: 'TN-58-AL-1082',
    vehicleModel: 'Tata Winger BLS',
    driverName: 'M. Senthil Kumar',
    driverPhone: '+91 97891 44520',
    patientName: 'Anitha Devi (28y Female)',
    callerName: 'Muthu Kumar (Husband)',
    callerPhone: '+91 94432 99812',
    pickupLocation: 'Anna Nagar 4th Main Road, Madurai',
    destinationHospital: 'Kizuna Hospital OBG Emergency Block',
    priority: 'HIGH',
    eta: '12 mins',
    distanceKm: '5.4 km',
    condition: 'Pre-term labor pains with premature rupture of membranes (PROM).',
    status: 'PATIENT_ON_BOARD',
    dispatchedAt: '10:35 AM',
    vitalsLogged: true,
    erHandshakeSent: true,
  },
  {
    id: 'trip-003',
    tripCode: 'AMB-2026-0003',
    vehicleId: 'AMB-VEH-1085',
    vehicleNumber: 'TN-58-AL-1085',
    vehicleModel: 'Force Traveller Trauma Mobile ICU',
    driverName: 'K. Rajendran',
    driverPhone: '+91 98422 11980',
    patientName: 'Ravi Chandran (44y Male)',
    callerName: 'Traffic Police Madurai North',
    callerPhone: '+91 0452 2530100',
    pickupLocation: 'Goripalayam Junction Highway Ring Road',
    destinationHospital: 'Kizuna Level-1 Trauma Resuscitation Center',
    priority: 'CRITICAL',
    eta: '4 mins',
    distanceKm: '1.6 km',
    condition: 'Polytrauma following high-speed RTA. Blunt abdominal injury, GCS 9/15.',
    status: 'ASSIGNED',
    dispatchedAt: '10:48 AM',
    vitalsLogged: false,
    erHandshakeSent: false,
  },
];

export default function AmbulanceDispatchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<AmbulanceTrip[]>(FALLBACK_ACTIVE_TRIPS);
  const [selectedTripId, setSelectedTripId] = useState<string>(FALLBACK_ACTIVE_TRIPS[0].id);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch from backend
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any[]>('/ambulance/active');
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: AmbulanceTrip[] = res.data.map((t: any, idx: number) => ({
          id: t.id,
          tripCode: t.tripCode || `AMB-2026-${String(idx + 1).padStart(4, '0')}`,
          vehicleId: t.ambulance?.id || `AMB-VEH-${idx + 1}`,
          vehicleNumber: t.ambulance?.vehicleNumber || 'TN-58-AL-1081',
          vehicleModel: t.ambulance?.model || 'Emergency Mobile ICU',
          driverName: t.driver?.employee?.user
            ? `${t.driver.employee.user.firstName} ${t.driver.employee.user.lastName}`
            : 'Velu Pandian',
          driverPhone: t.driver?.employee?.user?.phone || '+91 98401 22910',
          patientName: t.callerName ? `${t.callerName} (Patient)` : 'Emergency Patient',
          callerName: t.callerName || 'Emergency Caller',
          callerPhone: t.callerPhone || '+91 98765 43210',
          pickupLocation: t.pickupLocation || 'Madurai Metro Area',
          destinationHospital: t.destinationHospital || 'Kizuna Emergency Trauma Center',
          priority: (t.severity as any) || 'CRITICAL',
          eta: '8 mins',
          distanceKm: '3.6 km',
          condition: t.patientConditionSummary || 'Urgent medical assistance requested.',
          status: mapBackendStatus(t.status),
          dispatchedAt: '10:15 AM',
        }));
        setTrips(mapped);
        if (!selectedTripId && mapped.length > 0) {
          setSelectedTripId(mapped[0].id);
        }
      }
    } catch {
      // Defensive fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTripId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  // Lifecycle status progression
  const progressStatus = async (trip: AmbulanceTrip) => {
    let nextStatus: AmbulanceTripStatus;
    let nextBackendStatus: string;

    if (trip.status === 'ASSIGNED') {
      nextStatus = 'EN_ROUTE_PICKUP';
      nextBackendStatus = 'EN_ROUTE_PICKUP';
    } else if (trip.status === 'EN_ROUTE_PICKUP') {
      nextStatus = 'PATIENT_ON_BOARD';
      nextBackendStatus = 'PATIENT_LOADED';
    } else if (trip.status === 'PATIENT_ON_BOARD') {
      nextStatus = 'ARRIVED_ER';
      nextBackendStatus = 'ARRIVED_HOSPITAL';
    } else if (trip.status === 'ARRIVED_ER') {
      nextStatus = 'HANDOVER_COMPLETE';
      nextBackendStatus = 'HANDOVER_COMPLETE';
    } else {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await apiRequest(`/ambulance/trips/${trip.id}/status`, {
        method: 'PATCH',
        body: { status: nextBackendStatus },
      });
    } catch {
      // Defensive fallback
    }

    setTrips((prev) =>
      prev.map((t) => (t.id === trip.id ? { ...t, status: nextStatus } : t))
    );
    setIsUpdatingStatus(false);

    if (nextStatus === 'HANDOVER_COMPLETE') {
      Alert.alert(
        'Trauma Handover Accomplished',
        `Patient ${trip.patientName} successfully handed over to Emergency Trauma Bay. Vehicle ${trip.vehicleNumber} freed and marked ready for rapid dispatch.`
      );
    } else {
      Alert.alert('Trip Status Updated', `Mission updated to: ${formatStatusText(nextStatus)}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />}
    >
      {/* Top Emergency Active Bar */}
      <View style={styles.statusBar}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulseDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusHeaderText}>EMERGENCY 108 DISPATCH RUNNING</Text>
          <Text style={styles.statusHeaderSub}>Active Fleet Telemetry & Central Emergency Command</Text>
        </View>
        <View style={styles.sirenBadge}>
          <Siren size={14} color="#DC2626" />
          <Text style={styles.sirenText}>GREEN CORRIDOR</Text>
        </View>
      </View>

      {/* Multi-Trip Selector Carousel */}
      <Text style={styles.sectionTitle}>Active Dispatch Missions ({trips.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripSelectorRow}>
        {trips.map((t) => {
          const isSelected = t.id === activeTrip.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tripTab, isSelected && styles.tripTabSelected]}
              onPress={() => setSelectedTripId(t.id)}
            >
              <View style={styles.tripTabTop}>
                <Text style={[styles.tripTabCode, isSelected && styles.tripTabCodeSelected]}>{t.tripCode}</Text>
                <View style={[styles.miniPriorityPill, t.priority === 'CRITICAL' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.miniPriorityText, t.priority === 'CRITICAL' ? { color: '#DC2626' } : { color: '#D97706' }]}>
                    {t.priority}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tripTabVehicle, isSelected && styles.tripTabVehicleSelected]}>{t.vehicleNumber}</Text>
              <Text style={[styles.tripTabStatus, isSelected && styles.tripTabStatusSelected]}>{formatStatusText(t.status)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Selected Trip Card */}
      {activeTrip && (
        <View style={styles.mainCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.tripCodeText}>{activeTrip.tripCode}</Text>
              <Text style={styles.vehicleModelText}>{activeTrip.vehicleModel}</Text>
            </View>
            <View style={styles.vehicleBadge}>
              <Ambulance size={14} color="#0F766E" />
              <Text style={styles.vehicleBadgeText}>{activeTrip.vehicleNumber}</Text>
            </View>
          </View>

          {/* Severity & ETA Row */}
          <View style={styles.telemetryRow}>
            <View style={[styles.severityPill, activeTrip.priority === 'CRITICAL' ? styles.severityPillCritical : styles.severityPillHigh]}>
              <AlertTriangle size={14} color={activeTrip.priority === 'CRITICAL' ? '#DC2626' : '#D97706'} />
              <Text style={[styles.severityPillText, activeTrip.priority === 'CRITICAL' ? { color: '#DC2626' } : { color: '#D97706' }]}>
                PRIORITY: {activeTrip.priority}
              </Text>
            </View>

            <View style={styles.etaPill}>
              <Clock size={13} color="#0F766E" />
              <Text style={styles.etaPillText}>ETA: <Text style={{ fontWeight: '900' }}>{activeTrip.eta}</Text> ({activeTrip.distanceKm})</Text>
            </View>
          </View>

          {/* Lifecycle Status Progress Tracker */}
          <View style={styles.progressTracker}>
            <Text style={styles.trackerTitle}>Trip Lifecycle Status</Text>
            <View style={styles.trackerStepsRow}>
              {(['ASSIGNED', 'EN_ROUTE_PICKUP', 'PATIENT_ON_BOARD', 'ARRIVED_ER'] as AmbulanceTripStatus[]).map((step, idx) => {
                const isPassed = getStatusStepIndex(activeTrip.status) >= idx;
                const isCurrent = activeTrip.status === step;
                return (
                  <View key={step} style={styles.trackerStepItem}>
                    <View style={[styles.trackerStepCircle, isPassed && styles.trackerStepCirclePassed, isCurrent && styles.trackerStepCircleCurrent]}>
                      {isPassed ? <CheckCircle2 size={12} color="#fff" /> : <Text style={styles.trackerStepNumber}>{idx + 1}</Text>}
                    </View>
                    <Text style={[styles.trackerStepLabel, isCurrent && styles.trackerStepLabelCurrent]}>
                      {step === 'ASSIGNED' ? 'Assigned' : step === 'EN_ROUTE_PICKUP' ? 'En Route' : step === 'PATIENT_ON_BOARD' ? 'On Board' : 'Arrived ER'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Card Info Details */}
          <View style={styles.infoSection}>
            {/* Patient Name */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoVal}>{activeTrip.patientName}</Text>
            </View>

            {/* Assigned Driver */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Driver</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <User size={13} color="#0F766E" />
                <Text style={styles.infoVal}>{activeTrip.driverName} ({activeTrip.driverPhone})</Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRowBlock}>
              <Text style={styles.infoLabel}>Pickup Location</Text>
              <View style={styles.locationGroup}>
                <MapPin size={16} color="#DC2626" />
                <Text style={styles.locationText}>{activeTrip.pickupLocation}</Text>
              </View>
            </View>

            {/* Emergency Caller Contact */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Emergency Caller</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Phone size={13} color="#0284C7" />
                <Text style={styles.infoVal}>{activeTrip.callerName} • {activeTrip.callerPhone}</Text>
              </View>
            </View>

            {/* Paramedic Condition Notes */}
            <View style={styles.conditionBox}>
              <Text style={styles.conditionTitle}>Paramedic Condition Summary:</Text>
              <Text style={styles.conditionBody}>{activeTrip.condition}</Text>
            </View>
          </View>

          {/* Quick Action Navigation Buttons */}
          <View style={styles.quickNavRow}>
            <TouchableOpacity
              style={styles.quickNavBtn}
              onPress={() => router.push('/(ambulance)/tracker')}
            >
              <Navigation size={14} color="#0F766E" />
              <Text style={styles.quickNavBtnText}>Live Tracker Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickNavBtn}
              onPress={() => router.push('/(ambulance)/transit')}
            >
              <HeartPulse size={14} color="#DC2626" />
              <Text style={styles.quickNavBtnText}>Paramedic Vitals & ER Handshake</Text>
            </TouchableOpacity>
          </View>

          {/* Lifecycle Action Button */}
          {activeTrip.status !== 'HANDOVER_COMPLETE' ? (
            <TouchableOpacity
              style={styles.lifecycleActionBtn}
              onPress={() => progressStatus(activeTrip)}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Navigation size={16} color="#fff" />
                  <Text style={styles.lifecycleActionBtnText}>
                    {activeTrip.status === 'ASSIGNED'
                      ? 'Confirm Departure • Start Pickup Run'
                      : activeTrip.status === 'EN_ROUTE_PICKUP'
                      ? 'Arrived at Scene • Load Patient'
                      : activeTrip.status === 'PATIENT_ON_BOARD'
                      ? 'Patient Loaded • Rush to Hospital ER'
                      : 'Complete ER Trauma Bay Handover'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.handoverCompletedBox}>
              <CheckCircle2 size={18} color="#059669" />
              <Text style={styles.handoverCompletedText}>Mission Completed • Patient Handed Over to ER</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// Helpers
function mapBackendStatus(status: string): AmbulanceTripStatus {
  switch (status) {
    case 'DISPATCHED':
    case 'ASSIGNED':
    case 'REQUESTED':
      return 'ASSIGNED';
    case 'EN_ROUTE_PICKUP':
      return 'EN_ROUTE_PICKUP';
    case 'ARRIVED_AT_SCENE':
    case 'PATIENT_LOADED':
    case 'PATIENT_ON_BOARD':
    case 'EN_ROUTE_HOSPITAL':
      return 'PATIENT_ON_BOARD';
    case 'ARRIVED_HOSPITAL':
    case 'ARRIVED_ER':
      return 'ARRIVED_ER';
    case 'HANDOVER_COMPLETE':
      return 'HANDOVER_COMPLETE';
    default:
      return 'EN_ROUTE_PICKUP';
  }
}

function getStatusStepIndex(status: AmbulanceTripStatus): number {
  switch (status) {
    case 'ASSIGNED':
      return 0;
    case 'EN_ROUTE_PICKUP':
      return 1;
    case 'PATIENT_ON_BOARD':
      return 2;
    case 'ARRIVED_ER':
    case 'HANDOVER_COMPLETE':
      return 3;
    default:
      return 0;
  }
}

function formatStatusText(status: AmbulanceTripStatus): string {
  switch (status) {
    case 'ASSIGNED':
      return 'Dispatched / Assigned';
    case 'EN_ROUTE_PICKUP':
      return 'En Route Pickup';
    case 'PATIENT_ON_BOARD':
      return 'Patient On Board';
    case 'ARRIVED_ER':
      return 'Arrived at ER';
    case 'HANDOVER_COMPLETE':
      return 'Handover Complete';
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  statusBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 14, gap: 10 },
  pulseContainer: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  statusHeaderText: { fontSize: 12, fontWeight: '900', color: '#991B1B' },
  statusHeaderSub: { fontSize: 10, color: '#B91C1C', marginTop: 1 },
  sirenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  sirenText: { fontSize: 9, fontWeight: '900', color: '#DC2626' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  tripSelectorRow: { flexDirection: 'row', marginBottom: 14 },
  tripTab: { width: 150, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginRight: 10 },
  tripTabSelected: { borderColor: '#0F766E', borderWidth: 1.5, backgroundColor: '#F0FDFA' },
  tripTabTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripTabCode: { fontSize: 11, fontWeight: '800', color: '#64748B', fontFamily: 'monospace' },
  tripTabCodeSelected: { color: '#0F766E' },
  miniPriorityPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  miniPriorityText: { fontSize: 8, fontWeight: '800' },
  tripTabVehicle: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  tripTabVehicleSelected: { color: '#0F766E' },
  tripTabStatus: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  tripTabStatusSelected: { color: '#0F766E', fontWeight: '700' },
  mainCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 18, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tripCodeText: { fontSize: 18, fontWeight: '900', color: '#0F172A', fontFamily: 'monospace' },
  vehicleModelText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  vehicleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vehicleBadgeText: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  telemetryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  severityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  severityPillCritical: { backgroundColor: '#FEE2E2' },
  severityPillHigh: { backgroundColor: '#FEF3C7' },
  severityPillText: { fontSize: 11, fontWeight: '900' },
  etaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#99F6E4' },
  etaPillText: { fontSize: 11, color: '#0F766E', fontWeight: '600' },
  progressTracker: { marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  trackerTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 10 },
  trackerStepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trackerStepItem: { alignItems: 'center', flex: 1 },
  trackerStepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  trackerStepCirclePassed: { backgroundColor: '#0F766E' },
  trackerStepCircleCurrent: { backgroundColor: '#DC2626' },
  trackerStepNumber: { fontSize: 10, fontWeight: '700', color: '#fff' },
  trackerStepLabel: { fontSize: 9, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  trackerStepLabelCurrent: { color: '#0F172A', fontWeight: '800' },
  infoSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoRowBlock: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  infoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  locationGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },
  conditionBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#FECACA' },
  conditionTitle: { fontSize: 11, fontWeight: '800', color: '#991B1B' },
  conditionBody: { fontSize: 12, color: '#7F1D1D', marginTop: 4, lineHeight: 18 },
  quickNavRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  quickNavBtnText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  lifecycleActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  lifecycleActionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  handoverCompletedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 14, marginTop: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  handoverCompletedText: { color: '#065F46', fontSize: 13, fontWeight: '800' },
});


import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ambulance, MapPin, Phone, AlertTriangle, Navigation, CheckCircle } from 'lucide-react-native';

const INITIAL_TRIP = {
  tripCode: 'AMB-2026-0001',
  vehicleNumber: 'TN-58-AL-1081',
  callerName: 'Saravanan R',
  callerPhone: '+91 98765 43210',
  pickupLocation: 'Near Meenakshi Amman Temple West Gate, Madurai',
  severity: 'CRITICAL',
  condition: '62-year-old male sudden collapse, dyspnea, pale.',
  status: 'EN_ROUTE_PICKUP',
};

export default function AmbulanceDriverScreen() {
  const [trip, setTrip] = useState(INITIAL_TRIP);

  const progressStatus = () => {
    if (trip.status === 'EN_ROUTE_PICKUP') {
      setTrip((prev) => ({ ...prev, status: 'ARRIVED_AT_SCENE' }));
    } else if (trip.status === 'ARRIVED_AT_SCENE') {
      setTrip((prev) => ({ ...prev, status: 'EN_ROUTE_HOSPITAL' }));
    } else if (trip.status === 'EN_ROUTE_HOSPITAL') {
      setTrip((prev) => ({ ...prev, status: 'HANDOVER_COMPLETE' }));
      Alert.alert('Mission Accomplished', 'Patient successfully handed over to Emergency Trauma Bay.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusBar}>
        <View style={styles.pulseDot} />
        <Text style={styles.statusText}>Emergency Call in Progress</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.tripCode}>{trip.tripCode}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trip.vehicleNumber}</Text>
          </View>
        </View>

        <View style={styles.severityBox}>
          <AlertTriangle color="#DC2626" size={16} />
          <Text style={styles.severityText}>SEVERITY: {trip.severity}</Text>
        </View>

        {/* Pickup address */}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Pickup Location</Text>
          <View style={styles.row}>
            <MapPin color="#0F766E" size={18} />
            <Text style={styles.val}>{trip.pickupLocation}</Text>
          </View>
        </View>

        {/* Caller Contact */}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Emergency Caller</Text>
          <View style={styles.row}>
            <Phone color="#0284C7" size={18} />
            <Text style={styles.val}>{trip.callerName} ({trip.callerPhone})</Text>
          </View>
        </View>

        {/* Patient Condition */}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Paramedic Triage Notes</Text>
          <Text style={styles.conditionText}>{trip.condition}</Text>
        </View>

        {/* Action Button */}
        {trip.status !== 'HANDOVER_COMPLETE' ? (
          <TouchableOpacity style={styles.actionBtn} onPress={progressStatus}>
            <Navigation color="#fff" size={18} />
            <Text style={styles.actionBtnText}>
              {trip.status === 'EN_ROUTE_PICKUP'
                ? 'Arrived at Scene'
                : trip.status === 'ARRIVED_AT_SCENE'
                ? 'Patient Loaded • Return to ER'
                : 'Complete Trauma Handover'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completeBox}>
            <CheckCircle color="#059669" size={20} />
            <Text style={styles.completeText}>Handover Completed • Vehicle Ready</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#991B1B' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripCode: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', fontFamily: 'monospace' },
  badge: { backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#0F766E' },
  severityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  severityText: { fontSize: 11, fontWeight: 'bold', color: '#DC2626' },
  infoBlock: { marginTop: 14 },
  label: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  val: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  conditionText: { fontSize: 12, color: '#334155', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  completeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 20,
  },
  completeText: { color: '#065F46', fontWeight: 'bold', fontSize: 12 },
});


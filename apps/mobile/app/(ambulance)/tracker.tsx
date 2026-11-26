import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Navigation,
  MapPin,
  Ambulance,
  Compass,
  Gauge,
  Clock,
  ShieldCheck,
  Siren,
  Play,
  Pause,
  RotateCcw,
  HeartPulse,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';

interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  passed: boolean;
  isDestination?: boolean;
}

const INITIAL_WAYPOINTS: RouteWaypoint[] = [
  { name: 'Pickup: Meenakshi West Gate', lat: 9.9195, lng: 78.1194, passed: true },
  { name: 'Simmakkal Junction Corridor', lat: 9.9248, lng: 78.1215, passed: true },
  { name: 'Goripalayam Vaigai Bridge', lat: 9.9325, lng: 78.1310, passed: false },
  { name: 'Anna Bus Stand Overpass', lat: 9.9388, lng: 78.1385, passed: false },
  { name: 'ER Trauma Center, Bay 1', lat: 9.9460, lng: 78.1450, passed: false, isDestination: true },
];

export default function AmbulanceTrackerScreen() {
  const router = useRouter();

  // Simulation State
  const [simulationStep, setSimulationStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sirenActive, setSirenActive] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(380); // ~6 mins 20s
  const [currentSpeed, setCurrentSpeed] = useState(58);

  const totalSteps = INITIAL_WAYPOINTS.length - 1;

  // Real-time Countdown timer simulation
  useEffect(() => {
    if (!isPlaying || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
      // subtle speed variation
      setCurrentSpeed(Math.floor(52 + Math.random() * 14));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, secondsRemaining]);

  const advanceStep = () => {
    if (simulationStep < totalSteps) {
      setSimulationStep((prev) => prev + 1);
      setSecondsRemaining((prev) => Math.max(30, prev - 90));
    } else {
      Alert.alert('Arrived at Destination', 'Ambulance has reached Kizuna Hospital Emergency Trauma Bay.');
    }
  };

  const resetSimulation = () => {
    setSimulationStep(0);
    setSecondsRemaining(450);
    setCurrentSpeed(55);
  };

  // Interpolated metrics based on current step
  const progressRatio = simulationStep / totalSteps;
  const currentWaypoint = INITIAL_WAYPOINTS[simulationStep];
  const distanceRemainingKm = ((1 - progressRatio) * 4.2).toFixed(1);

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBox}>
            <Navigation size={22} color="#38845A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Live Vehicle Route Tracker</Text>
            <Text style={styles.subtitle}>GPS Telemetry & Hospital Emergency Navigation</Text>
          </View>
          <TouchableOpacity
            style={[styles.sirenToggleBtn, sirenActive ? styles.sirenActive : styles.sirenInactive]}
            onPress={() => setSirenActive(!sirenActive)}
          >
            <Siren size={14} color={sirenActive ? '#fff' : '#64748B'} />
            <Text style={[styles.sirenToggleText, sirenActive ? { color: '#fff' } : { color: '#64748B' }]}>
              {sirenActive ? 'SIREN ON' : 'SIREN OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Telemetry KPI Cards */}
        <View style={styles.telemetryGrid}>
          <View style={styles.telemetryKpi}>
            <Clock size={16} color="#38845A" />
            <Text style={styles.kpiValue}>{formatMinSec(secondsRemaining)}</Text>
            <Text style={styles.kpiLabel}>ETA COUNTDOWN</Text>
          </View>

          <View style={styles.telemetryKpi}>
            <MapPin size={16} color="#DC2626" />
            <Text style={styles.kpiValue}>{distanceRemainingKm} km</Text>
            <Text style={styles.kpiLabel}>DIST TO HOSPITAL</Text>
          </View>

          <View style={styles.telemetryKpi}>
            <Gauge size={16} color="#0284C7" />
            <Text style={styles.kpiValue}>{currentSpeed} km/h</Text>
            <Text style={styles.kpiLabel}>CURRENT SPEED</Text>
          </View>
        </View>
      </View>

      {/* Live Visual Route Canvas Simulation */}
      <View style={styles.mapCanvasCard}>
        <View style={styles.mapCanvasHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Radio size={16} color="#38845A" />
            <Text style={styles.gpsCoordText}>
              GPS: {currentWaypoint.lat.toFixed(4)}° N, {currentWaypoint.lng.toFixed(4)}° E • Alt 138m
            </Text>
          </View>
          <View style={styles.greenCorridorPill}>
            <ShieldCheck size={12} color="#38845A" />
            <Text style={styles.greenCorridorText}>Smart Corridor Active</Text>
          </View>
        </View>

        {/* Schematic Route Track Visualizer */}
        <View style={styles.routeDiagram}>
          {INITIAL_WAYPOINTS.map((wp, idx) => {
            const isCompleted = idx <= simulationStep;
            const isVehicleHere = idx === simulationStep;

            return (
              <View key={wp.name} style={styles.waypointRow}>
                {/* Node icon & connection line */}
                <View style={styles.nodeColumn}>
                  <View style={[styles.nodeDot, isCompleted && styles.nodeDotCompleted, isVehicleHere && styles.nodeDotActive]}>
                    {isVehicleHere ? (
                      <Ambulance size={14} color="#fff" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={12} color="#fff" />
                    ) : (
                      <View style={styles.innerDot} />
                    )}
                  </View>
                  {idx < INITIAL_WAYPOINTS.length - 1 && (
                    <View style={[styles.connectingLine, idx < simulationStep && styles.connectingLineCompleted]} />
                  )}
                </View>

                {/* Waypoint details */}
                <View style={[styles.waypointContent, isVehicleHere && styles.waypointContentActive]}>
                  <View style={styles.waypointHeader}>
                    <Text style={[styles.waypointName, isVehicleHere && styles.waypointNameActive]}>{wp.name}</Text>
                    {isVehicleHere && (
                      <View style={styles.currentVehicleTag}>
                        <Text style={styles.currentVehicleTagText}>CURRENT AMBULANCE LOCATION</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.waypointCoords}>
                    Lat: {wp.lat.toFixed(4)} • Lng: {wp.lng.toFixed(4)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Vehicle Telemetry Details */}
        <View style={styles.vehicleDetailsStrip}>
          <View style={styles.vehicleCol}>
            <Text style={styles.vehicleDetailLabel}>Vehicle Code</Text>
            <Text style={styles.vehicleDetailVal}>TN-58-AL-1081</Text>
          </View>
          <View style={styles.vehicleCol}>
            <Text style={styles.vehicleDetailLabel}>Vehicle Type</Text>
            <Text style={styles.vehicleDetailVal}>Cardiac ALS ICU</Text>
          </View>
          <View style={styles.vehicleCol}>
            <Text style={styles.vehicleDetailLabel}>Assigned Driver</Text>
            <Text style={styles.vehicleDetailVal}>Velu Pandian</Text>
          </View>
        </View>

        {/* Simulation Controls */}
        <View style={styles.simulationControlRow}>
          <TouchableOpacity
            style={styles.simControlBtn}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={14} color="#0F172A" /> : <Play size={14} color="#0F172A" />}
            <Text style={styles.simControlBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simControlBtn, styles.advanceBtn]}
            onPress={advanceStep}
          >
            <Navigation size={14} color="#fff" />
            <Text style={[styles.simControlBtnText, { color: '#fff' }]}>Advance GPS Step</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simControlBtn}
            onPress={resetSimulation}
          >
            <RotateCcw size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Transit Action Bar */}
      <View style={styles.bottomCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={18} color="#DC2626" />
          <Text style={styles.bottomCardTitle}>Incoming Trauma Protocol</Text>
        </View>
        <Text style={styles.bottomCardSub}>
          Log patient vital signs in real-time or trigger the 1-Tap Casualty / ER Red-Flag Handshake to prepare the resuscitation team before ambulance arrival.
        </Text>

        <TouchableOpacity
          style={styles.goToTransitBtn}
          onPress={() => router.push('/(ambulance)/transit')}
        >
          <HeartPulse size={16} color="#fff" />
          <Text style={styles.goToTransitBtnText}>Open Pre-Hospital Vitals & ER Handshake</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  header: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EAF5ED', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B' },
  sirenToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sirenActive: { backgroundColor: '#DC2626' },
  sirenInactive: { backgroundColor: '#F1F5F9' },
  sirenToggleText: { fontSize: 10, fontWeight: '800' },
  telemetryGrid: { flexDirection: 'row', gap: 10 },
  telemetryKpi: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, alignItems: 'center' },
  kpiValue: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  kpiLabel: { fontSize: 8, fontWeight: '800', color: '#64748B', marginTop: 2 },
  mapCanvasCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 },
  mapCanvasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10, marginBottom: 14 },
  gpsCoordText: { fontSize: 11, fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' },
  greenCorridorPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  greenCorridorText: { fontSize: 10, color: '#065F46', fontWeight: '700' },
  routeDiagram: { marginVertical: 8 },
  waypointRow: { flexDirection: 'row', gap: 12 },
  nodeColumn: { alignItems: 'center', width: 26 },
  nodeDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  nodeDotCompleted: { backgroundColor: '#38845A' },
  nodeDotActive: { backgroundColor: '#DC2626', borderWidth: 3, borderColor: '#CDE8D5' },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' },
  connectingLine: { width: 3, height: 38, backgroundColor: '#E2E8F0', marginVertical: 2 },
  connectingLineCompleted: { backgroundColor: '#38845A' },
  waypointContent: { flex: 1, paddingBottom: 20 },
  waypointContentActive: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginBottom: 12 },
  waypointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waypointName: { fontSize: 13, fontWeight: '700', color: '#334155' },
  waypointNameActive: { color: '#991B1B', fontWeight: '800' },
  waypointCoords: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontFamily: 'monospace' },
  currentVehicleTag: { backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  currentVehicleTagText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  vehicleDetailsStrip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 4 },
  vehicleCol: { flex: 1 },
  vehicleDetailLabel: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  vehicleDetailVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  simulationControlRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  simControlBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  advanceBtn: { flex: 1, backgroundColor: '#38845A', borderColor: '#38845A' },
  simControlBtnText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  bottomCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 20 },
  bottomCardTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  bottomCardSub: { fontSize: 11, color: '#64748B', lineHeight: 16, marginBottom: 12 },
  goToTransitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 10 },
  goToTransitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

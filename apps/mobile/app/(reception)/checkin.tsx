import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Ticket,
  Stethoscope,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';

export default function ReceptionCheckInScreen() {
  const router = useRouter();
  const [searchKey, setSearchKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [foundAppointment, setFoundAppointment] = useState<any | null>(null);
  const [checkedInResult, setCheckedInResult] = useState<any | null>(null);

  const handleLookup = async () => {
    const term = searchKey.trim().toUpperCase();
    if (!term) {
      Alert.alert('Search required', 'Enter a patient UHID, phone, or appointment number.');
      return;
    }
    setLoading(true);
    setFoundAppointment(null);
    setCheckedInResult(null);
    try {
      const rows = (await mobileApiClient.reception.getTodayQueue()).data ?? [];
      const matches = rows.filter((row: any) => [row.appointmentNumber, row.patient.uhid, row.patient.phone]
        .some((value) => value?.toUpperCase() === term));
      if (matches.length !== 1) {
        Alert.alert(matches.length ? 'Multiple appointments found' : 'Appointment not found',
          matches.length ? 'Search again with the appointment number.' : 'Check the details for today’s appointment.');
        return;
      }
      const row = matches[0];
      const clinician = row.doctor.employee.user;
      setFoundAppointment({ ...row, appointmentDate: row.appointmentDate.slice(0, 10),
        doctor: { name: clinician.firstName + ' ' + clinician.lastName, specialty: row.doctor.specialization } });
    } catch {
      Alert.alert('Could not load appointments', 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!foundAppointment) return;
    setCheckingIn(true);
    try {
      const saved = (await mobileApiClient.reception.checkInAppointment(foundAppointment.id)).data;
      if (saved?.status !== 'CHECKED_IN') throw new Error('The API did not confirm check-in.');
      setCheckedInResult({ tokenNumber: saved.tokenNumber, doctorName: foundAppointment.doctor.name });
      setFoundAppointment({ ...foundAppointment, status: saved.status });
    } catch (error) {
      Alert.alert('Check-in failed', error instanceof Error ? error.message : 'Refresh and try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Banner */}
      <View style={styles.banner}>
        <UserCheck size={20} color="#1565C0" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.bannerTitle}>Patient Arrival & OPD Check-In</Text>
          <Text style={styles.bannerSub}>Verify appointment, confirm physical arrival, and issue token</Text>
        </View>
      </View>

      {/* Lookup Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find Today's Appointment</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter UHID, Mobile, or Name..."
            placeholderTextColor="#94A3B8"
            value={searchKey}
            onChangeText={setSearchKey}
            onSubmitEditing={handleLookup}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={handleLookup} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.lookupBtnText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Checked In Token Slip */}
      {checkedInResult && (
        <View style={styles.tokenSlipCard}>
          <View style={styles.slipTop}>
            <CheckCircle2 size={24} color="#1565C0" />
            <Text style={styles.slipTitle}>Official OPD Consultation Token</Text>
          </View>

          <View style={styles.tokenNumberBox}>
            <Text style={styles.tokenCodeLabel}>QUEUE TOKEN</Text>
            <Text style={styles.tokenCodeText}>{checkedInResult.tokenNumber}</Text>
          </View>

          <View style={styles.directionBox}>
            <Building2 size={16} color="#1565C0" />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.directionDoc}>{checkedInResult.doctorName}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Appointment Verification Card */}
      {foundAppointment && (
        <View style={styles.card}>
          <View style={styles.aptHeader}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{foundAppointment.status}</Text>
            </View>
            <Text style={styles.aptDate}>{foundAppointment.appointmentDate} • {foundAppointment.appointmentTime}</Text>
          </View>

          <Text style={styles.patientName}>
            {foundAppointment.patient.firstName} {foundAppointment.patient.lastName}
          </Text>
          <Text style={styles.patientSub}>
            UHID: {foundAppointment.patient.uhid} • Phone: {foundAppointment.patient.phone}
          </Text>

          <View style={styles.docDivider} />

          <View style={styles.docInfoRow}>
            <Stethoscope size={18} color="#1565C0" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.docName}>{foundAppointment.doctor.name}</Text>
              <Text style={styles.docSpecialty}>{foundAppointment.doctor.specialty}</Text>
            </View>
          </View>

          {foundAppointment.status === 'SCHEDULED' ? (
            <TouchableOpacity
              style={styles.confirmCheckInBtn}
              onPress={handleConfirmCheckIn}
              disabled={checkingIn}
            >
              {checkingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.confirmCheckInText}>Confirm Patient Arrival & Issue Token</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.alreadyCheckedInBox}>
              <CheckCircle2 size={16} color="#1565C0" />
              <Text style={styles.alreadyCheckedInText}>Patient already checked in and in active queue</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F1FC', padding: 14, borderRadius: 12, marginBottom: 12 },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#1565C0' },
  bannerSub: { fontSize: 11, color: '#0D47A1', marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#183153', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  lookupBtn: { backgroundColor: '#1565C0', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  lookupBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  tokenSlipCard: { backgroundColor: '#DCFCE7', borderWidth: 1.5, borderColor: '#BBF7D0', borderRadius: 14, padding: 16, marginBottom: 12 },
  slipTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  slipTitle: { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  tokenNumberBox: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', padding: 16, alignItems: 'center', marginBottom: 12 },
  tokenCodeLabel: { fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 },
  tokenCodeText: { fontSize: 32, fontWeight: '900', color: '#183153', marginTop: 2 },
  queueEstimateText: { fontSize: 12, color: '#00897B', fontWeight: '700', marginTop: 4 },
  directionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F1FC', padding: 10, borderRadius: 8 },
  directionDoc: { fontSize: 12, fontWeight: '800', color: '#1565C0' },
  directionRoom: { fontSize: 11, color: '#0D47A1', marginTop: 1 },
  aptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgePill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePillText: { fontSize: 10, fontWeight: '800', color: '#F59E0B' },
  aptDate: { fontSize: 11, color: '#64748B' },
  patientName: { fontSize: 16, fontWeight: '800', color: '#183153' },
  patientSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  docDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  docInfoRow: { flexDirection: 'row', alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: '800', color: '#183153' },
  docSpecialty: { fontSize: 11, color: '#475569', marginTop: 1 },
  docRoom: { fontSize: 11, color: '#1565C0', fontWeight: '700', marginTop: 2 },
  confirmCheckInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1565C0', paddingVertical: 14, borderRadius: 10, marginTop: 16, gap: 8 },
  confirmCheckInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  alreadyCheckedInBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2F1', padding: 12, borderRadius: 8, marginTop: 14, gap: 6 },
  alreadyCheckedInText: { fontSize: 12, fontWeight: '700', color: '#183153' },
});


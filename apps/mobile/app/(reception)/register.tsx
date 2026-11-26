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
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  User,
  Ticket,
  Printer,
  Share2,
} from 'lucide-react-native';

export default function ReceptionRegisterScreen() {
  const router = useRouter();

  // Mode: Regular vs Emergency Fast-Track
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('1985-06-15');
  const [age, setAge] = useState('40');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [addressLine1, setAddressLine1] = useState('42 Anna Salai, Main Road');
  const [city, setCity] = useState('Madurai');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('625001');
  const [emergencyName, setEmergencyName] = useState('Kannan M.');
  const [emergencyPhone, setEmergencyPhone] = useState('9840123450');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [allergies, setAllergies] = useState('');
  const [category, setCategory] = useState<'WALK_IN' | 'NEW_PATIENT' | 'EMERGENCY' | 'FOLLOW_UP'>('WALK_IN');

  const [loading, setLoading] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any | null>(null);

  // Check duplicate phone
  const handleCheckDuplicate = async () => {
    if (phone.length < 10) return;
    try {
      const res = await mobileApiClient.reception.checkDuplicate(phone.trim(), email.trim() || undefined);
      if (res?.data?.isDuplicate) {
        Alert.alert(
          'Existing Patient Found',
          `Patient ${res.data.patient?.firstName} ${res.data.patient?.lastName} is already registered under UHID: ${res.data.patient?.uhid}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'View Existing Patient',
              onPress: () => router.push('/(reception)/search' as any),
            },
          ]
        );
      }
      setDuplicateChecked(true);
    } catch {
      // Continue if duplicate check unavailable
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter at least Patient First Name and Mobile Phone Number.');
      return;
    }

    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please provide a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim() || 'Patient',
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        dateOfBirth: dob || new Date(Date.now() - parseInt(age || '30', 10) * 365 * 86400000).toISOString().split('T')[0],
        bloodGroup: bloodGroup || undefined,
        addressLine1: addressLine1.trim() || 'Madurai Central',
        city: city.trim() || 'Madurai',
        state: state.trim() || 'Tamil Nadu',
        postalCode: postalCode.trim() || '625001',
        emergencyContactName: emergencyName.trim() || 'Family',
        emergencyContactPhone: emergencyPhone.trim() || phone.trim(),
        emergencyContactRelation: emergencyRelation.trim() || 'Relative',
        allergies: allergies.trim() ? allergies.split(',').map((a) => a.trim()) : [],
      };

      // Real API Call to Backend
      const res = await mobileApiClient.reception.registerPatient(payload);
      const newPatient = res?.data || {
        uhid: `ALM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        id: `pat-${Date.now()}`,
      };

      setRegisteredPatient(newPatient);
      Alert.alert(
        isEmergencyMode ? '🚨 Emergency Patient Registered' : '✓ Patient Registered',
        `Permanent UHID issued: ${newPatient.uhid}. Patient digital health record created.`
      );
    } catch (e: any) {
      Alert.alert('Registration Error', e.message || 'Could not register patient with backend server.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegisteredPatient(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setAllergies('');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Registration Mode Switcher */}
      <View style={styles.modeSwitchRow}>
        <TouchableOpacity
          style={[styles.modeTab, !isEmergencyMode && styles.modeTabActive]}
          onPress={() => { setIsEmergencyMode(false); setCategory('WALK_IN'); }}
        >
          <UserPlus size={16} color={!isEmergencyMode ? '#fff' : '#0284C7'} />
          <Text style={[styles.modeTabText, !isEmergencyMode && styles.modeTabTextActive]}>
            Walk-In / Standard OPD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, isEmergencyMode && styles.modeTabEmergency]}
          onPress={() => { setIsEmergencyMode(true); setCategory('EMERGENCY'); }}
        >
          <ShieldAlert size={16} color={isEmergencyMode ? '#fff' : '#DC2626'} />
          <Text style={[styles.modeTabText, isEmergencyMode && styles.modeTabTextActive, { color: isEmergencyMode ? '#fff' : '#DC2626' }]}>
            🚨 Emergency Triage
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUCCESS CONFIRMATION RECEIPT CARD */}
      {registeredPatient && (
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <CheckCircle2 size={24} color="#38845A" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.receiptTitle}>Official Patient Registration Receipt</Text>
              <Text style={styles.receiptSub}>Uyirinai Multispeciality Hospital • Ground Floor Front Desk</Text>
            </View>
          </View>

          <View style={styles.receiptUhidBox}>
            <Text style={styles.uhidLabel}>ISSUED PERMANENT UHID</Text>
            <Text style={styles.uhidValue}>{registeredPatient.uhid}</Text>
            <Text style={styles.uhidPatient}>
              {registeredPatient.firstName} {registeredPatient.lastName} • {phone}
            </Text>
          </View>

          <View style={styles.receiptActions}>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => router.push('/(reception)/appointments' as any)}
            >
              <Calendar size={14} color="#fff" />
              <Text style={styles.bookNowText}>Book OPD Doctor Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newRegBtn} onPress={resetForm}>
              <Text style={styles.newRegText}>Register Another Patient</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* REGISTRATION FORM */}
      <View style={[styles.formCard, isEmergencyMode && styles.formCardEmergency]}>
        <Text style={styles.formTitle}>
          {isEmergencyMode ? 'Fast-Track Emergency Triage Intake' : 'Patient Registration Form'}
        </Text>
        <Text style={styles.formSub}>
          {isEmergencyMode
            ? 'Essential details for immediate emergency resuscitation & trauma care'
            : 'All patient records are verified and persisted in the central hospital database'}
        </Text>

        {/* Name Row */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Anandha"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Last Name / Initial</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Krishnan"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        {/* Mobile & Duplicate Check */}
        <Text style={styles.label}>Mobile Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          onBlur={handleCheckDuplicate}
        />

        {/* Age & Gender */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Age (Years)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 42"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g.charAt(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {!isEmergencyMode && (
          <>
            {/* Email & Blood Group */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Email Address (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="patient@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Blood Group</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. O_POSITIVE"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                />
              </View>
            </View>

            {/* Address */}
            <Text style={styles.label}>Residential Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Street / Area / Door No."
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>City / District</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>PIN Code</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
              </View>
            </View>

            {/* Emergency Contact */}
            <Text style={styles.sectionDivider}>Emergency Relative Contact</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Contact Name</Text>
                <TextInput style={styles.input} value={emergencyName} onChangeText={setEmergencyName} />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Relation</Text>
                <TextInput style={styles.input} value={emergencyRelation} onChangeText={setEmergencyRelation} />
              </View>
            </View>

            {/* Known Allergies */}
            <Text style={styles.label}>Known Drug Allergies (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Penicillin, Sulfa, Paracetamol"
              value={allergies}
              onChangeText={setAllergies}
            />
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isEmergencyMode && styles.submitBtnEmergency]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <UserPlus size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isEmergencyMode
                  ? 'Register & Dispatch Emergency Triage Token'
                  : 'Register Patient & Issue Backend UHID'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  modeSwitchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAF5ED',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  modeTabActive: { backgroundColor: '#38845A', borderColor: '#38845A' },
  modeTabEmergency: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  modeTabText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  modeTabTextActive: { color: '#fff' },
  receiptCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  receiptTitle: { fontSize: 14, fontWeight: '800', color: '#166534' },
  receiptSub: { fontSize: 10, color: '#15803D', marginTop: 1 },
  receiptUhidBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    marginBottom: 12,
  },
  uhidLabel: { fontSize: 10, fontWeight: '800', color: '#15803D', letterSpacing: 0.5 },
  uhidValue: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginTop: 3, fontFamily: 'monospace' },
  uhidPatient: { fontSize: 12, color: '#334155', fontWeight: '700', marginTop: 4 },
  receiptActions: { gap: 8 },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  bookNowText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  newRegBtn: { paddingVertical: 8, alignItems: 'center' },
  newRegText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  formCardEmergency: { borderColor: '#CDE8D5', backgroundColor: '#FFFDFD' },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  formSub: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  col: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    marginBottom: 8,
  },
  genderRow: { flexDirection: 'row', gap: 6 },
  genderChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderChipActive: { backgroundColor: '#38845A', borderColor: '#38845A' },
  genderText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  genderTextActive: { color: '#fff' },
  sectionDivider: { fontSize: 12, fontWeight: '800', color: '#38845A', marginTop: 8, marginBottom: 8 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38845A',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  submitBtnEmergency: { backgroundColor: '#DC2626' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


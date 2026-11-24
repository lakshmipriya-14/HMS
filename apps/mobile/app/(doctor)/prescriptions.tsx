import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Plus, Check, Pill, FileText } from 'lucide-react-native';

export default function DoctorPrescriptionScreen() {
  const [patientUHID, setPatientUHID] = useState('ALM-20261119-0001');
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension (I10)');
  const [medicine, setMedicine] = useState('Amlodipine 5mg');
  const [dosage, setDosage] = useState('1 Tablet');
  const [freq, setFreq] = useState('1-0-0 (Morning)');
  const [duration, setDuration] = useState('30 Days');
  const [saved, setSaved] = useState(false);

  const handleIssue = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Digital Rx Prescription Pad</Text>
        <Text style={styles.headerSub}>Instantly dispatches order to Hospital Pharmacy</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Patient UHID</Text>
        <TextInput style={styles.input} value={patientUHID} onChangeText={setPatientUHID} />

        <Text style={styles.label}>Clinical Diagnosis</Text>
        <TextInput style={styles.input} value={diagnosis} onChangeText={setDiagnosis} />

        <View style={styles.rxCard}>
          <View style={styles.rxCardHeader}>
            <Pill size={16} color="#0F766E" />
            <Text style={styles.rxCardTitle}>Prescribed Medicine Item</Text>
          </View>

          <Text style={styles.subLabel}>Drug Name & Strength</Text>
          <TextInput style={styles.input} value={medicine} onChangeText={setMedicine} />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.subLabel}>Dosage</Text>
              <TextInput style={styles.input} value={dosage} onChangeText={setDosage} />
            </View>
            <View style={styles.col}>
              <Text style={styles.subLabel}>Duration</Text>
              <TextInput style={styles.input} value={duration} onChangeText={setDuration} />
            </View>
          </View>

          <Text style={styles.subLabel}>Frequency Schedule</Text>
          <TextInput style={styles.input} value={freq} onChangeText={setFreq} />
        </View>

        {saved && (
          <View style={styles.successBox}>
            <Check size={16} color="#065F46" />
            <Text style={styles.successText}>Prescription issued to Central Pharmacy!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleIssue}>
          <FileText size={18} color="#fff" />
          <Text style={styles.submitBtnText}>Issue Electronic Prescription</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  subLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginBottom: 12 },
  rxCard: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 12, padding: 14, marginBottom: 16 },
  rxCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rxCardTitle: { fontSize: 13, fontWeight: '700', color: '#0F766E', marginLeft: 6 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8, marginBottom: 14 },
  successText: { color: '#065F46', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  submitBtn: { flexDirection: 'row', backgroundColor: '#0F766E', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});


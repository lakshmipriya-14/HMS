import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Stethoscope } from 'lucide-react-native';

const DOCTORS = [
  { id: '1', name: 'Dr. Senthil Nathan', spec: 'Interventional Cardiology', fee: '₹800', slots: '10:00 AM, 11:30 AM' },
  { id: '2', name: 'Dr. Meenakshi Sundaram', spec: 'General Medicine & Diabetology', fee: '₹500', slots: '10:30 AM, 02:00 PM' },
  { id: '3', name: 'Dr. Balamurugan S', spec: 'Consultant Radiologist', fee: '₹600', slots: '11:00 AM, 04:00 PM' },
];

export default function PatientAppointmentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Find & Book Specialist</Text>
      <Text style={styles.sub}>Choose doctor, review consultation fee, and select OPD token</Text>

      <View style={{ marginTop: 14 }}>
        {DOCTORS.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Stethoscope size={20} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.spec}>{doc.spec}</Text>
                <Text style={styles.fee}>Consultation Fee: {doc.fee}</Text>
              </View>
            </View>

            <View style={styles.slotRow}>
              <Clock size={12} color="#64748B" />
              <Text style={styles.slots}>Available: {doc.slots}</Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => alert(`Appointment request for ${doc.name} submitted!`)}
            >
              <Text style={styles.btnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  spec: { fontSize: 12, color: '#475569', marginTop: 1 },
  fee: { fontSize: 11, color: '#0F766E', fontWeight: 'bold', marginTop: 2 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  slots: { fontSize: 11, color: '#64748B' },
  btn: { backgroundColor: '#0F766E', marginTop: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});


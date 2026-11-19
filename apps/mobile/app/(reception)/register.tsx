import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { UserPlus, Check } from 'lucide-react-native';

export default function ReceptionRegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [createdUHID, setCreatedUHID] = useState('');

  const handleRegister = () => {
    if (!name) return;
    const rand = Math.floor(1000 + Math.random() * 9000);
    setCreatedUHID(`ALM-20261119-${rand}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fast Walk-In Registration</Text>
        <Text style={styles.sub}>Instant UHID & Token Generation</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Patient Full Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Anandha Krishnan" value={name} onChangeText={setName} />

        <Text style={styles.label}>Mobile Phone Number</Text>
        <TextInput style={styles.input} placeholder="e.g. 9840123456" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} placeholder="e.g. 45" keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Gender</Text>
            <TextInput style={styles.input} value={gender} onChangeText={setGender} />
          </View>
        </View>

        {createdUHID !== '' && (
          <View style={styles.uhidCard}>
            <Check size={20} color="#0284C7" />
            <View>
              <Text style={styles.uhidLabel}>Generated UHID</Text>
              <Text style={styles.uhidVal}>{createdUHID}</Text>
              <Text style={styles.tokenPill}>Allocated Token: T-{createdUHID.slice(-2)}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
          <UserPlus size={18} color="#fff" />
          <Text style={styles.submitText}>Register & Issue OPD Token</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  uhidCard: { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', padding: 16, borderRadius: 12, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 },
  uhidLabel: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  uhidVal: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  tokenPill: { backgroundColor: '#0284C7', color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#0284C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

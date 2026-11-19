import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { mobileApiClient } from '../../services/api';
import { BedDouble, HeartPulse, ShieldAlert } from 'lucide-react-native';

export default function NursePatientsScreen() {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await mobileApiClient.nursing.getAssignedPatients();
        if (res.data) setPatients(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.bedBadge}>
                <BedDouble size={14} color="#0F766E" />
                <Text style={styles.bedText}>{item.bed?.bedNumber || 'Bed Assigned'}</Text>
              </View>
              <Text style={styles.uhidText}>UHID: {item.patient?.uhid}</Text>
            </View>

            <Text style={styles.name}>
              {item.patient?.firstName} {item.patient?.lastName}
            </Text>
            <Text style={styles.diag}>Diagnosis: {item.initialDiagnosis}</Text>

            {item.patient?.allergies?.length > 0 && (
              <View style={styles.allergyRow}>
                <ShieldAlert size={12} color="#DC2626" />
                <Text style={styles.allergyText}>
                  Allergies: {item.patient.allergies.join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.vitalsRow}>
              <Text style={styles.vitalsText}>
                Latest BP: {item.vitals?.[0]?.systolicBp || 120}/{item.vitals?.[0]?.diastolicBp || 80} mmHg
              </Text>
              <Text style={styles.vitalsText}>
                Pulse: {item.vitals?.[0]?.pulseRate || 72} bpm
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  bedText: { fontSize: 11, fontWeight: 'bold', color: '#0F766E' },
  uhidText: { fontSize: 10, color: '#64748B', fontFamily: 'monospace' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  diag: { fontSize: 12, color: '#475569', marginTop: 2 },
  allergyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  allergyText: { fontSize: 11, color: '#DC2626', fontWeight: 'bold' },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vitalsText: { fontSize: 11, fontWeight: '600', color: '#0F766E' },
});

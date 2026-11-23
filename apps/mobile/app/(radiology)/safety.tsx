import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Check,
  X,
  Search,
  Scan,
  Zap,
} from 'lucide-react-native';

export interface SafetyScreeningCase {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  scanName: string;
  modality: 'CT' | 'MRI' | 'X_RAY' | 'ANGIO';
  requiresCreatinine: boolean;
  requiresPregnancy: boolean;
  requiresMriMetal: boolean;
  creatinineValue?: string;
  pregnancyStatus?: string;
  metalClearance?: boolean;
  cleared: boolean;
}

const INITIAL_SAFETY_CASES: SafetyScreeningCase[] = [
  {
    id: 'safe-1',
    uhid: 'KZN-2026-0001',
    patientName: 'Ramasamy Kuppusamy',
    age: 58,
    gender: 'Male',
    scanName: 'CT Coronary Angiogram with IV Contrast',
    modality: 'CT',
    requiresCreatinine: true,
    requiresPregnancy: false,
    requiresMriMetal: false,
    creatinineValue: 'Serum Creatinine: 0.9 mg/dL (eGFR: 88 mL/min)',
    cleared: false,
  },
  {
    id: 'safe-2',
    uhid: 'KZN-2026-0014',
    patientName: 'Deepa Thirunavukarasu',
    age: 34,
    gender: 'Female',
    scanName: 'MRI Brain & Cervical Spine (3.0T)',
    modality: 'MRI',
    requiresCreatinine: false,
    requiresPregnancy: true,
    requiresMriMetal: true,
    pregnancyStatus: 'LMP: 14 days ago (UPT Negative verified)',
    metalClearance: true,
    cleared: true,
  },
  {
    id: 'safe-3',
    uhid: 'KZN-2026-0025',
    patientName: 'Arulraj Anthony',
    age: 67,
    gender: 'Male',
    scanName: 'Abdominal CT Tri-Phase with Contrast',
    modality: 'CT',
    requiresCreatinine: true,
    requiresPregnancy: false,
    requiresMriMetal: false,
    creatinineValue: 'Serum Creatinine: 1.1 mg/dL (eGFR: 64 mL/min)',
    cleared: false,
  },
];

export default function RadiologySafetyScreen() {
  const [cases, setCases] = useState<SafetyScreeningCase[]>(INITIAL_SAFETY_CASES);
  const [search, setSearch] = useState('');

  const certifyCase = (id: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, cleared: true } : c))
    );
    Alert.alert('Patient Cleared', 'Pre-scan radiation & contrast safety verified.');
  };

  const filtered = cases.filter(
    (c) =>
      !search ||
      c.patientName.toLowerCase().includes(search.toLowerCase()) ||
      c.uhid.toLowerCase().includes(search.toLowerCase()) ||
      c.scanName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Pre-Scan Safety Clearance</Text>
            <Text style={styles.sub}>Creatinine · Pregnancy · Ferromagnetic Protocols</Text>
          </View>
          <View style={styles.badge}>
            <ShieldCheck size={14} color="#0F766E" />
            <Text style={styles.badgeText}>ALARA Compliant</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Search patient UHID or scan name..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.modalityTag}>
                <Text style={styles.modalityText}>{item.modality}</Text>
              </View>
              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.uhidText}>({item.uhid})</Text>
            </View>

            <Text style={styles.scanTitle}>{item.scanName}</Text>

            {/* Checkpoints */}
            <View style={styles.checklist}>
              {item.requiresCreatinine && (
                <View style={styles.checkItem}>
                  <View style={styles.checkIcon}>
                    <Check size={12} color="#059669" />
                  </View>
                  <Text style={styles.checkLabel}>
                    Creatinine Clearance: <Text style={styles.checkVal}>{item.creatinineValue || 'Pending Lab Sync'}</Text>
                  </Text>
                </View>
              )}

              {item.requiresPregnancy && (
                <View style={styles.checkItem}>
                  <View style={styles.checkIcon}>
                    <Check size={12} color="#059669" />
                  </View>
                  <Text style={styles.checkLabel}>
                    Pregnancy Check: <Text style={styles.checkVal}>{item.pregnancyStatus || 'LMP Screening Complete'}</Text>
                  </Text>
                </View>
              )}

              {item.requiresMriMetal && (
                <View style={styles.checkItem}>
                  <View style={styles.checkIcon}>
                    <Check size={12} color="#059669" />
                  </View>
                  <Text style={styles.checkLabel}>
                    MRI Pacemaker & Metal Questionnaire: <Text style={styles.checkVal}>{item.metalClearance ? 'Passed' : 'Pending'}</Text>
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              {item.cleared ? (
                <View style={styles.clearedPill}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.clearedText}>Safety Certified & Cleared</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.signBtn} onPress={() => certifyCase(item.id)}>
                  <Check size={14} color="#fff" />
                  <Text style={styles.signBtnText}>Certify Safety Clearance</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12, gap: 8 },
  input: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },
  scroll: { flex: 1, padding: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalityTag: { backgroundColor: '#334155', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  modalityText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  patientName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  uhidText: { fontSize: 12, color: '#64748B' },
  scanTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginTop: 8 },
  checklist: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 10, gap: 6 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 11, color: '#475569' },
  checkVal: { fontWeight: '700', color: '#0F172A' },
  actionRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'flex-end' },
  signBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  signBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  clearedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  clearedText: { color: '#059669', fontSize: 12, fontWeight: '700' },
});

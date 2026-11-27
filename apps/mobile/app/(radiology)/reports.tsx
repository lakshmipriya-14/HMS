import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../services/api';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
  Calendar,
  User,
  Share2,
} from 'lucide-react-native';

export interface ReleasedReport {
  id: string;
  orderNumber: string;
  uhid: string;
  patientName: string;
  scanName: string;
  modality: string;
  radiologistName: string;
  releasedAt: string;
  criticalAlert: boolean;
  findings: string;
  impression: string;
  imageUrl: string;
}

export default function RadiologyReportsScreen() {
  const { user } = useAuth();
  const query = useQuery<ReleasedReport[]>({
    queryKey: ['released-radiology', user?.id], enabled: !!user,
    queryFn: async () => {
      const rows = (await apiRequest<any[]>('/radiology/worklist')).data;
      return rows.filter((row) => row.status === 'REPORT_RELEASED' && row.reportReleasedAt).map((row) => ({
        id: row.id, orderNumber: row.orderNumber, uhid: row.patient.uhid,
        patientName: row.patient.firstName + ' ' + row.patient.lastName,
        scanName: row.test.name, modality: row.test.modality,
        radiologistName: row.releasedBy ? row.releasedBy.firstName + ' ' + row.releasedBy.lastName : 'Unavailable',
        releasedAt: new Date(row.reportReleasedAt).toLocaleString(), criticalAlert: row.criticalAlert,
        findings: row.findings, impression: row.impression, imageUrl: row.imageUrl,
      }));
    },
  });
  const reports = query.data ?? [];
  const [search, setSearch] = useState('');

  const filtered = reports.filter(
    (r) =>
      !search ||
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.uhid.toLowerCase().includes(search.toLowerCase()) ||
      r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.scanName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Released Diagnostic Reports</Text>
        <Text style={styles.sub}>Verified PACS Imaging Studies & Formal Sign-offs</Text>

        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.input}
            placeholder="Search report by UHID, patient name or scan..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        {query.isPending && <Text>Loading released reports…</Text>}
        {query.isError && <Text accessibilityRole="alert" onPress={() => void query.refetch()}>{query.error.message} Tap to retry.</Text>}
        {query.isSuccess && filtered.length === 0 && <Text>No matching released reports.</Text>}
        {filtered.map((rep) => (
          <View key={rep.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>{rep.orderNumber}</Text>
              </View>
              <View style={styles.modalityBadge}>
                <Text style={styles.modalityText}>{rep.modality}</Text>
              </View>
              {rep.criticalAlert && (
                <View style={styles.criticalPill}>
                  <AlertCircle size={12} color="#DC2626" />
                  <Text style={styles.criticalPillText}>Critical Alert</Text>
                </View>
              )}
            </View>

            <Text style={styles.scanTitle}>{rep.scanName}</Text>
            <Text style={styles.patientMeta}>
              Patient: <Text style={styles.boldText}>{rep.patientName}</Text> ({rep.uhid})
            </Text>

            {/* Simulated PACS Thumbnail */}
            <View style={styles.pacsPreviewBox}>
              <View style={styles.pacsBar}>
                <Eye size={14} color="#1565C0" />
                <Text style={styles.pacsBarText}>PACS DICOM Preview (Verified Series)</Text>
              </View>
            </View>

            {/* Findings */}
            <View style={styles.textBox}>
              <Text style={styles.textLabel}>Radiographic Findings:</Text>
              <Text style={styles.textContent}>{rep.findings}</Text>
            </View>

            {/* Impression */}
            <View style={[styles.impressionBox, rep.criticalAlert && styles.impressionCritical]}>
              <Text style={[styles.impressionLabel, rep.criticalAlert && styles.impressionCriticalLabel]}>
                Diagnostic Impression:
              </Text>
              <Text style={[styles.impressionContent, rep.criticalAlert && styles.impressionCriticalContent]}>
                {rep.impression}
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.signeeText}>Signed by: {rep.radiologistName}</Text>
              <Text style={styles.dateText}>{rep.releasedAt}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '800', color: '#183153' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12, gap: 8 },
  input: { flex: 1, fontSize: 13, color: '#183153', padding: 0 },
  scroll: { flex: 1, padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  idText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  modalityBadge: { backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modalityText: { fontSize: 10, fontWeight: '800', color: '#0D47A1' },
  criticalPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4, marginLeft: 'auto' },
  criticalPillText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  scanTitle: { fontSize: 15, fontWeight: '800', color: '#183153', marginTop: 8 },
  patientMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  boldText: { fontWeight: '700', color: '#183153' },
  pacsPreviewBox: { backgroundColor: '#E8F1FC', borderRadius: 8, padding: 8, marginVertical: 8, borderWidth: 1, borderColor: '#E8F1FC' },
  pacsBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pacsBarText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  textBox: { marginVertical: 4 },
  textLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  textContent: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 17 },
  impressionBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  impressionCritical: { backgroundColor: '#FEE2E2', borderColor: '#BFDBFE' },
  impressionLabel: { fontSize: 11, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase' },
  impressionCriticalLabel: { color: '#DC2626' },
  impressionContent: { fontSize: 12, color: '#183153', marginTop: 2, fontWeight: '600' },
  impressionCriticalContent: { color: '#DC2626' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  signeeText: { fontSize: 11, color: '#64748B', fontStyle: 'italic' },
  dateText: { fontSize: 11, color: '#94A3B8' },
});

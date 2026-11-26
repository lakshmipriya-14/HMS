import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiRequest } from '../../services/api';
import { UyirinaiTheme } from '../../constants/theme';
import { exportDirectoryFile } from '../../services/downloadHelper';
import { useDoctorWorkspace } from '../../hooks/useDoctorWorkspace';

type History = {
  patient: { firstName: string; lastName: string; uhid: string; gender: string; dateOfBirth: string;
    bloodGroup: string | null; allergies: string[]; medicalHistoryNotes: string | null };
  consultations: { id: string; createdAt: string; chiefComplaint: string; diagnosisNotes: string; treatmentPlan: string }[];
  prescriptions: { id: string; prescriptionNumber: string; createdAt: string; dispensingStatus: string; notes: string | null; items: {
    medicine: { brandName: string; strength: string }; dosage: string; route: string; frequency: string; durationDays: number; instructions: string;
  }[] }[];
  labs: { id: string; orderNumber: string; results: { parameter: { parameterName: string }; measuredValue: string; unit: string; isAbnormal: boolean }[] }[];
  radiology: { id: string; test: { name: string }; findings: string | null; impression: string | null }[];
  vitals: { id: string; createdAt: string; systolicBp: number | null; diastolicBp: number | null;
    pulseRate: number | null; oxygenSaturation: number | null }[];
  admissions: { id: string; admissionNumber: string; admittedAt: string; dischargedAt: string | null; dischargeSummary: string | null;
    status: string; ward: { name: string }; bed: { bedNumber: string } }[];
  followUps: { id: string; appointmentDate: string; appointmentTime: string; status: string; reasonForVisit: string }[];
};

function HistorySection({ title, rows }: { title: string; rows: {
  id: string; label: string; details: (string | null)[]; exportPdf?: () => void;
}[] }) {
  return <View style={styles.section}>
    <Text style={styles.heading}>{title}</Text>
    {rows.length === 0 && <Text style={styles.detail}>No records available in your scope.</Text>}
    {rows.map((row) => <View key={row.id} style={styles.card}>
      <Text style={styles.label}>{row.label}</Text>
      {row.details.filter(Boolean).map((value, index) => <Text key={index} style={styles.detail}>{value}</Text>)}
      {row.exportPdf && <Pressable accessibilityRole="button" style={styles.exportButton} onPress={row.exportPdf}>
        <Text style={styles.exportText}>Export prescription PDF</Text>
      </Pressable>}
    </View>)}
  </View>;
}

const date = (value: string) => value.slice(0, 10);

export default function DoctorPatientHistory() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { data: workspace } = useDoctorWorkspace();
  const [exportError, setExportError] = React.useState('');
  const history = useQuery({
    queryKey: ['doctor-patient-history', user?.id, user?.hospitalId, user?.branchId, id],
    enabled: !!id && user?.permissions.includes('PATIENTS:VIEW') === true,
    queryFn: async () => {
      const response = await apiRequest<History>(`/doctors/me/patients/${encodeURIComponent(id ?? '')}/history`);
      return response.data;
    },
  });
  const record: History | undefined = history.data;
  const exportPrescription = (row: History['prescriptions'][number]) => {
    if (!record || !workspace) return;
    setExportError('');
    const preview = typeof document !== 'undefined' ? window.open('', '_blank') : undefined;
    const doctor = workspace.profile;
    const summary = `${row.prescriptionNumber} · ${date(row.createdAt)} · ${record.patient.firstName} ${record.patient.lastName} (${record.patient.uhid}) · ${doctor.firstName} ${doctor.lastName} (${doctor.licenseNumber})`;
    void exportDirectoryFile(
      'pdf', row.prescriptionNumber, summary,
      ['Medicine', 'Strength', 'Dose', 'Route', 'Frequency', 'Days', 'Instructions', 'Prescription notes'],
      row.items.map((item) => [item.medicine.brandName, item.medicine.strength, item.dosage, item.route,
        item.frequency, item.durationDays, item.instructions, row.notes]),
      preview ?? undefined,
    ).catch((error: Error) => { preview?.close(); setExportError(error.message); });
  };
  return <ScrollView contentContainerStyle={styles.page}>
    {history.isLoading && <ActivityIndicator accessibilityLabel="Loading patient history" />}
    {!!exportError && <Text accessibilityRole="alert">{exportError}</Text>}
    {history.isError && <Pressable accessibilityRole="button" onPress={() => void history.refetch()}>
      <Text accessibilityRole="alert">{history.error.message} Tap to retry.</Text>
    </Pressable>}
    {!history.isLoading && !history.isError && !record && <Text>No patient history available.</Text>}
    {record && <>
      <View style={styles.card}>
        <Text style={styles.heading}>{record.patient.firstName} {record.patient.lastName}</Text>
        <Text style={styles.detail}>{record.patient.uhid} · {record.patient.gender} · {date(record.patient.dateOfBirth)}</Text>
        <Text style={styles.detail}>Blood group {record.patient.bloodGroup ?? 'on file unavailable'}</Text>
        <Text style={styles.detail}>Allergies: {record.patient.allergies.join(', ') || 'None recorded'}</Text>
        <Text style={styles.detail}>{record.patient.medicalHistoryNotes ?? 'No medical history note on file.'}</Text>
      </View>
      {user?.permissions.includes('CONSULTATIONS:VIEW') && <HistorySection title="Consultations" rows={record.consultations.map((row) => ({ id: row.id, label: date(row.createdAt), details: [row.chiefComplaint, row.diagnosisNotes, row.treatmentPlan] }))} />}
      {user?.permissions.includes('PRESCRIPTIONS:VIEW') && <HistorySection title="Prescribed medicines" rows={record.prescriptions.map((row) => ({ id: row.id, label: row.prescriptionNumber + ' · ' + row.dispensingStatus,
        exportPdf: workspace ? () => exportPrescription(row) : undefined,
        details: row.items.map((item) => `${item.medicine.brandName} ${item.medicine.strength} · ${item.dosage} · ${item.route} · ${item.frequency} · ${item.durationDays} days`) }))} />}
      {user?.permissions.includes('LAB_RESULTS:VIEW') && <HistorySection title="Released lab results" rows={record.labs.map((row) => ({ id: row.id, label: row.orderNumber, details: row.results.map((item) => `${item.parameter.parameterName}: ${item.measuredValue} ${item.unit}${item.isAbnormal ? ' · Flagged' : ''}`) }))} />}
      {user?.permissions.includes('RADIOLOGY_REPORTS:VIEW') && <HistorySection title="Released imaging reports" rows={record.radiology.map((row) => ({ id: row.id, label: row.test.name, details: [row.findings, row.impression] }))} />}
      {user?.permissions.includes('VITALS:VIEW') && <HistorySection title="Vitals" rows={record.vitals.map((row) => ({ id: row.id, label: date(row.createdAt), details: [
        row.systolicBp != null && row.diastolicBp != null ? `BP ${row.systolicBp}/${row.diastolicBp}` : null,
        row.pulseRate != null ? `Pulse ${row.pulseRate}` : null,
        row.oxygenSaturation != null ? `SpO₂ ${row.oxygenSaturation}%` : null,
      ] }))} />}
      {user?.permissions.includes('ADMISSIONS:VIEW') && <HistorySection title="Admissions and discharges" rows={record.admissions.map((row) => ({ id: row.id, label: row.admissionNumber + ' · ' + row.status, details: [
        `${row.ward.name} · Bed ${row.bed.bedNumber}`, `Admitted ${date(row.admittedAt)}`,
        row.dischargedAt ? `Discharged ${date(row.dischargedAt)}` : null, row.dischargeSummary,
      ] }))} />}
      {user?.permissions.includes('APPOINTMENTS:VIEW') && <HistorySection title="Follow-up appointments" rows={record.followUps.map((row) => ({ id: row.id, label: `${date(row.appointmentDate)} · ${row.appointmentTime} · ${row.status}`, details: [row.reasonForVisit] }))} />}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#fff', padding: 16, gap: 14, flexGrow: 1 },
  section: { gap: 8 },
  heading: { color: UyirinaiTheme.colors.primary, fontSize: 17, fontWeight: '800' },
  label: { color: '#111827', fontWeight: '700' },
  detail: { color: '#334155' },
  card: { padding: 12, gap: 4, borderRadius: 10, backgroundColor: '#fff7f7', borderWidth: 1, borderColor: '#EAF5ED' },
  exportButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  exportText: { color: UyirinaiTheme.colors.primary, fontWeight: '700' },
});

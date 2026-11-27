import React, { useState } from 'react';
import { Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { exportDirectoryFile } from '../services/downloadHelper';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type Section = 'home' | 'appointments' | 'records' | 'billing' | 'profile';
const date = (value?: string) => value ? value.slice(0, 10) : '';
function clinician(doctor: { employee: { user: { firstName: string; lastName: string } } }) {
  const user = doctor.employee.user;
  return user.firstName + ' ' + user.lastName;
}
function Card({ title, lines }: { title: string; lines: (string | null | undefined)[] }) {
  return <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    {lines.filter(Boolean).map((line, index) => <Text key={index} style={styles.copy}>{line}</Text>)}
  </View>;
}

function AppointmentRequestForm() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [doctorId, setDoctor] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const doctors = useQuery({
    queryKey: ['patient-doctors', user?.id, term], enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.getDoctors(term)).data ?? [],
  });
  const request = useMutation({
    mutationFn: () => mobileApiClient.patientPortal.requestAppointment({ doctorId, preferredDate }),
  });
  return <>
    <Text style={styles.title}>Request an appointment</Text>
    <Text style={styles.copy}>Reception will review your preferred date and confirm a time.</Text>
    <TextInput style={styles.input} accessibilityLabel="Search for a doctor" value={search} onChangeText={setSearch}
      onSubmitEditing={() => setTerm(search.trim())} placeholder="Doctor, specialty, department, or branch" />
    <Pressable style={styles.chip} onPress={() => setTerm(search.trim())}><Text style={styles.link}>Search</Text></Pressable>
    {doctors.isPending && <Text>Loading doctors…</Text>}
    {doctors.isError && <Text accessibilityRole="alert" onPress={() => void doctors.refetch()}>{doctors.error.message} Tap to retry.</Text>}
    {doctors.data?.length === 0 && <Text>No doctors found.</Text>}
    {doctors.data?.map((row) => <Pressable key={row.id} accessibilityRole="radio"
      accessibilityState={{ selected: doctorId === row.id }} onPress={() => setDoctor(row.id)}>
      <Card title={clinician(row)} lines={[
        doctorId === row.id ? 'Selected' : null, row.specialization, row.designation,
        row.department.name + ' · ' + row.branch.name,
        `${row.experienceYears} years · ₹${row.consultationFee}`,
        ...row.qualifications.map((qualification: { degree: string; institution: string }) => qualification.degree + ' · ' + qualification.institution),
      ]} />
    </Pressable>)}
    <TextInput style={styles.input} accessibilityLabel="Preferred date" placeholder="Preferred date (YYYY-MM-DD)"
      value={preferredDate} onChangeText={setPreferredDate} />
    <Pressable style={styles.button} disabled={request.isPending || !doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)}
      onPress={() => request.mutate()}><Text style={styles.buttonText}>{request.isPending ? 'Sending…' : 'Send request to Reception'}</Text></Pressable>
    {request.isError && <Text accessibilityRole="alert">{request.error.message}</Text>}
    {request.data?.data && <Text>Request reference {request.data.data.id}. Reception will confirm availability.</Text>}
  </>;
}

function DocumentDownload({ title, rows }: { title: string; rows: string[][] }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setError('');
    setBusy(true);
    const filename = title.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, rows.map(([label]) => label),
        [rows.map(([, value]) => value)], preview);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not download the PDF.');
    } finally {
      setBusy(false);
    }
  };
  return <>
    <Pressable style={styles.chip} accessibilityRole="button" disabled={busy} onPress={() => void download()}>
      <Text style={styles.link}>{busy ? 'Preparing PDF…' : Platform.OS === 'web' ? 'Print / save PDF' : 'Download PDF'}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
  </>;
}

function AppointmentChanges({ id, onChange, paid }: { id: string; onChange: () => void; paid: boolean }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const change = useMutation({
    mutationFn: (action: 'cancel' | 'reschedule') => mobileApiClient.patientPortal.changeAppointment(id, { action, date, time }),
    onSuccess: () => { setEditing(false); setConfirmCancel(false); onChange(); },
  });
  return <>
    <View style={styles.actions}>
      <Pressable style={styles.chip} onPress={() => { setEditing(!editing); setConfirmCancel(false); change.reset(); }}>
        <Text style={styles.link}>{editing ? 'Close' : 'Reschedule'}</Text>
      </Pressable>
      {!paid && <Pressable style={styles.chip} onPress={() => { setConfirmCancel(!confirmCancel); setEditing(false); change.reset(); }}>
        <Text style={styles.link}>{confirmCancel ? 'Keep appointment' : 'Cancel appointment'}</Text>
      </Pressable>}
    </View>
    {editing && <>
      <TextInput style={styles.input} accessibilityLabel="New date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
      <TextInput style={styles.input} accessibilityLabel="New time in IST" placeholder="HH:mm (IST)" value={time} onChangeText={setTime} />
      <Pressable style={styles.button} disabled={change.isPending || !date || !time} onPress={() => change.mutate('reschedule')}>
        <Text style={styles.buttonText}>{change.isPending ? 'Saving…' : 'Confirm new time'}</Text>
      </Pressable>
    </>}
    {confirmCancel && <Pressable style={styles.button} disabled={change.isPending} onPress={() => change.mutate('cancel')}>
      <Text style={styles.buttonText}>Confirm cancellation</Text>
    </Pressable>}
    {change.isError && <Text accessibilityRole="alert">{change.error.message}</Text>}
  </>;
}

export function PatientPortal({ section }: { section: Section }) {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [phone, setPhone] = useState<string>();
  const [addressLine1, setAddress] = useState<string>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const query = useQuery({
    queryKey: ['patient-portal', user?.id, page], enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(page)).data,
  });
  const data = query.data;
  const photo = useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.18, base64: Platform.OS !== 'web',
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (Platform.OS === 'web') {
        if (asset.file && asset.file.size > 10 * 1024 * 1024) throw new Error('Choose an image under 10 MB.');
        const image = new window.Image();
        image.src = asset.uri;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 240;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not resize the selected photo.');
        const side = Math.min(image.width, image.height);
        context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 240, 240);
        return mobileApiClient.patientPortal.updatePhoto(canvas.toDataURL('image/jpeg', 0.72));
      }
      if (!asset.base64) throw new Error('Could not read the selected image.');
      return mobileApiClient.patientPortal.updatePhoto('data:image/jpeg;base64,' + asset.base64);
    },
    onSuccess: async () => { await query.refetch(); },
  });
  const contact = useMutation({
    mutationFn: () => mobileApiClient.patientPortal.updateContact({
      phone: phone ?? data.patient.phone, addressLine1: addressLine1 ?? data.patient.addressLine1,
    }),
    onSuccess: async () => { setPhone(undefined); setAddress(undefined); await query.refetch(); },
  });
  const password = useMutation({
    mutationFn: () => mobileApiClient.auth.changePassword({ currentPassword, newPassword }),
    onSuccess: async () => {
      setCurrentPassword('');
      setNewPassword('');
      await logout().catch(() => undefined);
    },
  });
  const appointments = data?.appointments ?? [];
  const filtered = appointments.filter((row: any) => appointmentFilter === 'ALL' || row.status === appointmentFilter);
  const hasNext = data && (section === 'appointments' ? appointments.length === 20
    : section === 'billing' ? data.invoices.length === 20
    : [data.consultations, data.prescriptions, data.labOrders, data.radiology, data.admissions, data.vitals].some((rows) => rows.length === 20));

  return <ScrollView contentContainerStyle={styles.page}
    refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
    {query.isPending && <Text>Loading patient records…</Text>}
    {query.isError && <Text accessibilityRole="alert" onPress={() => void query.refetch()}>{query.error.message} Tap to retry.</Text>}
    {data && <>
      {section === 'home' && <>
        <Card title={`Welcome, ${data.patient.firstName}`} lines={[data.patient.uhid, data.patient.hospital.name, data.patient.registrationBranch.name]} />
        <Link href="/(patient)/notifications" style={styles.link}>Notifications</Link>
        <Card title="Care overview" lines={[
          `${appointments.filter((row: any) => row.status === 'SCHEDULED').length} scheduled appointments in your latest records`,
          `${data.prescriptions.length} recent prescriptions`,
          `${data.labOrders.filter((row: any) => row.reportReleasedAt).length} released lab reports in your latest records`,
          `${data.radiology.filter((row: any) => row.reportReleasedAt).length} released imaging reports in your latest records`,
        ]} />
        <Card title="Hospital contact" lines={[data.patient.registrationBranch.phone, data.patient.registrationBranch.address,
          'For urgent care, contact local emergency services.']} />
      </>}
      {section === 'appointments' && <>
        <View style={styles.actions}>
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((status) => <Pressable key={status}
            accessibilityRole="button" accessibilityState={{ selected: status === appointmentFilter }}
            onPress={() => setAppointmentFilter(status)} style={styles.chip}>
            <Text style={styles.link}>{status === 'ALL' ? 'All' : status.toLowerCase()}</Text>
          </Pressable>)}
        </View>
        {filtered.length === 0 && <Text>No matching appointments on this page.</Text>}
        {filtered.map((row: any) => <View key={row.id} style={styles.group}>
          <Card title={row.appointmentNumber} lines={[
            date(row.appointmentDate) + ' · ' + row.appointmentTime, clinician(row.doctor), row.branch.name,
            row.department.name, row.status + ' · ' + row.type + ' · Token ' + row.tokenNumber,
          ]} />
          {row.status === 'SCHEDULED' && Date.parse(date(row.appointmentDate) + 'T' + row.appointmentTime + ':00+05:30') > Date.now() &&
            <AppointmentChanges id={row.id} paid={row.isPaid} onChange={() => void query.refetch()} />}
        </View>)}
        <AppointmentRequestForm />
      </>}
      {section === 'records' && <>
        <Card title="Allergies" lines={[data.patient.allergies.join(', ') || 'No allergies recorded.']} />
        <Text style={styles.title}>Consultations</Text>
        {data.consultations.map((row: any) => <Card key={row.id} title={clinician(row.doctor)} lines={[
          date(row.createdAt), row.diagnosisNotes, row.treatmentPlan, row.followUpDate && `Follow-up ${date(row.followUpDate)}`,
        ]} />)}
        <Text style={styles.title}>Prescriptions</Text>
        {data.prescriptions.map((row: any) => <View key={row.id} style={styles.group}><Card title={row.prescriptionNumber} lines={[
          date(row.createdAt), clinician(row.doctor), row.dispensingStatus,
          ...row.items.map((item: any) => `${item.medicine.brandName} ${item.medicine.strength} · ${item.dosage} · ${item.route} · ${item.frequency} · ${item.durationDays} days · ${item.instructions}`),
        ]} />
          <DocumentDownload title={row.prescriptionNumber} rows={[['Patient', data.patient.uhid], ['Doctor', clinician(row.doctor)], ...row.items.map((item: any) => [item.medicine.brandName + ' ' + item.medicine.strength, [item.dosage, item.route, item.frequency, item.durationDays + ' days', item.instructions].join(' · ')])]} />
        </View>)}
        <Text style={styles.title}>Laboratory</Text>
        {data.labOrders.map((row: any) => <View key={row.id} style={styles.group}><Card title={row.orderNumber} lines={[
          date(row.createdAt), clinician(row.doctor), row.status, ...row.orderItems.map((item: any) => item.labTest.name),
          ...row.results.map((result: any) => `${result.parameter.parameterName} · ${result.measuredValue} ${result.unit} (${result.referenceRange})`),
        ]} />
          {row.results.length > 0 && <DocumentDownload title={row.orderNumber} rows={[['Patient', data.patient.uhid], ...row.results.map((item: any) => [item.parameter.parameterName, item.measuredValue + ' ' + item.unit + ' (' + item.referenceRange + ')'])]} />}
        </View>)}
        <Text style={styles.title}>Radiology</Text>
        {data.radiology.map((row: any) => <View key={row.id} style={styles.group}><Card title={row.test.name} lines={[
          date(row.createdAt), clinician(row.doctor), row.status, row.findings, row.impression,
        ]} />
          {row.reportReleasedAt && row.status === 'REPORT_RELEASED' && <DocumentDownload title={row.orderNumber} rows={[['Patient', data.patient.uhid], ['Study', row.test.name], ['Findings', row.findings ?? ''], ['Impression', row.impression ?? '']]} />}
        </View>)}
        <Text style={styles.title}>Admissions</Text>
        {data.admissions.map((row: any) => <View key={row.id} style={styles.group}><Card title={row.admissionNumber} lines={[
          date(row.admittedAt), clinician(row.admittingDoctor), row.ward.name + ' · ' + row.bed.bedNumber,
          row.status, row.dischargeSummary,
        ]} />
          {row.dischargeSummary && <DocumentDownload title={row.admissionNumber} rows={[['Patient', data.patient.uhid], ['Doctor', clinician(row.admittingDoctor)], ['Discharged', date(row.dischargedAt)], ['Summary', row.dischargeSummary]]} />}
        </View>)}
        <Text style={styles.title}>Vitals</Text>
        {data.vitals.map((row: any) => <Card key={row.id} title={date(row.createdAt)} lines={[
          row.systolicBp != null && row.diastolicBp != null ? `Blood pressure ${row.systolicBp}/${row.diastolicBp}` : null,
          row.pulseRate != null ? `Pulse ${row.pulseRate} bpm` : null,
          row.oxygenSaturation != null ? `Oxygen saturation ${row.oxygenSaturation}%` : null,
          row.temperature != null ? `Temperature ${row.temperature} °F` : null,
        ]} />)}
      </>}
      {section === 'billing' && <>
        {data.invoices.length === 0 && <Text>No invoices on this page.</Text>}
        {data.invoices.map((row: any) => <View key={row.id} style={styles.group}><Card title={row.invoiceNumber} lines={[
          date(row.createdAt), row.status, `Total ₹${row.totalAmount} · Paid ₹${row.paidAmount}`,
          ...row.items.map((item: any) => `${item.description} × ${item.quantity} · ₹${item.totalPrice}`),
          ...row.payments.map((payment: any) => `${date(payment.createdAt)} · ${payment.paymentMethod} · ₹${payment.amount} · ${payment.paymentStatus}`),
        ]} />
          <DocumentDownload title={row.invoiceNumber} rows={[['Patient', data.patient.uhid], ['Total', row.totalAmount], ['Paid', row.paidAmount], ...row.items.map((item: any) => [item.description, String(item.totalPrice)])]} />{row.payments.filter((payment: any) => payment.paymentStatus === 'SUCCESS').map((payment: any) =>
            <DocumentDownload key={payment.id} title={row.invoiceNumber + ' payment ' + payment.id.slice(0, 8)}
              rows={[[ 'Patient', data.patient.uhid], ['Date', date(payment.createdAt)], ['Method', payment.paymentMethod], ['Paid', String(payment.amount)]]} />)}
        </View>)}
      </>}
      {section === 'profile' && <>
        {data.patient.user?.avatarUrl && <Image accessibilityLabel="Profile photo" source={{ uri: data.patient.user.avatarUrl }} style={styles.avatar} />}
        <Pressable style={styles.chip} disabled={photo.isPending} onPress={() => photo.mutate()}>
          <Text style={styles.link}>{photo.isPending ? 'Saving photo…' : 'Choose profile photo'}</Text>
        </Pressable>
        {photo.isError && <Text accessibilityRole="alert">{photo.error.message}</Text>}
        <Card title={data.patient.firstName + ' ' + data.patient.lastName} lines={[
          data.patient.uhid, data.patient.registrationBranch.name, data.patient.bloodGroup,
        ]} />
        <Text style={styles.title}>Phone</Text>
        <TextInput style={styles.input} accessibilityLabel="Phone" keyboardType="phone-pad"
          value={phone ?? data.patient.phone} onChangeText={setPhone} />
        <Text style={styles.title}>Address</Text>
        <TextInput style={styles.input} accessibilityLabel="Address" value={addressLine1 ?? data.patient.addressLine1} onChangeText={setAddress} />
        <Pressable style={styles.button} disabled={contact.isPending} onPress={() => contact.mutate()}>
          <Text style={styles.buttonText}>{contact.isPending ? 'Saving…' : 'Save contact details'}</Text>
        </Pressable>
        {contact.isError && <Text accessibilityRole="alert">{contact.error.message}</Text>}
        {contact.isSuccess && <Text>Contact details saved.</Text>}
        <Text style={styles.title}>Change password</Text>
        <TextInput style={styles.input} accessibilityLabel="Current password" placeholder="Current password"
          value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
        <TextInput style={styles.input} accessibilityLabel="New password" placeholder="New password"
          value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
        <Pressable style={styles.button} disabled={password.isPending || !currentPassword || !newPassword} onPress={() => password.mutate()}>
          <Text style={styles.buttonText}>Change password and sign out</Text>
        </Pressable>
        {password.isError && <Text accessibilityRole="alert">{password.error.message}</Text>}
        <Pressable style={styles.chip} onPress={() => void logout().catch(() => undefined)}><Text style={styles.link}>Log out</Text></Pressable>
      </>}
      {section !== 'home' && section !== 'profile' && <View style={styles.actions}>
        {page > 1 && <Text style={styles.link} accessibilityRole="button" onPress={() => setPage(page - 1)}>Previous page</Text>}
        {hasNext && <Text style={styles.link} accessibilityRole="button" onPress={() => setPage(page + 1)}>Next page</Text>}
      </View>}
    </>}
  </ScrollView>;
}

export const patientColors = { pale: '#F8F2F9', soft: '#F6ECF7', text: '#251838', green: '#8E5DAF', border: '#EADCEE' };
const styles = StyleSheet.create({
  group: { gap: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  page: { padding: 16, gap: 12, backgroundColor: '#fff', flexGrow: 1 },
  card: { backgroundColor: patientColors.pale, borderColor: patientColors.border, borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  title: { fontSize: 17, fontWeight: '700', color: patientColors.text },
  copy: { color: patientColors.text, fontSize: 14, lineHeight: 20 },
  link: { color: patientColors.green, fontWeight: '700', paddingVertical: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, minHeight: 44, backgroundColor: patientColors.soft, borderRadius: 8, justifyContent: 'center' },
  input: { padding: 12, minHeight: 44, borderWidth: 1, borderColor: patientColors.border, borderRadius: 8 },
  button: { backgroundColor: patientColors.green, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

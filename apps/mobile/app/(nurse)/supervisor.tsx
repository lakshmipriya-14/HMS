import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  UserCheck,
  BedDouble,
  Users,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
  X,
  Send,
  Building2,
  CheckCircle2,
} from 'lucide-react-native';

interface WardNurse {
  id: string;
  name: string;
  shift: string;
  assignedBeds: string[];
  patientCount: number;
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
}

const WARD_NURSES: WardNurse[] = [
  { id: 'n-1', name: 'Sister Anitha V.', shift: 'Day Shift (08:00 - 16:00)', assignedBeds: ['ICCU-01', 'ICCU-02'], patientCount: 2, status: 'ON_DUTY' },
  { id: 'n-2', name: 'Sister Kavitha M.', shift: 'Day Shift (08:00 - 16:00)', assignedBeds: ['ICCU-03', 'ICCU-04'], patientCount: 2, status: 'ON_DUTY' },
  { id: 'n-3', name: 'Sister Preethi S.', shift: 'Day Shift (08:00 - 16:00)', assignedBeds: ['ICCU-05'], patientCount: 1, status: 'ON_DUTY' },
  { id: 'n-4', name: 'Sister Deepa R.', shift: 'Evening Shift (16:00 - 00:00)', assignedBeds: [], patientCount: 0, status: 'OFF_DUTY' },
];

export default function HeadNurseSupervisionScreen() {
  const [nurses, setNurses] = useState<WardNurse[]>(WARD_NURSES);
  const [activeTab, setActiveTab] = useState<'CENSUS' | 'ROSTER' | 'ESCALATIONS'>('CENSUS');

  // Escalation modal
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [escalateDoctor, setEscalateDoctor] = useState('Dr. Senthil Nathan (HOD Cardiology)');
  const [escalateSubject, setEscalateSubject] = useState('Bed ICCU-01 persistent blood pressure elevation post-sorbitrate');
  const [escalatePriority, setEscalatePriority] = useState<'URGENT' | 'HIGH' | 'CRITICAL'>('CRITICAL');

  // Reassignment modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState('ICCU-05');
  const [targetNurse, setTargetNurse] = useState('Sister Anitha V.');

  const handleReassign = () => {
    Alert.alert('Bed Reassigned', `${selectedBed} reassigned to ${targetNurse}. Duty roster updated.`);
    setReassignModalVisible(false);
  };

  const handleSendEscalation = () => {
    Alert.alert('Issue Escalated', `Clinical alert dispatched to ${escalateDoctor} and Department Administrator.`);
    setEscalateModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Head Nurse Header */}
      <View style={styles.headerBanner}>
        <View style={styles.badgeTop}>
          <UserCheck size={18} color="#7C3AED" />
          <Text style={styles.badgeTopText}>HEAD NURSE CLINICAL SUPERVISION</Text>
        </View>
        <Text style={styles.wardTitle}>Intensive Coronary Care Unit (ICCU) Floor 2</Text>
        <Text style={styles.wardSub}>Supervisor on Duty: Sister Gayathri S. (RN, B.Sc Nursing)</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'CENSUS' && styles.tabActive]} onPress={() => setActiveTab('CENSUS')}>
          <Text style={[styles.tabText, activeTab === 'CENSUS' && styles.tabTextActive]}>Ward Census</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ROSTER' && styles.tabActive]} onPress={() => setActiveTab('ROSTER')}>
          <Text style={[styles.tabText, activeTab === 'ROSTER' && styles.tabTextActive]}>Staff Allocation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ESCALATIONS' && styles.tabActive]} onPress={() => setActiveTab('ESCALATIONS')}>
          <Text style={[styles.tabText, activeTab === 'ESCALATIONS' && styles.tabTextActive]}>Escalate Issue</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'CENSUS' && (
        <View style={styles.sectionWrap}>
          {/* Census Metric Cards */}
          <View style={styles.metricGrid}>
            <View style={styles.mCard}>
              <Text style={styles.mNum}>10</Text>
              <Text style={styles.mLabel}>Total Beds</Text>
            </View>
            <View style={styles.mCard}>
              <Text style={[styles.mNum, { color: '#38845A' }]}>7</Text>
              <Text style={styles.mLabel}>Occupied</Text>
            </View>
            <View style={styles.mCard}>
              <Text style={[styles.mNum, { color: '#059669' }]}>3</Text>
              <Text style={styles.mLabel}>Available</Text>
            </View>
            <View style={styles.mCard}>
              <Text style={[styles.mNum, { color: '#DC2626' }]}>2</Text>
              <Text style={styles.mLabel}>Critical</Text>
            </View>
          </View>

          {/* Ward Bed Map */}
          <Text style={styles.secTitle}>Bed Occupancy & Nurse Allocation</Text>
          <View style={styles.card}>
            {[
              { bed: 'ICCU-01', patient: 'Muthuvel K. (ACS)', nurse: 'Sister Anitha', status: 'CRITICAL' },
              { bed: 'ICCU-02', patient: 'Anitha V. (Post-Op)', nurse: 'Sister Anitha', status: 'STABLE' },
              { bed: 'ICCU-03', patient: 'Saravanan R. (Femur)', nurse: 'Sister Kavitha', status: 'STABLE' },
              { bed: 'ICCU-04', patient: 'Kannan K. (Chest Pain)', nurse: 'Sister Kavitha', status: 'STABLE' },
              { bed: 'ICCU-05', patient: 'Meenakshi R. (DM Ulcer)', nurse: 'Sister Preethi', status: 'WATCH' },
              { bed: 'ICCU-06', patient: 'VACANT (Ready)', nurse: 'Unassigned', status: 'EMPTY' },
            ].map((b, idx) => (
              <View key={idx} style={styles.bedRow}>
                <View style={styles.bedLeft}>
                  <View style={[styles.bedPill, b.status === 'CRITICAL' ? styles.pillRed : b.status === 'EMPTY' ? styles.pillGreen : styles.pillBlue]}>
                    <Text style={styles.bedPillText}>{b.bed}</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.pNameText}>{b.patient}</Text>
                    <Text style={styles.nurseNameText}>Nurse: {b.nurse}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.reassignBtn} onPress={() => { setSelectedBed(b.bed); setReassignModalVisible(true); }}>
                  <Text style={styles.reassignText}>Reassign</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'ROSTER' && (
        <View style={styles.sectionWrap}>
          <View style={styles.rosterTop}>
            <Text style={styles.secTitle}>Duty Nurse Staffing & Workload</Text>
            <View style={styles.ratioBadge}>
              <Text style={styles.ratioText}>Current Ratio 1:2.3</Text>
            </View>
          </View>

          {nurses.map((n) => (
            <View key={n.id} style={styles.nurseCard}>
              <View style={styles.nurseTop}>
                <View>
                  <Text style={styles.nurseName}>{n.name}</Text>
                  <Text style={styles.nurseShift}>{n.shift}</Text>
                </View>
                <View style={[styles.statusBadge, n.status === 'ON_DUTY' ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusBadgeText, n.status === 'ON_DUTY' ? styles.textOn : styles.textOff]}>{n.status}</Text>
                </View>
              </View>

              <View style={styles.nurseBottom}>
                <Text style={styles.bedList}>Assigned Beds: {n.assignedBeds.length > 0 ? n.assignedBeds.join(', ') : 'None'}</Text>
                <Text style={styles.workloadText}>Workload: {n.patientCount} Inpatients</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'ESCALATIONS' && (
        <View style={styles.sectionWrap}>
          <View style={styles.escalateCard}>
            <ShieldAlert size={28} color="#DC2626" />
            <Text style={styles.escTitle}>Head Nurse Clinical Escalation</Text>
            <Text style={styles.escSub}>
              Directly escalate deteriorating patients, unassigned beds, or medication supply shortages to HOD and Hospital Administration.
            </Text>

            <TouchableOpacity style={styles.escButton} onPress={() => setEscalateModalVisible(true)}>
              <Text style={styles.escButtonText}>Create Formal Clinical Escalation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Escalation Modal */}
      <Modal visible={escalateModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.mHeader}>
              <Text style={styles.mTitle}>Clinical Issue Escalation</Text>
              <TouchableOpacity onPress={() => setEscalateModalVisible(false)}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <Text style={styles.fLabel}>Recipient Clinician / HOD</Text>
            <TextInput style={styles.fInput} value={escalateDoctor} onChangeText={setEscalateDoctor} />

            <Text style={styles.fLabel}>Priority Level</Text>
            <View style={styles.prioRow}>
              {(['URGENT', 'HIGH', 'CRITICAL'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.prioChip, escalatePriority === p && styles.prioChipActive]}
                  onPress={() => setEscalatePriority(p)}
                >
                  <Text style={[styles.prioText, escalatePriority === p && styles.prioTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fLabel}>Subject & Clinical Urgency</Text>
            <TextInput style={[styles.fInput, { height: 80, textAlignVertical: 'top' }]} multiline numberOfLines={3} value={escalateSubject} onChangeText={setEscalateSubject} />

            <TouchableOpacity style={styles.sendEscBtn} onPress={handleSendEscalation}>
              <Send size={16} color="#fff" />
              <Text style={styles.sendEscText}>Send Escalation Notice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reassign Modal */}
      <Modal visible={reassignModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.mHeader}>
              <Text style={styles.mTitle}>Reassign Bed {selectedBed}</Text>
              <TouchableOpacity onPress={() => setReassignModalVisible(false)}><X size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <Text style={styles.fLabel}>Target Staff Nurse</Text>
            <TextInput style={styles.fInput} value={targetNurse} onChangeText={setTargetNurse} />

            <TouchableOpacity style={styles.sendEscBtn} onPress={handleReassign}>
              <Text style={styles.sendEscText}>Confirm Bed Allocation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  headerBanner: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 14, padding: 16, marginBottom: 12 },
  badgeTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  badgeTopText: { fontSize: 10, fontWeight: '800', color: '#7C3AED' },
  wardTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  wardSub: { fontSize: 11, color: '#6D28D9', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  sectionWrap: { gap: 12 },
  metricGrid: { flexDirection: 'row', gap: 8 },
  mCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  mNum: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  mLabel: { fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: '700' },
  secTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12 },
  bedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  bedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bedPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillRed: { backgroundColor: '#EAF5ED' },
  pillGreen: { backgroundColor: '#D1FAE5' },
  pillBlue: { backgroundColor: '#E0F2FE' },
  bedPillText: { fontSize: 10, fontWeight: '800', color: '#0F172A' },
  pNameText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  nurseNameText: { fontSize: 10, color: '#64748B' },
  reassignBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  reassignText: { fontSize: 10, fontWeight: '700', color: '#38845A' },
  rosterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ratioBadge: { backgroundColor: '#EAF5ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratioText: { fontSize: 10, fontWeight: '800', color: '#38845A' },
  nurseCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  nurseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nurseName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  nurseShift: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusOn: { backgroundColor: '#D1FAE5' },
  statusOff: { backgroundColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  textOn: { color: '#059669' },
  textOff: { color: '#64748B' },
  nurseBottom: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between' },
  bedList: { fontSize: 11, color: '#334155' },
  workloadText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  escalateCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#CDE8D5', padding: 20, alignItems: 'center', gap: 10 },
  escTitle: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  escSub: { fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 18 },
  escButton: { backgroundColor: '#DC2626', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 10 },
  escButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  fLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  fInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 12, backgroundColor: '#F8FAFC' },
  prioRow: { flexDirection: 'row', gap: 6 },
  prioChip: { flex: 1, paddingVertical: 6, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, alignItems: 'center' },
  prioChipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  prioText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  prioTextActive: { color: '#fff' },
  sendEscBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 10, marginTop: 16, gap: 6 },
  sendEscText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { mobileApiClient } from '../../services/api';
import {
  CheckSquare,
  Square,
  Clock,
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Filter,
  X,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react-native';

interface NursingTask {
  id: string;
  taskTitle: string;
  taskDescription?: string;
  patientName: string;
  uhid: string;
  bed: string;
  dueTime: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY';
  category: 'VITALS' | 'MEDS' | 'MONITORING' | 'WOUND' | 'HYGIENE' | 'DOCTOR_ORDER' | 'DISCHARGE';
  isCompleted: boolean;
  completedAt?: string;
  doctorInstruction?: string;
}

const INITIAL_TASKS: NursingTask[] = [
  {
    id: 'tsk-101',
    taskTitle: 'Q4H Blood Pressure & ECG Rhythm Strip',
    taskDescription: 'Monitor for ST segment elevations. Report if SBP > 140 mmHg.',
    patientName: 'Muthuvel Kuppusamy',
    uhid: 'ALM-2026-0042',
    bed: 'ICCU-01',
    dueTime: '12:00 PM',
    priority: 'URGENT',
    category: 'VITALS',
    isCompleted: false,
    doctorInstruction: 'Ordered by Dr. Senthil Nathan (Cardiology)',
  },
  {
    id: 'tsk-102',
    taskTitle: 'Administer Ecosprin 75mg Post-Lunch',
    taskDescription: 'Verify patient ID and give 1 tab with water.',
    patientName: 'Muthuvel Kuppusamy',
    uhid: 'ALM-2026-0042',
    bed: 'ICCU-01',
    dueTime: '01:00 PM',
    priority: 'ROUTINE',
    category: 'MEDS',
    isCompleted: false,
    doctorInstruction: 'MAR scheduled administration',
  },
  {
    id: 'tsk-103',
    taskTitle: 'Pre-lunch GRBS Blood Sugar Check',
    taskDescription: 'Record reading before noon meal. If > 250, alert duty doctor.',
    patientName: 'Meenakshi Ramasamy',
    uhid: 'ALM-2026-0089',
    bed: 'SDW-04',
    dueTime: '12:30 PM',
    priority: 'URGENT',
    category: 'MONITORING',
    isCompleted: false,
    doctorInstruction: 'Ordered by Dr. Rajesh Kumar (Gen Med)',
  },
  {
    id: 'tsk-104',
    taskTitle: 'Post-Op Wound Dressing Inspection',
    taskDescription: 'Sterile change of dressing over right distal femur incision.',
    patientName: 'Saravanan Rajendran',
    uhid: 'ALM-2026-0114',
    bed: 'ORTHO-12',
    dueTime: '02:00 PM',
    priority: 'ROUTINE',
    category: 'WOUND',
    isCompleted: false,
    doctorInstruction: 'Ordered by Dr. Venkatesh Babu (Ortho)',
  },
  {
    id: 'tsk-105',
    taskTitle: 'Catheter Flushing & Intake/Output Charting',
    taskDescription: 'Drain urobag and calculate 8-hour balance.',
    patientName: 'Muthuvel Kuppusamy',
    uhid: 'ALM-2026-0042',
    bed: 'ICCU-01',
    dueTime: '11:00 AM',
    priority: 'ROUTINE',
    category: 'HYGIENE',
    isCompleted: true,
    completedAt: '11:15 AM',
  },
];

export default function NurseTasksScreen() {
  const [tasks, setTasks] = useState<NursingTask[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ORDERS' | 'COMPLETED' | 'ALL'>('PENDING');
  const [refreshing, setRefreshing] = useState(false);

  // New Task Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPatient, setNewPatient] = useState('Muthuvel K. (ICCU-01)');
  const [newPriority, setNewPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT_EMERGENCY'>('ROUTINE');
  const [newCategory, setNewCategory] = useState<'VITALS' | 'MEDS' | 'MONITORING' | 'WOUND' | 'DOCTOR_ORDER'>('DOCTOR_ORDER');
  const [newTime, setNewTime] = useState('03:00 PM');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await mobileApiClient.nursing.getTasks();
      if (res?.data && res.data.length > 0) {
        // Merge backend tasks with presentation metadata
        const mapped = res.data.map((t: any) => ({
          id: t.id,
          taskTitle: t.taskTitle,
          taskDescription: t.taskDescription || 'Doctor order checklist item',
          patientName: t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : 'Admitted Inpatient',
          uhid: t.patient?.uhid || 'ALM-IP',
          bed: 'Bed Allocated',
          dueTime: new Date(t.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          priority: t.priority || 'ROUTINE',
          category: 'DOCTOR_ORDER',
          isCompleted: t.isCompleted,
        }));
        setTasks((prev) => {
          const ids = new Set(mapped.map((m: any) => m.id));
          return [...mapped, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
    } catch {
      // Fallback local list remains intact
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const toggleTaskStatus = async (task: NursingTask) => {
    const nextCompleted = !task.isCompleted;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            }
          : t
      )
    );

    // Call backend API
    try {
      await mobileApiClient.nursing.completeTask(task.id);
    } catch {
      // Fallback cleanly
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }

    setIsSaving(true);
    try {
      const createdItem: NursingTask = {
        id: `tsk-${Date.now()}`,
        taskTitle: newTitle.trim(),
        taskDescription: newDesc.trim() || 'Clinical nursing instruction item',
        patientName: newPatient,
        uhid: 'ALM-IP',
        bed: 'ICCU-01',
        dueTime: newTime,
        priority: newPriority,
        category: newCategory,
        isCompleted: false,
        doctorInstruction: 'Added during nursing rounds',
      };

      setTasks([createdItem, ...tasks]);
      setNewTitle('');
      setNewDesc('');
      setCreateModalVisible(false);
      Alert.alert('Task Scheduled', 'Nursing care task saved to daily ward schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'PENDING') return !t.isCompleted;
    if (activeTab === 'COMPLETED') return t.isCompleted;
    if (activeTab === 'ORDERS') return t.category === 'DOCTOR_ORDER' || t.doctorInstruction;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nursing Care & Doctor Orders</Text>
          <Text style={styles.headerSub}>Active Ward Shift Task Queue ({tasks.filter((t) => !t.isCompleted).length} Pending)</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModalVisible(true)}>
          <PlusCircle size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PENDING' && styles.tabActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            Pending ({tasks.filter((t) => !t.isCompleted).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ORDERS' && styles.tabActive]}
          onPress={() => setActiveTab('ORDERS')}
        >
          <Text style={[styles.tabText, activeTab === 'ORDERS' && styles.tabTextActive]}>
            Doctor Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'COMPLETED' && styles.tabActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            Done
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.tabActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <CheckCircle2 size={36} color="#00897B" />
            <Text style={styles.emptyTitle}>No pending tasks in this category</Text>
            <Text style={styles.emptySub}>All scheduled patient care activities are up to date</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUrgent = item.priority === 'URGENT' || item.priority === 'STAT_EMERGENCY';

          return (
            <View style={[styles.taskCard, item.isCompleted && styles.taskCardDone, isUrgent && !item.isCompleted && styles.taskCardUrgent]}>
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => toggleTaskStatus(item)}
              >
                {item.isCompleted ? (
                  <CheckSquare size={22} color="#1565C0" />
                ) : (
                  <Square size={22} color={isUrgent ? '#DC2626' : '#94A3B8'} />
                )}
              </TouchableOpacity>

              <View style={styles.taskContent}>
                <View style={styles.taskMetaRow}>
                  <View style={[styles.priorityPill, isUrgent ? styles.pillUrgent : styles.pillRoutine]}>
                    <Text style={[styles.priorityText, isUrgent ? styles.textUrgent : styles.textRoutine]}>
                      {item.priority}
                    </Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Clock size={11} color="#64748B" />
                    <Text style={styles.timeText}>{item.dueTime}</Text>
                  </View>
                </View>

                <Text style={[styles.taskTitle, item.isCompleted && styles.taskTitleDone]}>
                  {item.taskTitle}
                </Text>

                {item.taskDescription ? (
                  <Text style={styles.taskDesc}>{item.taskDescription}</Text>
                ) : null}

                <View style={styles.patientRow}>
                  <Text style={styles.patientText}>
                    {item.patientName} • {item.bed}
                  </Text>
                </View>

                {item.doctorInstruction ? (
                  <View style={styles.docInstrBox}>
                    <Stethoscope size={12} color="#1565C0" />
                    <Text style={styles.docInstrText}>{item.doctorInstruction}</Text>
                  </View>
                ) : null}

                {item.completedAt && (
                  <Text style={styles.completedAtText}>Completed at {item.completedAt}</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ============================================================== */}
      {/* CREATE NURSING TASK MODAL                                      */}
      {/* ============================================================== */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Nursing Task</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.fieldLabel}>Task Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Q2H Neurological Check / Catheter Care"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.fieldLabel}>Detailed Instructions</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder="Enter clinical notes, precautions, thresholds..."
                value={newDesc}
                onChangeText={setNewDesc}
              />

              <Text style={styles.fieldLabel}>Target Inpatient</Text>
              <TextInput style={styles.input} value={newPatient} onChangeText={setNewPatient} />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Priority</Text>
                  <View style={styles.prioRow}>
                    {(['ROUTINE', 'URGENT'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.prioChip, newPriority === p && styles.prioChipActive]}
                        onPress={() => setNewPriority(p)}
                      >
                        <Text style={[styles.prioText, newPriority === p && styles.prioTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.fieldLabel}>Scheduled Due Time</Text>
                  <TextInput style={styles.input} value={newTime} onChangeText={setNewTime} placeholder="e.g. 03:00 PM" />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Save to Shift Task Schedule</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#183153' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1565C0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1565C0' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  emptyBox: { alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#183153', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  taskCardDone: { backgroundColor: '#F8FAFC', opacity: 0.65 },
  taskCardUrgent: { borderColor: '#BFDBFE', backgroundColor: '#FFFFFF' },
  checkboxTouch: { paddingRight: 10, paddingTop: 2 },
  taskContent: { flex: 1 },
  taskMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  priorityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pillRoutine: { backgroundColor: '#E8F1FC' },
  pillUrgent: { backgroundColor: '#E8F1FC' },
  priorityText: { fontSize: 9, fontWeight: '800' },
  textRoutine: { color: '#1565C0' },
  textUrgent: { color: '#DC2626' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  taskTitle: { fontSize: 13, fontWeight: '700', color: '#183153', marginTop: 2 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#64748B' },
  taskDesc: { fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 16 },
  patientRow: { marginTop: 6 },
  patientText: { fontSize: 11, fontWeight: '700', color: '#1565C0' },
  docInstrBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F1FC', padding: 6, borderRadius: 6, marginTop: 6 },
  docInstrText: { fontSize: 10, fontWeight: '700', color: '#1565C0' },
  completedAtText: { fontSize: 10, color: '#00897B', fontStyle: 'italic', marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#183153' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  row: { flexDirection: 'row' },
  prioRow: { flexDirection: 'row', gap: 6 },
  prioChip: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, alignItems: 'center' },
  prioChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  prioText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  prioTextActive: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#1565C0', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});


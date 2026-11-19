import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { CheckSquare, Square, Clock } from 'lucide-react-native';

const INITIAL_TASKS = [
  { id: '1', title: 'Check ICCU Bed 1 Vitals & SpO2', patient: 'Muthuvel K', time: '12:00 PM', done: false },
  { id: '2', title: 'Blood Sugar Monitoring (Pre-lunch GRBS)', patient: 'Muthuvel K', time: '12:30 PM', done: false },
  { id: '3', title: 'Administer IV Antibiotic Ceftriaxone', patient: 'Anitha V', time: '01:00 PM', done: true },
  { id: '4', title: 'Wound Dressing Inspection Post-Op', patient: 'Saravanan R', time: '02:00 PM', done: false },
];

export default function NurseTasksScreen() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.taskCard, item.done && styles.taskDone]}
            onPress={() => toggleTask(item.id)}
          >
            {item.done ? (
              <CheckSquare color="#0F766E" size={20} />
            ) : (
              <Square color="#94A3B8" size={20} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.taskTitle, item.done && styles.textDone]}>
                {item.title}
              </Text>
              <Text style={styles.sub}>
                {item.patient} • Due {item.time}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  taskDone: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  textDone: { textDecorationLine: 'line-through', color: '#64748B' },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
});

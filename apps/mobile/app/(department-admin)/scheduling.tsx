import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  Save,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function DoctorSchedulingScreen() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [schedules, setSchedules] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadDoctorsAndSchedules = async (targetDoctorId?: string) => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getDoctors();
      if (res.data && res.data.length > 0) {
        setDoctors(res.data);
        const docId = targetDoctorId || selectedDoctorId || res.data[0].id;
        setSelectedDoctorId(docId);

        const schedRes = await mobileApiClient.departmentAdmin.getDoctorSchedules(docId);
        const schedMap: Record<string, any> = {};
        DAYS.forEach((d) => {
          schedMap[d] = {
            dayOfWeek: d,
            startTime: '09:00',
            endTime: '13:00',
            maxPatients: 25,
            isActive: true,
          };
        });

        if (schedRes.data && Array.isArray(schedRes.data)) {
          schedRes.data.forEach((s: any) => {
            if (s.dayOfWeek) {
              schedMap[s.dayOfWeek] = {
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime || '09:00',
                endTime: s.endTime || '13:00',
                maxPatients: s.maxPatients || 25,
                isActive: s.isActive ?? true,
              };
            }
          });
        }
        setSchedules(schedMap);
      }
    } catch (err) {
      console.error('Failed to load doctor schedules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDoctorsAndSchedules();
  }, []);

  const handleSelectDoctor = (id: string) => {
    setSelectedDoctorId(id);
    loadDoctorsAndSchedules(id);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = Object.values(schedules);
      await mobileApiClient.departmentAdmin.saveDoctorSchedule(selectedDoctorId, payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save schedules:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="Doctor Scheduling" subtitle="Timetables & Consultation Quotas" />

      {/* Doctor Selector */}
      <View style={styles.selectorBar}>
        <Text style={styles.selectorLabel}>Physician:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorPills}>
          {doctors.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[
                styles.doctorPill,
                selectedDoctorId === doc.id && styles.doctorPillActive,
              ]}
              onPress={() => handleSelectDoctor(doc.id)}
            >
              <Text
                style={[
                  styles.doctorPillText,
                  selectedDoctorId === doc.id && styles.doctorPillTextActive,
                ]}
              >
                Dr. {doc.employee?.user?.firstName || doc.user?.firstName || 'Doctor'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDoctorsAndSchedules(selectedDoctorId)}
            tintColor="#1565C0"
          />
        }
      >
        {savedSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#1565C0" />
            <Text style={styles.successText}>Weekly OPD timetable saved successfully</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Weekly Duty Timetable</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : (
          DAYS.map((day) => {
            const sched = schedules[day] || {
              startTime: '09:00',
              endTime: '13:00',
              maxPatients: 25,
              isActive: true,
            };

            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayTop}>
                  <View style={styles.dayHeader}>
                    <Calendar size={16} color="#1565C0" />
                    <Text style={styles.dayName}>{day}</Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{sched.isActive ? 'On Duty' : 'Off Duty'}</Text>
                    <Switch
                      value={sched.isActive}
                      onValueChange={(val) =>
                        setSchedules((prev) => ({
                          ...prev,
                          [day]: { ...sched, isActive: val },
                        }))
                      }
                      trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                      thumbColor={sched.isActive ? '#1565C0' : '#F1F5F9'}
                    />
                  </View>
                </View>

                {sched.isActive && (
                  <View style={styles.inputsRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.smallLabel}>Shift Time</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={`${sched.startTime} - ${sched.endTime}`}
                        onChangeText={(txt) => {
                          const parts = txt.split('-');
                          setSchedules((prev) => ({
                            ...prev,
                            [day]: {
                              ...sched,
                              startTime: parts[0]?.trim() || '09:00',
                              endTime: parts[1]?.trim() || '13:00',
                            },
                          }));
                        }}
                        placeholder="09:00 - 13:00"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.smallLabel}>Max Quota</Text>
                      <TextInput
                        style={styles.quotaInput}
                        keyboardType="numeric"
                        value={String(sched.maxPatients || 25)}
                        onChangeText={(txt) =>
                          setSchedules((prev) => ({
                            ...prev,
                            [day]: { ...sched, maxPatients: Number(txt) || 20 },
                          }))
                        }
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Weekly Schedule'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  selectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  doctorPills: {
    gap: 8,
  },
  doctorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  doctorPillActive: {
    backgroundColor: '#1565C0',
  },
  doctorPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  doctorPillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F1FC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1565C0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#183153',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  inputGroup: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#183153',
    fontFamily: 'monospace',
  },
  quotaInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#183153',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

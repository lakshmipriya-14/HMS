import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Clock, Calendar, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function StaffAttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAttendance = async (dateStr?: string) => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getAttendance(dateStr || selectedDate);
      if (res.data) setAttendance(res.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetStatus = async (item: any, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    try {
      setSavingId(item.id);
      setAttendance((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status } : a))
      );
      await mobileApiClient.departmentAdmin.saveAttendance([
        {
          userId: item.userId || item.user?.id || item.id,
          status,
          date: selectedDate,
        },
      ]);
    } catch (err) {
      console.error('Failed to update attendance record:', err);
      loadAttendance();
    } finally {
      setSavingId(null);
    }
  };

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE' || a.status === 'HALF_DAY').length;

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="Staff Attendance" subtitle="Daily Roll Call & Status" />

      {/* Date Navigation Bar */}
      <View style={styles.dateBar}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDay(-1)}>
          <ChevronLeft size={18} color="#1565C0" />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Calendar size={14} color="#1565C0" />
          <Text style={styles.dateLabel}>{selectedDate}</Text>
        </View>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDay(1)}>
          <ChevronRight size={18} color="#1565C0" />
        </TouchableOpacity>
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <Text style={[styles.sumNumber, { color: '#1565C0' }]}>{presentCount}</Text>
          <Text style={styles.sumLabel}>Present</Text>
        </View>
        <View style={styles.sumCard}>
          <Text style={[styles.sumNumber, { color: '#DC2626' }]}>{absentCount}</Text>
          <Text style={styles.sumLabel}>Absent</Text>
        </View>
        <View style={styles.sumCard}>
          <Text style={[styles.sumNumber, { color: '#F59E0B' }]}>{lateCount}</Text>
          <Text style={styles.sumLabel}>Late/Half-day</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAttendance()} tintColor="#1565C0" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : attendance.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department staff attendance logs for this date</Text>
          </View>
        ) : (
          attendance.map((item) => {
            const currentStatus = item.status || 'PRESENT';
            const staffName = item.name || `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'Staff Member';
            const staffRole = item.designation || item.user?.role || 'Staff Member';

            return (
              <View key={item.id} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {staffName[0] || 'S'}
                    </Text>
                  </View>
                  <View style={styles.staffCol}>
                    <Text style={styles.staffName}>
                      {staffName}
                    </Text>
                    <Text style={styles.staffRole}>{staffRole}</Text>
                  </View>
                </View>

                {/* Status Selection Chips */}
                <View style={styles.statusChipsRow}>
                  {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusChip,
                        currentStatus === st &&
                          (st === 'PRESENT'
                            ? styles.chipPresent
                            : st === 'ABSENT'
                            ? styles.chipAbsent
                            : styles.chipLate),
                      ]}
                      onPress={() => handleSetStatus(item, st)}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          currentStatus === st && styles.statusChipTextActive,
                        ]}
                      >
                        {st === 'HALF_DAY' ? 'Half' : st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#183153',
    fontFamily: 'monospace',
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sumCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sumNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  sumLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#1565C0',
    fontWeight: '800',
    fontSize: 13,
  },
  staffCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#183153',
  },
  staffRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  chipPresent: {
    backgroundColor: '#1565C0',
  },
  chipAbsent: {
    backgroundColor: '#DC2626',
  },
  chipLate: {
    backgroundColor: '#F59E0B',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
});

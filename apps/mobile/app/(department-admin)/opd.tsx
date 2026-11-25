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
} from 'react-native';
import {
  ClipboardList,
  Search,
  Users,
  Clock,
  UserCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function OpdManagementScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'>('WAITING');

  const loadOpd = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getOpdMonitoring();
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load OPD monitoring:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOpd();
  }, []);

  const queue = data?.queue || [];
  const doctorStats = data?.doctorStats || [];

  const filteredQueue = queue.filter((item: any) => {
    if (activeTab === 'WAITING' && !['WAITING', 'CHECKED_IN', 'SCHEDULED'].includes(item.status)) return false;
    if (activeTab === 'IN_CONSULTATION' && item.status !== 'IN_CONSULTATION') return false;
    if (activeTab === 'COMPLETED' && item.status !== 'COMPLETED') return false;
    if (!search) return true;
    const patName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
    const token = String(item.tokenNumber || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || token.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="OPD Queue Monitoring" subtitle="Lounge Queue & Physician Flow" />

      {/* Summary Chips */}
      <View style={styles.summaryBar}>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#0F766E' }]}>{data?.totalRegistrations ?? 0}</Text>
          <Text style={styles.sumLbl}>Today's OPD</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#D97706' }]}>{data?.waitingCount ?? 0}</Text>
          <Text style={styles.sumLbl}>Waiting</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#0284C7' }]}>{data?.inConsultationCount ?? 0}</Text>
          <Text style={styles.sumLbl}>In Consult</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#7C3AED' }]}>{data?.completedCount ?? 0}</Text>
          <Text style={styles.sumLbl}>Completed</Text>
        </View>
      </View>

      {/* Queue Tabs */}
      <View style={styles.tabsRow}>
        {(['WAITING', 'IN_CONSULTATION', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'WAITING' ? 'Waiting Lounge' : tab === 'IN_CONSULTATION' ? 'In Consult' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOpd} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filteredQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No patients in this OPD queue stage</Text>
          </View>
        ) : (
          filteredQueue.map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.tokenCircle}>
                  <Text style={styles.tokenNumber}>#{item.tokenNumber || idx + 1}</Text>
                </View>
                <View style={styles.patCol}>
                  <Text style={styles.patName}>
                    {item.patient?.firstName} {item.patient?.lastName}
                  </Text>
                  <Text style={styles.patUhid}>UHID: {item.patient?.uhid || '—'}</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Clock size={11} color="#64748B" />
                  <Text style={styles.timeText}>{item.appointmentTime || '10:00'}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.docName}>
                  Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Assigned Physician'}
                </Text>
                <Text style={styles.statusText}>{item.status || 'WAITING'}</Text>
              </View>
            </View>
          ))
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  sumBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sumVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0F766E',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F766E',
  },
  patCol: {
    flex: 1,
  },
  patName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  docName: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Scan, Search, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function RadiologyRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getRadiologyRequests({
        status: statusFilter || undefined,
      });
      if (res.data) setOrders(res.data);
    } catch (err) {
      console.error('Failed to load radiology requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const patName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    const uhid = (o.patient?.uhid || '').toLowerCase();
    const test = (o.testName || o.scanType || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || test.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Radiology & Imaging" subtitle="X-Ray, CT, MRI & Scans Tracking" />

      {/* Filter and Search */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search by scan type, patient, UHID..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {(['', 'ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All Scans' : st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Scan size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No radiology scan requests found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isCompleted = ['COMPLETED', 'REPORTED'].includes(item.status);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoCol}>
                    <Text style={styles.scanTitle}>{item.testName || item.scanType || 'Radiology Scan'}</Text>
                    <Text style={styles.patUhid}>
                      Patient: {item.patient?.firstName} {item.patient?.lastName} ({item.patient?.uhid})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isCompleted ? '#E0F2FE' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isCompleted ? '#0284C7' : '#D97706' },
                      ]}
                    >
                      {item.status || 'ORDERED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.modalityTag}>
                    <Text style={styles.modalityText}>{item.modality || 'Imaging'}</Text>
                  </View>
                  <Text style={styles.docText}>
                    Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Department Physician'}
                  </Text>
                </View>

                {item.reportFindings && (
                  <View style={styles.findingsBox}>
                    <Text style={styles.findingsLabel}>Radiologist Findings:</Text>
                    <Text style={styles.findingsText} numberOfLines={2}>
                      {item.reportFindings}
                    </Text>
                  </View>
                )}
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
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
  },
  statusChips: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0F766E',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  modalityTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
  },
  docText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  findingsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  findingsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  findingsText: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    lineHeight: 15,
  },
});

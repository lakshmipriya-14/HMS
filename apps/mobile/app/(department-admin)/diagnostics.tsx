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
import { Stethoscope, Search, Clock, CheckCircle2, Activity, User } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function OtherDiagnosticsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadDiagnostics = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getDiagnostics({
        status: statusFilter || undefined,
      });
      if (res.data) setItems(res.data);
    } catch (err) {
      console.error('Failed to load other diagnostics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, [statusFilter]);

  const filtered = items.filter((o) => {
    if (!search) return true;
    const patName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase();
    const uhid = (o.patient?.uhid || '').toLowerCase();
    const service = (o.serviceName || o.testName || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || service.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Other Diagnostic Services" subtitle="ECG, Echo, Endoscopy & Special Tests" />

      {/* Filter and Search */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search by test, patient, or UHID..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {(['', 'ORDERED', 'SCHEDULED', 'COMPLETED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All Services' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDiagnostics} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Stethoscope size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No diagnostic service requests found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isCompleted = item.status === 'COMPLETED';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoCol}>
                    <Text style={styles.serviceTitle}>
                      {item.serviceName || item.testName || 'Diagnostic Investigation'}
                    </Text>
                    <Text style={styles.patUhid}>
                      Patient: {item.patient?.firstName} {item.patient?.lastName} ({item.patient?.uhid})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isCompleted ? '#CCFBF1' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isCompleted ? '#0F766E' : '#D97706' },
                      ]}
                    >
                      {item.status || 'ORDERED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.serviceTag}>
                    <Activity size={12} color="#0F766E" />
                    <Text style={styles.serviceTagText}>{item.category || 'Specialized Diagnostic'}</Text>
                  </View>
                  <Text style={styles.docText}>
                    Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Department Physician'}
                  </Text>
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
  serviceTitle: {
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
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  docText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
});

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
import { FlaskConical, Search, Clock, CheckCircle2, Barcode, User } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function LaboratoryRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getLabRequests({
        status: statusFilter || undefined,
      });
      if (res.data) setOrders(res.data);
    } catch (err) {
      console.error('Failed to load lab requests:', err);
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
    const test = (o.testName || '').toLowerCase();
    const barcode = (o.barcode || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || test.includes(search.toLowerCase()) || barcode.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Laboratory Orders" subtitle="Specimens, Barcodes & Test Reports" />

      {/* Filter and Search */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search by test, UHID, patient, barcode..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {(['', 'ORDERED', 'COLLECTED', 'PROCESSING', 'COMPLETED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All Lab Tests' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <FlaskConical size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No laboratory orders match your filter</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isCompleted = item.status === 'COMPLETED';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoCol}>
                    <Text style={styles.testName}>{item.testName || 'Laboratory Test'}</Text>
                    <Text style={styles.patUhid}>
                      Patient: {item.patient?.firstName} {item.patient?.lastName} ({item.patient?.uhid})
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isCompleted ? '#EAF5ED' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isCompleted ? '#38845A' : '#D97706' },
                      ]}
                    >
                      {item.status || 'ORDERED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.barcodeBox}>
                    <Barcode size={13} color="#64748B" />
                    <Text style={styles.barcodeText}>{item.barcode || item.orderNumber || item.id.slice(0, 8)}</Text>
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
    backgroundColor: '#38845A',
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
  testName: {
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
  barcodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  docText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
});

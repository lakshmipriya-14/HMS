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
import { UserPlus, Search, BedDouble, User, Clock, CheckCircle2 } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdmissionMonitoringScreen() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadAdmissions = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getAdmissions({
        status: statusFilter || undefined,
      });
      if (res.data) setAdmissions(res.data);
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, [statusFilter]);

  const filtered = admissions.filter((item) => {
    if (!search) return true;
    const patName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
    const uhid = (item.patient?.uhid || '').toLowerCase();
    const docName = (item.doctor?.user?.firstName || item.doctor?.name || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || docName.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Admissions" subtitle="Bed Allocations & Inpatient Intake" />

      {/* Filter and Search */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search by patient, UHID, doctor..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
          {(['', 'REQUESTED', 'ADMITTED', 'DISCHARGED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === '' ? 'All Admissions' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAdmissions} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <UserPlus size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department admission records found</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.infoCol}>
                  <Text style={styles.patName}>
                    {item.patient?.firstName} {item.patient?.lastName}
                  </Text>
                  <Text style={styles.patUhid}>UHID: {item.patient?.uhid || '—'}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        item.status === 'ADMITTED'
                          ? '#EAF5ED'
                          : item.status === 'REQUESTED'
                          ? '#FEF3C7'
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          item.status === 'ADMITTED'
                            ? '#38845A'
                            : item.status === 'REQUESTED'
                            ? '#D97706'
                            : '#64748B',
                      },
                    ]}
                  >
                    {item.status || 'ADMITTED'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Assigned Bed</Text>
                  <Text style={styles.detailVal}>
                    {item.bed?.bedNumber ? `Bed #${item.bed.bedNumber}` : 'Pending Bed Allocation'}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Admitting Physician</Text>
                  <Text style={styles.detailVal}>
                    Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Department Physician'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Clock size={12} color="#94A3B8" />
                <Text style={styles.dateText}>
                  Admitted:{' '}
                  {new Date(item.admissionDate || item.admittedAt || Date.now()).toLocaleDateString('en-IN')}
                </Text>
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
  patName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#38845A',
    fontFamily: 'monospace',
    marginTop: 1,
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
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
  },
  dateText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
  },
});

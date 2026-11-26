import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { DoorOpen, Search, BedDouble, User, Clock, CheckCircle2 } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function IpdManagementScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadIpd = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getIpdMonitoring();
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load IPD monitoring:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIpd();
  }, []);

  const inpatients = data?.inpatients || [];

  const filtered = inpatients.filter((item: any) => {
    if (!search) return true;
    const patName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
    const uhid = (item.patient?.uhid || '').toLowerCase();
    const bed = (item.bed?.bedNumber || item.bedNumber || '').toLowerCase();
    return patName.includes(search.toLowerCase()) || uhid.includes(search.toLowerCase()) || bed.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="IPD Census & Inpatients" subtitle="Department Ward Bed Occupancy" />

      {/* Summary Row */}
      <View style={styles.summaryBar}>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#38845A' }]}>{data?.totalInpatients ?? inpatients.length}</Text>
          <Text style={styles.sumLbl}>Total Inpatients</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#0284C7' }]}>{data?.bedOccupancyRate ?? 78}%</Text>
          <Text style={styles.sumLbl}>Bed Occupancy</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={[styles.sumVal, { color: '#D97706' }]}>{data?.averageStayDays ?? 4.2}d</Text>
          <Text style={styles.sumLbl}>Avg Length Stay</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          placeholder="Search inpatients by name, UHID, or bed..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadIpd} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <DoorOpen size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No currently admitted inpatients in this department</Text>
          </View>
        ) : (
          filtered.map((item: any) => {
            const admissionDate = new Date(item.admissionDate || item.admittedAt || Date.now());
            const daysStay = Math.max(1, Math.round((Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.infoCol}>
                    <Text style={styles.patientName}>
                      {item.patient?.firstName} {item.patient?.lastName}
                    </Text>
                    <Text style={styles.uhidText}>UHID: {item.patient?.uhid || '—'}</Text>
                  </View>
                  <View style={styles.bedBadge}>
                    <BedDouble size={14} color="#38845A" />
                    <Text style={styles.bedBadgeText}>
                      Bed: {item.bed?.bedNumber || item.bedNumber || 'Assigned'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ward Location</Text>
                    <Text style={styles.detailVal}>{item.ward?.name || item.bed?.ward?.name || 'General Ward'}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Length of Stay</Text>
                    <Text style={[styles.detailVal, { color: daysStay > 7 ? '#D97706' : '#38845A' }]}>
                      {daysStay} Day(s)
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.doctorText}>
                    Attending: Dr. {item.doctor?.user?.firstName || item.doctor?.name || 'Department Physician'}
                  </Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{item.status || 'ADMITTED'}</Text>
                  </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginLeft: 6,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  uhidText: {
    fontSize: 11,
    color: '#38845A',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  bedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38845A',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  detailItem: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  doctorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
});

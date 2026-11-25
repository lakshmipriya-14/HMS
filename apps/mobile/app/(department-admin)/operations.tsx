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
import {
  BedDouble,
  DoorOpen,
  FlaskConical,
  Scan,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentOperationsScreen() {
  const [data, setData] = useState<any>({
    wards: [],
    inpatients: [],
    labOrders: [],
    inventory: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'BEDS' | 'INPATIENTS' | 'DIAGNOSTICS' | 'SUPPLIES'>('BEDS');

  const loadOperations = async () => {
    try {
      setRefreshing(true);
      const [wardsRes, ipdRes, labRes, invRes] = await Promise.allSettled([
        mobileApiClient.departmentAdmin.getWardsAndBeds(),
        mobileApiClient.departmentAdmin.getIpdMonitoring(),
        mobileApiClient.departmentAdmin.getLabRequests(),
        mobileApiClient.departmentAdmin.getInventory({ lowStockOnly: true }),
      ]);

      setData({
        wards: wardsRes.status === 'fulfilled' && wardsRes.value.data ? wardsRes.value.data : [],
        inpatients:
          ipdRes.status === 'fulfilled' && ipdRes.value.data?.inpatients
            ? ipdRes.value.data.inpatients
            : [],
        labOrders: labRes.status === 'fulfilled' && labRes.value.data ? labRes.value.data : [],
        inventory: invRes.status === 'fulfilled' && invRes.value.data ? invRes.value.data : [],
      });
    } catch (err) {
      console.error('Failed to load department operations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Operations" subtitle="Beds, Inpatients & Services" />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['BEDS', 'INPATIENTS', 'DIAGNOSTICS', 'SUPPLIES'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'BEDS'
                ? 'Beds'
                : tab === 'INPATIENTS'
                ? 'Inpatients'
                : tab === 'DIAGNOSTICS'
                ? 'Diagnostics'
                : 'Supplies'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOperations} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : activeTab === 'BEDS' ? (
          <View>
            <Text style={styles.subTitle}>Department Bed Status</Text>
            {data.wards.length === 0 ? (
              <View style={styles.emptyCard}>
                <BedDouble size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No wards or beds linked to this department</Text>
              </View>
            ) : (
              data.wards.map((ward: any) => (
                <View key={ward.id} style={styles.wardCard}>
                  <View style={styles.wardHeader}>
                    <Text style={styles.wardName}>{ward.name}</Text>
                    <Text style={styles.wardBadge}>
                      {ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0}/
                      {ward.beds?.length || 0} Occupied
                    </Text>
                  </View>

                  <View style={styles.bedGrid}>
                    {(ward.beds || []).map((bed: any) => {
                      const isOccupied = bed.status === 'OCCUPIED';
                      return (
                        <View
                          key={bed.id}
                          style={[
                            styles.bedPill,
                            { backgroundColor: isOccupied ? '#FEE2E2' : '#CCFBF1' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bedNumber,
                              { color: isOccupied ? '#DC2626' : '#0F766E' },
                            ]}
                          >
                            {bed.bedNumber}
                          </Text>
                          <Text style={styles.bedStatus}>
                            {isOccupied ? 'Occupied' : 'Free'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'INPATIENTS' ? (
          <View>
            <Text style={styles.subTitle}>Active Inpatients</Text>
            {data.inpatients.length === 0 ? (
              <View style={styles.emptyCard}>
                <DoorOpen size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No currently admitted inpatients in this department</Text>
              </View>
            ) : (
              data.inpatients.map((adm: any) => (
                <View key={adm.id} style={styles.inpatientCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.inpatientInfo}>
                      <Text style={styles.inpatientName}>
                        {adm.patient?.firstName} {adm.patient?.lastName}
                      </Text>
                      <Text style={styles.inpatientUhid}>UHID: {adm.patient?.uhid}</Text>
                    </View>
                    <View style={styles.bedTag}>
                      <Text style={styles.bedTagText}>
                        Bed: {adm.bed?.bedNumber || adm.bedNumber || 'Assigned'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.docAttending}>
                    Attending: Dr. {adm.doctor?.user?.firstName || adm.doctor?.name || 'Department Physician'}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'DIAGNOSTICS' ? (
          <View>
            <Text style={styles.subTitle}>Recent Lab & Radiology Orders</Text>
            {data.labOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <FlaskConical size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No active diagnostic orders</Text>
              </View>
            ) : (
              data.labOrders.slice(0, 10).map((ord: any) => (
                <View key={ord.id} style={styles.inpatientCard}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inpatientName}>{ord.testName || 'Laboratory Test'}</Text>
                      <Text style={styles.inpatientUhid}>
                        Patient: {ord.patient?.firstName} {ord.patient?.lastName}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#CCFBF1' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#0F766E' }]}>
                        {ord.status || 'ORDERED'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.subTitle}>Low Stock & Consumables Alert</Text>
            {data.inventory.length === 0 ? (
              <View style={styles.emptyCard}>
                <CheckCircle2 size={36} color="#0F766E" />
                <Text style={styles.emptyText}>All department supplies are above safe thresholds</Text>
              </View>
            ) : (
              data.inventory.map((item: any) => (
                <View key={item.id} style={styles.inpatientCard}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inpatientName}>{item.name}</Text>
                      <Text style={styles.inpatientUhid}>Category: {item.category || 'Supplies'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#DC2626' }]}>
                        {item.currentStock || 0} {item.unit || 'units'} left
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#0F766E',
  },
  tabText: {
    fontSize: 12,
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
    paddingBottom: 32,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  wardBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedPill: {
    width: 60,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  bedNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  bedStatus: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  inpatientCard: {
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
    justifyContent: 'space-between',
  },
  inpatientInfo: {
    flex: 1,
  },
  inpatientName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  inpatientUhid: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  bedTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  docAttending: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

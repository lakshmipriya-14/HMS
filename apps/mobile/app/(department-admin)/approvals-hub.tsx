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
import { CheckSquare, Search, Clock, Layers, CalendarOff, Hammer, ShoppingCart } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function ApprovalsHubScreen() {
  const [data, setData] = useState<{ leaves: any[]; requests: any[] }>({ leaves: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LEAVES' | 'RESOURCES' | 'PURCHASE' | 'MAINTENANCE'>('ALL');
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    try {
      setRefreshing(true);
      const [leavesRes, reqRes] = await Promise.allSettled([
        mobileApiClient.departmentAdmin.getLeaves(),
        mobileApiClient.departmentAdmin.getRequests(),
      ]);

      setData({
        leaves: leavesRes.status === 'fulfilled' && leavesRes.value.data ? leavesRes.value.data : [],
        requests: reqRes.status === 'fulfilled' && reqRes.value.data ? reqRes.value.data : [],
      });
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const combinedItems = [
    ...data.leaves.map((l) => ({
      id: l.id,
      category: 'LEAVES',
      title: `${l.user?.firstName || 'Staff'} ${l.user?.lastName || ''} – ${l.leaveType || 'Leave Application'}`,
      description: `${new Date(l.startDate).toLocaleDateString('en-IN')} to ${new Date(l.endDate).toLocaleDateString('en-IN')} • Reason: ${l.reason || 'Personal'}`,
      status: l.status || 'PENDING',
      priority: 'MEDIUM',
      createdAt: l.createdAt,
    })),
    ...data.requests.map((r) => ({
      id: r.id,
      category: r.type || 'RESOURCES',
      title: r.title,
      description: r.description,
      status: r.status || 'PENDING',
      priority: r.priority || 'MEDIUM',
      createdAt: r.createdAt,
    })),
  ];

  const filtered = combinedItems.filter((item) => {
    if (activeTab !== 'ALL' && item.category !== activeTab) return false;
    if (!search) return true;
    return item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="Approvals Hub" subtitle="Requisitions & Reviews Tracking" />

      {/* Tabs */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {(['ALL', 'LEAVES', 'RESOURCES', 'PURCHASE', 'MAINTENANCE'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.chip, activeTab === tab && styles.chipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.chipText, activeTab === tab && styles.chipTextActive]}>
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'LEAVES'
                  ? 'Leaves'
                  : tab === 'RESOURCES'
                  ? 'Resources'
                  : tab === 'PURCHASE'
                  ? 'Purchases'
                  : 'Maintenance'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAll} tintColor="#1565C0" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckSquare size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No approval or requisition records found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isApproved = ['APPROVED', 'RESOLVED', 'COMPLETED'].includes(item.status);
            const isPending = !isApproved && item.status !== 'REJECTED';

            return (
              <View key={`${item.category}-${item.id}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.tagRow}>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeTagText}>{item.category}</Text>
                    </View>
                    <View
                      style={[
                        styles.priorityTag,
                        {
                          backgroundColor:
                            item.priority === 'URGENT' || item.priority === 'HIGH'
                              ? '#E8F1FC'
                              : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityTagText,
                          {
                            color:
                              item.priority === 'URGENT' || item.priority === 'HIGH'
                                ? '#DC2626'
                                : '#64748B',
                          },
                        ]}
                      >
                        {item.priority || 'MEDIUM'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isApproved ? '#E8F1FC' : isPending ? '#FEF3C7' : '#E8F1FC' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isApproved ? '#1565C0' : isPending ? '#F59E0B' : '#DC2626' },
                      ]}
                    >
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={styles.dateText}>
                    Logged: {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
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
  selectorBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#1565C0',
  },
  chipText: {
    fontSize: 12,
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
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#183153',
  },
  itemDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
});

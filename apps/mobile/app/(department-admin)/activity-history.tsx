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
import { History, Search, Activity, User, Clock } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function ActivityHistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getActivityLogs({ page: 1, limit: 50 });
      if (res.data) setLogs(res.data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const act = (log.action || '').toLowerCase();
    const details = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')).toLowerCase();
    return act.includes(search.toLowerCase()) || details.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="Department Audit Log" subtitle="Chronological Operations Trail" />

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          placeholder="Filter audit logs by action or keyword..."
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
          <RefreshControl refreshing={refreshing} onRefresh={loadLogs} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <History size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No activity records logged</Text>
          </View>
        ) : (
          filtered.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionText}>{log.action}</Text>
                </View>
                <Text style={styles.timeText}>
                  {new Date(log.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.detailsText}>
                {typeof log.details === 'string'
                  ? log.details
                  : log.details?.notes || log.details?.reason || JSON.stringify(log.details || {})}
              </Text>

              <View style={styles.cardFooter}>
                <User size={12} color="#64748B" />
                <Text style={styles.userText}>
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId || 'Department User'}
                </Text>
                <Text style={styles.ipText}>• {log.ipAddress || 'Internal'}</Text>
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
    marginBottom: 6,
  },
  actionBadge: {
    backgroundColor: '#EAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38845A',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  detailsText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  userText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  ipText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

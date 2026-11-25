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
import { Bell, CheckCheck, Megaphone, Clock } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.notifications.getNotifications();
      if (res.data) setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await mobileApiClient.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await mobileApiClient.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Notices" subtitle="Alerts & Hospital Broadcasts" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Alerts & Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <CheckCheck size={14} color="#0F766E" />
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>You're all caught up! No notifications</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notifCard,
                { backgroundColor: item.isRead ? '#FFFFFF' : '#F0FDFA' },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: item.isRead ? '#F1F5F9' : '#CCFBF1' },
                  ]}
                >
                  <Megaphone size={16} color={item.isRead ? '#64748B' : '#0F766E'} />
                </View>
                <View style={styles.textCol}>
                  <Text style={[styles.notifTitle, !item.isRead && { fontWeight: '900' }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifMsg}>{item.message}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={11} color="#94A3B8" />
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                {!item.isRead && (
                  <TouchableOpacity
                    style={styles.readBtn}
                    onPress={() => handleMarkAsRead(item.id)}
                  >
                    <Text style={styles.readBtnText}>Read</Text>
                  </TouchableOpacity>
                )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
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
  notifCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifMsg: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  readBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#CCFBF1',
    borderRadius: 6,
    marginLeft: 8,
  },
  readBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
});

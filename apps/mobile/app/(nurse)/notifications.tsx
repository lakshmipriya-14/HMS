import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import {
  BellRing,
  AlertCircle,
  Pill,
  HeartPulse,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  CheckCheck,
} from 'lucide-react-native';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'CRITICAL_VITALS' | 'MED_DUE' | 'DOCTOR_ORDER' | 'PATIENT_ASSIGNED' | 'DISCHARGE_TASK' | 'HANDOVER';
  priority: 'URGENT' | 'HIGH' | 'ROUTINE';
  time: string;
  isRead: boolean;
  targetRoute: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Critical Vitals Flagged',
    message: 'Bed ICCU-01 (Muthuvel K): BP 142/92 mmHg exceeds threshold. Dr. Senthil Nathan notified.',
    type: 'CRITICAL_VITALS',
    priority: 'URGENT',
    time: '10 mins ago',
    isRead: false,
    targetRoute: '/(nurse)/patients',
  },
  {
    id: 'notif-2',
    title: 'Medication Administration Due',
    message: 'Tab. Ecosprin 75mg is scheduled for Bed ICCU-01 (Muthuvel K) at 01:00 PM.',
    type: 'MED_DUE',
    priority: 'HIGH',
    time: '25 mins ago',
    isRead: false,
    targetRoute: '/(nurse)/medications',
  },
  {
    id: 'notif-3',
    title: 'New Doctor Treatment Order',
    message: 'Dr. Rajesh Kumar added pre-lunch GRBS check and wound dressing instruction for Bed SDW-04.',
    type: 'DOCTOR_ORDER',
    priority: 'HIGH',
    time: '1 hour ago',
    isRead: false,
    targetRoute: '/(nurse)/tasks',
  },
  {
    id: 'notif-4',
    title: 'Inpatient Bed Admission Assigned',
    message: 'New admission Saravanan R. (Right Femur Fracture) assigned to Bed ORTHO-12.',
    type: 'PATIENT_ASSIGNED',
    priority: 'ROUTINE',
    time: '2 hours ago',
    isRead: true,
    targetRoute: '/(nurse)/patients',
  },
  {
    id: 'notif-5',
    title: 'Shift Handover Acknowledged',
    message: 'Sister Anitha accepted morning shift handover protocol from Sister Kavitha.',
    type: 'HANDOVER',
    priority: 'ROUTINE',
    time: '08:15 AM',
    isRead: true,
    targetRoute: '/(nurse)/handover',
  },
];

export default function NurseNotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await mobileApiClient.notifications.getNotifications();
      if (res?.data && res.data.length > 0) {
        // Merge with existing notifications
      }
    } catch {
      // Gracefully use local records
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    mobileApiClient.notifications.markAllAsRead().catch(() => undefined);
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
    );
    router.push(item.targetRoute as any);
  };

  const filteredItems = items.filter((i) => {
    if (filter === 'UNREAD') return !i.isRead;
    if (filter === 'URGENT') return i.priority === 'URGENT';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Controls */}
      <View style={styles.topBar}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, filter === 'ALL' && styles.tabActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.tabText, filter === 'ALL' && styles.tabTextActive]}>
              All ({items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filter === 'UNREAD' && styles.tabActive]}
            onPress={() => setFilter('UNREAD')}
          >
            <Text style={[styles.tabText, filter === 'UNREAD' && styles.tabTextActive]}>
              Unread ({items.filter((i) => !i.isRead).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, filter === 'URGENT' && styles.tabActive]}
            onPress={() => setFilter('URGENT')}
          >
            <Text style={[styles.tabText, filter === 'URGENT' && styles.tabTextActive]}>
              Urgent
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <CheckCheck size={14} color="#38845A" />
          <Text style={styles.markAllText}>Mark Read</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38845A']} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <CheckCircle2 size={36} color="#059669" />
            <Text style={styles.emptyTitle}>All alerts acknowledged</Text>
            <Text style={styles.emptySub}>No unread notifications in this view</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUrgent = item.priority === 'URGENT';

          return (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread, isUrgent && styles.cardUrgent]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {item.type === 'CRITICAL_VITALS' && <HeartPulse size={22} color="#DC2626" />}
                {item.type === 'MED_DUE' && <Pill size={22} color="#D97706" />}
                {item.type === 'DOCTOR_ORDER' && <ClipboardList size={22} color="#0284C7" />}
                {item.type === 'PATIENT_ASSIGNED' && <BellRing size={22} color="#38845A" />}
                {item.type === 'HANDOVER' && <Clock size={22} color="#7C3AED" />}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>

                <Text style={styles.cardMsg}>{item.message}</Text>

                <View style={styles.cardActionRow}>
                  <Text style={styles.actionPrompt}>Tap to view related clinical record</Text>
                  <ArrowRight size={14} color="#38845A" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 3, flex: 1, marginRight: 8 },
  tab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#38845A' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF5ED', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  markAllText: { fontSize: 11, fontWeight: '700', color: '#38845A' },
  emptyCard: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderRadius: 12 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  cardUnread: { backgroundColor: '#EAF5ED', borderColor: '#CDE8D5' },
  cardUrgent: { borderColor: '#CDE8D5', backgroundColor: '#FFFDFD' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', flex: 1 },
  cardTitleBold: { fontWeight: '900', color: '#38845A' },
  cardTime: { fontSize: 10, color: '#94A3B8' },
  cardMsg: { fontSize: 12, color: '#334155', lineHeight: 17 },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  actionPrompt: { fontSize: 10, fontWeight: '700', color: '#38845A' },
});

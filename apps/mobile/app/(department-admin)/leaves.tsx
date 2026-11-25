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
import { CalendarOff, CheckCircle2, XCircle, Clock, ThumbsUp } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentLeavesScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadLeaves = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getLeaves();
      if (res.data) setLeaves(res.data);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleAction = async (leaveId: string, action: 'RECOMMEND' | 'APPROVE' | 'REJECT') => {
    try {
      setReviewingId(leaveId);
      await mobileApiClient.departmentAdmin.reviewLeave(leaveId, action, `Mobile ${action.toLowerCase()}`);
      setLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status: action === 'RECOMMEND' ? 'RECOMMENDED' : action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : l))
      );
    } catch (err) {
      console.error('Failed to review leave:', err);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Staff Leave Requests" subtitle="Approval & Shift Coverage" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadLeaves} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : leaves.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarOff size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No pending staff leave applications</Text>
          </View>
        ) : (
          leaves.map((item) => {
            const isPending = ['PENDING', 'SUBMITTED', 'REQUESTED'].includes(item.status);
            const isProcessing = reviewingId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.user?.firstName?.[0] || 'S'}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.staffName}>
                      {item.user?.firstName} {item.user?.lastName}
                    </Text>
                    <Text style={styles.leaveType}>
                      {item.leaveType || 'Casual Leave'} ({item.totalDays || 1} days)
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{item.status || 'PENDING'}</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Clock size={12} color="#64748B" />
                  <Text style={styles.dateText}>
                    {new Date(item.startDate).toLocaleDateString('en-IN')} –{' '}
                    {new Date(item.endDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>

                <Text style={styles.reasonText}>Reason: {item.reason || 'Personal emergency'}</Text>

                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.recommendBtn]}
                      disabled={isProcessing}
                      onPress={() => handleAction(item.id, 'RECOMMEND')}
                    >
                      <ThumbsUp size={12} color="#0F766E" />
                      <Text style={styles.recommendBtnText}>Recommend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      disabled={isProcessing}
                      onPress={() => handleAction(item.id, 'APPROVE')}
                    >
                      <CheckCircle2 size={12} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      disabled={isProcessing}
                      onPress={() => handleAction(item.id, 'REJECT')}
                    >
                      <XCircle size={12} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#0F766E',
    fontWeight: '800',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveType: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  reasonText: {
    fontSize: 11,
    color: '#334155',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  recommendBtn: {
    backgroundColor: '#CCFBF1',
  },
  recommendBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  approveBtn: {
    backgroundColor: '#0F766E',
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});

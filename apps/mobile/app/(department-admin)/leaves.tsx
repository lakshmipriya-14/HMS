import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  X,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentLeavesScreen() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'RECOMMEND' | 'APPROVE' | 'REJECT'>('RECOMMEND');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  const openReviewModal = (item: any, action: 'RECOMMEND' | 'APPROVE' | 'REJECT') => {
    setSelectedLeave(item);
    setReviewAction(action);
    setRemarks('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedLeave) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.reviewLeave(
        selectedLeave.id,
        reviewAction,
        remarks.trim() || `Department Admin: ${reviewAction.toLowerCase()}ed`
      );
      setReviewModal(false);
      setSelectedLeave(null);
      setToastMsg(`Leave application ${reviewAction.toLowerCase()}ed successfully`);
      setTimeout(() => setToastMsg(''), 3000);
      loadLeaves();
    } catch (err) {
      console.error('Failed to review leave:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Staff Leave Requests" />

      {toastMsg ? (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadLeaves} tintColor="#38845A" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : leaves.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarOff size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No pending staff leave applications</Text>
          </View>
        ) : (
          leaves.map((item) => {
            const isPending = ['PENDING', 'SUBMITTED', 'REQUESTED'].includes(item.status);

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
                      {item.leaveType || 'Casual Leave'} • {item.totalDays || 1} day(s)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'APPROVED'
                            ? '#D1FAE5'
                            : item.status === 'REJECTED'
                            ? '#EAF5ED'
                            : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            item.status === 'APPROVED'
                              ? '#059669'
                              : item.status === 'REJECTED'
                              ? '#DC2626'
                              : '#D97706',
                        },
                      ]}
                    >
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Calendar size={13} color="#64748B" />
                  <Text style={styles.dateText}>
                    {new Date(item.startDate).toLocaleDateString('en-IN')} –{' '}
                    {new Date(item.endDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>

                {item.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                  </View>
                ) : null}

                {isPending && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.recommendBtn]}
                      onPress={() => openReviewModal(item, 'RECOMMEND')}
                    >
                      <ThumbsUp size={13} color="#38845A" />
                      <Text style={styles.recommendBtnText}>Recommend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => openReviewModal(item, 'APPROVE')}
                    >
                      <CheckCircle2 size={13} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      onPress={() => openReviewModal(item, 'REJECT')}
                    >
                      <XCircle size={13} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Leave Review Modal */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Review Leave Application
              </Text>
              <TouchableOpacity onPress={() => setReviewModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedLeave && (
              <View style={styles.modalBody}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryName}>
                    {selectedLeave.user?.firstName} {selectedLeave.user?.lastName}
                  </Text>
                  <Text style={styles.summarySub}>
                    {selectedLeave.leaveType || 'Leave'} • {selectedLeave.totalDays || 1} day(s)
                  </Text>
                  <Text style={styles.summaryDates}>
                    {new Date(selectedLeave.startDate).toLocaleDateString('en-IN')} to{' '}
                    {new Date(selectedLeave.endDate).toLocaleDateString('en-IN')}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Review Action</Text>
                <View style={styles.actionSelector}>
                  {(['RECOMMEND', 'APPROVE', 'REJECT'] as const).map((act) => (
                    <TouchableOpacity
                      key={act}
                      style={[
                        styles.actChip,
                        reviewAction === act && styles.actChipActive,
                        reviewAction === act && act === 'REJECT' && styles.actChipReject,
                      ]}
                      onPress={() => setReviewAction(act)}
                    >
                      <Text
                        style={[
                          styles.actChipText,
                          reviewAction === act && styles.actChipTextActive,
                        ]}
                      >
                        {act}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Admin Remarks & Handover Notes</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80 }]}
                  multiline
                  numberOfLines={3}
                  placeholder="e.g. Ward duty handover confirmed with Nurse Priya..."
                  value={remarks}
                  onChangeText={setRemarks}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    reviewAction === 'REJECT' && { backgroundColor: '#DC2626' },
                    submitting && { opacity: 0.6 },
                  ]}
                  onPress={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      Submit {reviewAction} Decision
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toastText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 12,
    color: '#1E293B',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  recommendBtn: {
    backgroundColor: '#EAF5ED',
    borderWidth: 1,
    borderColor: '#EAF5ED',
  },
  recommendBtnText: {
    color: '#38845A',
    fontSize: 11,
    fontWeight: '700',
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#EAF5ED',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summarySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  summaryDates: {
    fontSize: 11,
    color: '#38845A',
    marginTop: 4,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  actionSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  actChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  actChipActive: {
    backgroundColor: '#EAF5ED',
    borderColor: '#38845A',
  },
  actChipReject: {
    backgroundColor: '#EAF5ED',
    borderColor: '#DC2626',
  },
  actChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  actChipTextActive: {
    color: '#38845A',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#38845A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

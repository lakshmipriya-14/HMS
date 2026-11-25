import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  CheckSquare,
  ChevronLeft,
  CalendarCheck,
  UserCheck,
  BedDouble,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  X,
  History,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function AdminApprovalsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'APPOINTMENTS' | 'LEAVES' | 'BEDS'>('ALL');
  const [approvalsData, setApprovalsData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Action / Details Modal
  const [actionItem, setActionItem] = useState<{
    type: 'appointment-request' | 'doctor-leave' | 'bed-turnover';
    id: string;
    title: string;
    details: any;
    action: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadApprovals = async () => {
    try {
      setRefreshing(true);
      const [pendingRes, histRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getApprovals(),
        mobileApiClient.hospitalAdmin.getApprovalHistory(),
      ]);
      if (pendingRes.data) setApprovalsData(pendingRes.data);
      if (histRes.data) setHistoryData(histRes.data);
    } catch (e: any) {
      console.error('Failed to load approvals:', e);
      Alert.alert('Approvals Error', e.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleExecuteAction = async () => {
    if (!actionItem) return;
    try {
      setSubmitting(true);
      const res = await mobileApiClient.hospitalAdmin.processApproval(
        actionItem.type,
        actionItem.id,
        actionItem.action,
        actionNotes || undefined
      );
      setActionItem(null);
      setActionNotes('');
      await loadApprovals();
      Alert.alert(
        actionItem.action === 'APPROVE' ? 'Request Approved' : 'Request Rejected',
        res.message || 'Action recorded successfully.'
      );
    } catch (err: any) {
      Alert.alert('Processing Error', err.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = approvalsData?.summary || {};
  const apptRequests: any[] = approvalsData?.appointmentRequests || [];
  const doctorLeaves: any[] = approvalsData?.doctorLeaves || [];
  const bedTurnovers: any[] = approvalsData?.bedTurnovers || [];
  const unassignedDepts: any[] = approvalsData?.unassignedDepartments || [];

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Approvals Hub"
        subtitle="Executive Governance"
        alertsCount={summary.totalPending || 0}
      />

      {/* Main Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pending')}
        >
          <CheckSquare size={16} color={activeTab === 'pending' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'pending' && styles.tabBtnTextActive]}>
            Pending ({summary.totalPending || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <History size={16} color={activeTab === 'history' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            Approval History ({historyData.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Filter Chips for Pending */}
      {activeTab === 'pending' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('ALL')}
          >
            <Text style={[styles.filterChipText, categoryFilter === 'ALL' && styles.filterChipTextActive]}>
              All ({summary.totalPending || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === 'APPOINTMENTS' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('APPOINTMENTS')}
          >
            <Text style={[styles.filterChipText, categoryFilter === 'APPOINTMENTS' && styles.filterChipTextActive]}>
              Appointments ({apptRequests.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === 'LEAVES' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('LEAVES')}
          >
            <Text style={[styles.filterChipText, categoryFilter === 'LEAVES' && styles.filterChipTextActive]}>
              Doctor Leaves ({doctorLeaves.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === 'BEDS' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('BEDS')}
          >
            <Text style={[styles.filterChipText, categoryFilter === 'BEDS' && styles.filterChipTextActive]}>
              Bed Turnovers ({bedTurnovers.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Fetching live approval queues...</Text>
        </View>
      ) : activeTab === 'history' ? (
        /* APPROVAL HISTORY TAB */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadApprovals} tintColor="#0F766E" />
          }
        >
          {historyData.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle size={28} color="#059669" />
              <Text style={styles.emptyTitle}>No Approval History Yet</Text>
              <Text style={styles.emptySub}>
                Actions on appointment requests, leaves, and bed turnovers will appear here.
              </Text>
            </View>
          ) : (
            historyData.map((item) => {
              const isApproved = item.action === 'APPROVE' || item.action === 'CLEAR';
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <View
                      style={[
                        styles.historyActionBadge,
                        { backgroundColor: isApproved ? '#D1FAE5' : '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.historyActionText,
                          { color: isApproved ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {item.action}
                      </Text>
                    </View>
                    <Text style={styles.historyDate}>
                      {new Date(item.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.historyResource}>
                    Resource: {item.resource.replace('_', ' ')}
                  </Text>
                  <Text style={styles.historyApprover}>
                    By: {item.approverEmail}
                  </Text>
                  {item.details && (
                    <Text style={styles.historyNotes}>
                      {item.details.notes || item.details.reason || JSON.stringify(item.details)}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* PENDING REQUESTS TAB */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadApprovals} tintColor="#0F766E" />
          }
        >
          {/* SECTION 1: APPOINTMENT REQUESTS */}
          {(categoryFilter === 'ALL' || categoryFilter === 'APPOINTMENTS') && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <CalendarCheck size={16} color="#2563EB" />
                <Text style={styles.sectionTitle}>Online Appointment Requests ({apptRequests.length})</Text>
              </View>

              {apptRequests.length === 0 ? (
                <Text style={styles.emptyInline}>No pending patient appointment requests.</Text>
              ) : (
                apptRequests.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <View style={styles.cardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardMain}>{req.patientName}</Text>
                        <Text style={styles.cardSub}>
                          Phone: {req.phone} • Speciality: {req.specialty}
                        </Text>
                        <Text style={styles.cardDate}>
                          Preferred: {new Date(req.preferredDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>PENDING</Text>
                      </View>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() =>
                          setActionItem({
                            type: 'appointment-request',
                            id: req.id,
                            title: `Reject Request for ${req.patientName}`,
                            details: req,
                            action: 'REJECT',
                          })
                        }
                      >
                        <XCircle size={14} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() =>
                          setActionItem({
                            type: 'appointment-request',
                            id: req.id,
                            title: `Approve & Schedule for ${req.patientName}`,
                            details: req,
                            action: 'APPROVE',
                          })
                        }
                      >
                        <CheckCircle size={14} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Approve & Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SECTION 2: DOCTOR LEAVE APPLICATIONS */}
          {(categoryFilter === 'ALL' || categoryFilter === 'LEAVES') && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <UserCheck size={16} color="#0F766E" />
                <Text style={styles.sectionTitle}>Doctor Leave Applications ({doctorLeaves.length})</Text>
              </View>

              {doctorLeaves.length === 0 ? (
                <Text style={styles.emptyInline}>No pending doctor leave requests.</Text>
              ) : (
                doctorLeaves.map((leave) => {
                  const doctorName = leave.doctor?.employee?.user
                    ? `Dr. ${leave.doctor.employee.user.firstName} ${leave.doctor.employee.user.lastName}`
                    : 'Doctor';
                  const dept = leave.doctor?.department?.name || 'General Medicine';
                  return (
                    <View key={leave.id} style={styles.card}>
                      <View style={styles.cardHead}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardMain}>{doctorName}</Text>
                          <Text style={styles.cardSub}>Department: {dept}</Text>
                          <Text style={styles.cardDate}>
                            Duration: {new Date(leave.startDate).toLocaleDateString()} to{' '}
                            {new Date(leave.endDate).toLocaleDateString()}
                          </Text>
                          <Text style={styles.reasonText}>Reason: {leave.reason}</Text>
                        </View>
                        <View style={[styles.pendingBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.pendingBadgeText, { color: '#D97706' }]}>
                            LEAVE
                          </Text>
                        </View>
                      </View>

                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() =>
                            setActionItem({
                              type: 'doctor-leave',
                              id: leave.id,
                              title: `Reject Leave for ${doctorName}`,
                              details: leave,
                              action: 'REJECT',
                            })
                          }
                        >
                          <XCircle size={14} color="#DC2626" />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() =>
                            setActionItem({
                              type: 'doctor-leave',
                              id: leave.id,
                              title: `Approve Leave for ${doctorName}`,
                              details: leave,
                              action: 'APPROVE',
                            })
                          }
                        >
                          <CheckCircle size={14} color="#FFFFFF" />
                          <Text style={styles.approveBtnText}>Approve Leave</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* SECTION 3: BED TURNOVER CLEARANCES */}
          {(categoryFilter === 'ALL' || categoryFilter === 'BEDS') && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <BedDouble size={16} color="#E11D48" />
                <Text style={styles.sectionTitle}>Bed Sanitization Clearances ({bedTurnovers.length})</Text>
              </View>

              {bedTurnovers.length === 0 ? (
                <Text style={styles.emptyInline}>All inpatient beds sanitized and available.</Text>
              ) : (
                bedTurnovers.map((bed) => (
                  <View key={bed.id} style={styles.card}>
                    <View style={styles.cardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardMain}>
                          Bed {bed.bedNumber} (Room {bed.roomNumber})
                        </Text>
                        <Text style={styles.cardSub}>
                          Ward: {bed.ward?.name || 'General Ward'} • Floor {bed.ward?.floorNumber || 1}
                        </Text>
                        <Text style={styles.cardDate}>
                          Current Status: {bed.status} • Rate: ₹ {Number(bed.dailyRate) || 1000}/day
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.pendingBadge,
                          {
                            backgroundColor:
                              bed.status === 'CLEANING' ? '#FEF3C7' : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pendingBadgeText,
                            {
                              color:
                                bed.status === 'CLEANING' ? '#D97706' : '#DC2626',
                            },
                          ]}
                        >
                          {bed.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() =>
                          setActionItem({
                            type: 'bed-turnover',
                            id: bed.id,
                            title: `Flag Bed ${bed.bedNumber} for Maintenance`,
                            details: bed,
                            action: 'REJECT',
                          })
                        }
                      >
                        <AlertCircle size={14} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Send to Maint</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() =>
                          setActionItem({
                            type: 'bed-turnover',
                            id: bed.id,
                            title: `Clear Bed ${bed.bedNumber} as AVAILABLE`,
                            details: bed,
                            action: 'APPROVE',
                          })
                        }
                      >
                        <CheckCircle size={14} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Clear & Release</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SECTION 4: DEPARTMENT LEADERSHIP COVERAGE */}
          {unassignedDepts.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Building2 size={16} color="#D97706" />
                <Text style={styles.sectionTitle}>
                  Department Leadership Coverage ({unassignedDepts.length})
                </Text>
              </View>

              {unassignedDepts.map((d: any) => (
                <View key={d.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardMain}>{d.name} ({d.code})</Text>
                      <Text style={styles.cardSub}>
                        Department Admin: Not Assigned (Mandatory Rule: 1 Admin per Dept)
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn, { marginTop: 10 }]}
                    onPress={() => router.push('/(admin)/departments')}
                  >
                    <Text style={styles.approveBtnText}>Assign Department Admin</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* CONFIRMATION / NOTES MODAL */}
      <Modal visible={!!actionItem} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{actionItem?.title}</Text>
              <TouchableOpacity onPress={() => setActionItem(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              {actionItem?.action === 'APPROVE'
                ? 'Confirming will update live database status and record this executive approval.'
                : 'Confirming will reject this request and log an immutable audit event.'}
            </Text>

            <Text style={styles.fieldLabel}>Decision Notes / Remarks (Optional)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Approved per hospital clinical protocol"
              value={actionNotes}
              onChangeText={setActionNotes}
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    actionItem?.action === 'APPROVE' ? '#0F766E' : '#DC2626',
                },
              ]}
              onPress={handleExecuteAction}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  Confirm {actionItem?.action === 'APPROVE' ? 'Approval' : 'Rejection'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, color: '#64748B', marginTop: 10, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0F766E',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F766E',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 46,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 40 },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F766E',
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  pendingBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#0F766E',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyInline: {
    fontSize: 12,
    color: '#94A3B8',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyActionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyActionText: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  historyResource: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyApprover: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  historyNotes: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 16,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

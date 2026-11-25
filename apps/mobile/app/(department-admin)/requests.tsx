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
  Modal,
} from 'react-native';
import { Layers, Plus, Search, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reqType, setReqType] = useState('RESOURCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getRequests();
      if (res.data) setRequests(res.data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.createRequest({
        type: reqType,
        title,
        description,
        priority,
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadRequests();
    } catch (err) {
      console.error('Failed to submit request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Requisitions" subtitle="Resource & Work Orders" />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Active Tickets & Requisitions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Request</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRequests} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Layers size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active department requisitions</Text>
          </View>
        ) : (
          requests.map((item) => {
            const isApproved = item.status === 'APPROVED' || item.status === 'RESOLVED';
            const isPending = !isApproved && item.status !== 'REJECTED';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.tagRow}>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeTagText}>{item.type || 'RESOURCE'}</Text>
                    </View>
                    <View
                      style={[
                        styles.priorityTag,
                        {
                          backgroundColor:
                            item.priority === 'URGENT' || item.priority === 'HIGH'
                              ? '#FEE2E2'
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
                      styles.statusBadge,
                      { backgroundColor: isApproved ? '#CCFBF1' : isPending ? '#FEF3C7' : '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isApproved ? '#0F766E' : isPending ? '#D97706' : '#DC2626' },
                      ]}
                    >
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={styles.dateText}>
                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Department Requisition</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Request Category</Text>
              <View style={styles.typeButtonsRow}>
                {(['RESOURCE', 'PURCHASE', 'MAINTENANCE'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeSelectBtn, reqType === t && styles.typeSelectBtnActive]}
                    onPress={() => setReqType(t)}
                  >
                    <Text
                      style={[
                        styles.typeSelectText,
                        reqType === t && styles.typeSelectTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject / Item Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Extra ICU monitors / Nurse shift support"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Urgency Priority</Text>
              <View style={styles.typeButtonsRow}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.typeSelectBtn, priority === p && styles.typeSelectBtnActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.typeSelectText,
                        priority === p && styles.typeSelectTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Detailed Description & Justification *</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                multiline
                numberOfLines={3}
                placeholder="Describe clinical requirement or location..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Submitting...' : 'Submit Requisition'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    color: '#334155',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeSelectBtnActive: {
    backgroundColor: '#0F766E',
  },
  typeSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  typeSelectTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitButton: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

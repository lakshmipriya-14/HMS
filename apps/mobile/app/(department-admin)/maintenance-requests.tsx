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
import { Hammer, Plus, Search, CheckCircle2, Clock, X, AlertTriangle } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function MaintenanceRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadRequests = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getRequests({ type: 'MAINTENANCE' });
      if (res.data) setRequests(res.data);
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) return;
    try {
      setSubmitting(true);
      await mobileApiClient.departmentAdmin.createRequest({
        type: 'MAINTENANCE',
        title,
        priority,
        description: `${description} [Location: ${location || 'Department Floor'}]`,
      });
      setCreateModal(false);
      setTitle('');
      setLocation('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadRequests();
    } catch (err) {
      console.error('Failed to create maintenance ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader showBack={true} fallbackHref="/(department-admin)/more" title="Facility Maintenance" subtitle="Work Orders, Electrical & HVAC" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Department Tickets</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={15} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Log Ticket</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRequests} tintColor="#38845A" />
        }
      >
        {success && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color="#38845A" />
            <Text style={styles.successText}>Maintenance ticket dispatched to engineering</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#38845A" style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Hammer size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No maintenance tickets logged</Text>
          </View>
        ) : (
          requests.map((item) => {
            const isResolved = item.status === 'RESOLVED' || item.status === 'COMPLETED';

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSub}>Priority: {item.priority || 'MEDIUM'}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isResolved ? '#EAF5ED' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isResolved ? '#38845A' : '#D97706' },
                      ]}
                    >
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.descText}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <Clock size={12} color="#94A3B8" />
                  <Text style={styles.dateText}>
                    Date: {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Maintenance Ticket</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Issue Summary *</Text>
              <TextInput
                style={styles.modalInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. AC leaking in Consultation Room 2"
              />

              <Text style={styles.inputLabel}>Exact Room / Location</Text>
              <TextInput
                style={styles.modalInput}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Room 204, Ward A"
              />

              <Text style={styles.inputLabel}>Urgency Priority</Text>
              <View style={styles.priorityRow}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityBtnText, priority === p && styles.priorityBtnTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Issue Details *</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe fault, symptoms, safety hazard..."
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Dispatch Ticket'}
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38845A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF5ED',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38845A',
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
  },
  infoCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
  descText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 8,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityBtnActive: {
    backgroundColor: '#38845A',
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  priorityBtnTextActive: {
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
  submitBtn: {
    backgroundColor: '#38845A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

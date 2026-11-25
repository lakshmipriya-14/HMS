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
import { HeartPulse, Search, Phone, Calendar, User, ChevronRight } from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentPatientsScreen() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadPatients = async () => {
    try {
      setRefreshing(true);
      const res = await mobileApiClient.departmentAdmin.getPatients({ query: search || undefined });
      if (res.data) setPatients(res.data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Patients" subtitle="Clinical Records & Directory" />

      <View style={styles.searchBarContainer}>
        <Search size={16} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by UHID, patient name, phone..."
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
          <RefreshControl refreshing={refreshing} onRefresh={loadPatients} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <View style={styles.emptyState}>
            <HeartPulse size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No department patients found</Text>
          </View>
        ) : (
          patients.map((pat) => (
            <View key={pat.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {pat.firstName?.[0] || 'P'}
                    {pat.lastName?.[0] || ''}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.patientName}>
                    {pat.firstName} {pat.lastName}
                  </Text>
                  <Text style={styles.uhidText}>UHID: {pat.uhid || '—'}</Text>
                </View>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>
                    {pat.gender || 'M'} • {pat.age || 35}y
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.metaItem}>
                  <Phone size={13} color="#64748B" />
                  <Text style={styles.metaText}>{pat.phone || 'No phone'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={13} color="#64748B" />
                  <Text style={styles.metaText}>
                    {pat.bloodGroup ? `Blood: ${pat.bloodGroup}` : 'Active File'}
                  </Text>
                </View>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0F766E',
    fontWeight: '800',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  uhidText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  genderBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});

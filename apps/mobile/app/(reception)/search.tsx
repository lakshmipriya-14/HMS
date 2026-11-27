import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mobileApiClient } from '../../services/api';
import {
  Search,
  User,
  Phone,
  Calendar,
  Ticket,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react-native';

export default function ReceptionSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Search Required', 'Please enter a Patient Name, UHID, or Mobile Number.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await mobileApiClient.reception.searchPatients(query.trim());
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch {
      setResults([]);
      Alert.alert('Patient search failed', 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#1565C0" />
        <TextInput
          style={styles.input}
          placeholder="Search by UHID, name, or phone"
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchBtnText}>Search Patient Directory</Text>}
      </TouchableOpacity>

      {/* Results Header */}
      {hasSearched && (
        <Text style={styles.resultsCount}>
          Found {results.length} matching registered patient record{results.length === 1 ? '' : 's'}
        </Text>
      )}

      {/* Results List */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          hasSearched && !loading ? (
            <View style={styles.emptyCard}>
              <User size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No patient record found</Text>
              <Text style={styles.emptySub}>Verify UHID or register as new patient</Text>
              <TouchableOpacity
                style={styles.newRegLink}
                onPress={() => router.push('/(reception)/register')}
              >
                <Text style={styles.newRegLinkText}>+ Register as New Patient</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.patientCard}>
            <View style={styles.pHeader}>
              <View style={styles.uhidBadge}>
                <Text style={styles.uhidBadgeText}>{item.uhid}</Text>
              </View>
              <Text style={styles.genderTag}>
                {item.gender?.charAt(0)} • {item.bloodGroup?.replace('_', ' ') || 'Blood Group N/A'}
              </Text>
            </View>

            <Text style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>

            <View style={styles.infoRow}>
              <Phone size={13} color="#64748B" />
              <Text style={styles.infoText}>{item.phone}</Text>
              <Text style={styles.infoDot}>•</Text>
              <Text style={styles.infoText}>DOB: {item.dateOfBirth}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => router.push('/(reception)/appointments' as any)}
              >
                <Calendar size={13} color="#FFFFFF" />
                <Text style={styles.bookBtnText}>Book Appointment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tokenBtn}
                onPress={() => router.push('/(reception)/checkin' as any)}
              >
                <Ticket size={13} color="#1565C0" />
                <Text style={styles.tokenBtnText}>Check In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  input: { flex: 1, fontSize: 13, color: '#183153' },
  searchBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  searchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  resultsCount: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10 },
  emptyCard: { alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 14 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#183153', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  newRegLink: { marginTop: 14, backgroundColor: '#E8F1FC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newRegLinkText: { fontSize: 12, fontWeight: '800', color: '#1565C0' },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  uhidBadge: { backgroundColor: '#E8F1FC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  uhidBadgeText: { fontSize: 11, fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' },
  genderTag: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '800', color: '#183153' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: '#64748B' },
  infoDot: { color: '#CBD5E1' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  bookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565C0',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  bookBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  tokenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F1FC',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  tokenBtnText: { color: '#1565C0', fontSize: 11, fontWeight: '700' },
});


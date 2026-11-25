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
} from 'react-native';
import {
  BedDouble,
  Users,
  CalendarCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

type Tab = 'beds' | 'ipd' | 'opd';

export default function AdminOperationsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('beds');
  const [wards, setWards] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [wardRes, admRes, qRes] = await Promise.all([
        mobileApiClient.hospitalAdmin.getWards(),
        mobileApiClient.hospitalAdmin.getAdmissions(),
        mobileApiClient.reception.getTodayQueue().catch(() => ({ data: [] })),
      ]);
      if (wardRes.data) setWards(wardRes.data);
      if (admRes.data) setAdmissions(admRes.data);
      if (qRes.data) setQueue(qRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <AdminHeader title="Clinical Operations" subtitle="Bed Census & Live Flow" />

      {/* Segmented Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'beds' && styles.tabItemActive]}
          onPress={() => setActiveTab('beds')}
        >
          <BedDouble size={16} color={activeTab === 'beds' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'beds' && styles.tabLabelActive]}>
            Bed Census
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ipd' && styles.tabItemActive]}
          onPress={() => setActiveTab('ipd')}
        >
          <Users size={16} color={activeTab === 'ipd' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'ipd' && styles.tabLabelActive]}>
            Inpatients ({admissions.filter((a) => a.status === 'ADMITTED').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'opd' && styles.tabItemActive]}
          onPress={() => setActiveTab('opd')}
        >
          <CalendarCheck size={16} color={activeTab === 'opd' ? '#0F766E' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'opd' && styles.tabLabelActive]}>
            OPD Queue
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#0F766E" />
          }
        >
          {/* TAB 1: BED CENSUS */}
          {activeTab === 'beds' && (
            <View>
              {wards.map((ward) => {
                const totalBeds = ward.beds?.length || ward.totalBeds || 0;
                const occBeds = ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0;
                const occRate = totalBeds > 0 ? Math.round((occBeds / totalBeds) * 100) : 0;
                return (
                  <View key={ward.id} style={styles.card}>
                    <View style={styles.wardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wardName}>{ward.name}</Text>
                        <Text style={styles.wardMeta}>
                          Code: {ward.code} • Floor {ward.floorNumber} • Gender: {ward.genderAllowed}
                        </Text>
                      </View>
                      <View style={styles.occBadge}>
                        <Text style={styles.occBadgeText}>{occRate}% Occ</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${occRate}%`,
                            backgroundColor: occRate > 85 ? '#E11D48' : '#0F766E',
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.wardStat}>
                      {occBeds} occupied / {totalBeds} total beds ({totalBeds - occBeds} available)
                    </Text>

                    {/* Beds Grid Preview */}
                    <View style={styles.bedMiniGrid}>
                      {(ward.beds || []).slice(0, 8).map((b: any) => {
                        const isOcc = b.status === 'OCCUPIED';
                        const isMaint = b.status === 'MAINTENANCE';
                        return (
                          <View
                            key={b.id}
                            style={[
                              styles.bedChip,
                              isOcc && styles.bedChipOcc,
                              isMaint && styles.bedChipMaint,
                            ]}
                          >
                            <Text
                              style={[
                                styles.bedChipText,
                                isOcc && styles.bedChipTextOcc,
                                isMaint && styles.bedChipTextMaint,
                              ]}
                            >
                              {b.bedNumber}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: INPATIENT IPD */}
          {activeTab === 'ipd' && (
            <View>
              {admissions.length === 0 ? (
                <Text style={styles.emptyText}>No inpatient admissions recorded.</Text>
              ) : (
                admissions.map((adm) => {
                  const patientName = adm.patient
                    ? `${adm.patient.firstName || ''} ${adm.patient.lastName || ''}`.trim()
                    : (adm.currentPatientName || 'Patient');
                  const doctorName = adm.admittingDoctor?.employee?.user
                    ? `Dr. ${adm.admittingDoctor.employee.user.firstName} ${adm.admittingDoctor.employee.user.lastName}`.trim()
                    : (adm.admittingDoctor?.user?.name || 'Dr. Consultant');

                  return (
                    <View key={adm.id} style={styles.card}>
                      <View style={styles.ipdHead}>
                        <View>
                          <Text style={styles.patientName}>{patientName}</Text>
                          <Text style={styles.uhidText}>UHID: {adm.patient?.uhid || adm.patientId}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusTag,
                            {
                              backgroundColor:
                                adm.status === 'ADMITTED' ? '#CCFBF1' : '#F1F5F9',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              {
                                color:
                                  adm.status === 'ADMITTED' ? '#0F766E' : '#64748B',
                              },
                            ]}
                          >
                            {adm.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.ipdDetailBox}>
                        <Text style={styles.ipdDetailText}>
                          🛏️ Ward: {adm.ward?.name || 'General Ward'} • Bed {adm.bed?.bedNumber || '-'}
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          👨‍⚕️ Attending: {doctorName}
                        </Text>
                        <Text style={styles.ipdDetailText}>
                          📋 Diagnosis: {adm.initialDiagnosis || adm.admissionReason || 'Clinical Evaluation'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: OPD QUEUE */}
          {activeTab === 'opd' && (
            <View>
              {queue.length === 0 ? (
                <Text style={styles.emptyText}>No OPD appointments scheduled for today.</Text>
              ) : (
                queue.map((q: any) => {
                  const qPatient = q.patient
                    ? `${q.patient.firstName || ''} ${q.patient.lastName || ''}`.trim()
                    : (q.patientName || 'Patient');
                  const qDoctor = q.doctor?.employee?.user
                    ? `Dr. ${q.doctor.employee.user.firstName} ${q.doctor.employee.user.lastName}`.trim()
                    : (q.doctor?.user?.name || 'Consultant');

                  return (
                    <View key={q.id} style={styles.card}>
                      <View style={styles.queueRow}>
                        <View style={styles.tokenCircle}>
                          <Text style={styles.tokenText}>#{q.tokenNumber || q.id.slice(0, 4)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.patientName}>{qPatient}</Text>
                          <Text style={styles.queueMeta}>
                            {q.department?.name || 'OPD'} • {qDoctor}
                          </Text>
                          <Text style={styles.queueTime}>Time: {q.slotTime || 'Scheduled'}</Text>
                        </View>
                        <View style={styles.opdBadge}>
                          <Text style={styles.opdBadgeText}>{q.status}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0F766E',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F766E',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  wardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  wardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  occBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wardStat: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  bedMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  bedChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bedChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bedChipOcc: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  bedChipTextOcc: {
    color: '#E11D48',
  },
  bedChipMaint: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  bedChipTextMaint: {
    color: '#D97706',
  },
  ipdHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  uhidText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ipdDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 4,
  },
  ipdDetailText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  queueMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  queueTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  opdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  opdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 24,
  },
});

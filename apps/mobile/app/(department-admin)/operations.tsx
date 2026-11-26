import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BedDouble,
  DoorOpen,
  CalendarCheck,
  ClipboardList,
  UserPlus,
  LogOut,
  HeartPulse,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentOperationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPD' | 'IPD' | 'BEDS' | 'DISCHARGE'>('OPD');

  // Operations data
  const [wards, setWards] = useState<any[]>([]);
  const [inpatients, setInpatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [discharges, setDischarges] = useState<any[]>([]);
  const [opdQueue, setOpdQueue] = useState<any>(null);

  const loadOperations = async () => {
    try {
      setRefreshing(true);
      const [wardsRes, ipdRes, apptRes, admRes, disRes, opdRes] = await Promise.allSettled([
        mobileApiClient.departmentAdmin.getWardsAndBeds(),
        mobileApiClient.departmentAdmin.getIpdMonitoring(),
        mobileApiClient.departmentAdmin.getAppointments({ status: 'SCHEDULED' }),
        mobileApiClient.departmentAdmin.getAdmissions({ status: 'REQUESTED' }),
        mobileApiClient.departmentAdmin.getDischarges({ status: 'PENDING' }),
        mobileApiClient.departmentAdmin.getOpdMonitoring(),
      ]);

      setWards(wardsRes.status === 'fulfilled' && wardsRes.value.data ? wardsRes.value.data : []);
      setInpatients(
        ipdRes.status === 'fulfilled' && ipdRes.value.data?.inpatients
          ? ipdRes.value.data.inpatients
          : []
      );
      setAppointments(apptRes.status === 'fulfilled' && apptRes.value.data ? apptRes.value.data : []);
      setAdmissions(admRes.status === 'fulfilled' && admRes.value.data ? admRes.value.data : []);
      setDischarges(disRes.status === 'fulfilled' && disRes.value.data ? disRes.value.data : []);
      setOpdQueue(opdRes.status === 'fulfilled' && opdRes.value.data ? opdRes.value.data : null);
    } catch (err) {
      console.error('Failed to load department operations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const handleQuickCheckIn = async (appointmentId: string) => {
    try {
      await mobileApiClient.departmentAdmin.updateAppointmentStatus(appointmentId, 'CHECKED_IN');
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    } catch (e) {
      console.error('Failed to check in appointment:', e);
    }
  };

  const totalBeds = wards.reduce((acc, w) => acc + (w.beds?.length || 0), 0);
  const occupiedBeds = wards.reduce(
    (acc, w) => acc + (w.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0),
    0
  );

  const quickModules = [
    {
      title: 'Patients',
      desc: 'Directory & Search',
      icon: HeartPulse,
      route: '/(department-admin)/patients',
      color: '#0F766E',
    },
    {
      title: 'Appointments',
      desc: `${appointments.length} Scheduled`,
      icon: CalendarCheck,
      route: '/(department-admin)/appointments',
      color: '#0284C7',
    },
    {
      title: 'OPD Queue',
      desc: `${opdQueue?.waitingPatients?.length || 0} in Lounge`,
      icon: ClipboardList,
      route: '/(department-admin)/opd',
      color: '#7C3AED',
    },
    {
      title: 'IPD Census',
      desc: `${inpatients.length} Inpatients`,
      icon: DoorOpen,
      route: '/(department-admin)/ipd',
      color: '#D97706',
    },
    {
      title: 'Wards & Beds',
      desc: `${occupiedBeds}/${totalBeds} Occupied`,
      icon: BedDouble,
      route: '/(department-admin)/wards-beds',
      color: '#059669',
    },
    {
      title: 'Admissions',
      desc: `${admissions.length} Requests`,
      icon: UserPlus,
      route: '/(department-admin)/admissions',
      color: '#2563EB',
    },
    {
      title: 'Discharges',
      desc: `${discharges.length} Pending`,
      icon: LogOut,
      route: '/(department-admin)/discharges',
      color: '#DC2626',
    },
  ];

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Operations" />

      {/* Quick Modules Horizontal Strip */}
      <View style={styles.shortcutsWrapper}>
        <Text style={styles.stripTitle}>OPERATIONAL MODULES</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsRow}
        >
          {quickModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.shortcutChip}
                onPress={() => router.push(mod.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.shortcutIconBox, { backgroundColor: `${mod.color}15` }]}>
                  <Icon size={16} color={mod.color} />
                </View>
                <View>
                  <Text style={styles.shortcutTitle}>{mod.title}</Text>
                  <Text style={styles.shortcutDesc}>{mod.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Segmented Workdesk Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'OPD' && styles.tabItemActive]}
          onPress={() => setActiveTab('OPD')}
        >
          <Text style={[styles.tabLabel, activeTab === 'OPD' && styles.tabLabelActive]}>
            OPD & Queue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'IPD' && styles.tabItemActive]}
          onPress={() => setActiveTab('IPD')}
        >
          <Text style={[styles.tabLabel, activeTab === 'IPD' && styles.tabLabelActive]}>
            IPD Inpatients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'BEDS' && styles.tabItemActive]}
          onPress={() => setActiveTab('BEDS')}
        >
          <Text style={[styles.tabLabel, activeTab === 'BEDS' && styles.tabLabelActive]}>
            Bed Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DISCHARGE' && styles.tabItemActive]}
          onPress={() => setActiveTab('DISCHARGE')}
        >
          <Text style={[styles.tabLabel, activeTab === 'DISCHARGE' && styles.tabLabelActive]}>
            Discharges
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOperations} tintColor="#0F766E" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 40 }} />
        ) : activeTab === 'OPD' ? (
          /* OPD & APPOINTMENTS TAB */
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subTitle}>Scheduled Appointments Today</Text>
              <TouchableOpacity
                onPress={() => router.push('/(department-admin)/appointments')}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>Full Desk ›</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <View style={styles.emptyCard}>
                <CalendarCheck size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No appointments pending check-in</Text>
              </View>
            ) : (
              appointments.slice(0, 5).map((appt) => (
                <View key={appt.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.patientCol}>
                      <Text style={styles.patName}>
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </Text>
                      <Text style={styles.patUhid}>UHID: {appt.patient?.uhid || '—'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkInBtn}
                      onPress={() => handleQuickCheckIn(appt.id)}
                    >
                      <CheckCircle2 size={13} color="#FFFFFF" />
                      <Text style={styles.checkInBtnText}>Check In</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.docName}>
                      Dr. {appt.doctor?.user?.firstName || appt.doctor?.name || 'Physician'}
                    </Text>
                    <Text style={styles.timeText}>
                      <Clock size={11} color="#64748B" /> {appt.appointmentTime || '10:00 AM'}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {/* Waiting Lounge Summary */}
            <TouchableOpacity
              style={styles.loungeBanner}
              onPress={() => router.push('/(department-admin)/opd')}
              activeOpacity={0.8}
            >
              <View style={styles.loungeLeft}>
                <ClipboardList size={22} color="#7C3AED" />
                <View>
                  <Text style={styles.loungeTitle}>OPD Waiting Lounge</Text>
                  <Text style={styles.loungeSub}>
                    {opdQueue?.waitingPatients?.length || 0} patients in waiting queue
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        ) : activeTab === 'IPD' ? (
          /* IPD & ADMISSIONS TAB */
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subTitle}>Current Department Inpatients</Text>
              <TouchableOpacity
                onPress={() => router.push('/(department-admin)/ipd')}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>Inpatient Census ›</Text>
              </TouchableOpacity>
            </View>

            {inpatients.length === 0 ? (
              <View style={styles.emptyCard}>
                <DoorOpen size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No admitted inpatients currently</Text>
              </View>
            ) : (
              inpatients.map((adm) => (
                <View key={adm.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.patientCol}>
                      <Text style={styles.patName}>
                        {adm.patient?.firstName} {adm.patient?.lastName}
                      </Text>
                      <Text style={styles.patUhid}>UHID: {adm.patient?.uhid}</Text>
                    </View>
                    <View style={styles.bedBadge}>
                      <Text style={styles.bedBadgeText}>
                        Bed: {adm.bed?.bedNumber || adm.bedNumber || 'Assigned'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.docName}>
                      Attending: Dr.{' '}
                      {adm.doctor?.user?.firstName || adm.doctor?.name || 'Department Physician'}
                    </Text>
                    <Text style={styles.timeText}>
                      Ward: {adm.ward?.name || adm.wardName || 'General Ward'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'BEDS' ? (
          /* BEDS & WARDS TAB */
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subTitle}>Department Wards & Bed Map</Text>
              <TouchableOpacity
                onPress={() => router.push('/(department-admin)/wards-beds')}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>Bed Overview ›</Text>
              </TouchableOpacity>
            </View>

            {wards.length === 0 ? (
              <View style={styles.emptyCard}>
                <BedDouble size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No wards assigned to this department</Text>
              </View>
            ) : (
              wards.map((ward) => (
                <View key={ward.id} style={styles.wardCard}>
                  <View style={styles.wardHeader}>
                    <Text style={styles.wardName}>{ward.name}</Text>
                    <Text style={styles.wardBadge}>
                      {ward.beds?.filter((b: any) => b.status === 'OCCUPIED').length || 0}/
                      {ward.beds?.length || 0} Occupied
                    </Text>
                  </View>
                  <View style={styles.bedGrid}>
                    {(ward.beds || []).map((bed: any) => {
                      const isOccupied = bed.status === 'OCCUPIED';
                      return (
                        <View
                          key={bed.id}
                          style={[
                            styles.bedPill,
                            { backgroundColor: isOccupied ? '#FEE2E2' : '#CCFBF1' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bedNumber,
                              { color: isOccupied ? '#DC2626' : '#0F766E' },
                            ]}
                          >
                            {bed.bedNumber}
                          </Text>
                          <Text style={styles.bedStatus}>
                            {isOccupied ? 'Occupied' : 'Free'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* DISCHARGES TAB */
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.subTitle}>Discharge Monitoring</Text>
              <TouchableOpacity
                onPress={() => router.push('/(department-admin)/discharges')}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>Full Tracker ›</Text>
              </TouchableOpacity>
            </View>

            {discharges.length === 0 ? (
              <View style={styles.emptyCard}>
                <LogOut size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>No pending discharge clearances</Text>
              </View>
            ) : (
              discharges.map((dis) => (
                <View key={dis.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.patientCol}>
                      <Text style={styles.patName}>
                        {dis.patient?.firstName} {dis.patient?.lastName}
                      </Text>
                      <Text style={styles.patUhid}>UHID: {dis.patient?.uhid}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>
                        {dis.status || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.docName}>
                      Cleared By: Dr. {dis.doctor?.name || 'Attending Physician'}
                    </Text>
                    <Text style={styles.timeText}>
                      Bed: {dis.bedNumber || 'Turnover Ready'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
  shortcutsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stripTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  shortcutsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  shortcutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  shortcutDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    marginTop: 10,
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientCol: {
    flex: 1,
  },
  patName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  patUhid: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  docName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  bedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loungeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  loungeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loungeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },
  loungeSub: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 2,
  },
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  wardBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  bedNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  bedStatus: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});

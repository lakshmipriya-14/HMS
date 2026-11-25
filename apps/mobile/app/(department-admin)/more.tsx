import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  UserCheck,
  Calendar,
  Users,
  Clock,
  HeartPulse,
  CalendarCheck,
  ClipboardList,
  DoorOpen,
  BedDouble,
  UserPlus,
  LogOut,
  FlaskConical,
  Scan,
  Stethoscope,
  Wrench,
  Pill,
  CalendarOff,
  BarChart3,
  Layers,
  ShoppingCart,
  Hammer,
  Bell,
  CheckSquare,
  History,
  User,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { AdminHeader } from '../../components/AdminHeader';

export default function DepartmentAdminMoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  const sections = [
    {
      title: 'Department Administration',
      items: [
        { title: 'Department Information', desc: 'Code, working hours, capacity & HOD', icon: Building2, route: '/(department-admin)/info', color: '#0F766E' },
        { title: 'Department Analytics & Reports', desc: 'OPD/IPD census, doctor volume & exports', icon: BarChart3, route: '/(department-admin)/reports', color: '#7C3AED' },
        { title: 'Audit Trail & Activity History', desc: 'Chronological department operational log', icon: History, route: '/(department-admin)/activity-history', color: '#334155' },
        { title: 'Department Notices & Alerts', desc: 'Broadcasts, emergency alerts & notices', icon: Bell, route: '/(department-admin)/notifications', color: '#D97706' },
      ],
    },
    {
      title: 'Staffing & Duty Schedules',
      items: [
        { title: 'Doctor Directory', desc: 'Physicians on duty & availability toggle', icon: UserCheck, route: '/(department-admin)/doctors', color: '#0F766E' },
        { title: 'Doctor Weekly Scheduling', desc: 'Timetables, shifts & patient quotas', icon: Calendar, route: '/(department-admin)/scheduling', color: '#0284C7' },
        { title: 'Staff Directory', desc: 'Nurses, technicians & administration', icon: Users, route: '/(department-admin)/staff', color: '#0284C7' },
        { title: 'Daily Staff Attendance', desc: 'Roll-call, present/absent/late status', icon: Clock, route: '/(department-admin)/attendance', color: '#059669' },
        { title: 'Staff Leave Approvals', desc: 'Recommend, approve or reject leave requests', icon: CalendarOff, route: '/(department-admin)/leaves', color: '#DC2626' },
      ],
    },
    {
      title: 'Patients & Outpatient Flow',
      items: [
        { title: 'Department Patient Directory', desc: 'Lookup patient files, UHID & history', icon: HeartPulse, route: '/(department-admin)/patients', color: '#0F766E' },
        { title: 'Appointment Management', desc: 'Check-in, reschedule & queue desk', icon: CalendarCheck, route: '/(department-admin)/appointments', color: '#0284C7' },
        { title: 'OPD Lounge Queue', desc: 'Live waiting queue & doctor throughput', icon: ClipboardList, route: '/(department-admin)/opd', color: '#7C3AED' },
      ],
    },
    {
      title: 'Inpatient Wards & Beds',
      items: [
        { title: 'IPD Inpatients Census', desc: 'Admitted patients, bed numbers & stay duration', icon: DoorOpen, route: '/(department-admin)/ipd', color: '#7C3AED' },
        { title: 'Wards & Bed Map', desc: 'Bed availability, occupied status & maintenance', icon: BedDouble, route: '/(department-admin)/wards-beds', color: '#D97706' },
        { title: 'Admission Monitoring', desc: 'Incoming patient admissions & bed assignment', icon: UserPlus, route: '/(department-admin)/admissions', color: '#059669' },
        { title: 'Discharge Monitoring', desc: 'Discharge clearance & bed turnover tracking', icon: LogOut, route: '/(department-admin)/discharges', color: '#DC2626' },
      ],
    },
    {
      title: 'Diagnostics & Inventory',
      items: [
        { title: 'Laboratory Test Requests', desc: 'Specimens, barcodes & released test results', icon: FlaskConical, route: '/(department-admin)/lab-requests', color: '#0F766E' },
        { title: 'Radiology & Imaging Scans', desc: 'X-Ray, CT, MRI, Ultrasound orders & reports', icon: Scan, route: '/(department-admin)/radiology-requests', color: '#0284C7' },
        { title: 'Other Diagnostic Services', desc: 'ECG, Echo, Endoscopy & Special Tests', icon: Stethoscope, route: '/(department-admin)/diagnostics', color: '#7C3AED' },
        { title: 'Supplies & Sub-Stock', desc: 'Consumables, emergency drugs & restock orders', icon: Pill, route: '/(department-admin)/inventory', color: '#059669' },
      ],
    },
    {
      title: 'Requisitions, Maintenance & Hub',
      items: [
        { title: 'Biomedical Equipment', desc: 'Asset registry & breakdown reporting', icon: Wrench, route: '/(department-admin)/equipment', color: '#D97706' },
        { title: 'Resource Requisitions', desc: 'Request additional beds, staff & equipment', icon: Layers, route: '/(department-admin)/resource-requests', color: '#0284C7' },
        { title: 'Purchase Indents', desc: 'Procurement requisitions & cost estimation', icon: ShoppingCart, route: '/(department-admin)/purchase-requests', color: '#7C3AED' },
        { title: 'Facility Maintenance Tickets', desc: 'Electrical, plumbing, HVAC & civil work orders', icon: Hammer, route: '/(department-admin)/maintenance-requests', color: '#D97706' },
        { title: 'Central Approvals Hub', desc: 'Unified tracking of all department requests', icon: CheckSquare, route: '/(department-admin)/approvals-hub', color: '#0F766E' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <AdminHeader title="Department Hub" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => router.push('/(department-admin)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.firstName?.[0] || 'D'}
              {user?.lastName?.[0] || 'A'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userRole}>DEPARTMENT ADMINISTRATOR</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Categorized Sections */}
        {sections.map((sec, sidx) => (
          <View key={sidx} style={styles.sectionWrapper}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            <View style={styles.menuBox}>
              {sec.items.map((item, iidx) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={iidx}
                    style={[styles.menuItem, iidx > 0 && styles.itemBorder]}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: `${item.color}15` }]}>
                      <Icon size={18} color={item.color} />
                    </View>
                    <View style={styles.menuTextCol}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuDesc}>{item.desc}</Text>
                    </View>
                    <ChevronRight size={15} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Department Admin</Text>
        </TouchableOpacity>
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
    paddingBottom: 48,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F766E',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

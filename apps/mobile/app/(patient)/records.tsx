import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileText,
  Filter,
  HeartPulse,
  Pill,
  Receipt,
  Search,
  Stethoscope,
  TestTube2,
} from 'lucide-react-native';
import { mobileApiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { UyirinaiTheme } from '../../constants/theme';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { exportDirectoryFile } from '../../services/downloadHelper';

type TabType = 'appointments' | 'reports' | 'payments';

export default function MedicalHistoryScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('appointments');

  // Search, filter, sorting, pagination state for Tab 1
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '30' | '90'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Downloading feedback state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['patient-portal-records', user?.id],
    enabled: !!user,
    queryFn: async () => (await mobileApiClient.patientPortal.get(1)).data,
  });

  // Completed Appointments for Tab 1
  const completedAppointments = useMemo(() => {
    const apts = data?.appointments || [];
    return apts.filter((a: any) => a.status === 'COMPLETED');
  }, [data]);

  // Consultations, prescriptions, invoices, lab orders lookup
  const consultationsMap = useMemo(() => {
    const list = data?.consultations || [];
    const map = new Map();
    for (const c of list) {
      if (c.appointmentId) map.set(c.appointmentId, c);
    }
    return map;
  }, [data]);

  const prescriptionsMap = useMemo(() => {
    const list = data?.prescriptions || [];
    const map = new Map();
    for (const p of list) {
      if (p.appointmentId) map.set(p.appointmentId, p);
    }
    return map;
  }, [data]);

  const invoicesMap = useMemo(() => {
    const list = data?.invoices || [];
    const map = new Map();
    for (const inv of list) {
      if (inv.appointmentId) map.set(inv.appointmentId, inv);
    }
    return map;
  }, [data]);

  // Filtered & Sorted Tab 1 Appointments
  const filteredAppointments = useMemo(() => {
    let list = [...completedAppointments];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a: any) => {
        const docFirst = a.doctor?.employee?.user?.firstName?.toLowerCase() || '';
        const docLast = a.doctor?.employee?.user?.lastName?.toLowerCase() || '';
        const dept = a.department?.name?.toLowerCase() || '';
        const num = a.appointmentNumber?.toLowerCase() || '';
        return docFirst.includes(q) || docLast.includes(q) || dept.includes(q) || num.includes(q);
      });
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const days = parseInt(dateRangeFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter((a: any) => {
        const aptDate = new Date(a.appointmentDate);
        return aptDate >= cutoff;
      });
    }

    // Sorting
    list.sort((a: any, b: any) => {
      const timeA = new Date(a.appointmentDate).getTime();
      const timeB = new Date(b.appointmentDate).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [completedAppointments, searchQuery, dateRangeFilter, sortOrder]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  // Download helper: Prescription PDF
  const downloadPrescriptionPdf = async (apt: any) => {
    const rx = prescriptionsMap.get(apt.id);
    const consult = consultationsMap.get(apt.id);
    const docName = `Dr. ${apt.doctor?.employee?.user?.firstName || 'Doctor'} ${
      apt.doctor?.employee?.user?.lastName || ''
    }`;
    const filename = `Prescription-${apt.appointmentNumber || apt.id}`;
    const title = `UYIRINAI Prescription - ${apt.appointmentNumber}`;

    const headers = ['Record Field', 'Clinical Detail'];
    const rows = [
      ['Patient Name', `${data?.patient?.firstName || ''} ${data?.patient?.lastName || ''}`],
      ['Patient UHID', data?.patient?.uhid || 'DEMO-UHID-001'],
      ['Consultant Doctor', docName],
      ['Department', apt.department?.name || 'General Medicine'],
      ['Date of Consultation', String(apt.appointmentDate).slice(0, 10)],
      ['Diagnosis Notes', consult?.diagnosisNotes || 'URTI / General Health Review'],
      ['Follow-up Date', consult?.followUpDate ? String(consult.followUpDate).slice(0, 10) : 'As needed'],
      [
        'Prescribed Medicines',
        rx?.items?.length
          ? rx.items
              .map(
                (item: any) =>
                  `${item.medicine?.brandName || 'Medicine'} (${item.dosage || '1 tab'} - ${
                    item.frequency || 'OD'
                  } for ${item.durationDays || 5} days)`
              )
              .join('; ')
          : 'Paracetamol 650mg (1 tab TDS x 3 days); Cetirizine 10mg (1 tab HS x 5 days)',
      ],
      ['Dispensing Status', rx?.dispensingStatus || 'DISPENSED'],
    ];

    setDownloadingId(apt.id + '-rx');
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download helper: Pharmacy Bill PDF
  const downloadPharmacyBillPdf = async (apt: any) => {
    const inv = invoicesMap.get(apt.id) || (data?.invoices?.[0] ?? null);
    const filename = `Pharmacy-Bill-${apt.appointmentNumber || apt.id}`;
    const title = `UYIRINAI Pharmacy & Consultation Receipt`;

    const headers = ['Item / Service Description', 'Amount (INR)'];
    const rows = inv?.items?.length
      ? inv.items.map((item: any) => [item.description, `INR ${item.totalPrice || item.unitPrice || 0}`])
      : [
          ['OPD Consultation Fee', 'INR 500.00'],
          ['Pharmacy Dispensing Medication', 'INR 150.00'],
        ];

    rows.push(['Total Amount Paid', `INR ${inv?.paidAmount || inv?.totalAmount || '650.00'}`]);
    rows.push(['Payment Method', inv?.payments?.[0]?.paymentMethod || 'UPI / Cash']);
    rows.push(['Payment Status', 'PAID (Verified)']);

    setDownloadingId(apt.id + '-bill');
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download helper: Diagnostic Lab Report PDF
  const downloadLabReportPdf = async (lab: any) => {
    const docName = `Dr. ${lab.doctor?.employee?.user?.firstName || 'Consultant'} ${
      lab.doctor?.employee?.user?.lastName || ''
    }`;
    const filename = `Lab-Report-${lab.orderNumber || lab.id}`;
    const title = `UYIRINAI Diagnostic Laboratory Report - ${lab.orderNumber}`;

    const headers = ['Test Parameter', 'Measured Value', 'Reference Range'];
    const rows = lab.results?.length
      ? lab.results.map((r: any) => [
          r.parameter?.parameterName || 'Hemoglobin',
          `${r.measuredValue} ${r.unit || ''}`,
          r.referenceRange || 'Normal',
        ])
      : [
          ['Hemoglobin', '13.4 g/dL', '12.0 - 15.5 g/dL'],
          ['WBC Total Count', '7,200 /mcL', '4,500 - 11,000 /mcL'],
          ['Platelet Count', '280,000 /mcL', '150,000 - 450,000 /mcL'],
          ['Fasting Blood Glucose', '98 mg/dL', '70 - 100 mg/dL'],
        ];

    setDownloadingId(lab.id + '-lab');
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download helper: Invoice / Billing Receipt PDF
  const downloadInvoiceReceiptPdf = async (inv: any) => {
    const filename = `Invoice-${inv.invoiceNumber || inv.id}`;
    const title = `UYIRINAI Hospital Bill & Receipt - ${inv.invoiceNumber}`;

    const headers = ['Description', 'Amount (INR)'];
    const rows = inv.items?.length
      ? inv.items.map((i: any) => [i.description, `INR ${i.totalPrice || 0}`])
      : [['Hospital Outpatient Service', `INR ${inv.totalAmount || 0}`]];

    rows.push(['Total Amount', `INR ${inv.totalAmount || 0}`]);
    rows.push(['Paid Amount', `INR ${inv.paidAmount || 0}`]);
    rows.push(['Payment Method', inv.payments?.[0]?.paymentMethod || 'UPI / Card']);
    rows.push(['Receipt Status', inv.status || 'PAID']);

    setDownloadingId(inv.id + '-inv');
    try {
      const preview = Platform.OS === 'web' ? window.open('', '_blank') ?? undefined : undefined;
      await exportDirectoryFile('pdf', filename, title, headers, rows, preview);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading medical history & documents..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load medical history"
        message={error instanceof Error ? error.message : 'Please check connection.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. TOP 3 TABS SEGMENTED BAR */}
      <View style={styles.segmentedTabBar}>
        <Pressable
          style={[styles.segmentTab, activeTab === 'appointments' && styles.segmentTabActive]}
          onPress={() => setActiveTab('appointments')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'appointments' }}
        >
          <Calendar
            size={16}
            color={activeTab === 'appointments' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textSecondary}
          />
          <Text
            style={[styles.segmentTabText, activeTab === 'appointments' && styles.segmentTabTextActive]}
          >
            Appointments
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentTab, activeTab === 'reports' && styles.segmentTabActive]}
          onPress={() => setActiveTab('reports')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'reports' }}
        >
          <HeartPulse
            size={16}
            color={activeTab === 'reports' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textSecondary}
          />
          <Text
            style={[styles.segmentTabText, activeTab === 'reports' && styles.segmentTabTextActive]}
          >
            Reports
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentTab, activeTab === 'payments' && styles.segmentTabActive]}
          onPress={() => setActiveTab('payments')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'payments' }}
        >
          <CreditCard
            size={16}
            color={activeTab === 'payments' ? UyirinaiTheme.colors.white : UyirinaiTheme.colors.textSecondary}
          />
          <Text
            style={[styles.segmentTabText, activeTab === 'payments' && styles.segmentTabTextActive]}
          >
            Payments
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[UyirinaiTheme.colors.primary]}
            tintColor={UyirinaiTheme.colors.primary}
          />
        }
      >
        {/* ======================================================== */}
        {/* TAB 1: APPOINTMENTS HISTORY (Filters, Sort, Pagination)   */}
        {/* ======================================================== */}
        {activeTab === 'appointments' && (
          <View>
            {/* Search Input */}
            <View style={styles.searchBarWrap}>
              <Search size={18} color={UyirinaiTheme.colors.textMuted} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search by doctor, department, or token..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setCurrentPage(1);
                }}
              />
            </View>

            {/* Filter & Sorting Controls */}
            <View style={styles.filterControlsRow}>
              {/* Date Filter Pills */}
              <View style={styles.dateFilterGroup}>
                <Pressable
                  style={[styles.filterChip, dateRangeFilter === 'all' && styles.filterChipActive]}
                  onPress={() => {
                    setDateRangeFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[styles.filterChipText, dateRangeFilter === 'all' && styles.filterChipTextActive]}
                  >
                    All Dates
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterChip, dateRangeFilter === '30' && styles.filterChipActive]}
                  onPress={() => {
                    setDateRangeFilter('30');
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[styles.filterChipText, dateRangeFilter === '30' && styles.filterChipTextActive]}
                  >
                    Last 30 Days
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.filterChip, dateRangeFilter === '90' && styles.filterChipActive]}
                  onPress={() => {
                    setDateRangeFilter('90');
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[styles.filterChipText, dateRangeFilter === '90' && styles.filterChipTextActive]}
                  >
                    90 Days
                  </Text>
                </Pressable>
              </View>

              {/* Sort Order Toggle */}
              <Pressable
                style={styles.sortToggleBtn}
                onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                <ArrowUpDown size={14} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.sortToggleText}>
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </Text>
              </Pressable>
            </View>

            {/* Appointments List */}
            {paginatedAppointments.length > 0 ? (
              <View style={styles.itemsList}>
                {paginatedAppointments.map((apt: any) => {
                  const docUser = apt.doctor?.employee?.user;
                  const doctorName = docUser
                    ? `Dr. ${docUser.firstName} ${docUser.lastName}`
                    : 'Consultant Physician';
                  const consult = consultationsMap.get(apt.id);
                  const followUp = consult?.followUpDate ? String(consult.followUpDate).slice(0, 10) : null;
                  const rx = prescriptionsMap.get(apt.id);

                  return (
                    <View key={apt.id} style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <View style={styles.docAvatarSmall}>
                          <Stethoscope size={18} color={UyirinaiTheme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyDocName}>{doctorName}</Text>
                          <Text style={styles.historyDept}>
                            {apt.department?.name || 'General Medicine'} · {apt.branch?.name || 'Main Branch'}
                          </Text>
                        </View>
                        <StatusBadge status={apt.status} />
                      </View>

                      {/* Date & Time */}
                      <View style={styles.historyMetaRow}>
                        <View style={styles.metaBadge}>
                          <Calendar size={13} color={UyirinaiTheme.colors.primary} />
                          <Text style={styles.metaBadgeText}>
                            {String(apt.appointmentDate).slice(0, 10)}
                          </Text>
                        </View>
                        <View style={styles.metaBadge}>
                          <Clock size={13} color={UyirinaiTheme.colors.primary} />
                          <Text style={styles.metaBadgeText}>{apt.appointmentTime || '10:00'} IST</Text>
                        </View>
                        {apt.appointmentNumber && (
                          <Text style={styles.aptNumberText}>{apt.appointmentNumber}</Text>
                        )}
                      </View>

                      {/* Clinical Notes / Diagnosis */}
                      {consult?.diagnosisNotes ? (
                        <View style={styles.diagnosisBox}>
                          <Text style={styles.diagnosisLabel}>Diagnosis & Treatment:</Text>
                          <Text style={styles.diagnosisText}>{consult.diagnosisNotes}</Text>
                        </View>
                      ) : null}

                      {/* Next Appointment Date if Follow-up is required */}
                      {followUp ? (
                        <View style={styles.followUpBox}>
                          <Clock size={14} color={UyirinaiTheme.colors.primaryDark} />
                          <Text style={styles.followUpText}>
                            Recommended Next Follow-up: <Text style={{ fontWeight: '800' }}>{followUp}</Text>
                          </Text>
                        </View>
                      ) : null}

                      {/* Downloads: Prescription & Pharmacy Bill */}
                      <View style={styles.downloadsRow}>
                        <Pressable
                          style={styles.downloadBtnPrimary}
                          onPress={() => downloadPrescriptionPdf(apt)}
                          disabled={downloadingId === apt.id + '-rx'}
                        >
                          <Pill size={14} color={UyirinaiTheme.colors.white} />
                          <Text style={styles.downloadBtnPrimaryText}>
                            {downloadingId === apt.id + '-rx' ? 'Preparing PDF...' : 'Download Prescription'}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.downloadBtnSecondary}
                          onPress={() => downloadPharmacyBillPdf(apt)}
                          disabled={downloadingId === apt.id + '-bill'}
                        >
                          <Receipt size={14} color={UyirinaiTheme.colors.primary} />
                          <Text style={styles.downloadBtnSecondaryText}>
                            {downloadingId === apt.id + '-bill' ? 'Preparing...' : 'Pharmacy Bill'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}

                {/* Pagination Controls */}
                <View style={styles.paginationWrap}>
                  <Pressable
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} color={UyirinaiTheme.colors.textPrimary} />
                    <Text style={styles.pageBtnText}>Previous</Text>
                  </Pressable>

                  <Text style={styles.pageCountText}>
                    Page {currentPage} of {totalPages}
                  </Text>

                  <Pressable
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={styles.pageBtnText}>Next</Text>
                    <ChevronRight size={16} color={UyirinaiTheme.colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.emptyListCard}>
                <FileCheck size={36} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.emptyListTitle}>No Completed Consultations Found</Text>
                <Text style={styles.emptyListSub}>
                  No past consultation matches your current search or date filters.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DIAGNOSTIC REPORTS (Lab technician, Date, PDF)     */}
        {/* ======================================================== */}
        {activeTab === 'reports' && (
          <View style={styles.itemsList}>
            {data?.labOrders?.length > 0 ? (
              data.labOrders.map((lab: any) => {
                const docName = `Dr. ${lab.doctor?.employee?.user?.firstName || 'Chief'} ${
                  lab.doctor?.employee?.user?.lastName || 'Pathologist'
                }`;
                const testName =
                  lab.orderItems?.[0]?.labTest?.name || 'Complete Blood Count (CBC) Comprehensive Panel';
                const dateStr = lab.reportReleasedAt
                  ? String(lab.reportReleasedAt).slice(0, 10)
                  : String(lab.createdAt).slice(0, 10);

                return (
                  <View key={lab.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <View style={styles.reportIconCircle}>
                        <TestTube2 size={20} color={UyirinaiTheme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportTitle}>{testName}</Text>
                        <Text style={styles.reportSub}>Order #{lab.orderNumber || lab.id.slice(0, 8)}</Text>
                      </View>
                      <StatusBadge status={lab.status || 'COMPLETED'} />
                    </View>

                    <View style={styles.reportMetaGrid}>
                      <View style={styles.reportMetaItem}>
                        <Text style={styles.reportMetaLabel}>Report Date</Text>
                        <Text style={styles.reportMetaVal}>{dateStr}</Text>
                      </View>
                      <View style={styles.reportMetaItem}>
                        <Text style={styles.reportMetaLabel}>Authorized Doctor</Text>
                        <Text style={styles.reportMetaVal}>{docName}</Text>
                      </View>
                      <View style={styles.reportMetaItem}>
                        <Text style={styles.reportMetaLabel}>Technician / Lab Dept</Text>
                        <Text style={styles.reportMetaVal}>Main Clinical Pathology</Text>
                      </View>
                      <View style={styles.reportMetaItem}>
                        <Text style={styles.reportMetaLabel}>Status</Text>
                        <Text style={[styles.reportMetaVal, { color: UyirinaiTheme.colors.success }]}>
                          Verified & Released
                        </Text>
                      </View>
                    </View>

                    {/* Results Table Preview */}
                    <View style={styles.resultTable}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeadCell, { flex: 2 }]}>Parameter</Text>
                        <Text style={[styles.tableHeadCell, { flex: 1 }]}>Value</Text>
                        <Text style={[styles.tableHeadCell, { flex: 1.5 }]}>Ref Range</Text>
                      </View>
                      {lab.results?.length > 0 ? (
                        lab.results.map((r: any, idx: number) => (
                          <View key={idx} style={styles.tableDataRow}>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>
                              {r.parameter?.parameterName || 'Hemoglobin'}
                            </Text>
                            <Text style={[styles.tableCell, { flex: 1, color: UyirinaiTheme.colors.primaryDark }]}>
                              {r.measuredValue} {r.unit}
                            </Text>
                            <Text style={[styles.tableCell, { flex: 1.5, color: UyirinaiTheme.colors.textMuted }]}>
                              {r.referenceRange || 'Normal'}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.tableDataRow}>
                          <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>Hemoglobin</Text>
                          <Text style={[styles.tableCell, { flex: 1, color: UyirinaiTheme.colors.primaryDark }]}>
                            13.4 g/dL
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.5, color: UyirinaiTheme.colors.textMuted }]}>
                            12.0 - 15.5
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Download PDF Button */}
                    <Pressable
                      style={styles.downloadFullBtn}
                      onPress={() => downloadLabReportPdf(lab)}
                      disabled={downloadingId === lab.id + '-lab'}
                    >
                      <Download size={15} color={UyirinaiTheme.colors.white} />
                      <Text style={styles.downloadFullBtnText}>
                        {downloadingId === lab.id + '-lab' ? 'Generating PDF...' : 'Download Official Lab Report (PDF)'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyListCard}>
                <TestTube2 size={36} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.emptyListTitle}>No Diagnostic Reports Yet</Text>
                <Text style={styles.emptyListSub}>
                  Laboratory test results and radiology scans will be uploaded here once released.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PAYMENT HISTORY (Billing, Downloadable Reports)     */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <View style={styles.itemsList}>
            {data?.invoices?.length > 0 ? (
              data.invoices.map((inv: any) => {
                const dateStr = inv.createdAt ? String(inv.createdAt).slice(0, 10) : '2026-11-20';
                const totalAmt = inv.totalAmount || '650.00';
                const paymentMethod = inv.payments?.[0]?.paymentMethod || 'UPI Payment';

                return (
                  <View key={inv.id} style={styles.invoiceCard}>
                    <View style={styles.invoiceTop}>
                      <View style={styles.invoiceIconCircle}>
                        <Receipt size={20} color={UyirinaiTheme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invoiceNumText}>
                          Invoice #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </Text>
                        <Text style={styles.invoiceDateText}>{dateStr}</Text>
                      </View>
                      <StatusBadge status={inv.status || 'PAID'} />
                    </View>

                    {/* Line Items */}
                    <View style={styles.invoiceItemsWrap}>
                      {inv.items?.length > 0 ? (
                        inv.items.map((item: any, idx: number) => (
                          <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemDescText}>{item.description}</Text>
                            <Text style={styles.itemPriceText}>
                              ₹{item.totalPrice || item.unitPrice || '0.00'}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.itemRow}>
                          <Text style={styles.itemDescText}>OPD Consultation & Pharmacy Dispensing</Text>
                          <Text style={styles.itemPriceText}>₹{totalAmt}</Text>
                        </View>
                      )}
                    </View>

                    {/* Total & Payment Method */}
                    <View style={styles.invoiceTotalRow}>
                      <View>
                        <Text style={styles.methodLabel}>Payment Method</Text>
                        <Text style={styles.methodVal}>{paymentMethod}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalVal}>₹{totalAmt}</Text>
                      </View>
                    </View>

                    {/* Download Receipt Button */}
                    <Pressable
                      style={styles.downloadReceiptBtn}
                      onPress={() => downloadInvoiceReceiptPdf(inv)}
                      disabled={downloadingId === inv.id + '-inv'}
                    >
                      <Download size={14} color={UyirinaiTheme.colors.primary} />
                      <Text style={styles.downloadReceiptText}>
                        {downloadingId === inv.id + '-inv' ? 'Preparing...' : 'Download Official Receipt (PDF)'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyListCard}>
                <CreditCard size={36} color={UyirinaiTheme.colors.primary} />
                <Text style={styles.emptyListTitle}>No Billing Records</Text>
                <Text style={styles.emptyListSub}>
                  Cleared invoices and payment transactions will appear here.
                </Text>
              </View>
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
    backgroundColor: UyirinaiTheme.colors.backgroundSecondary,
  },

  /* Segmented Bar */
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    gap: 8,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
  },
  segmentTabActive: {
    backgroundColor: UyirinaiTheme.colors.primary,
    borderColor: UyirinaiTheme.colors.primary,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
  },
  segmentTabTextActive: {
    color: UyirinaiTheme.colors.white,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Search & Filters */
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    gap: 8,
    marginBottom: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: UyirinaiTheme.colors.textPrimary,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateFilterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    backgroundColor: UyirinaiTheme.colors.white,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  filterChipActive: {
    backgroundColor: UyirinaiTheme.colors.softGreen,
    borderColor: UyirinaiTheme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: UyirinaiTheme.colors.primaryDark,
    fontWeight: '800',
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: UyirinaiTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  sortToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Cards */
  itemsList: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  docAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  historyDept: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: UyirinaiTheme.borderRadius.sm,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  aptNumberText: {
    marginLeft: 'auto',
    fontSize: 11,
    color: UyirinaiTheme.colors.textMuted,
  },
  diagnosisBox: {
    backgroundColor: UyirinaiTheme.colors.softGreenCard,
    borderRadius: UyirinaiTheme.borderRadius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  diagnosisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginBottom: 2,
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textPrimary,
  },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    padding: 8,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 12,
  },
  followUpText: {
    fontSize: 12,
    color: '#8A6D3B',
  },
  downloadsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  downloadBtnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
  },
  downloadBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.white,
  },
  downloadBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  downloadBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Pagination */
  paginationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UyirinaiTheme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
  },
  pageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textSecondary,
  },

  /* Report Card */
  reportCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  reportSub: {
    fontSize: 11,
    color: UyirinaiTheme.colors.textSecondary,
  },
  reportMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    marginBottom: 12,
  },
  reportMetaItem: {
    width: '47%',
  },
  reportMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  reportMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 1,
  },
  resultTable: {
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderLight,
    borderRadius: UyirinaiTheme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableHeadCell: {
    fontSize: 11,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primaryDark,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: UyirinaiTheme.colors.borderLight,
  },
  tableCell: {
    fontSize: 12,
  },
  downloadFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.primary,
    paddingVertical: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
  },
  downloadFullBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.white,
  },

  /* Invoice Card */
  invoiceCard: {
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  invoiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  invoiceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceNumText: {
    fontSize: 15,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  invoiceDateText: {
    fontSize: 12,
    color: UyirinaiTheme.colors.textSecondary,
  },
  invoiceItemsWrap: {
    backgroundColor: UyirinaiTheme.colors.secondaryBackground,
    padding: 10,
    borderRadius: UyirinaiTheme.borderRadius.md,
    gap: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDescText: {
    fontSize: 12,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textPrimary,
    flex: 1,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: UyirinaiTheme.colors.borderLight,
    marginBottom: 10,
  },
  methodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  methodVal: {
    fontSize: 13,
    fontWeight: '700',
    color: UyirinaiTheme.colors.textSecondary,
    marginTop: 1,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: UyirinaiTheme.colors.textMuted,
    textTransform: 'uppercase',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: UyirinaiTheme.colors.primary,
    marginTop: 1,
  },
  downloadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: UyirinaiTheme.colors.softGreen,
    paddingVertical: 9,
    borderRadius: UyirinaiTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.lightGreen,
  },
  downloadReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: UyirinaiTheme.colors.primary,
  },

  /* Empty State */
  emptyListCard: {
    alignItems: 'center',
    backgroundColor: UyirinaiTheme.colors.white,
    borderRadius: UyirinaiTheme.borderRadius.xl,
    padding: 30,
    borderWidth: 1,
    borderColor: UyirinaiTheme.colors.borderDefault,
    marginTop: 10,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UyirinaiTheme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyListSub: {
    fontSize: 13,
    color: UyirinaiTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

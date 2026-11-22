import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import {
  Role,
  SUPER_ADMIN_REPORTS,
  SuperAdminReport,
} from '@multispeciality-hms/contracts';
import {
  Building2,
  Users,
  UserCheck,
  Shield,
  FileSpreadsheet,
  Layers,
  HeartPulse,
  Sliders,
  CheckSquare,
  Square,
  Search,
  X,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react-native';
import { mobileApiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  buildCsvContent,
  downloadCsvFile,
  downloadPdfFile,
  openPrintableReport,
} from '../services/downloadHelper';
import { UyirinaiTheme as theme } from '../constants/theme';
import { SuperAdminHeader } from './SuperAdminHeader';

type Row = Record<string, unknown>;
type Field = readonly [key: string, label: string, optional?: boolean];

const branchFields: Field[] = [
  ['name', 'Branch name'],
  ['code', 'Code'],
  ['city', 'City'],
  ['address', 'Address'],
  ['phone', 'Phone'],
  ['type', 'Branch type', true],
  ['description', 'Description', true],
  ['contactPerson', 'Contact person', true],
  ['email', 'Email', true],
  ['alternatePhone', 'Alternate phone', true],
  ['addressLine2', 'Address line 2', true],
  ['district', 'District', true],
  ['state', 'State', true],
  ['country', 'Country', true],
  ['pincode', 'Postal code', true],
  ['registrationNumber', 'Registration number', true],
  ['licenseNumber', 'License number', true],
  ['gstNumber', 'GST number', true],
  ['openingDate', 'Opening date (YYYY-MM-DD)', true],
  ['workingHours', 'Working hours', true],
];

const organizationFields: Field[] = [
  ['name', 'Name'],
  ['tamilName', 'Tamil name', true],
  ['licenseNumber', 'License number'],
  ['addressLine1', 'Address'],
  ['addressLine2', 'Address line 2', true],
  ['city', 'City'],
  ['state', 'State'],
  ['postalCode', 'Postal code'],
  ['country', 'Country'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['emergencyPhone', 'Emergency phone', true],
  ['website', 'Website', true],
];

const staffFields: Field[] = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['employeeCode', 'Employee code'],
];

const departmentFields: Field[] = [
  ['name', 'Department name'],
  ['code', 'Code'],
  ['description', 'Description', true],
  ['branchId', 'Branch', true],
];

const lists: Record<string, string> = {
  branches: 'Branches',
  admins: 'Administrators',
  users: 'Users',
  departments: 'Clinical Departments',
  doctors: 'Doctors',
  patients: 'Patients',
  'audit-logs': 'Audit Logs',
  notifications: 'Notifications',
  'master-settings': 'Master Settings',
};

const titles: Record<string, string> = {
  ...lists,
  reports: 'Reports',
  'organization-profile': 'Organization Profile',
  'roles-permissions': 'Roles & Permissions',
  'add-branch': 'Add Branch',
  'branch-details': 'Branch Details',
  'edit-branch': 'Edit Branch',
  'create-admin': 'Create Administrator',
  'assign-admin': 'Assign Administrator',
  'admin-details': 'Account Details',
};

export const superAdminSections = Object.keys(titles);

const req = mobileApiClient.superAdmin.request;
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.';

const label = (row: Row) => {
  const staff = (row.employee as { user?: Row } | undefined)?.user ?? row;
  const fullName = [staff.firstName, staff.lastName].filter(Boolean).join(' ');
  return String(
    row.name ??
      row.title ??
      (fullName || row.action || row.code || row.id)
  );
};

const idOf = (row: Row) => String(row.id);
const segment = (id: string) => encodeURIComponent(id);

const display = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(display).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => key !== 'id')
      .map(([key, item]) => (display(item) ? key + ': ' + display(item) : ''))
      .filter(Boolean)
      .join(', ');
  }
  return String(value);
};

function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  icon: Icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: any;
}) {
  const getStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'danger':
        return styles.btnDanger;
      case 'outline':
        return styles.btnOutline;
      default:
        return styles.btnPrimary;
    }
  };
  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondaryText;
      case 'outline':
        return styles.btnOutlineText;
      default:
        return styles.btnText;
    }
  };
  const iconColor =
    variant === 'outline'
      ? theme.colors.primary
      : variant === 'secondary'
      ? '#374151'
      : '#fff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, getStyle(), disabled && styles.disabled]}
    >
      {Icon && <Icon size={14} color={iconColor} />}
      <Text style={getTextStyle()}>{title}</Text>
    </Pressable>
  );
}

function useLoad<T>(load: () => Promise<T>, dependencies: string) {
  const [state, setState] = useState<{ value?: T; error?: string }>({});
  const [version, refresh] = useState(0);
  useEffect(() => {
    let current = true;
    setState({});
    load().then(
      (value) => {
        if (current) setState({ value });
      },
      (error) => {
        if (current) setState({ error: message(error) });
      }
    );
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies, version]);
  return { ...state, reload: () => refresh((n) => n + 1) };
}

function Notice({ error }: { error?: string }) {
  return (
    <Text accessibilityLiveRegion="polite" style={error ? styles.error : styles.muted}>
      {error || 'Loading…'}
    </Text>
  );
}

function Card({ row }: { row: Row }) {
  return (
    <View style={styles.card}>
      {Object.entries(row)
        .filter(
          ([key]) =>
            ![
              'id',
              'hospitalId',
              'branchId',
              'departmentId',
              'userId',
              'passwordHash',
            ].includes(key)
        )
        .map(([key, value]) =>
          display(value) ? (
            <View key={key} style={styles.kvRow}>
              <Text style={styles.kKey}>
                {key.replace(/([a-z])([A-Z])/g, '$1 $2')}:
              </Text>
              <Text style={styles.kVal}>{display(value)}</Text>
            </View>
          ) : null
        )}
    </View>
  );
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.actions}>
      {options.map(([id, name]) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          accessibilityState={{ selected: value === id }}
          onPress={() => onChange(id)}
          style={[styles.choice, value === id && styles.selected]}
        >
          <Text
            style={[styles.choiceText, value === id && styles.selectedChoiceText]}
          >
            {name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Input({
  label: title,
  value,
  change,
  placeholder,
  onClear,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{title}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          accessibilityLabel={title}
          value={value}
          onChangeText={change}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          style={styles.input}
        />
        {!!value && onClear && (
          <TouchableOpacity onPress={onClear} style={styles.inputClearBtn}>
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const branchOptions = async () => {
  const options: [string, string][] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await req<Row[]>('branches', 'GET', undefined, {
      status: 'ACTIVE',
      limit: 100,
      page,
    });
    options.push(
      ...(response.data ?? []).map((row): [string, string] => [
        idOf(row),
        label(row),
      ])
    );
    totalPages = response.meta?.totalPages ?? 1;
  }
  return options;
};

function Editor({
  fields,
  initial,
  onSave,
  choices = {},
  activeControl = false,
}: {
  fields: Field[];
  initial?: Row;
  onSave: (data: Record<string, string | boolean | null>) => Promise<void>;
  choices?: Record<string, [string, string][]>;
  activeControl?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map(([key]) => [
        key,
        String(initial?.[key] ?? '').slice(0, key === 'openingDate' ? 10 : undefined),
      ])
    )
  );
  const [active, setActive] = useState(initial?.isActive !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key: string, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));

  async function save() {
    setError('');
    const missing = fields.find(
      ([key, , optional]) => !optional && !values[key]?.trim()
    );
    if (missing) {
      setError('Enter ' + missing[1].toLowerCase() + '.');
      return;
    }
    const data: Record<string, string | boolean | null> = {};
    for (const [key, , optional] of fields) {
      const value = values[key]?.trim();
      if (value || !optional) data[key] = value ?? '';
      else if (key === 'branchId' && initial) data[key] = null;
      else if (
        initial &&
        !['email', 'alternatePhone', 'emergencyPhone', 'pincode', 'openingDate'].includes(
          key
        )
      )
        data[key] = '';
    }
    if (activeControl) data.isActive = active;
    setBusy(true);
    try {
      await onSave(data);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      {fields.map(([key, title, optional]) =>
        choices[key] ? (
          <View key={key} style={{ gap: 4 }}>
            <Text style={styles.inputLabel}>{title}</Text>
            <Choices
              options={[
                ...(optional ? ([['', 'None']] as [string, string][]) : []),
                ...choices[key],
              ]}
              value={values[key] ?? ''}
              onChange={(value) => change(key, value)}
            />
          </View>
        ) : (
          <Input
            key={key}
            label={title + (optional ? '' : ' *')}
            value={values[key] ?? ''}
            change={(value) => change(key, value)}
          />
        )
      )}
      {activeControl && (
        <View style={{ gap: 4 }}>
          <Text style={styles.inputLabel}>Branch Status</Text>
          <Choices
            options={[
              ['active', 'Active'],
              ['inactive', 'Inactive'],
            ]}
            value={active ? 'active' : 'inactive'}
            onChange={(value) => setActive(value === 'active')}
          />
        </View>
      )}
      {!!error && <Notice error={error} />}
      <Button
        title={busy ? 'Saving…' : 'Save Changes'}
        disabled={busy}
        onPress={save}
      />
    </View>
  );
}

function useAction() {
  const [state, setState] = useState({ busy: false, feedback: '', error: false });
  const [confirmation, setConfirmation] = useState<{
    title: string;
    action: () => Promise<void>;
  }>();
  return {
    ...state,
    confirmation,
    cancel: () => setConfirmation(undefined),
    confirm: (title: string, action: () => Promise<void>) =>
      setConfirmation({ title, action }),
    run: async (action: () => Promise<void>) => {
      setConfirmation(undefined);
      setState({ busy: true, feedback: '', error: false });
      try {
        await action();
        setState({ busy: false, feedback: 'Operation completed successfully.', error: false });
      } catch (error) {
        setState({ busy: false, feedback: message(error), error: true });
      }
    },
  };
}

function Feedback({ action }: { action: ReturnType<typeof useAction> }) {
  return (
    <>
      {!!action.feedback && (
        <View
          style={[
            styles.feedbackBox,
            action.error ? styles.feedbackError : styles.feedbackSuccess,
          ]}
        >
          {action.error ? (
            <AlertTriangle size={16} color={theme.colors.accentRed} />
          ) : (
            <CheckCircle2 size={16} color={theme.colors.accentGreen} />
          )}
          <Text
            accessibilityLiveRegion="polite"
            style={action.error ? styles.errorText : styles.successText}
          >
            {action.feedback}
          </Text>
        </View>
      )}
      {action.confirmation && (
        <Modal transparent={true} visible={true} animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmHeader}>
                <AlertTriangle size={24} color={theme.colors.accentAmber} />
                <Text style={styles.confirmTitle}>Confirm Administrative Action</Text>
              </View>
              <Text style={styles.confirmBody}>{action.confirmation.title}</Text>
              <View style={styles.confirmActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={action.cancel}
                />
                <Button
                  title={action.busy ? 'Executing…' : 'Confirm & Proceed'}
                  variant="danger"
                  disabled={action.busy}
                  onPress={() => {
                    const pending = action.confirmation;
                    if (pending) void action.run(pending.action);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ----------------------------------------------------
// Directory Component with Search, Dynamic Filters,
// Page Size, Multi-Select, Bulk Actions & Audit Modal
// ----------------------------------------------------
function Directory({
  section,
  navigate,
}: {
  section: string;
  navigate: Navigate;
}) {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [auditLogModal, setAuditLogModal] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row>();
  const action = useAction();

  const branches = useLoad(
    async () =>
      ['branches', 'admins', 'users', 'departments', 'doctors', 'patients', 'audit-logs'].includes(
        section
      )
        ? branchOptions()
        : [],
    section
  );

  const unpaged = ['notifications', 'master-settings'].includes(section);

  const data = useLoad(async () => {
    const params = {
      page,
      limit: pageSize,
      search: search || undefined,
      status: status || undefined,
      branchIds: scope || undefined,
      sortOrder,
      role: role || undefined,
    };
    if (section === 'audit-logs') {
      return mobileApiClient.superAdmin.audit({
        page,
        limit: pageSize,
        search: search || undefined,
        action: search || undefined,
        resource: resourceFilter || undefined,
        branchId: scope || undefined,
        userRole: role || undefined,
        sortOrder,
      });
    }
    if (section === 'notifications') {
      return mobileApiClient.notifications.getNotifications();
    }
    return req<Row[]>(
      section === 'master-settings' ? 'master-items' : section,
      'GET',
      undefined,
      unpaged ? undefined : params
    );
  }, JSON.stringify([section, page, pageSize, search, status, scope, sortOrder, resourceFilter, role]));

  const rows: Row[] = data.value?.data ?? [];
  const meta = data.value?.meta ?? { total: rows.length, totalPages: 1 };
  const max = meta.totalPages ?? 1;
  const totalRecords = meta.total ?? rows.length;

  // Clear all filters back to default
  const clearFilters = () => {
    setDraft('');
    setSearch('');
    setResource('');
    setResourceFilter('');
    setStatus('');
    setScope('');
    setRole('');
    setPage(1);
    setSelectedIds([]);
  };

  // Toggle selection for bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => idOf(r)));
    }
  };

  // Execute bulk status change
  const handleBulkStatus = (activate: boolean) => {
    if (!selectedIds.length) return;
    const actionLabel = activate ? 'Activate' : 'Deactivate';
    action.confirm(
      `${actionLabel} ${selectedIds.length} selected record(s)? This will update status in the database.`,
      async () => {
        for (const id of selectedIds) {
          if (section === 'branches') {
            await req(`branches/${segment(id)}/status`, 'PATCH', {
              isActive: activate,
            });
          } else if (section === 'admins' || section === 'users') {
            await req(`users/${segment(id)}/status`, 'PATCH', {
              isActive: activate,
            });
          }
        }
        setSelectedIds([]);
        data.reload();
      }
    );
  };

  // Export full matching dataset
  const handleExport = async (format: 'csv' | 'pdf' | 'print') => {
    action.run(async () => {
      const exportParams = {
        page: 1,
        limit: 1000,
        search: search || undefined,
        status: status || undefined,
        branchIds: scope || undefined,
        sortOrder,
        role: role || undefined,
      };
      let allRows: Row[] = [];
      if (section === 'audit-logs') {
        const res = await mobileApiClient.superAdmin.audit({
          page: 1,
          limit: 1000,
          search: search || undefined,
          action: search || undefined,
          resource: resourceFilter || undefined,
          branchId: scope || undefined,
          userRole: role || undefined,
          sortOrder,
        });
        allRows = (res as any)?.data ?? [];
      } else {
        const res = await req<Row[]>(
          section === 'master-settings' ? 'master-items' : section,
          'GET',
          undefined,
          exportParams
        );
        allRows = res?.data ?? [];
      }
      if (!allRows.length) throw new Error('No records found to export.');

      let headers: string[] = [];
      let exportData: (string | number | boolean | null | undefined)[][] = [];
      const title = titles[section] || section;

      if (section === 'doctors') {
        headers = [
          'Doctor Name',
          'Code/License',
          'Department',
          'Specialization',
          'Branch',
          'OPD Fee',
          'Shift',
          'Availability',
        ];
        exportData = allRows.map((r: any) => {
          const staff = r.employee?.user ?? r;
          return [
            `Dr. ${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
            r.licenseNumber || r.doctorCode || '-',
            r.department?.name || r.department || '-',
            r.specialization || '-',
            r.branch?.name || r.branchName || '-',
            r.consultationFee ? `₹${r.consultationFee}` : '-',
            r.shift || '-',
            r.isAvailableToday ? 'Available' : 'Unavailable',
          ];
        });
      } else if (section === 'patients') {
        headers = ['UHID', 'Patient Name', 'Gender', 'Phone', 'City', 'Status', 'Registered Date'];
        exportData = allRows.map((r: any) => [
          r.uhid || '-',
          `${r.firstName || ''} ${r.lastName || ''}`.trim(),
          r.gender || '-',
          r.phone || '-',
          r.city || '-',
          r.status || 'ACTIVE',
          r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-',
        ]);
      } else if (section === 'audit-logs') {
        headers = ['Timestamp', 'User Email', 'Role', 'Action', 'Resource', 'Resource ID', 'Scope'];
        exportData = allRows.map((r: any) => [
          r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
          r.userEmail || '-',
          r.userRole || '-',
          r.action || '-',
          r.resource || '-',
          r.resourceId || '-',
          r.branchId || r.hospitalId || '-',
        ]);
      } else if (section === 'branches') {
        headers = ['Code', 'Branch Name', 'City', 'Phone', 'Status'];
        exportData = allRows.map((r: any) => [
          r.code || '-',
          r.name || '-',
          r.city || '-',
          r.phone || '-',
          r.isActive ? 'Active' : 'Inactive',
        ]);
      } else if (section === 'admins' || section === 'users') {
        headers = ['Name', 'Email', 'Role', 'Employee Code', 'Status'];
        exportData = allRows.map((r: any) => {
          const emp = r.employee as any;
          const roleStr = Array.isArray(r.roles)
            ? r.roles.map((x: any) => x.role?.name || x.role || x).join(', ')
            : r.role || '-';
          return [
            `${r.firstName || ''} ${r.lastName || ''}`.trim(),
            r.email || '-',
            roleStr,
            emp?.employeeCode || '-',
            r.isActive ? 'Active' : 'Inactive',
          ];
        });
      } else {
        const keys = Object.keys(allRows[0] || {}).filter(
          (k) => !['id', 'hospitalId', 'passwordHash'].includes(k)
        );
        headers = keys.map((k) => k.replace(/([a-z])([A-Z])/g, '$1 $2'));
        exportData = allRows.map((r) => keys.map((k) => display(r[k])));
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = buildCsvContent(headers, exportData);
        downloadCsvFile(`${section}-export-${timestamp}`, csv);
      } else if (format === 'pdf') {
        downloadPdfFile(
          `${section}-export-${timestamp}`,
          title,
          `Exported on ${new Date().toLocaleDateString()}`,
          headers,
          exportData
        );
      } else if (format === 'print') {
        openPrintableReport(
          title,
          `Exported on ${new Date().toLocaleDateString()}`,
          headers,
          exportData
        );
      }
    });
  };

  const open = (row: Row) => {
    if (section === 'branches') navigate('branch-details', idOf(row));
    else if (section === 'admins' || section === 'users') navigate('admin-details', idOf(row));
    else if (section === 'audit-logs') setAuditLogModal(row);
    else setEditing(row);
  };

  return (
    <>
      {/* Search & Dynamic Filter Panel */}
      {!unpaged && (
        <View style={styles.card}>
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Search"
                value={draft}
                change={setDraft}
                placeholder={`Search ${titles[section] || section}...`}
                onClear={() => {
                  setDraft('');
                  setSearch('');
                  setPage(1);
                }}
              />
            </View>
            <Button
              title="Search"
              icon={Search}
              onPress={() => {
                setSearch(draft.trim());
                setResourceFilter(resource.trim());
                setPage(1);
              }}
            />
          </View>

          {section === 'audit-logs' && (
            <Input
              label="Resource Filter (e.g. USER, BRANCH, DOCTOR)"
              value={resource}
              change={setResource}
              placeholder="Filter by resource..."
              onClear={() => {
                setResource('');
                setResourceFilter('');
                setPage(1);
              }}
            />
          )}

          {/* Status Filters */}
          {['branches', 'admins', 'users', 'departments', 'doctors'].includes(section) && (
            <View style={{ gap: 4 }}>
              <Text style={styles.inputLabel}>Filter by Status</Text>
              <Choices
                options={[
                  ['', 'All statuses'],
                  ['ACTIVE', 'Active'],
                  ['INACTIVE', 'Inactive'],
                ]}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
            </View>
          )}

          {section === 'patients' && (
            <View style={{ gap: 4 }}>
              <Text style={styles.inputLabel}>Patient Status</Text>
              <Choices
                options={[
                  ['', 'All statuses'],
                  ['ADMITTED', 'Admitted'],
                  ['DISCHARGED', 'Discharged'],
                  ['OUTPATIENT', 'Outpatient'],
                ]}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
            </View>
          )}

          {/* Role Filters */}
          {['users', 'admins', 'audit-logs'].includes(section) && (
            <View style={{ gap: 4 }}>
              <Text style={styles.inputLabel}>Filter by Role</Text>
              <Choices
                options={[
                  ['', 'All roles'],
                  ...(section === 'admins'
                    ? [Role.HOSPITAL_ADMIN, Role.DEPARTMENT_ADMIN]
                    : Object.values(Role)
                  ).map((value): [string, string] => [value, value.replace(/_/g, ' ')]),
                ]}
                value={role}
                onChange={(value) => {
                  setRole(value);
                  setPage(1);
                }}
              />
            </View>
          )}

          {/* Branch Dynamic Dropdown Filter */}
          {!!branches.value?.length && (
            <View style={{ gap: 4 }}>
              <Text style={styles.inputLabel}>Filter by Branch</Text>
              <Choices
                options={[['', 'All branches'], ...branches.value]}
                value={scope}
                onChange={(value) => {
                  setScope(value);
                  setPage(1);
                }}
              />
            </View>
          )}

          {/* Page Size & Reset Filter Controls */}
          <View style={styles.filterMetaRow}>
            <View style={styles.pageSizeRow}>
              <Text style={styles.pageSizeLabel}>Rows per page:</Text>
              <Choices
                options={[
                  ['10', '10'],
                  ['20', '20'],
                  ['50', '50'],
                  ['100', '100'],
                ]}
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              />
            </View>

            <Button
              title="Clear Filters"
              variant="outline"
              icon={X}
              onPress={clearFilters}
            />
          </View>
        </View>
      )}

      {/* Primary Actions & Export Toolbar */}
      <View style={styles.actions}>
        <Button title="Refresh" variant="secondary" onPress={data.reload} />

        {['doctors', 'patients', 'audit-logs', 'branches', 'admins', 'users'].includes(
          section
        ) && (
          <>
            <Button
              title="Export CSV"
              variant="outline"
              icon={Download}
              disabled={action.busy}
              onPress={() => handleExport('csv')}
            />
            <Button
              title="Export PDF"
              variant="outline"
              icon={Printer}
              disabled={action.busy}
              onPress={() => handleExport('pdf')}
            />
          </>
        )}

        {section === 'branches' && (
          <Button
            title="+ Add Branch"
            onPress={() => navigate('add-branch')}
          />
        )}
        {section === 'admins' && (
          <Button
            title="+ Create Administrator"
            onPress={() => navigate('create-admin')}
          />
        )}
        {['departments', 'master-settings'].includes(section) && (
          <Button title="+ Add Item" onPress={() => setEditing({})} />
        )}
        {section === 'notifications' && (
          <Button
            title="Mark All as Read"
            disabled={action.busy}
            onPress={() =>
              action.run(async () => {
                await mobileApiClient.notifications.markAllAsRead();
                data.reload();
              })
            }
          />
        )}
      </View>

      {/* Bulk Actions Bar (When items are selected) */}
      {['branches', 'admins', 'users'].includes(section) && rows.length > 0 && (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={selectAll}
          >
            {selectedIds.length === rows.length ? (
              <CheckSquare size={16} color={theme.colors.primary} />
            ) : (
              <Square size={16} color="#6B7280" />
            )}
            <Text style={styles.selectAllText}>
              Select All ({rows.length})
            </Text>
          </TouchableOpacity>

          {selectedIds.length > 0 && (
            <View style={styles.bulkRightActions}>
              <Text style={styles.selectedCountText}>
                {selectedIds.length} selected
              </Text>
              <Button
                title="Bulk Activate"
                variant="secondary"
                disabled={action.busy}
                onPress={() => handleBulkStatus(true)}
              />
              <Button
                title="Bulk Deactivate"
                variant="danger"
                disabled={action.busy}
                onPress={() => handleBulkStatus(false)}
              />
            </View>
          )}
        </View>
      )}

      {/* Feedback Messages & Confirmation Modals */}
      <Feedback action={action} />

      {/* Editing / Quick Details Card */}
      {editing && (
        <View style={{ gap: 8 }}>
          <Button title="Close Details" variant="secondary" onPress={() => setEditing(undefined)} />
          {section === 'departments' && branches.value ? (
            <Editor
              key={idOf(editing)}
              fields={departmentFields}
              initial={editing.id ? editing : undefined}
              choices={{ branchId: branches.value }}
              onSave={async (body) => {
                await req(
                  'departments' + (editing.id ? '/' + segment(idOf(editing)) : ''),
                  editing.id ? 'PATCH' : 'POST',
                  body
                );
                setEditing(undefined);
                data.reload();
              }}
            />
          ) : section === 'master-settings' ? (
            <Editor
              key={idOf(editing)}
              fields={[
                ['category', 'Category'],
                ['code', 'Code'],
                ['name', 'Name'],
                ['description', 'Description', true],
              ]}
              initial={
                editing.id
                  ? { ...editing, category: (editing.dataSet as Row | undefined)?.key }
                  : undefined
              }
              choices={{
                category: (editing.id
                  ? [String((editing.dataSet as Row | undefined)?.key)]
                  : ['Department', 'Specialization', 'Designation']
                ).map((name) => [name, name]),
              }}
              onSave={async (body) => {
                await req(
                  editing.id ? 'master-items/' + segment(idOf(editing)) : 'master-items',
                  editing.id ? 'PATCH' : 'POST',
                  body
                );
                setEditing(undefined);
                data.reload();
              }}
            />
          ) : (
            <Card row={editing} />
          )}
        </View>
      )}

      {/* Audit Log Full Detail Modal */}
      {auditLogModal && (
        <Modal transparent={true} visible={true} animationType="slide">
          <View style={styles.confirmOverlay}>
            <View style={styles.auditModalCard}>
              <View style={styles.auditModalHeader}>
                <View style={{ gap: 2 }}>
                  <Text style={styles.auditModalTitle}>Audit Log Inspection</Text>
                  <Text style={styles.auditModalTime}>
                    {auditLogModal.createdAt
                      ? new Date(String(auditLogModal.createdAt)).toLocaleString()
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAuditLogModal(null)}
                  style={styles.closeBtn}
                >
                  <X size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.auditModalBody}>
                <View style={styles.kvRow}>
                  <Text style={styles.kKey}>Action:</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>
                      {String(auditLogModal.action || '-')}
                    </Text>
                  </View>
                </View>

                <View style={styles.kvRow}>
                  <Text style={styles.kKey}>Resource Target:</Text>
                  <Text style={styles.kVal}>
                    {String(auditLogModal.resource || '-')}
                    {auditLogModal.resourceId ? ` (ID: ${auditLogModal.resourceId})` : ''}
                  </Text>
                </View>

                <View style={styles.kvRow}>
                  <Text style={styles.kKey}>Performed By:</Text>
                  <Text style={styles.kVal}>
                    {String(auditLogModal.userEmail || '-')} (
                    {String(auditLogModal.userRole || '-')})
                  </Text>
                </View>

                {auditLogModal.userId && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kKey}>User Account:</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const targetUserId = String(auditLogModal.userId);
                        setAuditLogModal(null);
                        navigate('admin-details', targetUserId);
                      }}
                    >
                      <Text style={styles.userLinkText}>
                        View User Profile →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {auditLogModal.branchId && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kKey}>Branch Scope:</Text>
                    <Text style={styles.kVal}>
                      {String(auditLogModal.branchId)}
                    </Text>
                  </View>
                )}

                {auditLogModal.details && (
                  <View style={{ gap: 4, marginTop: 8 }}>
                    <Text style={styles.kKey}>Audit Event Details / Diff:</Text>
                    <View style={styles.jsonBox}>
                      <Text style={styles.jsonText}>
                        {JSON.stringify(auditLogModal.details, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}

                {auditLogModal.ipAddress && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kKey}>IP Address:</Text>
                    <Text style={styles.kVal}>
                      {String(auditLogModal.ipAddress)}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.auditModalFooter}>
                <Button
                  title="Close Inspection"
                  variant="secondary"
                  onPress={() => setAuditLogModal(null)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Directory Records List */}
      {!data.value ? (
        <Notice error={data.error} />
      ) : rows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Info size={32} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Records Found</Text>
          <Text style={styles.emptyDesc}>
            No entries match your search and filter criteria.
          </Text>
          <Button title="Reset Filters" variant="outline" onPress={clearFilters} />
        </View>
      ) : (
        rows.map((row) => {
          const rowId = idOf(row);
          const isSelected = selectedIds.includes(rowId);
          const isActive = row.isActive ?? row.status === 'ACTIVE';

          return (
            <View
              key={rowId}
              style={[styles.rowCard, isSelected && styles.rowCardSelected]}
            >
              <View style={styles.rowCardTop}>
                {['branches', 'admins', 'users'].includes(section) && (
                  <TouchableOpacity
                    onPress={() => toggleSelect(rowId)}
                    style={{ padding: 4 }}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} color={theme.colors.primary} />
                    ) : (
                      <Square size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                )}

                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowTitle}>{label(row)}</Text>
                    {row.isActive !== undefined && (
                      <View
                        style={
                          row.isActive ? styles.badgeActive : styles.badgeInactive
                        }
                      >
                        <Text
                          style={
                            row.isActive
                              ? styles.badgeTextActive
                              : styles.badgeTextInactive
                          }
                        >
                          {row.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.rowSubtitle}>
                    {display(
                      row.code ??
                        row.email ??
                        row.userEmail ??
                        row.action ??
                        row.status
                    )}
                    {row.createdAt
                      ? ` · ${new Date(String(row.createdAt)).toLocaleDateString()}`
                      : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.rowCardBottom}>
                <Button
                  title={section === 'audit-logs' ? 'Inspect Log' : 'View Details'}
                  variant="outline"
                  onPress={() => open(row)}
                />

                {['departments', 'master-settings'].includes(section) && (
                  <Button
                    title={isActive ? 'Deactivate' : 'Activate'}
                    variant={isActive ? 'danger' : 'secondary'}
                    disabled={action.busy}
                    onPress={() =>
                      action.confirm(
                        `Change status of ${label(row)} to ${
                          isActive ? 'Inactive' : 'Active'
                        }?`,
                        async () => {
                          await req(
                            (section === 'departments' ? section : 'master-items') +
                              '/' +
                              segment(rowId) +
                              '/status',
                            'PATCH',
                            { isActive: !isActive }
                          );
                          setEditing(undefined);
                          data.reload();
                        }
                      )
                    }
                  />
                )}

                {section === 'notifications' && row.isRead === false && (
                  <Button
                    title="Mark Read"
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() =>
                      action.run(async () => {
                        await mobileApiClient.notifications.markAsRead(rowId);
                        data.reload();
                      })
                    }
                  />
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Pagination Controls */}
      {!unpaged && (
        <View style={styles.paginationCard}>
          <Text style={styles.paginationMeta}>
            Showing {rows.length} of {totalRecords} records · Page {page} of{' '}
            {Math.max(max, 1)}
          </Text>
          <View style={styles.paginationButtons}>
            <Button
              title="Previous"
              variant="secondary"
              icon={ChevronLeft}
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
            />
            <Button
              title="Next"
              variant="secondary"
              disabled={page >= max}
              onPress={() => setPage(page + 1)}
            />
          </View>
        </View>
      )}
    </>
  );
}

// ----------------------------------------------------
// Complete Branch Component:
// Details, Departments, Admins (Clickable!), Doctors & Audit
// ----------------------------------------------------
type Navigate = (screen: string, id?: string, branchId?: string) => void;

function Branch({
  section,
  id,
  navigate,
}: {
  section: string;
  id: string;
  navigate: Navigate;
}) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;
  const data = useLoad(
    async () => (id ? (await req<Row>('branches/' + segment(id))).data : undefined),
    id
  );
  const action = useAction();

  if (section === 'add-branch' || section === 'edit-branch') {
    if (section === 'edit-branch' && !data.value)
      return (
        <Notice error={data.error || (!id ? 'Select a branch first.' : undefined)} />
      );
    return (
      <Editor
        fields={branchFields}
        initial={data.value}
        activeControl={section === 'add-branch'}
        onSave={async (body) => {
          const saved = await req<Row>(
            id ? 'branches/' + segment(id) : 'branches',
            id ? 'PATCH' : 'POST',
            body
          );
          navigate('branch-details', String(saved.data?.id ?? id));
        }}
      />
    );
  }

  const row = data.value;
  if (!row)
    return (
      <Notice error={data.error || (!id ? 'Select a branch first.' : undefined)} />
    );

  const departments = (row.departments as Row[] | undefined) ?? [];
  const assignedAdmins = (row.assignedAdmins as Row[] | undefined) ?? [];
  const doctors = (row.doctors as Row[] | undefined) ?? [];
  const auditHistory = (row.auditHistory as Row[] | undefined) ?? [];

  return (
    <View style={{ gap: 14 }}>
      {/* Branch Profile Summary Header */}
      <View style={styles.detailHeaderCard}>
        <View style={styles.detailHeaderTop}>
          <View style={{ gap: 4 }}>
            <Text style={styles.detailTitle}>{label(row)}</Text>
            <Text style={styles.detailSubtitle}>Code: {display(row.code)}</Text>
          </View>
          <View
            style={
              row.isActive ? styles.badgeActive : styles.badgeInactive
            }
          >
            <Text
              style={
                row.isActive
                  ? styles.badgeTextActive
                  : styles.badgeTextInactive
              }
            >
              {row.isActive ? 'Active Branch' : 'Inactive Branch'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Edit Branch"
            variant="secondary"
            onPress={() => navigate('edit-branch', id)}
          />
          {row.isActive === true && (
            <Button
              title="Assign Administrator"
              variant="outline"
              onPress={() => navigate('assign-admin', undefined, id)}
            />
          )}
          <Button
            title={row.isActive ? 'Deactivate Branch' : 'Activate Branch'}
            variant={row.isActive ? 'danger' : 'primary'}
            disabled={action.busy}
            onPress={() =>
              action.confirm(
                `${row.isActive ? 'Deactivate' : 'Activate'} branch ${label(
                  row
                )}? Historical operational data will be preserved.`,
                async () => {
                  await req('branches/' + segment(id) + '/status', 'PATCH', {
                    isActive: !row.isActive,
                  });
                  data.reload();
                }
              )
            }
          />
        </View>
      </View>

      <Feedback action={action} />

      {/* Complete Branch Data Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Branch Contact & Identity</Text>
        <Card row={row} />
      </View>

      {/* Departments in this Branch */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Clinical Departments ({departments.length})
        </Text>
        {departments.length === 0 ? (
          <Text style={styles.muted}>No clinical departments assigned to this branch.</Text>
        ) : (
          <View style={styles.grid2Col}>
            {departments.map((dept) => (
              <View
                key={idOf(dept)}
                style={[
                  styles.subItemCard,
                  isNarrow ? { width: '100%' } : { width: '48.5%' },
                ]}
              >
                <View style={styles.rowTitleRow}>
                  <Text style={styles.subItemTitle}>{label(dept)}</Text>
                  <Text style={styles.subItemBadge}>{display(dept.code)}</Text>
                </View>
                <Text style={styles.subItemStatus}>
                  Status: {dept.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Assigned Administrators (With Clickable Link to Profile!) */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Assigned Administrators ({assignedAdmins.length})
        </Text>
        {assignedAdmins.length === 0 ? (
          <Text style={styles.muted}>No administrator assigned yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {assignedAdmins.map((adm) => {
              const rolesStr = Array.isArray(adm.userRoles)
                ? adm.userRoles.map((r: any) => r.role?.name || r.name).join(', ')
                : 'Hospital Admin';
              return (
                <TouchableOpacity
                  key={idOf(adm)}
                  style={styles.adminRowCard}
                  onPress={() => navigate('admin-details', idOf(adm))}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.adminNameLink}>{label(adm)}</Text>
                    <Text style={styles.subItemDesc}>
                      {display(adm.email)} · {display(adm.phone)}
                    </Text>
                    <Text style={styles.adminRoleBadge}>{rolesStr}</Text>
                  </View>
                  <ExternalLink size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Assigned Specialist Doctors */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Specialist Doctors ({doctors.length})
        </Text>
        {doctors.length === 0 ? (
          <Text style={styles.muted}>No specialist doctors registered in this branch.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {doctors.map((doc: any) => {
              const staff = doc.employee?.user;
              const name = staff ? `Dr. ${staff.firstName} ${staff.lastName}` : 'Dr. ' + (doc.licenseNumber || 'Doctor');
              return (
                <View key={idOf(doc)} style={styles.subItemCard}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.subItemTitle}>{name}</Text>
                    <Text style={styles.subItemBadge}>{doc.licenseNumber}</Text>
                  </View>
                  <Text style={styles.subItemDesc}>
                    Specialization: {doc.specialization} · OPD Fee: ₹{doc.consultationFee}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Related Audit History for this Branch */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Related Audit History ({auditHistory.length})
        </Text>
        {auditHistory.length === 0 ? (
          <Text style={styles.muted}>No audit logs found for this branch.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {auditHistory.map((audit) => (
              <View key={idOf(audit)} style={styles.auditRowItem}>
                <View style={styles.rowTitleRow}>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{String(audit.action)}</Text>
                  </View>
                  <Text style={styles.auditTimeText}>
                    {audit.createdAt
                      ? new Date(String(audit.createdAt)).toLocaleString()
                      : ''}
                  </Text>
                </View>
                <Text style={styles.subItemDesc}>
                  Target: {String(audit.resource)} · Actor: {String(audit.userEmail)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ----------------------------------------------------
// Organization Profile Component
// ----------------------------------------------------
function Organization() {
  const data = useLoad(
    async () => (await req<Row>('organization')).data ?? {},
    'organization'
  );
  const [saved, setSaved] = useState(false);
  return data.value ? (
    <View style={{ gap: 12 }}>
      <Text style={styles.value}>Hospital code: {display(data.value.code)}</Text>
      <Editor
        fields={organizationFields}
        initial={data.value}
        onSave={async (body) => {
          await req('organization', 'PATCH', body);
          setSaved(true);
          data.reload();
        }}
      />
      {saved && (
        <Text accessibilityLiveRegion="polite" style={styles.successText}>
          Organization profile saved.
        </Text>
      )}
    </View>
  ) : (
    <Notice error={data.error} />
  );
}

// ----------------------------------------------------
// Complete Administrator & User Details Component:
// Personal info, Hospital, Branch, Department, Roles,
// Permissions, Account Status, Audit History & Actions
// ----------------------------------------------------
function Administrator({
  section,
  id,
  branchId,
  navigate,
}: {
  section: string;
  id: string;
  branchId: string;
  navigate: Navigate;
}) {
  const account = useLoad(
    async () => (id ? (await req<Row>('users/' + segment(id))).data : undefined),
    id
  );
  const needsBranch = section !== 'admin-details';
  const branches = useLoad(
    async () => (needsBranch ? branchOptions() : []),
    section
  );
  const departments = useLoad(async () => {
    const options: [string, string][] = [];
    if (section !== 'create-admin') return options;
    let totalPages = 1;
    for (let page = 1; page <= totalPages; page++) {
      const response = await req<Row[]>('departments', 'GET', undefined, {
        status: 'ACTIVE',
        limit: 100,
        page,
      });
      options.push(
        ...(response.data ?? []).map((row): [string, string] => [
          idOf(row),
          label(row) + (row.branch ? ' · ' + display(row.branch) : ''),
        ])
      );
      totalPages = response.meta?.totalPages ?? 1;
    }
    return options;
  }, section);

  const [code, setCode] = useState<unknown>();
  const [edit, setEdit] = useState(false);
  const action = useAction();

  const candidates = useLoad(async () => {
    const options: [string, string][] = [];
    if (!branchId || id || section !== 'assign-admin') return options;
    let totalPages = 1;
    for (let page = 1; page <= totalPages; page++) {
      const response = await req<Row[]>('admins', 'GET', undefined, {
        status: 'ACTIVE',
        role: Role.HOSPITAL_ADMIN,
        limit: 100,
        page,
      });
      options.push(
        ...(response.data ?? []).map((row): [string, string] => [
          idOf(row),
          label(row),
        ])
      );
      totalPages = response.meta?.totalPages ?? 1;
    }
    return options;
  }, JSON.stringify([section, id, branchId]));

  const row = account.value;

  if (section === 'create-admin') {
    if (code)
      return (
        <View style={styles.card}>
          <Text style={styles.heading}>Administrator Created Successfully</Text>
          <Text style={styles.value}>
            Share this one-time invitation code securely. It is shown only once.
          </Text>
          <Text selectable style={styles.codeBox}>
            {display(code)}
          </Text>
          <Button
            title="Back to Administrators"
            onPress={() => navigate('admins')}
          />
        </View>
      );
    if (!branches.value || !departments.value)
      return <Notice error={branches.error || departments.error} />;
    return (
      <Editor
        fields={[
          ...staffFields,
          ['email', 'Email'],
          ['phone', 'Phone'],
          ['dateOfJoining', 'Joining date (YYYY-MM-DD)'],
          ['role', 'Role'],
          ['branchId', 'Branch', true],
          ['departmentId', 'Department', true],
        ]}
        choices={{
          role: [
            [Role.HOSPITAL_ADMIN, 'Hospital Admin'],
            [Role.DEPARTMENT_ADMIN, 'Department Admin'],
          ],
          branchId: branches.value,
          departmentId: departments.value,
        }}
        onSave={async (body) => {
          const result = await req<Row>('admins', 'POST', body);
          setCode(result.data?.invitation);
        }}
      />
    );
  }

  if (section === 'assign-admin' && branchId && !id) {
    if (!candidates.value) return <Notice error={candidates.error} />;
    if (!candidates.value.length)
      return (
        <Text style={styles.muted}>
          No active Hospital Admin accounts are available to assign.
        </Text>
      );
    return (
      <Editor
        fields={[['userId', 'Hospital Admin']]}
        choices={{ userId: candidates.value }}
        onSave={async (body) => {
          await req(
            'users/' + segment(String(body.userId)) + '/branch-assignment',
            'PATCH',
            { branchId }
          );
          navigate('branch-details', branchId);
        }}
      />
    );
  }

  if (!row || !branches.value)
    return (
      <Notice
        error={
          account.error ||
          branches.error ||
          (!id ? 'Select an account first.' : undefined)
        }
      />
    );

  if (section === 'assign-admin')
    return (
      <Editor
        fields={[['branchId', 'Branch']]}
        initial={row}
        choices={{ branchId: branches.value }}
        onSave={async (body) => {
          await req('users/' + segment(id) + '/branch-assignment', 'PATCH', body);
          navigate('admin-details', id);
        }}
      />
    );

  const roleDetails = JSON.stringify(row.roles ?? row.role ?? '');
  const isSuperAdminAccount = roleDetails.includes(Role.SUPER_ADMIN);
  const permissions = (row.permissions as string[] | undefined) ?? [];
  const auditHistory = (row.auditHistory as Row[] | undefined) ?? [];

  return (
    <View style={{ gap: 14 }}>
      {/* Account Profile Header */}
      <View style={styles.detailHeaderCard}>
        <View style={styles.detailHeaderTop}>
          <View style={{ gap: 4 }}>
            <Text style={styles.detailTitle}>{label(row)}</Text>
            <Text style={styles.detailSubtitle}>{display(row.email)}</Text>
          </View>
          <View
            style={
              row.isActive ? styles.badgeActive : styles.badgeInactive
            }
          >
            <Text
              style={
                row.isActive
                  ? styles.badgeTextActive
                  : styles.badgeTextInactive
              }
            >
              {row.isActive ? 'Active Account' : 'Inactive Account'}
            </Text>
          </View>
        </View>

        {!isSuperAdminAccount && (
          <View style={styles.actions}>
            <Button
              title={row.isActive ? 'Deactivate Account' : 'Activate Account'}
              variant={row.isActive ? 'danger' : 'primary'}
              disabled={action.busy}
              onPress={() =>
                action.confirm(
                  `Change status of account ${label(row)} to ${
                    row.isActive ? 'Inactive' : 'Active'
                  }?`,
                  async () => {
                    await req('users/' + segment(id) + '/status', 'PATCH', {
                      isActive: !row.isActive,
                    });
                    setCode(undefined);
                    account.reload();
                  }
                )
              }
            />

            {roleDetails.includes(Role.HOSPITAL_ADMIN) && (
              <Button
                title="Assign Branch"
                variant="outline"
                onPress={() => navigate('assign-admin', id)}
              />
            )}

            {!!row.employee && (
              <Button
                title={edit ? 'Cancel Edit' : 'Edit Employee'}
                variant="secondary"
                onPress={() => setEdit(!edit)}
              />
            )}

            {row.isActive === true &&
              ['invitation', 'reset'].map((purpose) => (
                <Button
                  key={purpose}
                  title={`Issue ${purpose} Code`}
                  variant="outline"
                  disabled={action.busy}
                  onPress={() =>
                    action.confirm(
                      `Generate a new one-time ${purpose} authorization code for ${label(
                        row
                      )}?`,
                      async () => {
                        setCode(undefined);
                        const result = await req(
                          'users/' + segment(id) + '/' + purpose + '-code',
                          'POST'
                        );
                        setCode(result.data);
                      }
                    )
                  }
                />
              ))}
          </View>
        )}
      </View>

      <Feedback action={action} />

      {/* Edit Employee Designation/Info */}
      {edit && (
        <Editor
          fields={[...staffFields, ['designation', 'Designation']]}
          initial={{ ...row, ...(row.employee as Row) }}
          onSave={async (body) => {
            await req('users/' + segment(id) + '/employee', 'PATCH', body);
            setEdit(false);
            account.reload();
          }}
        />
      )}

      {/* Code Display */}
      {!!code && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>
            One-Time Authorization Code Generated
          </Text>
          <Text style={styles.muted}>Share this code securely with the user.</Text>
          <Text selectable style={styles.codeBox}>
            {display(code)}
          </Text>
          <Button title="Hide Code" variant="secondary" onPress={() => setCode(undefined)} />
        </View>
      )}

      {/* Complete Account Overview */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Account & Hospital Affiliation</Text>
        <Card row={row} />
      </View>

      {/* Assigned Roles & Permissions Matrix */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Assigned Roles & Permissions ({permissions.length})
        </Text>
        <View style={styles.rolesGrid}>
          {permissions.map((perm) => (
            <View key={perm} style={styles.permChip}>
              <Text style={styles.permText}>{perm}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* User Related Audit History */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>
          Related Audit Activity ({auditHistory.length})
        </Text>
        {auditHistory.length === 0 ? (
          <Text style={styles.muted}>No audit history recorded for this user.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {auditHistory.map((audit) => (
              <View key={idOf(audit)} style={styles.auditRowItem}>
                <View style={styles.rowTitleRow}>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{String(audit.action)}</Text>
                  </View>
                  <Text style={styles.auditTimeText}>
                    {audit.createdAt
                      ? new Date(String(audit.createdAt)).toLocaleString()
                      : ''}
                  </Text>
                </View>
                <Text style={styles.subItemDesc}>
                  Resource: {String(audit.resource)} · Scope: {String(audit.branchId || 'Hospital')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ----------------------------------------------------
// Policies & Permissions Management Component
// ----------------------------------------------------
function Policies() {
  const [role, setRole] = useState<string>(Role.HOSPITAL_ADMIN);
  const [grants, setGrants] = useState<string[]>();
  const policy = useLoad(
    async () =>
      (await req<{ defaults: string[]; grants: string[] }>('policies/' + segment(role)))
        .data ?? { defaults: [], grants: [] },
    role
  );
  const action = useAction();
  const selected = grants ?? policy.value?.grants ?? [];
  return (
    <View style={{ gap: 12 }}>
      <Choices
        options={Object.values(Role).map((value) => [value, value.replace(/_/g, ' ')])}
        value={role}
        onChange={(value) => {
          setGrants(undefined);
          setRole(value);
        }}
      />
      {!policy.value ? (
        <Notice error={policy.error} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.muted}>
            Hospital grants are strictly governed by role capability specifications.
          </Text>
          {policy.value.defaults.map((grant) => (
            <Pressable
              key={grant}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: selected.includes(grant),
                disabled: role === Role.SUPER_ADMIN,
              }}
              disabled={role === Role.SUPER_ADMIN || action.busy}
              onPress={() =>
                setGrants(
                  selected.includes(grant)
                    ? selected.filter((value) => value !== grant)
                    : [...selected, grant]
                )
              }
              style={{ paddingVertical: 4 }}
            >
              <Text style={styles.value}>
                {selected.includes(grant) ? '✓ ' : '○ '}
                {grant}
              </Text>
            </Pressable>
          ))}
          {role !== Role.SUPER_ADMIN && (
            <Button
              title="Save Role Policy Grants"
              disabled={!grants || action.busy}
              onPress={() =>
                action.confirm('Apply these hospital role grants?', async () => {
                  await req('policies/' + segment(role), 'PATCH', { grants: selected });
                  setGrants(undefined);
                  policy.reload();
                })
              }
            />
          )}
        </View>
      )}
      <Feedback action={action} />
    </View>
  );
}

// ----------------------------------------------------
// Reports Component
// ----------------------------------------------------
function Reports() {
  const { user } = useAuth();
  const [key, setKey] = useState<string>(SUPER_ADMIN_REPORTS[0][0]);
  const [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [query, setQuery] = useState<{
    from?: string;
    to?: string;
    branchIds?: string;
  }>({});
  const branches = useLoad(branchOptions, 'report-branches');
  const data = useLoad(
    async () =>
      (await req<SuperAdminReport>('reports/' + segment(key), 'GET', undefined, query))
        .data,
    JSON.stringify([key, query])
  );
  const action = useAction();
  const canExport =
    typeof document !== 'undefined' &&
    user?.permissions.includes('REPORTS:EXPORT') === true;

  return (
    <View style={{ gap: 12 }}>
      <Choices
        options={SUPER_ADMIN_REPORTS.map(([id, name]) => [id, name])}
        value={key}
        onChange={setKey}
      />
      <View style={styles.card}>
        <Input label="From (YYYY-MM-DD)" value={from} change={setFrom} />
        <Input label="To (YYYY-MM-DD)" value={to} change={setTo} />
        {branches.value?.map(([id, name]) => (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: chosen.includes(id) }}
            onPress={() =>
              setChosen(
                chosen.includes(id)
                  ? chosen.filter((value) => value !== id)
                  : [...chosen, id]
              )
            }
          >
            <Text style={styles.value}>
              {chosen.includes(id) ? '✓ ' : '○ '}
              {name}
            </Text>
          </Pressable>
        ))}
        {!!branches.error && <Notice error={branches.error} />}
        <Button
          title="Apply Report Filters"
          onPress={() =>
            setQuery({
              from: from.trim() || undefined,
              to: to.trim() || undefined,
              branchIds: chosen.join(',') || undefined,
            })
          }
        />
      </View>
      <Feedback action={action} />
      {data.value ? (
        <>
          <View style={styles.actions}>
            {canExport &&
              (['csv', 'print'] as const).map((format) => (
                <Button
                  key={format}
                  title={format === 'csv' ? 'Download CSV' : 'Print / Save PDF'}
                  variant="outline"
                  disabled={action.busy}
                  onPress={() =>
                    action.run(async () => {
                      const exported = (
                        await req<SuperAdminReport>(
                          'reports/' + segment(key) + '/export',
                          'POST',
                          undefined,
                          query
                        )
                      ).data;
                      if (!exported) throw new Error('No report was returned.');
                      const rows = [exported.headers, ...exported.rows];
                      if (format === 'csv') {
                        const csv = buildCsvContent(exported.headers, exported.rows);
                        downloadCsvFile(`${key}-report`, csv);
                      } else {
                        const reportTitle =
                          SUPER_ADMIN_REPORTS.find(([k]) => k === key)?.[1] ?? 'Report';
                        openPrintableReport(
                          reportTitle,
                          `Generated on ${new Date().toLocaleDateString()}`,
                          exported.headers,
                          exported.rows
                        );
                      }
                    })
                  }
                />
              ))}
          </View>
          {data.value.truncated && (
            <Text style={styles.error}>
              The report exceeded the row limit. Narrow the filters.
            </Text>
          )}
          <ScrollView horizontal>
            <View>
              {[data.value.headers, ...data.value.rows].map((row, index) => (
                <View style={styles.actions} key={index}>
                  {row.map((cell, column) => (
                    <Text
                      style={[styles.cell, index === 0 && styles.heading]}
                      key={column}
                    >
                      {String(cell ?? '')}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          {data.value.rows.length === 0 && (
            <Text style={styles.muted}>No report rows found.</Text>
          )}
        </>
      ) : (
        <Notice error={data.error} />
      )}
    </View>
  );
}

// ----------------------------------------------------
// Main SuperAdminWorkspace Container
// ----------------------------------------------------
export function SuperAdminWorkspace({
  section,
  id = '',
  branchId = '',
}: {
  section: string;
  id?: string;
  branchId?: string;
}) {
  const router = useRouter();
  const navigate: Navigate = (screen, targetId, targetBranch) =>
    router.push({
      pathname: '/(super-admin)/' + screen,
      params: {
        ...(targetId ? { id: targetId } : {}),
        ...(targetBranch ? { branchId: targetBranch } : {}),
      },
    } as Href);

  const tabs = ['branches', 'admins', 'reports'];
  const breadcrumbs = [
    { label: titles[section] || section },
    ...(id ? [{ label: 'Details' }] : []),
  ];

  return (
    <View style={styles.root}>
      <SuperAdminHeader
        breadcrumbs={breadcrumbs}
        currentTitle={titles[section]}
      />
      <ScrollView
        key={JSON.stringify([section, id, branchId])}
        contentContainerStyle={styles.screen}
      >
        <View style={styles.titleRow}>
          {!tabs.includes(section) && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : navigate('more'))}
            >
              <ChevronLeft size={18} color="#374151" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <Text accessibilityRole="header" style={styles.title}>
            {titles[section] || section}
          </Text>
        </View>

        {section === 'reports' ? (
          <Reports />
        ) : section === 'organization-profile' ? (
          <Organization />
        ) : section === 'roles-permissions' ? (
          <Policies />
        ) : ['add-branch', 'branch-details', 'edit-branch'].includes(section) ? (
          <Branch section={section} id={id} navigate={navigate} />
        ) : ['create-admin', 'assign-admin', 'admin-details'].includes(section) ? (
          <Administrator
            section={section}
            id={id}
            branchId={branchId}
            navigate={navigate}
          />
        ) : (
          <Directory section={section} navigate={navigate} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  screen: {
    padding: 18,
    gap: 14,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  heading: { fontSize: 15, fontWeight: '700', color: '#111827' },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  button: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnDanger: { backgroundColor: theme.colors.accentRed },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  btnSecondaryText: { color: '#374151', fontWeight: '700', fontSize: 12.5 },
  btnOutlineText: { color: theme.colors.primary, fontWeight: '700', fontSize: 12.5 },
  disabled: { opacity: 0.5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  choice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selected: {
    backgroundColor: '#FEE2E2',
    borderColor: theme.colors.primary,
  },
  choiceText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  selectedChoiceText: { color: theme.colors.primary, fontWeight: '700' },
  value: { color: '#1F2937', fontSize: 13 },
  muted: { color: '#6B7280', fontSize: 13 },
  error: { color: theme.colors.accentRed, fontSize: 13, fontWeight: '600' },
  successText: { color: theme.colors.accentGreen, fontSize: 13, fontWeight: '600' },
  errorText: { color: theme.colors.accentRed, fontSize: 13, fontWeight: '600' },
  inputContainer: { gap: 4 },
  inputLabel: { fontSize: 11.5, fontWeight: '700', color: '#4B5563' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    color: '#111827',
    fontSize: 13,
    backgroundColor: '#fff',
  },
  inputClearBtn: { position: 'absolute', right: 10, padding: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  filterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageSizeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageSizeLabel: { fontSize: 11.5, fontWeight: '700', color: '#6B7280' },
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectAllText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  bulkRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedCountText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  rowCardSelected: { borderColor: theme.colors.primary, backgroundColor: '#FFF5F5' },
  rowCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  rowSubtitle: { fontSize: 12, color: '#6B7280' },
  rowCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  badgeActive: {
    backgroundColor: theme.colors.accentGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextActive: {
    color: theme.colors.accentGreen,
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeInactive: {
    backgroundColor: theme.colors.accentRedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextInactive: {
    color: theme.colors.accentRed,
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionBadgeText: { fontSize: 10, fontWeight: '800', color: '#1F2937' },
  paginationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationMeta: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  paginationButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: theme.colors.accentGreenBg,
    borderColor: '#A7F3D0',
  },
  feedbackError: {
    backgroundColor: theme.colors.accentRedBg,
    borderColor: '#FECACA',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 440,
    width: '100%',
    gap: 14,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  confirmBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  detailHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  detailSubtitle: { fontSize: 13, color: '#6B7280' },
  kvRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kKey: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  kVal: { fontSize: 12.5, color: '#111827', fontWeight: '500' },
  grid2Col: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subItemCard: {
    width: '48.5%',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  subItemTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  subItemBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  subItemDesc: { fontSize: 11.5, color: '#6B7280' },
  subItemStatus: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  adminRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adminNameLink: { fontSize: 13.5, fontWeight: '800', color: theme.colors.primary },
  adminRoleBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 2,
  },
  auditRowItem: {
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    gap: 4,
  },
  auditTimeText: { fontSize: 10.5, color: '#9CA3AF' },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  permChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  permText: { fontSize: 10.5, fontWeight: '700', color: '#1D4ED8' },
  codeBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cell: { width: 145, padding: 8, backgroundColor: '#fff', color: '#202d40' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 12.5, color: '#6B7280', textAlign: 'center' },
  auditModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 550,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  auditModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  auditModalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  auditModalTime: { fontSize: 11.5, color: '#6B7280' },
  closeBtn: { padding: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  auditModalBody: { padding: 16, gap: 10 },
  userLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  jsonBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#38BDF8',
    lineHeight: 16,
  },
  auditModalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
});

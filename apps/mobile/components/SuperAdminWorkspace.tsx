import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Href, useFocusEffect, useRouter } from 'expo-router';
import {
  Role,
  SUPER_ADMIN_REPORTS,
  SUPER_ADMIN_REPORT_FILTERS,
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
  ChevronDown,
  MapPin,
  CalendarDays,
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
  exportDirectoryFile,
  directoryExportTable,
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
  const reload = useCallback(() => refresh((n) => n + 1), []);
  return { ...state, reload };
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

const loadBranches = async (includeInactive = false) => {
  const rows: Row[] = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await req<Row[]>('branches', 'GET', undefined, {
      status: includeInactive ? undefined : 'ACTIVE',
      limit: 100,
      page,
    });
    rows.push(...(response.data ?? []));
    totalPages = response.meta?.totalPages ?? 1;
  }
  return rows;
};

const toBranchOptions = (rows: Row[]) =>
  rows.map((row): [string, string] => [idOf(row), label(row)]);

const branchOptions = async () => toBranchOptions(await loadBranches());

const branchStatuses: [string, string][] = [['', 'All statuses'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']];

function BranchFilterButton({ title, expanded, onPress }: { title: string; expanded: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.branchFilterButton} accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress}>
      <Text style={styles.branchFilterLabel} numberOfLines={1}>{title}</Text>
      <ChevronDown size={16} color="#475569" />
    </Pressable>
  );
}

function DirectoryDropdown({
  label, options, value, onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel = options.find(([key]) => key === value)?.[1];
  return (
    <View style={styles.directoryDropdown}>
      <Text style={styles.inputLabel}>{label}</Text>
      <BranchFilterButton
        title={selectedLabel ?? label}
        expanded={expanded}
        onPress={() => setExpanded((current) => !current)}
      />
      {expanded && (
        <ScrollView nestedScrollEnabled style={styles.branchMenu} keyboardShouldPersistTaps="handled">
          {options.map(([key, title]) => (
            <Pressable
              key={key}
              style={styles.branchMenuOption}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === key }}
              onPress={() => { onChange(key); setExpanded(false); }}
            >
              <Text style={styles.branchFilterLabel}>{title}</Text>
              {value === key && <CheckCircle2 size={16} color={theme.colors.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

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
  const isBranchDirectory = section === 'branches';
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [sortOrder, setSortOrder] = useState(isBranchDirectory ? 'asc' : 'desc');
  const [branchFilters, setBranchFilters] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [branchMenu, setBranchMenu] = useState<'status' | 'city' | 'branches' | 'more' | null>(null);
  const toggleBranchMenu = (menu: typeof branchMenu) => setBranchMenu((current) => current === menu ? null : menu);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [auditLogModal, setAuditLogModal] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row>();
  const action = useAction();

  const branches = useLoad<Row[]>(
    async () =>
      ['branches', 'admins', 'users', 'departments', 'doctors', 'patients', 'audit-logs'].includes(
        section
      )
        ? loadBranches(isBranchDirectory)
        : [],
    section
  );

  const unpaged = ['notifications', 'master-settings'].includes(section);

  const loadDirectory = (page: number, limit: number) => {
    const params = {
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
      city: city || undefined,
      branchIds: (isBranchDirectory ? branchFilters.join(',') : scope) || undefined,
      sortOrder,
      role: role || undefined,
    };
    if (section === 'audit-logs') {
      return mobileApiClient.superAdmin.audit({
        page,
        limit,
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
  };

  const data = useLoad(() => loadDirectory(page, pageSize), JSON.stringify([section, page, pageSize, search, status, scope, sortOrder, resourceFilter, role, branchFilters, city]));

  const hasFocused = useRef(false);
  const { reload: reloadDirectory } = data;
  const { reload: reloadBranches } = branches;
  useFocusEffect(useCallback(() => {
    if (!isBranchDirectory) return;
    if (hasFocused.current) {
      reloadDirectory();
      reloadBranches();
    }
    hasFocused.current = true;
  }, [isBranchDirectory, reloadDirectory, reloadBranches]));

  const rows: Row[] = data.value?.data ?? [];
  const meta = data.value?.meta ?? { total: rows.length, totalPages: 1 };
  const max = meta.totalPages ?? 1;
  const totalRecords = meta.total ?? rows.length;

  useEffect(() => {
    if (isBranchDirectory && branches.value) {
      const available = new Set(branches.value.map(idOf));
      const validFilters = branchFilters.filter((id) => available.has(id));
      if (validFilters.length !== branchFilters.length) {
        setBranchFilters(validFilters);
        setPage(1);
      }
    }
  }, [isBranchDirectory, branches.value, branchFilters]);

  useEffect(() => {
    if (isBranchDirectory && data.value && page > Math.max(max, 1)) {
      setPage(Math.max(max, 1));
    }
  }, [isBranchDirectory, data.value, max, page]);

  // Clear all filters back to default
  const clearFilters = () => {
    setDraft('');
    setSearch('');
    setResource('');
    setResourceFilter('');
    setStatus('');
    setScope('');
    setBranchFilters([]);
    setCity('');
    setBranchMenu(null);
    if (isBranchDirectory) {
      setSortOrder('asc');
      setPageSize(20);
    }
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
          await req(`users/${segment(id)}/status`, 'PATCH', {
            isActive: activate,
          });
        }
        setSelectedIds([]);
        data.reload();
      }
    );
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Open during the click so browsers allow the print preview after the requests finish.
    const preview = format === 'pdf' && typeof document !== 'undefined' ? window.open('', '_blank') : undefined;
    action.run(async () => {
      try {
        if (preview === null) throw new Error('Allow pop-ups to open the PDF preview.');
        const detailsPath = isBranchDirectory ? 'branches' : ['admins', 'users'].includes(section) ? 'users' : undefined;
        const records: Row[] = [];
        let totalPages = 1;
        for (let exportPage = 1; exportPage <= totalPages; exportPage++) {
          const response = await loadDirectory(exportPage, 100);
          const rows = (response.data ?? []) as Row[];
          totalPages = response.meta?.totalPages ?? 1;
          if (!detailsPath) {
            records.push(...rows);
            continue;
          }
          for (let offset = 0; offset < rows.length; offset += 8) {
            const details = await Promise.all(rows.slice(offset, offset + 8).map(async (row) => {
              const detail = (await req<Row>(detailsPath + '/' + segment(idOf(row)))).data;
              if (!detail) throw new Error('A record changed during export. Refresh and try again.');
              return { ...row, ...detail };
            }));
            records.push(...details);
          }
        }
        if (!records.length) throw new Error('No records found to export.');
        const { headers, rows } = directoryExportTable(records);
        const date = new Date().toISOString().slice(0, 10);
        await exportDirectoryFile(format, `${section}-export-${date}`, titles[section] || section, headers, rows, preview ?? undefined);
      } catch (error) {
        preview?.close();
        throw error;
      }
    });
  };

  const open = (row: Row) => {
    if (section === 'branches') navigate('branch-details', idOf(row));
    else if (section === 'admins' || section === 'users') navigate('admin-details', idOf(row));
    else if (section === 'audit-logs') setAuditLogModal(row);
    else setEditing(row);
  };

  useEffect(() => {
    if (!isBranchDirectory) return;
    const query = draft.trim();
    if (query === search) return;
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, search, isBranchDirectory]);

  const cities = [...new Set(branches.value?.map((row) => String(row.city ?? '')).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      {isBranchDirectory && (
        <View style={styles.branchControls}>
          <View style={styles.branchAdd}>
            <Button title="+ Add Branch" onPress={() => navigate('add-branch')} />
          </View>
          <View style={styles.branchSearch}>
            <Search size={19} color="#64748b" />
            <TextInput
              style={styles.branchSearchInput}
              accessibilityLabel="Search branches by name, code or city"
              placeholder="Search branches"
              placeholderTextColor="#64748b"
              value={draft}
              onChangeText={setDraft}
              returnKeyType="search"
              onSubmitEditing={() => { setSearch(draft.trim()); setPage(1); }}
            />
            {!!draft && (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => {
                setDraft('');
                setSearch('');
                setPage(1);
              }}>
                <X size={18} color="#64748b" />
              </Pressable>
            )}
          </View>
          <View style={styles.branchFilterRow}>
            <BranchFilterButton title={branchStatuses.find(([value]) => value === status)?.[1] ?? 'All statuses'} expanded={branchMenu === 'status'} onPress={() => toggleBranchMenu('status')} />
            <BranchFilterButton title={city || 'All locations'} expanded={branchMenu === 'city'} onPress={() => toggleBranchMenu('city')} />
          </View>
          <View style={styles.branchFilterRow}>
            <BranchFilterButton title={branchFilters.length ? `Branches (${branchFilters.length})` : 'All branches'} expanded={branchMenu === 'branches'} onPress={() => toggleBranchMenu('branches')} />
            <BranchFilterButton title="More options" expanded={branchMenu === 'more'} onPress={() => toggleBranchMenu('more')} />
          </View>
          {(branchMenu === 'status' || branchMenu === 'city') && (
            <ScrollView nestedScrollEnabled style={styles.branchMenu} keyboardShouldPersistTaps="handled">
              {(branchMenu === 'status' ? branchStatuses : [['', 'All locations'], ...cities.map((value) => [value, value])]).map(([value, title]) => {
                const selected = value === (branchMenu === 'status' ? status : city);
                return (
                  <Pressable key={value} style={styles.branchMenuOption} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => {
                    if (branchMenu === 'status') setStatus(value);
                    else setCity(value);
                    setPage(1);
                    setBranchMenu(null);
                  }}>
                    <Text style={styles.branchFilterLabel}>{title}</Text>
                    {selected && <CheckCircle2 size={16} color={theme.colors.primary} />}
                  </Pressable>
                );
              })}
              {branchMenu === 'city' && !branches.value && <Notice error={branches.error} />}
            </ScrollView>
          )}
          {branchMenu === 'branches' && (
            <ScrollView nestedScrollEnabled style={styles.branchMenu} keyboardShouldPersistTaps="handled">
              {!branches.value && <Notice error={branches.error} />}
              {branchFilters.length === 100 && <Text style={styles.muted}>You can select up to 100 branches.</Text>}
              {branches.value?.map((branch) => {
                const id = idOf(branch);
                const checked = branchFilters.includes(id);
                const disabled = !checked && branchFilters.length >= 100;
                const Icon = checked ? CheckSquare : Square;
                return (
                  <Pressable key={id} style={[styles.branchMenuOption, disabled && styles.disabled]} accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => {
                    setBranchFilters((current) => checked ? current.filter((value) => value !== id) : [...current, id]);
                    setPage(1);
                  }}>
                    <Icon size={18} color={checked ? theme.colors.primary : '#64748b'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.branchFilterLabel}>{label(branch)}</Text>
                      {!!branch.city && <Text style={styles.branchLocation}>{String(branch.city)}</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {branchMenu === 'more' && (
            <View style={styles.branchOptions}>
              <DirectoryDropdown label="Sort by name" options={[['asc', 'A to Z'], ['desc', 'Z to A']]} value={sortOrder} onChange={(value) => { setSortOrder(value); setPage(1); }} />
              <DirectoryDropdown label="Rows per page" options={['10', '20', '50', '100'].map((value): [string, string] => [value, value])} value={String(pageSize)} onChange={(value) => { setPageSize(Number(value)); setPage(1); }} />
            </View>
          )}
          {!!(draft || status || city || branchFilters.length || sortOrder !== 'asc' || pageSize !== 20) && (
            <Pressable accessibilityRole="button" style={styles.branchClear} onPress={clearFilters}>
              <Text style={styles.branchClearText}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      )}
      {section === 'admins' && (
        <Button title="+ Create Administrator" onPress={() => navigate('create-admin')} />
      )}
      {/* Search & Dynamic Filter Panel */}
      {!unpaged && !isBranchDirectory && (
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
            <View>
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
          {['admins', 'users', 'departments', 'doctors'].includes(section) && (
            <View style={{ gap: 4 }}>
              <DirectoryDropdown
                label="Filter by Status"
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
              <DirectoryDropdown
                label="Patient Status"
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
              <DirectoryDropdown
                label="Filter by Role"
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

          {!isBranchDirectory && !!branches.value?.length && (
            <View style={{ gap: 4 }}>
              <DirectoryDropdown
                label="Filter by Branch"
                options={[['', 'All branches'], ...toBranchOptions(branches.value)]}
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
            <View style={styles.directoryPageSize}>
              <DirectoryDropdown
                label="Rows per page"
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
        <Button
          title="Refresh"
          variant="secondary"
          onPress={() => {
            reloadDirectory();
            if (isBranchDirectory) reloadBranches();
          }}
        />

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
      {['admins', 'users'].includes(section) && rows.length > 0 && (
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
              choices={{ branchId: toBranchOptions(branches.value) }}
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
      ) : isBranchDirectory ? (
        rows.map((row) => (
          <Pressable
            key={idOf(row)}
            accessibilityRole="button"
            style={[styles.rowCard, styles.branchCard]}
            onPress={() => open(row)}
          >
            <View style={styles.branchCardContent}>
              <Text style={styles.branchName}>{label(row)}</Text>
              <View style={styles.branchLocationRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.branchLocation}>
                  {[row.address, row.city].filter(Boolean).join(', ') || 'Location unavailable'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </Pressable>
        ))
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
                {['admins', 'users'].includes(section) && (
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
  const router = useRouter();
  const { user } = useAuth();
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
  const assignedAdmin = row.assignedAdmin as Row | undefined;
  const otherAdmins = ((row.assignedAdmins as Row[] | undefined) ?? [])
    .filter((admin) => admin.id !== assignedAdmin?.id);
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
          {user?.permissions.includes('HOSPITALS:DELETE') && (
            <Button
              title="Delete Branch"
              variant="danger"
              disabled={action.busy}
              onPress={() =>
                action.confirm(
                  `Delete ${label(row)} from the branch directory? Historical records will be preserved.`,
                  async () => {
                    await req('branches/' + segment(id), 'DELETE');
                    router.dismissTo('/(super-admin)/branches');
                  }
                )
              }
            />
          )}
        </View>
      </View>

      <Feedback action={action} />

      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Branch Administrator</Text>
        {assignedAdmin ? (
          <Pressable
            accessibilityRole="button"
            style={styles.adminRowCard}
            onPress={() => navigate('admin-details', idOf(assignedAdmin))}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.adminNameLink}>{label(assignedAdmin)}</Text>
              <Text style={styles.subItemDesc}>
                {[assignedAdmin.email, assignedAdmin.phone].map(display).filter(Boolean).join(' · ')}
              </Text>
            </View>
            <ExternalLink size={16} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <Text style={styles.muted}>No branch administrator assigned.</Text>
        )}
      </View>

      {/* Complete Branch Data Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>Branch Contact & Identity</Text>
        <Card row={Object.fromEntries(branchFields.map(([key]) => [key, row[key]]))} />
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

      {otherAdmins.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>
            Other Assigned Administrators ({otherAdmins.length})
          </Text>
          <View style={{ gap: 8 }}>
            {otherAdmins.map((adm) => {
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
        </View>
      )}

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
const reportMonths = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, month, 1)))
);

function reportDate(daysAgo = 0) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }).format(new Date());
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function ReportDateField({ label: title, value, onChange }: {
  label: string; value: string; onChange: (value: string) => void;
}) {
  const [monthView, setMonthView] = useState<{ year: number; month: number } | null>(null);
  const thisYear = Number(reportDate().slice(0, 4));
  const year = monthView?.year ?? thisYear;
  const month = monthView?.month ?? 0;
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const moveMonth = (offset: number) => {
    const next = new Date(Date.UTC(year, month + offset, 1));
    setMonthView({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  return (
    <View style={styles.reportDateField}>
      <Text style={styles.inputLabel}>{title}</Text>
      <Pressable style={styles.reportDateButton} accessibilityRole="button" accessibilityLabel={`${title}: ${value}`} onPress={() => {
        const [year, month] = value.split('-').map(Number);
        setMonthView({ year, month: month - 1 });
      }}>
        <CalendarDays size={17} color="#475569" />
        <Text style={styles.branchFilterLabel}>{value}</Text>
      </Pressable>
      <Modal visible={monthView !== null} transparent animationType="fade" onRequestClose={() => setMonthView(null)}>
        <View style={styles.reportCalendarOverlay}>
          {monthView && (
            <ScrollView style={styles.reportCalendar} keyboardShouldPersistTaps="handled">
              <Text style={styles.cardHeaderTitle}>Choose {title.toLowerCase()} date</Text>
              <View style={styles.reportCalendarNav}>
                <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} onPress={() => moveMonth(-1)}>
                  <ChevronLeft size={22} color="#475569" />
                </Pressable>
                <Text style={styles.branchFilterLabel}>{reportMonths[month]} {year}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={8} onPress={() => moveMonth(1)}>
                  <ChevronRight size={22} color="#475569" />
                </Pressable>
              </View>
              <DirectoryDropdown label="Month" options={reportMonths.map((name, index) => [String(index), name])}
                value={String(month)} onChange={(next) => setMonthView({ year, month: Number(next) })} />
              <DirectoryDropdown label="Year" options={Array.from({ length: 111 }, (_, index): [string, string] => {
                const option = String(thisYear + 10 - index);
                return [option, option];
              })} value={String(year)} onChange={(next) => setMonthView({ year: Number(next), month })} />
              <View style={styles.reportCalendarGrid}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <View key={day} style={styles.reportCalendarCell}><Text style={styles.muted}>{day}</Text></View>
                ))}
                {Array.from({ length: firstDay + days }, (_, index) => {
                  const day = index - firstDay + 1;
                  if (day < 1) return <View key={index} style={styles.reportCalendarCell} />;
                  const date = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
                  return (
                    <Pressable key={index} style={[styles.reportCalendarCell, date === value && styles.selected]}
                      accessibilityRole="button" accessibilityLabel={date} accessibilityState={{ selected: date === value }}
                      onPress={() => { onChange(date); setMonthView(null); }}>
                      <Text style={styles.branchFilterLabel}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button title="Cancel" variant="secondary" onPress={() => setMonthView(null)} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const reportFilterLabels = {
  status: 'Status', role: 'Role', paymentMethod: 'Payment method', action: 'Activity',
} as const;
type ReportFilterName = keyof typeof reportFilterLabels;
type ReportFilters = Partial<Record<ReportFilterName, string>>;
type ReportParameters = ReportFilters & { from: string; to: string; branchIds?: string };

function Reports() {
  const { user } = useAuth();
  const [key, setKey] = useState<string>(SUPER_ADMIN_REPORTS[0][0]);
  const [range, setRange] = useState('30');
  const [from, setFrom] = useState(() => reportDate(29));
  const [to, setTo] = useState(() => reportDate());
  const [chosen, setChosen] = useState<string[]>([]);
  const [showBranches, setShowBranches] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [generated, setGenerated] = useState<{ key: string; query: ReportParameters; report: SuperAdminReport }>();
  const branches = useLoad(() => loadBranches(true), 'report-branches');
  const action = useAction();
  const reportTitle = (reportKey: string) => SUPER_ADMIN_REPORTS.find(([id]) => id === reportKey)?.[1] ?? 'Report';
  const query = { ...filters, from, to, branchIds: chosen.join(',') || undefined };
  const filtersChanged = generated && (
    key !== generated.key || JSON.stringify(query) !== JSON.stringify(generated.query)
  );

  const generate = () => action.run(async () => {
    setGenerated(undefined);
    if (from > to) throw new Error('From date must be on or before To date.');
    const { data: report } = await req<SuperAdminReport>('reports/' + segment(key), 'GET', undefined, query);
    if (!report) throw new Error('No report was returned.');
    setGenerated({ key, query, report });
  });

  const exportReport = (format: 'csv' | 'pdf') => {
    if (!generated) return;
    const preview = format === 'pdf' && typeof document !== 'undefined' ? window.open('', '_blank') : undefined;
    action.run(async () => {
      try {
        if (preview === null) throw new Error('Allow pop-ups to open the PDF preview.');
        const { key, query } = generated;
        const { data: report } = await req<SuperAdminReport>('reports/' + segment(key) + '/export', 'POST', undefined, query);
        if (!report?.rows.length) throw new Error('No report rows found.');
        setGenerated({ key, query, report });
        const title = `${reportTitle(key)} · ${query.from} to ${query.to}`;
        await exportDirectoryFile(format, `${key}-${query.from}-to-${query.to}`, title, report.headers, report.rows, preview ?? undefined);
      } catch (error) {
        preview?.close();
        throw error;
      }
    });
  };

  return (
    <View style={styles.reportStack}>
      <View style={styles.card}>
        <DirectoryDropdown label="Report type" options={SUPER_ADMIN_REPORTS.map(([id, title]) => [id, title])} value={key}
          onChange={(value) => { setKey(value); setFilters({}); }} />
        <DirectoryDropdown label="Date range" options={[['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['custom', 'Custom range']]}
          value={range} onChange={(value) => {
            setRange(value);
            if (value !== 'custom') { setFrom(reportDate(Number(value) - 1)); setTo(reportDate()); }
          }} />
        <View style={styles.branchFilterRow}>
          <ReportDateField label="From" value={from} onChange={(value) => { setFrom(value); setRange('custom'); }} />
          <ReportDateField label="To" value={to} onChange={(value) => { setTo(value); setRange('custom'); }} />
        </View>
        <View style={styles.directoryDropdown}>
          <Text style={styles.inputLabel}>Branch</Text>
          <BranchFilterButton title={chosen.length ? `${chosen.length} selected` : 'All branches'} expanded={showBranches}
            onPress={() => setShowBranches((value) => !value)} />
          {showBranches && (
            <ScrollView nestedScrollEnabled style={styles.branchMenu}>
              <Pressable style={styles.branchMenuOption} accessibilityRole="checkbox" accessibilityState={{ checked: chosen.length === 0 }}
                onPress={() => setChosen([])}>
                {chosen.length ? <Square size={17} /> : <CheckSquare size={17} color={theme.colors.primary} />}
                <Text style={styles.branchFilterLabel}>All branches</Text>
              </Pressable>
              {branches.value?.map((branch) => {
                const id = idOf(branch);
                const checked = chosen.includes(id);
                const disabled = !checked && chosen.length >= 50;
                return (
                  <Pressable key={id} style={[styles.branchMenuOption, disabled && styles.disabled]}
                    accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled}
                    onPress={() => setChosen((current) => checked ? current.filter((value) => value !== id) : [...current, id])}>
                    {checked ? <CheckSquare size={17} color={theme.colors.primary} /> : <Square size={17} />}
                    <Text style={styles.branchFilterLabel}>{label(branch)}{branch.city ? ` · ${String(branch.city)}` : ''}</Text>
                  </Pressable>
                );
              })}
              {chosen.length >= 50 && <Text style={styles.muted}>Select up to 50 branches.</Text>}
            </ScrollView>
          )}
        </View>
        {!!branches.error && <Notice error={branches.error} />}
        {(Object.keys(reportFilterLabels) as ReportFilterName[]).map((field) => {
          const options = SUPER_ADMIN_REPORT_FILTERS[key]?.[field];
          if (!options) return null;
          return (
            <DirectoryDropdown key={field} label={reportFilterLabels[field]} value={filters[field] ?? ''}
              options={[['', 'All'], ...options.map((value): [string, string] => [
                value, value.toLowerCase().replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
              ])]}
              onChange={(value) => setFilters((current) => ({ ...current, [field]: value || undefined }))} />
          );
        })}
        <Button title={action.busy ? 'Working…' : 'Generate Report'} disabled={action.busy} onPress={generate} />
      </View>
      {action.error && <Notice error={action.feedback} />}
      {generated && (
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>{reportTitle(generated.key)}</Text>
          <Text style={styles.muted}>{generated.query.from} to {generated.query.to} · {generated.report.rows.length} rows</Text>
          {filtersChanged && <Text style={styles.muted}>Generate again to apply your new filters.</Text>}
          {generated.report.truncated && <Text style={styles.error}>Narrow the report filters to export all results.</Text>}
          {generated.report.rows.length === 0 ? (
            <Text style={styles.muted}>No report rows found.</Text>
          ) : (
            <ScrollView horizontal>
              <View>
                {[generated.report.headers, ...generated.report.rows].map((row, index) => (
                  <View style={styles.reportTableRow} key={index}>
                    {row.map((cell, column) => (
                      <Text style={[styles.cell, index === 0 && styles.heading]} key={column}>{String(cell ?? '—')}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          {user?.permissions.includes('REPORTS:EXPORT') && generated.report.rows.length > 0 && !generated.report.truncated && (
            <View style={styles.actions}>
              <Button title="Export CSV" icon={Download} variant="outline" disabled={action.busy || filtersChanged} onPress={() => exportReport('csv')} />
              <Button title="Export PDF" icon={Printer} variant="outline" disabled={action.busy || filtersChanged} onPress={() => exportReport('pdf')} />
            </View>
          )}
        </View>
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
  directoryDropdown: { gap: 4 },
  directoryPageSize: { flexGrow: 1, minWidth: 115 },
  branchControls: { gap: 8 },
  branchAdd: { alignItems: 'flex-start' },
  branchSearch: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, minHeight: 46, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 10, backgroundColor: '#ffffff' },
  branchSearchInput: { flex: 1, minHeight: 44, fontSize: 14, color: '#111827' },
  branchFilterRow: { flexDirection: 'row', gap: 8 },
  branchFilterButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingHorizontal: 11, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 9, backgroundColor: '#ffffff' },
  branchFilterLabel: { color: '#111827', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  branchMenu: { maxHeight: 240, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 10, backgroundColor: '#ffffff' },
  branchMenuOption: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  branchOptions: { padding: 12, gap: 8, borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 10, backgroundColor: '#ffffff' },
  branchClear: { alignSelf: 'flex-start', paddingVertical: 6 },
  branchClearText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  branchCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  branchCardContent: { flex: 1, gap: 5 },
  branchName: { color: '#111827', fontSize: 16, fontWeight: '800' },
  branchLocationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  branchLocation: { flexShrink: 1, color: '#475569', fontSize: 13, lineHeight: 17 },
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
  reportStack: { gap: 12 },
  reportDateField: { flex: 1, gap: 4 },
  reportDateButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#d8e0e8', borderRadius: 9, paddingHorizontal: 10, backgroundColor: '#fff' },
  reportCalendarOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#0f172a80' },
  reportCalendar: { flexGrow: 0, maxHeight: '90%', width: '100%', maxWidth: 420, borderRadius: 14,
    backgroundColor: '#fff', padding: 16 },
  reportCalendarNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  reportCalendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 },
  reportCalendarCell: { width: '14.2857%', minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  reportTableRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d8e0e8' },
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


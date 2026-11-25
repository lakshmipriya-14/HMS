import { AppointmentStatus, PaymentMethod, Role } from './enums.js';

export const SUPER_ADMIN_REPORTS = [
  ['branch-performance', 'Branch-wise Performance Report'],
  ['branch-creation', 'Branch Creation Report'],
  ['hospital-admins', 'Hospital Admin Report'],
  ['users', 'User Management Report'],
  ['employees', 'Employee Summary Report'],
  ['doctors', 'Doctor Summary Report'],
  ['departments', 'Department Summary Report'],
  ['patient-registration', 'Patient Registration Summary'],
  ['appointments', 'Appointment Summary'],
  ['revenue', 'Revenue Summary'],
  ['branch-comparison', 'Branch Comparison Report'],
  ['user-activity', 'User Activity Report'],
  ['account-status', 'Account Status Report'],
  ['organization-activity', 'Organization Activity Report'],
] as const;

export const SUPER_ADMIN_REPORT_FILTERS: Record<string, {
  status?: readonly string[];
  role?: readonly string[];
  paymentMethod?: readonly string[];
  action?: readonly string[];
}> = {
  'branch-performance': { status: ['ACTIVE', 'INACTIVE'] },
  'branch-comparison': { status: ['ACTIVE', 'INACTIVE'] },
  'branch-creation': { status: ['ACTIVE', 'INACTIVE'] },
  'hospital-admins': { status: ['ACTIVE', 'INACTIVE'] },
  users: { status: ['ACTIVE', 'INACTIVE'], role: Object.values(Role) },
  'account-status': { status: ['ACTIVE', 'INACTIVE'], role: Object.values(Role) },
  employees: { status: ['ACTIVE', 'INACTIVE'] },
  doctors: { status: ['ACTIVE', 'INACTIVE'] },
  departments: { status: ['ACTIVE', 'INACTIVE'] },
  appointments: { status: Object.values(AppointmentStatus) },
  revenue: { paymentMethod: Object.values(PaymentMethod) },
  'user-activity': { action: ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'EXPORT'] },
  'organization-activity': { action: ['CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'EXPORT'] },
};

export interface SuperAdminReport {
  key: string;
  headers: string[];
  rows: (string | number | null)[][];
  truncated: boolean;
}

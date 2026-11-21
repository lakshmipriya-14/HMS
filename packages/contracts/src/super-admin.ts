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

export interface SuperAdminReport {
  key: string;
  headers: string[];
  rows: (string | number | null)[][];
  truncated: boolean;
}

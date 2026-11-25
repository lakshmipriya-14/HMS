import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { DepartmentManagement } from './DepartmentManagement';
import { DoctorManagement } from './DoctorManagement';
import { StaffManagement } from './StaffManagement';
import { PatientOperations } from './PatientOperations';
import { WardBedManagement } from './WardBedManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { AdmissionManagement } from './AdmissionManagement';
import { OpdManagement } from './OpdManagement';
import { IpdManagement } from './IpdManagement';
import { DiagnosticsOverview } from './DiagnosticsOverview';
import { PharmacyOverview } from './PharmacyOverview';
import { BillingFinanceManagement } from './BillingFinanceManagement';
import { FacilityFleetManagement } from './FacilityFleetManagement';
import { ApprovalsHub } from './ApprovalsHub';
import { ReportsAnalytics } from './ReportsAnalytics';
import { RolePermissionsView } from './RolePermissionsView';
import { AuditLogs } from './AuditLogs';
import { HospitalSettings } from './HospitalSettings';
import { AdminProfile } from './AdminProfile';

/**
 * Hospital Admin Master Workspace Router:
 * Mounts all clinical, operational, financial, and governance sub-modules
 * strictly scoped to the operating branch.
 */
export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="departments" element={<DepartmentManagement />} />
      <Route path="doctors" element={<DoctorManagement />} />
      <Route path="staff" element={<StaffManagement />} />
      <Route path="patients" element={<PatientOperations />} />
      <Route path="wards" element={<WardBedManagement />} />
      <Route path="opd" element={<OpdManagement />} />
      <Route path="ipd" element={<IpdManagement />} />
      <Route path="appointments" element={<OpdManagement />} />
      <Route path="admissions" element={<IpdManagement />} />
      <Route path="diagnostics" element={<DiagnosticsOverview />} />
      <Route path="pharmacy" element={<PharmacyOverview />} />
      <Route path="billing" element={<BillingFinanceManagement />} />
      <Route path="facility" element={<FacilityFleetManagement />} />
      <Route path="approvals" element={<ApprovalsHub />} />
      <Route path="reports" element={<ReportsAnalytics />} />
      <Route path="users" element={<StaffManagement />} />
      <Route path="roles" element={<RolePermissionsView />} />
      <Route path="audit" element={<AuditLogs />} />
      <Route path="settings" element={<HospitalSettings />} />
      <Route path="profile" element={<AdminProfile />} />
    </Routes>
  );
};

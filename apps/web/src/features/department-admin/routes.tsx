import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DepartmentDashboard } from './DepartmentDashboard';
import { DepartmentInfo } from './DepartmentInfo';
import { DoctorManagement } from './DoctorManagement';
import { DoctorScheduling } from './DoctorScheduling';
import { StaffManagement } from './StaffManagement';
import { StaffAttendance } from './StaffAttendance';
import { PatientManagement } from './PatientManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { OpdManagement } from './OpdManagement';
import { IpdManagement } from './IpdManagement';
import { WardBedOverview } from './WardBedOverview';
import { AdmissionMonitoring } from './AdmissionMonitoring';
import { DischargeMonitoring } from './DischargeMonitoring';
import { LaboratoryRequests } from './LaboratoryRequests';
import { RadiologyRequests } from './RadiologyRequests';
import { DiagnosticsOverview } from './DiagnosticsOverview';
import { EquipmentManagement } from './EquipmentManagement';
import { DepartmentInventory } from './DepartmentInventory';
import { LeaveManagement } from './LeaveManagement';
import { DepartmentReports } from './DepartmentReports';
import { ResourceRequests } from './ResourceRequests';
import { PurchaseRequests } from './PurchaseRequests';
import { MaintenanceRequests } from './MaintenanceRequests';
import { ApprovalsTracking } from './ApprovalsTracking';
import { ActivityHistory } from './ActivityHistory';
import { NotificationsView } from './NotificationsView';
import { DepartmentAdminProfile } from './DepartmentAdminProfile';

export const DepartmentAdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DepartmentDashboard />} />
      <Route path="info" element={<DepartmentInfo />} />
      <Route path="doctors" element={<DoctorManagement />} />
      <Route path="doctor-scheduling" element={<DoctorScheduling />} />
      <Route path="staff" element={<StaffManagement />} />
      <Route path="attendance" element={<StaffAttendance />} />
      <Route path="patients" element={<PatientManagement />} />
      <Route path="appointments" element={<AppointmentManagement />} />
      <Route path="opd" element={<OpdManagement />} />
      <Route path="ipd" element={<IpdManagement />} />
      <Route path="wards-beds" element={<WardBedOverview />} />
      <Route path="admissions" element={<AdmissionMonitoring />} />
      <Route path="discharges" element={<DischargeMonitoring />} />
      <Route path="lab-requests" element={<LaboratoryRequests />} />
      <Route path="radiology-requests" element={<RadiologyRequests />} />
      <Route path="diagnostics" element={<DiagnosticsOverview />} />
      <Route path="equipment" element={<EquipmentManagement />} />
      <Route path="inventory" element={<DepartmentInventory />} />
      <Route path="leaves" element={<LeaveManagement />} />
      <Route path="reports" element={<DepartmentReports />} />
      <Route path="resource-requests" element={<ResourceRequests />} />
      <Route path="purchase-requests" element={<PurchaseRequests />} />
      <Route path="maintenance-requests" element={<MaintenanceRequests />} />
      <Route path="approvals-hub" element={<ApprovalsTracking />} />
      <Route path="activity-history" element={<ActivityHistory />} />
      <Route path="notifications" element={<NotificationsView />} />
      <Route path="profile" element={<DepartmentAdminProfile />} />
      <Route path="*" element={<Navigate to="/department-admin" replace />} />
    </Routes>
  );
};

export default DepartmentAdminRoutes;

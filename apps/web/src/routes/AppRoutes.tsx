import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';

import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';

import { AdminDashboard } from '../features/admin/AdminDashboard';
import { UserManagement } from '../features/admin/UserManagement';
import { AuditLogs } from '../features/admin/AuditLogs';
import { DoctorDashboard } from '../features/doctor/DoctorDashboard';
import { NursingDashboard } from '../features/nursing/NursingDashboard';
import { ReceptionDashboard } from '../features/reception/ReceptionDashboard';
import { LaboratoryDashboard } from '../features/laboratory/LaboratoryDashboard';
import { PharmacyDashboard } from '../features/pharmacy/PharmacyDashboard';
import { RadiologyDashboard } from '../features/radiology/RadiologyDashboard';
import { BillingDashboard } from '../features/billing/BillingDashboard';
import { WardManagementDashboard } from '../features/wards/WardManagementDashboard';
import { AmbulanceDispatchDashboard } from '../features/ambulance/AmbulanceDispatchDashboard';
import { PatientPortalDashboard } from '../features/patient/PatientPortalDashboard';

const RoleBasedHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case Role.DOCTOR:
      return <Navigate to="/doctor" replace />;
    case Role.NURSE:
    case Role.HEAD_NURSE:
      return <Navigate to="/nursing" replace />;
    case Role.RECEPTIONIST:
      return <Navigate to="/reception" replace />;
    case Role.LAB_TECHNICIAN:
      return <Navigate to="/laboratory" replace />;
    case Role.PHARMACIST:
      return <Navigate to="/pharmacy" replace />;
    case Role.RADIOLOGY_STAFF:
      return <Navigate to="/radiology" replace />;
    case Role.BILLING_STAFF:
    case Role.INSURANCE_STAFF:
      return <Navigate to="/billing" replace />;
    case Role.WARD_MANAGER:
      return <Navigate to="/wards" replace />;
    case Role.AMBULANCE_COORDINATOR:
    case Role.AMBULANCE_DRIVER:
      return <Navigate to="/ambulance" replace />;
    case Role.PATIENT:
      return <Navigate to="/patient-portal" replace />;
    default:
      return <Navigate to="/admin" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<RoleBasedHomeRedirect />} />

          {/* Member 1: Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/audit" element={<AuditLogs />} />

          {/* Member 2: Doctor */}
          <Route path="/doctor" element={<DoctorDashboard />} />

          {/* Member 3: Nursing */}
          <Route path="/nursing" element={<NursingDashboard />} />

          {/* Member 4: Reception */}
          <Route path="/reception" element={<ReceptionDashboard />} />

          {/* Member 5: Laboratory */}
          <Route path="/laboratory" element={<LaboratoryDashboard />} />

          {/* Member 6: Pharmacy */}
          <Route path="/pharmacy" element={<PharmacyDashboard />} />

          {/* Member 7: Radiology */}
          <Route path="/radiology" element={<RadiologyDashboard />} />

          {/* Member 8: Billing, Insurance & Wards */}
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/wards" element={<WardManagementDashboard />} />

          {/* Member 9: Ambulance & Patient Portal */}
          <Route path="/ambulance" element={<AmbulanceDispatchDashboard />} />
          <Route path="/patient-portal" element={<PatientPortalDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

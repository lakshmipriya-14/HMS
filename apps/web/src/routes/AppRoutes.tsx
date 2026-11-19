import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';

import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';

// Independent Feature Route Modules (Decoupled across Members 1-9)
import { AdminRoutes } from '../features/admin/routes';
import { DoctorRoutes } from '../features/doctor/routes';
import { NursingRoutes } from '../features/nursing/routes';
import { ReceptionRoutes } from '../features/reception/routes';
import { LaboratoryRoutes } from '../features/laboratory/routes';
import { PharmacyRoutes } from '../features/pharmacy/routes';
import { RadiologyRoutes } from '../features/radiology/routes';
import { BillingRoutes } from '../features/billing/routes';
import { WardRoutes } from '../features/wards/routes';
import { AmbulanceRoutes } from '../features/ambulance/routes';
import { PatientRoutes } from '../features/patient/routes';

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

/**
 * Top-Level App Router:
 * Follows Open-Closed Principle. This file only mounts the root route prefixes.
 * Individual engineers (Doctor, Nurse, Pharmacy, etc.) ONLY modify their own
 * `features/<module>/routes.tsx` files. They NEVER touch this file to add sub-routes.
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Dashboard Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<RoleBasedHomeRedirect />} />

          {/* Member 1: Admin */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Member 2: Doctor */}
          <Route path="/doctor/*" element={<DoctorRoutes />} />

          {/* Member 3: Nursing */}
          <Route path="/nursing/*" element={<NursingRoutes />} />

          {/* Member 4: Reception */}
          <Route path="/reception/*" element={<ReceptionRoutes />} />

          {/* Member 5: Laboratory */}
          <Route path="/laboratory/*" element={<LaboratoryRoutes />} />

          {/* Member 6: Pharmacy */}
          <Route path="/pharmacy/*" element={<PharmacyRoutes />} />

          {/* Member 7: Radiology */}
          <Route path="/radiology/*" element={<RadiologyRoutes />} />

          {/* Member 8: Billing, Insurance & Wards */}
          <Route path="/billing/*" element={<BillingRoutes />} />
          <Route path="/wards/*" element={<WardRoutes />} />

          {/* Member 9: Ambulance & Patient Portal */}
          <Route path="/ambulance/*" element={<AmbulanceRoutes />} />
          <Route path="/patient-portal/*" element={<PatientRoutes />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

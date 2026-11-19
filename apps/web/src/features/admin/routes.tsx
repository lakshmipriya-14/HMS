import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { AuditLogs } from './AuditLogs';

/**
 * Member 1 owns this file.
 * All admin sub-routes must be registered here.
 * Changes here will never conflict with Doctor, Nurse, or other member features.
 */
export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="audit" element={<AuditLogs />} />
    </Routes>
  );
};

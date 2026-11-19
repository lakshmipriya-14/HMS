import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PatientPortalDashboard } from './PatientPortalDashboard';

/**
 * Member 9 owns this file.
 * All patient health record, appointments, and report viewer routes live here.
 */
export const PatientRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PatientPortalDashboard />} />
    </Routes>
  );
};

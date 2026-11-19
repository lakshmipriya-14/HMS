import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DoctorDashboard } from './DoctorDashboard';

/**
 * Member 2 owns this file.
 * All doctor-specific sub-routes (e.g. consultations, prescriptions, history)
 * are managed exclusively inside this feature module.
 * Modifying doctor screens will never cause git merge conflicts for other team members.
 */
export const DoctorRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DoctorDashboard />} />
      {/* Member 2 can freely add future sub-routes here:
          <Route path="queue" element={<DoctorQueue />} />
          <Route path="consultations/:id" element={<ConsultationScreen />} />
          <Route path="prescriptions" element={<PrescriptionHistory />} />
      */}
    </Routes>
  );
};

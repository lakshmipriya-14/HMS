import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { NursingDashboard } from './NursingDashboard';

/**
 * Member 3 owns this file.
 * All nursing inpatient, MAR, vitals, and handover routes live here.
 */
export const NursingRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<NursingDashboard />} />
    </Routes>
  );
};

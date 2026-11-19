import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ReceptionDashboard } from './ReceptionDashboard';

/**
 * Member 4 owns this file.
 * All reception, UHID registration, walk-in, and OPD queue routes live here.
 */
export const ReceptionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ReceptionDashboard />} />
    </Routes>
  );
};

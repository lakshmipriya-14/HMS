import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PharmacyDashboard } from './PharmacyDashboard';

/**
 * Member 6 owns this file.
 * All pharmacy dispensing, inventory stock, and batch management routes live here.
 */
export const PharmacyRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PharmacyDashboard />} />
    </Routes>
  );
};

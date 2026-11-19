import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WardManagementDashboard } from './WardManagementDashboard';

/**
 * Member 8 owns this file.
 * All ward occupancy, bed allocation, and transfer routes live here.
 */
export const WardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WardManagementDashboard />} />
    </Routes>
  );
};

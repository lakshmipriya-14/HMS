import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AmbulanceDispatchDashboard } from './AmbulanceDispatchDashboard';

/**
 * Member 9 owns this file.
 * All ambulance emergency dispatch and fleet management routes live here.
 */
export const AmbulanceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AmbulanceDispatchDashboard />} />
    </Routes>
  );
};

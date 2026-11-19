import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LaboratoryDashboard } from './LaboratoryDashboard';

/**
 * Member 5 owns this file.
 * All laboratory testing, barcode tracking, and report release routes live here.
 */
export const LaboratoryRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LaboratoryDashboard />} />
    </Routes>
  );
};

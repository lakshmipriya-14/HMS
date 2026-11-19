import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RadiologyDashboard } from './RadiologyDashboard';

/**
 * Member 7 owns this file.
 * All radiology imaging orders, PACS/DICOM metadata, and report release routes live here.
 */
export const RadiologyRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RadiologyDashboard />} />
    </Routes>
  );
};

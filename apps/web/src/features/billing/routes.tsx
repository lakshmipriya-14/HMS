import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BillingDashboard } from './BillingDashboard';

/**
 * Member 8 owns this file.
 * All OPD/IPD invoices, insurance claims, and payment routes live here.
 */
export const BillingRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<BillingDashboard />} />
    </Routes>
  );
};

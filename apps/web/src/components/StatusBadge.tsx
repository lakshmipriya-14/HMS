import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'solid' | 'subtle';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'subtle' }) => {
  const getColors = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'AVAILABLE':
      case 'COMPLETED':
      case 'RELEASED':
      case 'DISPENSED':
      case 'PAID':
      case 'APPROVED':
      case 'SUCCESS':
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'SCHEDULED':
      case 'CHECKED_IN':
      case 'ADMITTED':
      case 'OCCUPIED':
      case 'DISPATCHED':
      case 'EN_ROUTE_PICKUP':
      case 'EN_ROUTE_HOSPITAL':
        return 'bg-sky-50 text-sky-700 border-sky-200';

      case 'PENDING':
      case 'PROCESSING':
      case 'PARTIALLY_PAID':
      case 'PARTIALLY_DISPENSED':
      case 'CLEANING':
      case 'UNDER_REVIEW':
      case 'ROUTINE':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'CRITICAL':
      case 'STAT_EMERGENCY':
      case 'CANCELLED':
      case 'REJECTED':
      case 'MAINTENANCE':
      case 'NO_SHOW':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formattedStatus = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {formattedStatus}
    </span>
  );
};

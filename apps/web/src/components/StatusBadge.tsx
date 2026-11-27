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
        return 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';

      case 'SCHEDULED':
      case 'CHECKED_IN':
      case 'ADMITTED':
      case 'OCCUPIED':
      case 'DISPATCHED':
      case 'EN_ROUTE_PICKUP':
      case 'EN_ROUTE_HOSPITAL':
        return 'bg-[#E8F1FC] text-[#1565C0] border-[#BFDBFE]';

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
        return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';

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

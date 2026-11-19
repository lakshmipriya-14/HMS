import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading hospital clinical records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
        <Activity className="w-5 h-5 text-teal-600 absolute animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};

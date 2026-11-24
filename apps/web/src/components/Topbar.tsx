import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, LogOut, ShieldCheck, MapPin, Activity } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Branch & Hospital Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-medium">Main Campus: K.K. Nagar, Madurai</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1 text-xs text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>EMR System Online</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile Pill with Hover Name */}
        <div
          className="flex items-center space-x-2 text-xs cursor-pointer group"
          title={`Name: ${user?.firstName} ${user?.lastName}\nRole: ${user?.role}\nEmail: ${user?.email}`}
        >
          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200 text-[11px] group-hover:bg-teal-100 transition-colors">
            {user?.role}
          </span>
          <span className="font-semibold text-slate-700 hidden md:inline group-hover:text-teal-700 transition-colors">
            {user?.firstName} {user?.lastName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of hospital terminal"
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

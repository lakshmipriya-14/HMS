import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bell, LogOut, ShieldCheck, MapPin, Activity } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Branch & Hospital Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-xs text-[#183153] bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-[#00897B]" />
          <span className="font-medium">Main Campus: K.K. Nagar, Madurai</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1 text-xs text-[#16A34A] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span>EMR System Online</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-500 hover:text-[#1565C0] hover:bg-[#E8F1FC] rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00897B]"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile Pill with Hover Name */}
        <div
          className="flex items-center space-x-2 text-xs cursor-pointer group"
          title={`Name: ${user?.firstName} ${user?.lastName}\nRole: ${user?.role}\nEmail: ${user?.email}`}
        >
          <span className="px-2 py-0.5 rounded bg-[#E0F2F1] text-[#00897B] font-semibold border border-[#B2DFDB] text-[11px] transition-colors">
            {user?.role}
          </span>
          <span className="font-semibold text-[#183153] hidden md:inline group-hover:text-[#1565C0] transition-colors">
            {user?.firstName} {user?.lastName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign out of hospital terminal"
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#DC2626] hover:bg-red-50 border border-slate-200 rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

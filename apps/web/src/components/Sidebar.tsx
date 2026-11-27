import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HeartPulse, ChevronRight } from 'lucide-react';
import { ALL_NAV_ITEMS } from './navigationRegistry';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const filteredNav = ALL_NAV_ITEMS.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-[#183153] text-slate-200 flex flex-col shrink-0 border-r border-slate-800/60 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1565C0] to-[#00897B] flex items-center justify-center text-white shadow-md">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">
            Uyirinai
          </h1>
          <p className="text-[10px] text-[#B2DFDB] font-medium tracking-wider uppercase">
            Multispeciality Hospital
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Clinical & Ops Modules
        </p>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-[#1565C0] text-white font-semibold border-l-4 border-[#00897B] pl-2.5'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300" />
            </NavLink>
          );
        })}
      </div>

      {/* Active User Profile Hover Footer */}
      {user && (
        <div
          className="p-3 mx-3 mb-2 bg-white/10 rounded-xl border border-white/15 flex items-center space-x-3 cursor-pointer hover:bg-white/15 hover:border-[#00897B] transition-all group relative"
          title={`Name: ${user.firstName} ${user.lastName}\nRole: ${user.role}\nEmail: ${user.email}`}
        >
          <div className="w-8 h-8 rounded-full bg-[#1565C0] border border-[#00897B] flex items-center justify-center text-white font-bold text-xs uppercase group-hover:scale-105 transition-transform">
            {user.firstName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate transition-colors">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-[#B2DFDB] font-mono truncate">
              {user.role}
            </p>
          </div>
        </div>
      )}

      {/* Hospital Footer Info */}
      <div className="p-4 border-t border-white/10 text-[11px] text-slate-300 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">NABH Accredited</span>
          <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
        </div>
        <p className="text-[10px] text-slate-400">Emergency Hotline: 1066</p>
      </div>
    </aside>
  );
};

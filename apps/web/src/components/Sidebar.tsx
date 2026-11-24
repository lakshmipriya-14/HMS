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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">
            Kizuna
          </h1>
          <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">
            Multispeciality Hospital
          </p>
          <p className="text-[9px] text-slate-500 font-tamil">
            கிஜுனா மருத்துவமனை
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                    ? 'bg-teal-600/20 text-teal-300 font-semibold border-l-4 border-teal-500 pl-2.5'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
            </NavLink>
          );
        })}
      </div>

      {/* Active User Profile Hover Footer */}
      {user && (
        <div
          className="p-3 mx-3 mb-2 bg-slate-800/90 rounded-xl border border-slate-700/60 flex items-center space-x-3 cursor-pointer hover:bg-slate-800 hover:border-teal-500/40 transition-all group relative"
          title={`Name: ${user.firstName} ${user.lastName}\nRole: ${user.role}\nEmail: ${user.email}`}
        >
          <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300 font-bold text-xs uppercase group-hover:scale-105 transition-transform">
            {user.firstName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-teal-400 font-mono truncate">
              {user.role}
            </p>
          </div>
        </div>
      )}

      {/* Hospital Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-400">NABH Accredited</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-[10px]">Emergency Hotline: 1066</p>
      </div>
    </aside>
  );
};

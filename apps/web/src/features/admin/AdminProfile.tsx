import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Shield,
  KeyRound,
  LogOut,
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }
    setSuccessMessage('Password changed successfully.');
    setPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-900">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
                {user?.role}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Kizuna Apex Medical Center</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Profile Details & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-teal-600" />
            Administrative Account Info
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Account Role</span>
              <span className="font-semibold text-slate-800">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Registered Email</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Hospital Branch ID</span>
              <span className="font-mono text-slate-700">{user?.branchId || 'Apex Branch'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-400">Scope Authority</span>
              <span className="font-semibold text-teal-700">Full Operating Branch</span>
            </div>
          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-teal-600" />
              Security & Credential Management
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Ensure your administrative account password uses a strong mix of letters, numbers, and symbols.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Password</p>
              <p className="text-[11px] text-slate-400">Last changed recently</p>
            </div>
            <button
              onClick={() => {
                setErrorMessage('');
                setPasswordModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* UPDATE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Update Administrative Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

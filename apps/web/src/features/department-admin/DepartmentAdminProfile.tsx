import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import {
  User,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const DepartmentAdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getProfile();
      if (res.data) {
        setProfile(res.data);
        setFirstName(res.data.firstName || '');
        setLastName(res.data.lastName || '');
        setPhone(res.data.phone || '');
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setError('');
      await apiClient.departmentAdmin.updateProfile({ firstName, lastName, phone });
      setSuccessMessage('Profile information updated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadProfile();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await apiClient.departmentAdmin.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading administrator profile..." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
          <User className="w-6 h-6 text-teal-600" />
          Department Administrator Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal account credentials, departmental assignments, and login security.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200/50 flex items-center justify-center text-teal-700 text-2xl font-black shrink-0">
          {profile?.firstName?.[0] || 'D'}{profile?.lastName?.[0] || 'A'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-black text-slate-800">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/50 self-center sm:self-auto">
              <ShieldCheck className="w-3 h-3" /> DEPARTMENT ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{profile?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Dept: {profile?.department?.name || 'Assigned Department'}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <span>Branch: {profile?.branch?.name || 'Main Hospital Campus'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Contact Info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" /> Personal Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-mono"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                {savingProfile ? 'Saving...' : 'Update Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" /> Security & Password
          </h3>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-4">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

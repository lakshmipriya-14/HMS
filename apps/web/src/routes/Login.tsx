import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '@multispeciality-hms/contracts';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const DEMO_PRESETS = [
  { label: 'Super Admin', email: 'superadmin@kizunahospital.com', role: Role.SUPER_ADMIN },
  { label: 'Hospital Admin', email: 'hospitaladmin@kizunahospital.com', role: Role.HOSPITAL_ADMIN },
  { label: 'Doctor (Cardiology)', email: 'doctor@kizunahospital.com', role: Role.DOCTOR },
  { label: 'Staff Nurse', email: 'nurse@kizunahospital.com', role: Role.NURSE },
  { label: 'Head Nurse', email: 'headnurse@kizunahospital.com', role: Role.HEAD_NURSE },
  { label: 'Receptionist', email: 'reception@kizunahospital.com', role: Role.RECEPTIONIST },
  { label: 'Lab Technician', email: 'lab@kizunahospital.com', role: Role.LAB_TECHNICIAN },
  { label: 'Pharmacist', email: 'pharmacy@kizunahospital.com', role: Role.PHARMACIST },
  { label: 'Radiology Staff', email: 'radiology@kizunahospital.com', role: Role.RADIOLOGY_STAFF },
  { label: 'Billing Staff', email: 'billing@kizunahospital.com', role: Role.BILLING_STAFF },
  { label: 'Ward Manager', email: 'wardmanager@kizunahospital.com', role: Role.WARD_MANAGER },
  { label: 'Ambulance Dispatch', email: 'ambulance@kizunahospital.com', role: Role.AMBULANCE_COORDINATOR },
  { label: 'Patient Portal', email: 'patient@kizunahospital.com', role: Role.PATIENT },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('doctor@kizunahospital.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email, password });
      // Redirect based on role or home
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectDemoRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white mx-auto shadow-xl shadow-teal-900/20">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Kizuna Multispeciality Hospital
        </h2>
        <p className="text-xs text-teal-800 font-medium mt-1">
          கிஜுனா பன்னோக்கு மருத்துவமனை • EMR Clinical Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="name@kizunahospital.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Clinical Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Role Switcher (10 Member Testing)
            </p>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {DEMO_PRESETS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => selectDemoRole(demo.email)}
                  className={`text-[11px] font-medium p-1.5 rounded text-left border truncate transition-colors ${
                    email === demo.email
                      ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {demo.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Password for all seeded accounts: <span className="font-mono font-bold text-slate-600">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

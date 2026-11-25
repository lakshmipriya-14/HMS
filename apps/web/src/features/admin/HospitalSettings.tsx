import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const HospitalSettings: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Kizuna Multispeciality Hospital',
    tamilName: 'கிஜுனா பன்னோக்கு மருத்துவமனை',
    code: 'KIZUNA-MADURAI',
    licenseNumber: 'TN-HOSP-2026-08492',
    addressLine1: '45, Bypass Road, Ponmeni',
    city: 'Madurai',
    state: 'Tamil Nadu',
    postalCode: '625016',
    country: 'India',
    phone: '+91 452 258000',
    emergencyPhone: '108 / +91 452 258008',
    email: 'contact@kizunahospital.com',
    opdHours: '08:00 AM - 08:00 PM (Monday - Saturday)',
    emergencyHours: '24 Hours / 7 Days (Continuous Emergency Care)',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Hospital operational settings saved successfully.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <Settings className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hospital Center & Branch Settings</h1>
            <p className="text-xs text-slate-500">
              Institution metadata, regulatory license credentials, emergency hotlines, and operational timings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-teal-600" />
            Institutional Identity & Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tamil Institutional Name</label>
              <input
                type="text"
                value={formData.tamilName}
                onChange={(e) => setFormData({ ...formData, tamilName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-tamil"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Center Code</label>
              <input
                type="text"
                readOnly
                value={formData.code}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Health License Number</label>
              <input
                type="text"
                readOnly
                value={formData.licenseNumber}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-teal-600" />
            Campus Location & Contact Directory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City & State</label>
              <input
                type="text"
                value={`${formData.city}, ${formData.state} - ${formData.postalCode}`}
                readOnly
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reception Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency 24x7 Helpline</label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-rose-700 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Timings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-teal-600" />
            Operating Schedules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Consultation Hours</label>
              <input
                type="text"
                value={formData.opdHours}
                onChange={(e) => setFormData({ ...formData, opdHours: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Department Hours</label>
              <input
                type="text"
                readOnly
                value={formData.emergencyHours}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            Save Hospital Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

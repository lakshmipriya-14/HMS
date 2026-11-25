import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const EquipmentManagement: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<any | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.departmentAdmin.getEquipment();
      if (res.data) setEquipmentList(res.data);
    } catch (err: any) {
      console.error('Failed to load department equipment:', err);
      setError(err.message || 'Failed to load department equipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleOpenMaintenanceModal = (equip: any) => {
    setSelectedEquip(equip);
    setIssueDescription('');
    setPriority('MEDIUM');
    setShowReportModal(true);
  };

  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;
    try {
      setSubmitting(true);
      setError('');
      await apiClient.departmentAdmin.submitMaintenanceRequest({
        equipmentId: selectedEquip?.id,
        equipmentName: selectedEquip?.name || 'Department Equipment',
        description: issueDescription,
        priority,
      });
      setShowReportModal(false);
      setSuccessMessage('Maintenance request submitted successfully to biomedical/facilities engineering.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadEquipment();
    } catch (err: any) {
      console.error('Failed to submit maintenance request:', err);
      setError(err.message || 'Failed to submit maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = equipmentList.filter((eq) => {
    if (!search) return true;
    const name = (eq.name || '').toLowerCase();
    const serial = (eq.serialNumber || eq.model || '').toLowerCase();
    const room = (eq.location || eq.room || '').toLowerCase();
    return name.includes(search.toLowerCase()) || serial.includes(search.toLowerCase()) || room.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-teal-600" />
            Department Equipment & Biomedical Assets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track department machines, monitors, ventilators, and submit maintenance work orders.
          </p>
        </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Equipment</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{equipmentList.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Operational / Ready</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {equipmentList.filter((e) => ['FUNCTIONAL', 'ACTIVE', 'OPERATIONAL'].includes(e.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">In Maintenance</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {equipmentList.filter((e) => ['MAINTENANCE', 'UNDER_MAINTENANCE', 'REPAIR'].includes(e.status)).length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Calibration Due</p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {equipmentList.filter((e) => e.status === 'CALIBRATION_DUE').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search equipment by name, model, serial #, room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
        />
      </div>

      {/* Equipment Table */}
      {loading ? (
        <LoadingState message="Loading department equipment..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Equipment Registered</p>
          <p className="text-xs text-slate-400 mt-1">No biomedical or facility equipment matches your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Equipment & Model</th>
                  <th className="py-3 px-4">Serial / Tag #</th>
                  <th className="py-3 px-4">Location / Room</th>
                  <th className="py-3 px-4">Last Calibration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400">{item.model || item.type || 'Standard Equipment'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {item.serialNumber || item.tagNumber || item.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {item.location || item.room || 'Department Floor'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {item.lastCalibratedAt
                        ? new Date(item.lastCalibratedAt).toLocaleDateString('en-IN')
                        : 'Routine Checked'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status || 'OPERATIONAL'} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenMaintenanceModal(item)}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" /> Report Issue
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Request Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-800">Report Equipment Breakdown</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Equipment</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedEquip?.name || ''} (${selectedEquip?.serialNumber || selectedEquip?.model || ''})`}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the malfunction, error code, or maintenance needed..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Urgency / Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                >
                  <option value="LOW">Low (Preventative / Minor)</option>
                  <option value="MEDIUM">Medium (Degraded Performance)</option>
                  <option value="HIGH">High (Equipment Down)</option>
                  <option value="CRITICAL">Critical (Emergency / ICU / OT)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

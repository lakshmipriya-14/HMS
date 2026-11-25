import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import {
  Ambulance,
  Building2,
  Plus,
  Radio,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const FacilityFleetManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    patientName: '',
    contactPhone: '',
    pickupAddress: '',
    severity: 'EMERGENCY',
    reason: 'Acute Trauma / Cardiac Emergency',
    vehicleId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const [vRes, tRes] = await Promise.all([
        apiClient.ambulance.getVehicles(),
        apiClient.ambulance.getActiveTrips(),
      ]);
      if (vRes.data) setVehicles(vRes.data);
      if (tRes.data) setActiveTrips(tRes.data);
    } catch (err: any) {
      console.error('Failed to load fleet:', err);
      setErrorMessage(err.message || 'Failed to load fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.ambulance.createEmergencyRequest({
        callerName: dispatchForm.patientName || 'Emergency Hospital Dispatch',
        callerPhone: dispatchForm.contactPhone || '108',
        pickupLocation: dispatchForm.pickupAddress || 'Hospital Main Campus',
        destinationHospitalId: 'default',
        emergencySeverity: (dispatchForm.severity || 'CRITICAL') as any,
        patientConditionSummary: dispatchForm.reason || 'Urgent hospital transport requested',
      });
      setSuccessMessage('Emergency ambulance dispatched immediately.');
      setDispatchModalOpen(false);
      await loadFleetData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch ambulance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading hospital emergency fleet and 108 radar..." />;

  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');

  return (
    <div className="space-y-6 pb-12">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <Ambulance className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Emergency 108 Fleet & Facility Operations</h1>
            <p className="text-xs text-slate-500">
              Ambulance fleet status, GPS emergency radar, and physical campus infrastructure
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDispatchForm({
              patientName: '',
              contactPhone: '',
              pickupAddress: '',
              severity: 'EMERGENCY',
              reason: 'Acute Trauma / Cardiac Emergency',
              vehicleId: availableVehicles[0]?.id || '',
            });
            setErrorMessage('');
            setDispatchModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          Trigger 108 Dispatch
        </button>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Emergency Fleet</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{vehicles.length} Vehicles</h3>
          <p className="text-xs text-slate-400 mt-0.5">Advanced Life Support (ALS) & Basic (BLS)</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ready at Hospital Bay</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">{availableVehicles.length} Units Ready</h3>
          <p className="text-xs text-slate-400 mt-0.5">Paramedics & drivers standing by</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Active Dispatches</span>
          <h3 className="text-2xl font-bold text-rose-700 mt-1">{activeTrips.length} En Route</h3>
          <p className="text-xs text-slate-400 mt-0.5">Transits undergoing trauma run</p>
        </div>
      </div>

      {/* Active Trips Radar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              Real-Time Emergency Dispatches & Trips
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Live monitoring of vehicles currently dispatched</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{activeTrips.length} active runs</span>
        </div>

        {activeTrips.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No ambulances currently on emergency runs.</p>
        ) : (
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{trip.patientName || 'Emergency Patient'}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800">
                      {trip.severity || 'CRITICAL'}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pickup: {trip.pickupLocation || 'Caller Location'}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Assigned Vehicle: <span className="font-semibold text-slate-800">{trip.ambulance?.registrationNumber}</span>{' '}
                    • Driver: {trip.driver?.employee?.user ? `${trip.driver.employee.user.firstName} ${trip.driver.employee.user.lastName}` : 'Standby Driver'}
                  </div>
                </div>

                <div className="text-right">
                  <StatusBadge status={trip.status} />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dispatched:{' '}
                    {new Date(trip.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Fleet Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-800">Emergency Ambulance Fleet Registry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-800">{v.registrationNumber}</span>
                  <StatusBadge status={v.status} />
                </div>
                <div className="mt-2">
                  <h4 className="font-bold text-slate-900 text-sm">{v.vehicleModel || 'Force Traveller'}</h4>
                  <p className="text-xs text-teal-700 font-semibold">{v.type?.replace(/_/g, ' ') || 'ADVANCED LIFE SUPPORT'}</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
                <span>Equipment: Oxygen, Defibrillator</span>
                <span className="font-semibold text-slate-700">Bay 1</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DISPATCH MODAL */}
      <Modal isOpen={dispatchModalOpen} onClose={() => setDispatchModalOpen(false)} title="Trigger Emergency 108 Dispatch">
        <form onSubmit={handleDispatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                placeholder="Caller / Patient Name"
                value={dispatchForm.patientName}
                onChange={(e) => setDispatchForm({ ...dispatchForm, patientName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                placeholder="Caller Phone Number"
                value={dispatchForm.contactPhone}
                onChange={(e) => setDispatchForm({ ...dispatchForm, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup GPS Address / Landmark *</label>
            <input
              type="text"
              required
              placeholder="e.g. Near Madurai Junction, West Masi Street"
              value={dispatchForm.pickupAddress}
              onChange={(e) => setDispatchForm({ ...dispatchForm, pickupAddress: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Ambulance</label>
              <select
                value={dispatchForm.vehicleId}
                onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Severity</label>
              <select
                value={dispatchForm.severity}
                onChange={(e) => setDispatchForm({ ...dispatchForm, severity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="CRITICAL">Critical (Red Code)</option>
                <option value="EMERGENCY">Emergency (Yellow Code)</option>
                <option value="ROUTINE">Routine Transit (Green Code)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Reason</label>
            <input
              type="text"
              value={dispatchForm.reason}
              onChange={(e) => setDispatchForm({ ...dispatchForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDispatchModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Dispatching...' : 'Dispatch Vehicle Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


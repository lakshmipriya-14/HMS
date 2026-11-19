import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  Ambulance,
  PhoneCall,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Radio,
  Navigation,
} from 'lucide-react';

export const AmbulanceDispatchDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Emergency Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [conditionSummary, setConditionSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAmbulanceData = async () => {
    try {
      const [vehRes, tripRes] = await Promise.all([
        apiClient.ambulance.getVehicles ? apiClient.ambulance.getVehicles() : { data: [] },
        apiClient.ambulance.getActiveTrips(),
      ]);
      if (vehRes.data) setVehicles(vehRes.data);
      if (tripRes.data) setActiveTrips(tripRes.data);
    } catch (err) {
      console.error('Failed to load ambulance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulanceData();
  }, []);

  const handleCreateEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.ambulance.createEmergencyRequest({
        callerName,
        callerPhone,
        pickupLocation,
        destinationHospitalId: 'default',
        emergencySeverity: severity as any,
        patientConditionSummary: conditionSummary,
      });

      alert('Emergency ambulance dispatched immediately! Driver notified.');
      setIsModalOpen(false);
      setCallerName('');
      setCallerPhone('');
      setPickupLocation('');
      setConditionSummary('');
      fetchAmbulanceData();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (tripId: string, status: string) => {
    try {
      await apiClient.ambulance.updateTripStatus(tripId, { status: status as any });
      fetchAmbulanceData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  if (loading) return <LoadingState message="Connecting to emergency dispatch radio & fleet..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Emergency Medical Services & Ambulance Fleet
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            24/7 Rapid response dispatch, GPS fleet tracking, paramedic triage, and ER trauma handover
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition-all flex items-center space-x-2 animate-pulse"
        >
          <PhoneCall className="w-4 h-4" />
          <span>+ Log 108 Emergency Call</span>
        </button>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Strength</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{vehicles.length || 4} Ambulances</h3>
            <p className="text-xs text-slate-500 mt-0.5">ICU Mobile Telemetry Units</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
            <Ambulance className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Dispatches</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{activeTrips.length} On Road</h3>
            <p className="text-xs text-slate-500 mt-0.5">En route to scene / hospital</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trauma ER Status</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">Ready for Triage</h3>
            <p className="text-xs text-slate-500 mt-0.5">Resuscitation bays pre-alerted</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Radio className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Emergency Trips Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-800">Live Ambulance Missions in Progress</h3>
          <span className="text-xs text-rose-600 font-semibold">{activeTrips.length} active dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Vehicle #</th>
                <th className="py-3 px-4">Emergency Caller</th>
                <th className="py-3 px-4">Pickup Location</th>
                <th className="py-3 px-4">Condition & Severity</th>
                <th className="py-3 px-4">Mission Status</th>
                <th className="py-3 px-4 text-right">Progress Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{trip.tripCode}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {trip.ambulance?.vehicleNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{trip.callerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{trip.callerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{trip.pickupLocation}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-700">{trip.patientConditionSummary}</div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      {trip.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={trip.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {trip.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'EN_ROUTE_PICKUP')}
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded text-[11px] font-semibold"
                      >
                        En Route
                      </button>
                    )}
                    {trip.status === 'EN_ROUTE_PICKUP' && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'ARRIVED_AT_SCENE')}
                        className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-semibold"
                      >
                        At Scene
                      </button>
                    )}
                    {trip.status === 'ARRIVED_AT_SCENE' && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'EN_ROUTE_HOSPITAL')}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-semibold"
                      >
                        Transporting
                      </button>
                    )}
                    {trip.status === 'EN_ROUTE_HOSPITAL' && (
                      <button
                        onClick={() => handleUpdateStatus(trip.id, 'HANDOVER_COMPLETE')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-sm"
                      >
                        Handover to ER
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Call Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Emergency Ambulance"
        subtitle="Log incoming emergency 108 trauma call"
      >
        <form onSubmit={handleCreateEmergency} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caller Name *
              </label>
              <input
                type="text"
                required
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Caller / Bystander name"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caller Phone Number *
              </label>
              <input
                type="tel"
                required
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                placeholder="+91 98400 00000"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exact Pickup Location Address *
            </label>
            <input
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Landmark, road, area in Madurai / Chennai..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-bold text-rose-700"
            >
              <option value="CRITICAL">Critical (Cardiac Arrest / Massive Trauma)</option>
              <option value="HIGH">High (Severe Respiratory Distress / Acute Stroke)</option>
              <option value="MODERATE">Moderate (Fractures / Stable Vitals)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Clinical Condition Summary *
            </label>
            <textarea
              rows={2}
              required
              value={conditionSummary}
              onChange={(e) => setConditionSummary(e.target.value)}
              placeholder="Symptoms, consciousness, bleeding, age..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-900/20"
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Nearest Ambulance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

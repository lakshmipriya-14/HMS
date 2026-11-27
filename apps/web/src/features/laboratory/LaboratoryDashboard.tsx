import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  FlaskConical,
  Barcode,
  CheckCircle,
  AlertOctagon,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const LaboratoryDashboard: React.FC = () => {
  const [worklist, setWorklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Result entry state
  const [measuredValues, setMeasuredValues] = useState<Record<string, string>>({});
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorklist = async () => {
    try {
      const res = await apiClient.laboratory.getWorklist();
      if (res.data) setWorklist(res.data);
    } catch (err) {
      console.error('Failed to load lab worklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const handleCollectSample = async (orderId: string) => {
    try {
      await apiClient.laboratory.collectSample(orderId, `BAR-${Date.now().toString().slice(-6)}`);
      fetchWorklist();
    } catch (err: any) {
      alert(err.message || 'Sample collection failed');
    }
  };

  const openResultEntry = (order: any) => {
    setSelectedOrder(order);
    const initialVals: Record<string, string> = {};
    order.orderItems?.forEach((item: any) => {
      item.labTest?.parameters?.forEach((p: any) => {
        initialVals[p.id] = '';
      });
    });
    setMeasuredValues(initialVals);
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      const results: any[] = [];
      selectedOrder.orderItems?.forEach((item: any) => {
        item.labTest?.parameters?.forEach((p: any) => {
          const val = measuredValues[p.id] || '0';
          const numVal = parseFloat(val);
          const isCritical =
            (p.criticalLow && numVal < p.criticalLow) ||
            (p.criticalHigh && numVal > p.criticalHigh);
          const isAbnormal =
            (p.referenceLow && numVal < p.referenceLow) ||
            (p.referenceHigh && numVal > p.referenceHigh) ||
            isCritical;

          results.push({
            testParameterId: p.id,
            measuredValue: val,
            unit: p.unit,
            referenceRange: `${p.referenceLow || 0} - ${p.referenceHigh || 0} ${p.unit}`,
            isAbnormal,
            isCritical,
          });
        });
      });

      await apiClient.laboratory.enterResults({
        orderId: selectedOrder.id,
        results,
        technicianNotes,
      });

      alert('Test results entered and saved successfully!');
      setSelectedOrder(null);
      fetchWorklist();
    } catch (err: any) {
      alert(err.message || 'Failed to save results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseReport = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to officially release and sign this diagnostic report?')) {
      return;
    }
    try {
      await apiClient.laboratory.releaseReport(orderId);
      alert('Report released. Immediately accessible by Doctor and Patient portal.');
      fetchWorklist();
    } catch (err: any) {
      alert(err.message || 'Failed to release report');
    }
  };

  if (loading) return <LoadingState message="Loading laboratory worklists and sample logs..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Laboratory Diagnostics & Pathology
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sample tracking, automated analyzer worklists, critical value alerts, and validated report releases
          </p>
        </div>
      </div>

      {/* Worklist Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-[#00897B]" />
            <h3 className="font-bold text-sm text-slate-800">Pending Laboratory Orders Worklist</h3>
          </div>
          <span className="text-xs text-slate-500">{worklist.length} active orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order # & Barcode</th>
                <th className="py-3 px-4">Patient Name & UHID</th>
                <th className="py-3 px-4">Tests Ordered</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Laboratory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {worklist.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-800">{order.orderNumber}</div>
                    <div className="text-[11px] text-[#00897B] font-mono flex items-center space-x-1 mt-0.5">
                      <Barcode className="w-3.5 h-3.5" />
                      <span>{order.barcode}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">
                      {order.patient?.firstName} {order.patient?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      UHID: {order.patient?.uhid}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {order.orderItems?.map((oi: any) => (
                        <span
                          key={oi.id}
                          className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] mr-1"
                        >
                          {oi.labTest?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {order.priority === 'STAT_EMERGENCY' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                        STAT EMERGENCY
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Routine</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {order.status === 'ORDERED' && (
                      <button
                        onClick={() => handleCollectSample(order.id)}
                        className="px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Collect Sample
                      </button>
                    )}
                    {(order.status === 'COLLECTED' || order.status === 'PROCESSING') && (
                      <button
                        onClick={() => openResultEntry(order)}
                        className="px-3 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                      >
                        Enter Results
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => handleReleaseReport(order.id)}
                        className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Release Report</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enter Results Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Enter Diagnostic Results — ${selectedOrder?.orderNumber}`}
        subtitle={`Patient: ${selectedOrder?.patient?.firstName} ${selectedOrder?.patient?.lastName} | Barcode: ${selectedOrder?.barcode}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveResults} className="space-y-4">
          <div className="space-y-3">
            {selectedOrder?.orderItems?.map((item: any) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="font-bold text-xs text-slate-800 mb-2">{item.labTest?.name}</h5>
                <div className="space-y-2">
                  {item.labTest?.parameters?.map((p: any) => (
                    <div key={p.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5 text-slate-700 font-medium">
                        {p.parameterName}
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={measuredValues[p.id] || ''}
                          onChange={(e) =>
                            setMeasuredValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          placeholder={`Enter value (${p.unit})`}
                          className="w-full text-xs p-2 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 text-[11px] text-slate-400 font-mono">
                        Ref: {p.referenceLow} - {p.referenceHigh} {p.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technician / Pathologist Observations
            </label>
            <textarea
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Sample condition, automated analyzer flags..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Results'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/LoadingState';
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle,
  FileText,
  ShieldAlert,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'claims'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Collect Payment State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [txnRef, setTxnRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBillingData = async () => {
    try {
      const [invRes, claimRes] = await Promise.all([
        apiClient.billing.getInvoices(),
        apiClient.billing.getInsuranceClaims(),
      ]);
      if (invRes.data) setInvoices(invRes.data);
      if (claimRes.data) setClaims(claimRes.data);
    } catch (err) {
      console.error('Failed to load billing records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
    setPayAmount(balance.toString());
    setTxnRef(`UPI-${Date.now().toString().slice(-8)}`);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmitting(true);
    try {
      await apiClient.billing.collectPayment(selectedInvoice.id, {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(payAmount),
        paymentMethod: paymentMethod as any,
        transactionReference: txnRef,
      });

      alert('Payment collected successfully and receipt issued!');
      setSelectedInvoice(null);
      fetchBillingData();
    } catch (err: any) {
      alert(err.message || 'Payment collection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading hospital invoices and revenue ledger..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Hospital Billing & Health Insurance Claims
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated OPD/IPD invoices, digital payments (Cash/UPI/Cards), and TPA insurance claim settlement
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'invoices' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoices & Receipts ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'claims' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Insurance Claims ({claims.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient Name & UHID</th>
                  <th className="py-3 px-4">Billed Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {inv.patient?.firstName} {inv.patient?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          UHID: {inv.patient?.uhid}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {inv.items?.map((item: any) => (
                            <div key={item.id} className="text-slate-700 text-[11px]">
                              <span>{item.description}</span>
                              <span className="text-slate-400 ml-1 font-mono">(₹{item.totalPrice})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 font-mono text-sm">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700 font-mono">
                        ₹{Number(inv.paidAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {balance > 0 ? (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            Collect ₹{balance}
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            Fully Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Insurance Claims */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Claim #</th>
                  <th className="py-3 px-4">Patient Name & UHID</th>
                  <th className="py-3 px-4">Insurance Provider</th>
                  <th className="py-3 px-4">Policy Number</th>
                  <th className="py-3 px-4">Claim Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {claim.claimNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {claim.patient?.firstName} {claim.patient?.lastName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {claim.providerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{claim.policyNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{Number(claim.claimAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Collect Payment — ${selectedInvoice?.invoiceNumber}`}
        subtitle={`Patient: ${selectedInvoice?.patient?.firstName} ${selectedInvoice?.patient?.lastName}`}
      >
        <form onSubmit={handleCollectPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="CARD">Credit / Debit Card (POS)</option>
              <option value="CASH">Cash Counter</option>
              <option value="NET_BANKING">Net Banking Transfer</option>
              <option value="INSURANCE">TPA / Cashless Insurance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. UPI Ref / Bank Auth Code"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm inline-flex items-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Payment & Print Receipt'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { exportToCSV } from '../../utils/exportReport';
import {
  CreditCard,
  Search,
  DollarSign,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';

export const BillingFinanceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Collect Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CREDIT_CARD' | 'INSURANCE'>('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.billing.getInvoices();
      if (res.data) setInvoices(res.data);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setErrorMessage(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      await apiClient.billing.collectPayment(selectedInvoice.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: transactionRef || undefined,
      });
      setSuccessMessage(`Payment of ₹${paymentAmount} recorded for Invoice #${selectedInvoice.invoiceNumber}.`);
      setPaymentModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const pName = `${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}`.toLowerCase();
    const invNo = (inv.invoiceNumber || '').toLowerCase();
    const uhid = (inv.patient?.uhid || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = pName.includes(q) || invNo.includes(q) || uhid.includes(q);
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0);
  const totalPending = totalBilled - totalPaid;

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Hospital Billing & Invoicing Ledger',
      headers: ['Invoice #', 'Patient Name', 'UHID', 'Billed Amount', 'Paid Amount', 'Balance', 'Date', 'Status'],
      rows: filteredInvoices.map((i) => [
        i.invoiceNumber,
        `${i.patient?.firstName || ''} ${i.patient?.lastName || ''}`,
        i.patient?.uhid || 'N/A',
        Number(i.totalAmount || 0),
        Number(i.paidAmount || 0),
        Number(i.totalAmount || 0) - Number(i.paidAmount || 0),
        new Date(i.createdAt).toLocaleDateString('en-IN'),
        i.status,
      ]),
      fileName: 'billing_invoices_ledger',
    });
  };

  if (loading) return <LoadingState message="Loading hospital billing ledgers and financial audit..." />;

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
          <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <CreditCard className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Billing, Cashier POS & Financials</h1>
            <p className="text-xs text-slate-500">
              Inpatient/outpatient invoices, cashier POS collections, and insurance claims ledger
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Ledger
        </button>
      </div>

      {/* Financial KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed Volume</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{invoices.length} total hospital invoices issued</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Collected Collections</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{totalPaid.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Realized via Cash, UPI, Cards, TPA</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Balance Due</span>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">₹{totalPending.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Outstanding inpatient & corporate claims</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, patient name, UHID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Invoices</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending (Unpaid)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4 text-right">Billed Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const billed = Number(inv.totalAmount || 0);
                  const paid = Number(inv.paidAmount || 0);
                  const balance = billed - paid;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {inv.patient?.firstName} {inv.patient?.lastName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.patient?.uhid}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{billed.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">₹{paid.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-700">₹{balance.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentAmount(balance);
                              setPaymentMethod('CASH');
                              setTransactionRef('');
                              setErrorMessage('');
                              setPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Collect
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Collect Payment: Invoice #${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleCollectPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
            <span className="text-slate-500">Patient:</span>
            <span className="font-bold text-slate-800">
              {selectedInvoice?.patient?.firstName} {selectedInvoice?.patient?.lastName} ({selectedInvoice?.patient?.uhid})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                min={1}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="CASH">Cash POS</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="INSURANCE">TPA / Cashless Insurance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference / UTR Number</label>
            <input
              type="text"
              placeholder="e.g. UPI-9482019482, POS-REC-991"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || paymentAmount <= 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              {submitting ? 'Recording...' : 'Record Payment Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

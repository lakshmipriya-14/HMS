import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { exportToCSV, exportToPrintablePDF } from '../../utils/exportReport';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Building2,
  RefreshCw,
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const [reportType, setReportType] = useState('OPD');
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await apiClient.hospitalAdmin.getDepartments();
        if (res.data) setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      const res = await apiClient.hospitalAdmin.getReports({
        type: reportType,
        departmentId: departmentId || undefined,
        fromDate,
        toDate,
      });
      if (res.data) setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, departmentId]);

  const handleExportCSV = () => {
    if (reportType === 'OPD') {
      exportToCSV({
        title: 'OPD Census & Outpatient Consultation Report',
        headers: ['Token', 'Date', 'Patient Name', 'UHID', 'Doctor', 'Department', 'Status'],
        rows: reportData.map((r) => [
          r.tokenNumber || 'N/A',
          new Date(r.appointmentDate).toLocaleString('en-IN'),
          `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`,
          r.patient?.uhid || 'N/A',
          r.doctor?.employee?.user ? `Dr. ${r.doctor.employee.user.firstName} ${r.doctor.employee.user.lastName}` : 'N/A',
          r.department?.name || 'General',
          r.status,
        ]),
        fileName: 'opd_census_report',
        filterSummary: `Range: ${fromDate} to ${toDate}`,
      });
    } else if (reportType === 'IPD') {
      exportToCSV({
        title: 'Inpatient Admissions & Discharges Report',
        headers: ['Admission #', 'UHID', 'Patient Name', 'Ward', 'Bed', 'Admitted Date', 'Status'],
        rows: reportData.map((r) => [
          r.admissionNumber,
          r.patient?.uhid || 'N/A',
          `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`,
          r.ward?.name || 'N/A',
          r.bed ? `${r.bed.bedNumber} (${r.bed.roomNumber})` : 'N/A',
          new Date(r.admittedAt).toLocaleDateString('en-IN'),
          r.status,
        ]),
        fileName: 'ipd_admissions_report',
        filterSummary: `Range: ${fromDate} to ${toDate}`,
      });
    } else if (reportType === 'REVENUE') {
      exportToCSV({
        title: 'Hospital Collections & Financial Revenue Report',
        headers: ['Payment ID', 'Invoice #', 'Patient Name', 'Amount (₹)', 'Payment Method', 'Date'],
        rows: reportData.map((r) => [
          r.id.slice(0, 8),
          r.invoice?.invoiceNumber || 'N/A',
          r.invoice?.patient ? `${r.invoice.patient.firstName} ${r.invoice.patient.lastName}` : 'N/A',
          Number(r.amount || 0),
          r.paymentMethod || 'CASH',
          new Date(r.createdAt).toLocaleString('en-IN'),
        ]),
        fileName: 'financial_revenue_report',
        filterSummary: `Range: ${fromDate} to ${toDate}`,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#E0F2F1] text-[#00897B] rounded-xl border border-[#B2DFDB]">
            <BarChart3 className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reports, Analytics & Compliance Generator</h1>
            <p className="text-xs text-slate-500">
              Query PostgreSQL databases for clinical, financial, pharmacy, and audit records with export capabilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            Print Report
          </button>
        </div>
      </div>

      {/* Query Parameters Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Query Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Module *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
            >
              <option value="OPD">OPD Consultation Census</option>
              <option value="IPD">IPD Inpatient Admissions</option>
              <option value="REVENUE">Revenue & Financial Ledger</option>
              <option value="PHARMACY">Pharmacy Formulary Inventory</option>
              <option value="AUDIT">Immutable Audit Trail</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Query
          </button>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Query Output: {reportType} Report</h3>
          <span className="text-xs font-semibold text-slate-500">{reportData.length} records generated</span>
        </div>

        {loading ? (
          <LoadingState message="Executing PostgreSQL query and formatting result rows..." />
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No records returned for the selected criteria and date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'OPD' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">#{row.tokenNumber || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(row.appointmentDate).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {row.patient?.firstName} {row.patient?.lastName} ({row.patient?.uhid})
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {row.doctor?.employee?.user
                          ? `Dr. ${row.doctor.employee.user.firstName} ${row.doctor.employee.user.lastName}`
                          : 'Attending Doctor'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{row.department?.name || 'General'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'IPD' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Ward & Bed</th>
                    <th className="py-3 px-4">Admitted Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00897B]">{row.admissionNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {row.patient?.firstName} {row.patient?.lastName} ({row.patient?.uhid})
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {row.ward?.name} • Bed {row.bed?.bedNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(row.admittedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'REVENUE' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt ID</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{row.id.slice(0, 8)}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#00897B]">{row.invoice?.invoiceNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {row.invoice?.patient ? `${row.invoice.patient.firstName} ${row.invoice.patient.lastName}` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#16A34A]">
                        ₹{Number(row.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-slate-100 text-slate-700">
                          {row.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {new Date(row.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'PHARMACY' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Dosage / Formulation</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{row.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{row.composition || row.dosageForm}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#00897B]">{row.currentStock} units</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{Number(row.unitPrice || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'AUDIT' && (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {new Date(row.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{row.userEmail}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-[#E0F2F1] text-[#183153]">
                          {row.userRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.action}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{row.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

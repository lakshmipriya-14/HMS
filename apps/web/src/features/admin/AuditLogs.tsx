import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import { exportToCSV, exportToPrintablePDF } from '../../utils/exportReport';
import { ShieldAlert, Search, FileSpreadsheet, FileText } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.admin.getAuditLogs({
          search: searchTerm || undefined,
          action: selectedAction || undefined,
        });
        if (res.data) setLogs(res.data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [searchTerm, selectedAction]);

  const handleExportCSV = () => {
    exportToCSV({
      title: 'Security & Clinical Audit Logs',
      headers: ['Timestamp', 'User Email', 'Role', 'Action', 'Resource', 'IP Address'],
      rows: logs.map((l) => [
        new Date(l.createdAt).toLocaleString('en-IN'),
        l.userEmail,
        l.userRole,
        l.action,
        l.resource,
        l.ipAddress || '127.0.0.1',
      ]),
      fileName: 'audit_logs',
      filterSummary: selectedAction ? `Action: ${selectedAction}` : 'All Audit Events',
    });
  };

  const handleExportPDF = () => {
    exportToPrintablePDF({
      title: 'Security & System Audit Log Report',
      headers: ['Timestamp', 'User Email', 'Role', 'Action', 'Resource', 'IP Address'],
      rows: logs.map((l) => [
        new Date(l.createdAt).toLocaleString('en-IN'),
        l.userEmail,
        l.userRole,
        l.action,
        l.resource,
        l.ipAddress || '127.0.0.1',
      ]),
      filterSummary: selectedAction ? `Action: ${selectedAction}` : 'All Audit Events',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Security & Clinical Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable event log of all patient records access, logins, diagnoses, and prescriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by email, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="border border-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-w-[160px]"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="RELEASE">RELEASE</option>
          <option value="EXPORT">EXPORT</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Retrieving secure audit records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-800">
                        {log.userEmail}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-700">{log.action}</td>
                      <td className="py-3 px-4 text-slate-600">{log.resource}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono font-semibold">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

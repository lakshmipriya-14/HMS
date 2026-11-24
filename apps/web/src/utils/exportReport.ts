/**
 * Export Utility for Hospital Reports (CSV and Formatted Printable PDF/HTML)
 * Includes official UYIRINAI MULTISPECIALITY HOSPITAL header, timestamp, metadata & details.
 */

export interface ExportReportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  fileName?: string;
  filterSummary?: string;
}

export function exportToCSV(options: ExportReportOptions) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const metadataHeader = [
    `"UYIRINAI MULTISPECIALITY HOSPITAL (கிஜுனா பன்னோக்கு மருத்துவமனை)"`,
    `"Report Title: ${options.title}"`,
    `"Generated On: ${dateStr} at ${timeStr}"`,
    options.filterSummary ? `"Applied Filters / Sorting: ${options.filterSummary}"` : '',
    '""', // Blank line
  ].filter(Boolean).join('\n');

  const csvHeaders = options.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const csvRows = options.rows.map(row =>
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const fullContent = `${metadataHeader}\n${csvHeaders}\n${csvRows}`;

  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${options.fileName || 'report'}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPrintablePDF(options: ExportReportOptions) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.title} - Uyirinai HMS</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
          .logo-title { font-size: 20px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin: 0; }
          .sub-title { font-size: 11px; color: #64748b; margin-top: 4px; }
          .doc-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 12px; }
          .meta { font-size: 10px; color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          th { background-color: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 10px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-title">UYIRINAI MULTISPECIALITY HOSPITAL</div>
            <div class="sub-title">உயிரினை பன்னோக்கு மருத்துவமனை | Excellence in Care, Compassion in Healing</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b;">
            <div>NABH Accredited Apex Center</div>
            <div>License: TN-HOSP-MDU-2026-0042</div>
          </div>
        </div>

        <div class="doc-title">${options.title}</div>
        <div class="meta">
          <strong>Generated Date:</strong> ${dateStr} ${timeStr} |
          ${options.filterSummary ? `<strong>Filters:</strong> ${options.filterSummary}` : '<strong>Scope:</strong> Full Report'}
        </div>

        <table>
          <thead>
            <tr>
              ${options.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${options.rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <span>Official Hospital Management Record | System Audit Verified</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

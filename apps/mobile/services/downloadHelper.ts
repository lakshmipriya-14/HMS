// Universal true file download utility for UYIRINAI Hospital Management System
// Generates genuine, properly aligned CSV and PDF documents with official hospital branding
import { Platform } from 'react-native';

/**
 * Escape string for RFC 4180 CSV compliance
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Builds RFC 4180 compliant CSV string from headers and rows
 */
export function buildCsvContent(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerRow = headers.map(escapeCsvValue).join(',');
  const dataRows = rows.map((row) => row.map(escapeCsvValue).join(','));
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Downloads a CSV file directly to the user's Downloads folder without opening blank tabs
 */
export function downloadCsvFile(filename: string, csvContent: string): boolean {
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  if (typeof document !== 'undefined') {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.target = '_self'; // Prevents opening blank/empty tab
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  return false;
}

/**
 * Escapes characters for PDF text streams (parentheses and backslashes)
 */
function escapePdfText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates an authentic PDF 1.4 binary document with byte-accurate xref table
 */
export function generatePdfDocument(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  meta?: Record<string, string>
): Uint8Array {
  const now = new Date().toLocaleString();
  const hospitalHeader = 'UYIRINAI MULTISPECIALITY HOSPITAL';
  const subHeader = 'EXECUTIVE HEALTHCARE MANAGEMENT & CLINICAL AUDIT REPOSITORY';

  // Construct PDF stream text
  let streamContent = '';
  // Hospital Title
  streamContent += `BT /F1 16 Tf 40 750 Td (${escapePdfText(hospitalHeader)}) Tj ET\n`;
  streamContent += `BT /F2 8 Tf 40 735 Td (${escapePdfText(subHeader)}) Tj ET\n`;

  // Horizontal divider
  streamContent += `0.7 0.1 0.1 RG 1.5 w 40 725 m 572 725 l S\n`;

  // Report Title & Meta
  streamContent += `BT /F1 12 Tf 40 705 Td (${escapePdfText(title.toUpperCase())}) Tj ET\n`;
  streamContent += `BT /F2 9 Tf 40 690 Td (${escapePdfText(`Generated: ${now} | ${subtitle}`)}) Tj ET\n`;

  if (meta) {
    const metaStr = Object.entries(meta)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  |  ');
    streamContent += `BT /F2 8 Tf 40 675 Td (${escapePdfText(metaStr)}) Tj ET\n`;
  }

  // Table header background
  streamContent += `0.93 0.93 0.93 rg 40 645 532 18 re f\n`;
  streamContent += `0.75 0.75 0.75 RG 0.5 w 40 645 532 18 re s\n`;

  // Table headers
  const maxCols = Math.min(headers.length, 6);
  const colWidth = Math.floor(520 / Math.max(1, maxCols));
  let xPos = 45;
  headers.slice(0, maxCols).forEach((h) => {
    streamContent += `BT /F1 8.5 Tf ${xPos} 650 Td (${escapePdfText(h.slice(0, 16))}) Tj ET\n`;
    xPos += colWidth;
  });

  // Table rows (up to 32 rows per page)
  let yPos = 630;
  const maxRows = Math.min(rows.length, 32);
  for (let i = 0; i < maxRows; i++) {
    const row = rows[i];
    // alternating background
    if (i % 2 === 1) {
      streamContent += `0.98 0.98 0.98 rg 40 ${yPos - 4} 532 14 re f\n`;
    }
    // bottom border
    streamContent += `0.9 0.9 0.9 RG 0.5 w 40 ${yPos - 4} 532 14 re s\n`;

    let cellX = 45;
    row.slice(0, maxCols).forEach((val) => {
      const cellText = val === null || val === undefined ? '-' : String(val).slice(0, 18);
      streamContent += `BT /F2 8 Tf ${cellX} ${yPos} Td (${escapePdfText(cellText)}) Tj ET\n`;
      cellX += colWidth;
    });

    yPos -= 16;
  }

  // Footer
  streamContent += `0.8 0.8 0.8 RG 0.5 w 40 40 m 572 40 l S\n`;
  streamContent += `BT /F2 7.5 Tf 40 28 Td (${escapePdfText(
    `Official UYIRINAI HMS Document | Total Records: ${rows.length} | Confidential Healthcare Information`
  )}) Tj ET\n`;

  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(streamContent);
  const streamLen = streamBytes.length;

  const headerBytes = encoder.encode('%PDF-1.4\n');
  const obj1Bytes = encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  const obj2Bytes = encoder.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  const obj3Bytes = encoder.encode(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n'
  );
  const obj4Bytes = encoder.encode('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  const obj5Bytes = encoder.encode('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const streamHead = encoder.encode(`6 0 obj\n<< /Length ${streamLen} >>\nstream\n`);
  const streamFoot = encoder.encode('\nendstream\nendobj\n');

  // Compute exact byte offsets
  const off1 = headerBytes.length;
  const off2 = off1 + obj1Bytes.length;
  const off3 = off2 + obj2Bytes.length;
  const off4 = off3 + obj3Bytes.length;
  const off5 = off4 + obj4Bytes.length;
  const off6 = off5 + obj5Bytes.length;
  const offXref = off6 + streamHead.length + streamBytes.length + streamFoot.length;

  const xrefStr = `xref\n0 7\n0000000000 65535 f \n${String(off1).padStart(10, '0')} 00000 n \n${String(
    off2
  ).padStart(10, '0')} 00000 n \n${String(off3).padStart(10, '0')} 00000 n \n${String(off4).padStart(
    10,
    '0'
  )} 00000 n \n${String(off5).padStart(10, '0')} 00000 n \n${String(off6).padStart(10, '0')} 00000 n \n`;

  const trailerStr = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${offXref}\n%%EOF\n`;
  const xrefBytes = encoder.encode(xrefStr + trailerStr);

  const totalLength = offXref + xrefBytes.length;
  const finalPdf = new Uint8Array(totalLength);

  let ptr = 0;
  finalPdf.set(headerBytes, ptr);
  ptr += headerBytes.length;
  finalPdf.set(obj1Bytes, ptr);
  ptr += obj1Bytes.length;
  finalPdf.set(obj2Bytes, ptr);
  ptr += obj2Bytes.length;
  finalPdf.set(obj3Bytes, ptr);
  ptr += obj3Bytes.length;
  finalPdf.set(obj4Bytes, ptr);
  ptr += obj4Bytes.length;
  finalPdf.set(obj5Bytes, ptr);
  ptr += obj5Bytes.length;

  finalPdf.set(streamHead, ptr);
  ptr += streamHead.length;
  finalPdf.set(streamBytes, ptr);
  ptr += streamBytes.length;
  finalPdf.set(streamFoot, ptr);
  ptr += streamFoot.length;

  finalPdf.set(xrefBytes, ptr);

  return finalPdf;
}

/**
 * Downloads a genuine binary PDF file directly to the user's Downloads folder
 */
export function downloadPdfFile(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  meta?: Record<string, string>
): boolean {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const pdfBytes = generatePdfDocument(title, subtitle, headers, rows, meta);

  if (typeof document !== 'undefined') {
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.target = '_self'; // Prevents opening blank/empty tab
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  return false;
}

/**
 * Escapes characters for HTML output
 */
function escapeHtml(str: any): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Opens a beautifully formatted printable report with hospital letterhead and print/save controls
 * Directly writes document content into the opened window to eliminate blank/empty pages
 */
export function openPrintableReport(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  meta?: Record<string, string>,
  targetWindow?: Window
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const metaHtml = meta
    ? Object.entries(meta)
        .map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`)
        .join('')
    : '';

  const theadHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const tbodyHtml = rows
    .map(
      (row, idx) =>
        `<tr style="background-color: ${idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF'};">` +
        row.map((val) => `<td>${escapeHtml(val === null || val === undefined ? '-' : String(val))}</td>`).join('') +
        `</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - UYIRINAI HMS</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717; margin: 0; padding: 24px; background: #F8FAFC; }
    .report-card { max-width: 1100px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); padding: 28px; border: 1px solid #E2E8F0; }
    .header { border-bottom: 3px solid #B5121B; padding-bottom: 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .hospital-title { color: #B5121B; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
    .hospital-sub { font-size: 11px; color: #64748B; font-weight: 600; margin-top: 3px; letter-spacing: 0.3px; }
    .report-title { font-size: 16px; font-weight: 800; color: #171717; margin-top: 10px; margin-bottom: 2px; }
    .report-sub { font-size: 12px; color: #4B5563; }
    .meta-box { background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 14px; font-size: 11.5px; color: #334155; display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th { background: #B5121B; color: #ffffff; text-align: left; padding: 10px 12px; font-weight: 700; border: 1px solid #991B1B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 9px 12px; border: 1px solid #E2E8F0; color: #1F2937; }
    .footer { margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; }
    .print-bar { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; padding: 12px 18px; border-radius: 10px; border: 1px solid #E2E8F0; max-width: 1100px; margin: 0 auto 16px auto; }
    .btn { background: #B5121B; color: #fff; border: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: #850D14; }
    @media print {
      body { padding: 0; background: #fff; }
      .print-bar { display: none !important; }
      .report-card { box-shadow: none; border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <div style="font-size: 13px; font-weight: 700; color: #171717;">
      Document Preview &mdash; ${escapeHtml(title)}
    </div>
    <button class="btn" onclick="window.print()">
      Print / Save as PDF
    </button>
  </div>
  <div class="report-card">
    <div class="header">
      <div>
        <h1 class="hospital-title">UYIRINAI MULTISPECIALITY HOSPITAL</h1>
        <div class="hospital-sub">HOSPITAL MANAGEMENT SYSTEM</div>
        <div class="report-title">${escapeHtml(title)}</div>
        <div class="report-sub">${escapeHtml(subtitle)}</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748B;">
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
        <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
        <div><strong>Total Records:</strong> ${rows.length}</div>
      </div>
    </div>
    ${metaHtml ? `<div class="meta-box">${metaHtml}</div>` : ''}
    <table>
      <thead><tr>${theadHtml}</tr></thead>
      <tbody>${tbodyHtml}</tbody>
    </table>
    <div class="footer">
      <div>Confidential &bull; Official UYIRINAI Hospital Management System Report</div>
      <div>Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;

  try {
    const printWin = targetWindow ?? window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      return true;
    }
  } catch (e) {
    console.error('Failed to open printable report window:', e);
  }
  return false;
}

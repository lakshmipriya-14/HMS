// Universal true file download utility for UYIRINAI Hospital Management System
// Generates genuine, properly aligned CSV and PDF documents with official hospital branding
import { Platform } from 'react-native';
import * as files from 'expo-file-system';
import * as print from 'expo-print';
import * as sharing from 'expo-sharing';

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
 * Sanitizes text to safe ASCII/WinAnsi and escapes characters for PDF text streams
 */
function sanitizePdfString(str: string): string {
  return String(str ?? '')
    .replace(/₹/g, 'INR ')
    .replace(/[·•]/g, ' | ')
    .replace(/[–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(str: string): string {
  return sanitizePdfString(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapPdfText(text: string, maxChars: number): string[] {
  const clean = sanitizePdfString(text);
  if (!clean) return ['-'];
  if (clean.length <= maxChars) return [clean];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : ['-'];
}

function triggerWebBlobDownload(blob: Blob, safeFilename: string): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function buildMultiPagePdfBytes(pageStreams: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const safeStreams = pageStreams.length > 0 ? pageStreams : [''];
  const pageCount = safeStreams.length;
  // Object IDs: 1=Catalog, 2=Pages, 3=FontBold, 4=FontRegular, then per-page (PageObj, ContentObj)
  const pageIds: number[] = [];
  const objects: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    pageIds.push(5 + i * 2);
  }

  objects.push(encoder.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
  objects.push(
    encoder.encode(
      `2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`
    )
  );
  objects.push(encoder.encode('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'));
  objects.push(encoder.encode('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'));

  for (let i = 0; i < pageCount; i++) {
    const pageId = 5 + i * 2;
    const contentId = pageId + 1;
    const streamBytes = encoder.encode(safeStreams[i]);
    objects.push(
      encoder.encode(
        `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
      )
    );
    const contentHead = encoder.encode(`${contentId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
    const contentFoot = encoder.encode('\nendstream\nendobj\n');
    const combined = new Uint8Array(contentHead.length + streamBytes.length + contentFoot.length);
    combined.set(contentHead, 0);
    combined.set(streamBytes, contentHead.length);
    combined.set(contentFoot, contentHead.length + streamBytes.length);
    objects.push(combined);
  }

  const headerBytes = encoder.encode('%PDF-1.4\n');
  const offsets: number[] = [];
  let cursor = headerBytes.length;
  for (const obj of objects) {
    offsets.push(cursor);
    cursor += obj.length;
  }

  const xrefLines = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.map((off) => `${String(off).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF\n`,
  ];
  const xrefBytes = encoder.encode(xrefLines.join(''));
  const finalPdf = new Uint8Array(cursor + xrefBytes.length);

  let ptr = 0;
  finalPdf.set(headerBytes, ptr);
  ptr += headerBytes.length;
  for (const obj of objects) {
    finalPdf.set(obj, ptr);
    ptr += obj.length;
  }
  finalPdf.set(xrefBytes, ptr);
  return finalPdf;
}

export interface PatientReceiptPdfPayload {
  filename: string;
  receiptId: string;
  documentTitle?: string;
  hospitalName?: string;
  branchName?: string;
  branchLocation?: string;
  branchPhone?: string;
  date?: string;
  status?: string;
  patientName?: string;
  patientUhid?: string;
  patientEmail?: string;
  patientPhone?: string;
  department?: string;
  paymentMethod?: string;
  items: { description: string; detail?: string; amount?: string }[];
  summaryLines?: { label: string; value: string; highlight?: boolean }[];
  notes?: string;
}

function generateReceiptPdfBytes(payload: PatientReceiptPdfPayload): Uint8Array {
  const hospital = payload.hospitalName || 'UYIRINAI MULTISPECIALITY HOSPITAL';
  const branchText = [payload.branchName, payload.branchLocation].filter(Boolean).join(' - ');
  const docTitle = payload.documentTitle || 'OFFICIAL PATIENT PAYMENT RECEIPT';
  const generatedAt = new Date().toLocaleString();

  const pages: string[] = [];
  let s = '';
  let y = 795;

  const drawHeader = (isContinuation: boolean) => {
    s = '';
    // Top brand banner (Medical Blue #1565C0)
    s += `0.08 0.40 0.75 rg 36 742 523 64 re f\n`;
    s += `0.00 0.54 0.48 rg 36 742 523 4 re f\n`;
    s += `1 1 1 rg BT /F1 14 Tf 48 784 Td (${escapePdfText(hospital.toUpperCase())}) Tj ET\n`;
    if (branchText) {
      s += `0.91 0.95 0.99 rg BT /F2 9 Tf 48 768 Td (${escapePdfText(branchText)}) Tj ET\n`;
    }
    if (payload.branchPhone) {
      s += `0.91 0.95 0.99 rg BT /F2 8 Tf 48 754 Td (${escapePdfText(`Helpline: ${payload.branchPhone}`)}) Tj ET\n`;
    }
    s += `0.09 0.19 0.33 rg\n`;
    y = 722;
    s += `BT /F1 12 Tf 36 ${y} Td (${escapePdfText(isContinuation ? `${docTitle} (Cont.)` : docTitle)}) Tj ET\n`;
    s += `BT /F2 8.5 Tf 395 ${y} Td (${escapePdfText(`Ref: ${payload.receiptId}`)}) Tj ET\n`;
    y -= 14;
    s += `0.08 0.40 0.75 RG 1 w 36 ${y} m 559 ${y} l S\n`;
    y -= 16;
  };

  drawHeader(false);

  // Metadata Box
  const metaPairs: [string, string][] = [
    ['Receipt / Ref ID', payload.receiptId],
    ['Date', payload.date || generatedAt.slice(0, 10)],
    ['Patient Name', payload.patientName || 'Patient'],
    ['Patient UHID', payload.patientUhid || '-'],
  ];
  if (payload.patientPhone) metaPairs.push(['Phone', payload.patientPhone]);
  if (payload.patientEmail) metaPairs.push(['Email', payload.patientEmail]);
  if (payload.department) metaPairs.push(['Department', payload.department]);
  if (payload.paymentMethod) metaPairs.push(['Payment Method', payload.paymentMethod]);
  if (payload.status) metaPairs.push(['Status', payload.status]);

  const metaRows = Math.ceil(metaPairs.length / 2);
  const metaHeight = metaRows * 16 + 14;
  s += `0.97 0.98 0.99 rg 36 ${y - metaHeight + 8} 523 ${metaHeight} re f\n`;
  s += `0.89 0.91 0.94 RG 0.6 w 36 ${y - metaHeight + 8} 523 ${metaHeight} re s\n`;
  s += `0.09 0.19 0.33 rg\n`;
  for (let i = 0; i < metaPairs.length; i += 2) {
    const [k1, v1] = metaPairs[i];
    s += `BT /F1 8.5 Tf 46 ${y - 6} Td (${escapePdfText(`${k1}:`)}) Tj ET\n`;
    s += `BT /F2 8.5 Tf 130 ${y - 6} Td (${escapePdfText(v1.slice(0, 26))}) Tj ET\n`;
    if (metaPairs[i + 1]) {
      const [k2, v2] = metaPairs[i + 1];
      s += `BT /F1 8.5 Tf 305 ${y - 6} Td (${escapePdfText(`${k2}:`)}) Tj ET\n`;
      s += `BT /F2 8.5 Tf 390 ${y - 6} Td (${escapePdfText(v2.slice(0, 26))}) Tj ET\n`;
    }
    y -= 16;
  }
  y -= 18;

  // Table Header
  const drawTableHeader = () => {
    s += `0.91 0.95 0.99 rg 36 ${y - 6} 523 20 re f\n`;
    s += `0.75 0.86 0.99 RG 0.5 w 36 ${y - 6} 523 20 re s\n`;
    s += `0.09 0.19 0.33 rg\n`;
    s += `BT /F1 9 Tf 44 ${y} Td (DESCRIPTION / CLINICAL ITEM) Tj ET\n`;
    s += `BT /F1 9 Tf 350 ${y} Td (DETAILS) Tj ET\n`;
    s += `BT /F1 9 Tf 470 ${y} Td (AMOUNT) Tj ET\n`;
    y -= 22;
  };
  drawTableHeader();

  const items = payload.items.length > 0 ? payload.items : [{ description: 'Hospital Services', detail: '-', amount: '-' }];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const descLines = wrapPdfText(item.description, 48);
    const detailLines = wrapPdfText(item.detail || '-', 20);
    const rowLines = Math.max(descLines.length, detailLines.length);
    const rowHeight = rowLines * 12 + 8;

    if (y - rowHeight < 110) {
      s += `0.89 0.91 0.94 RG 0.5 w 36 48 m 559 48 l S\n`;
      s += `0.28 0.33 0.41 rg BT /F2 7.5 Tf 36 35 Td (${escapePdfText(`${hospital} | Generated: ${generatedAt} | Page ${pages.length + 1}`)}) Tj ET\n`;
      pages.push(s);
      drawHeader(true);
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      s += `0.97 0.98 0.99 rg 36 ${y - rowHeight + 10} 523 ${rowHeight} re f\n`;
    }
    s += `0.89 0.91 0.94 RG 0.5 w 36 ${y - rowHeight + 10} 523 ${rowHeight} re s\n`;
    s += `0.09 0.19 0.33 rg\n`;

    for (let l = 0; l < rowLines; l++) {
      const lineY = y - l * 12;
      if (descLines[l]) {
        s += `BT /F2 8.5 Tf 44 ${lineY} Td (${escapePdfText(descLines[l])}) Tj ET\n`;
      }
      if (detailLines[l]) {
        s += `BT /F2 8.5 Tf 350 ${lineY} Td (${escapePdfText(detailLines[l])}) Tj ET\n`;
      }
      if (l === 0 && item.amount) {
        s += `BT /F1 8.5 Tf 470 ${lineY} Td (${escapePdfText(item.amount)}) Tj ET\n`;
      }
    }
    y -= rowHeight;
  }

  // Summary Box
  if (payload.summaryLines && payload.summaryLines.length > 0) {
    const sumHeight = payload.summaryLines.length * 16 + 14;
    if (y - sumHeight < 95) {
      s += `0.89 0.91 0.94 RG 0.5 w 36 48 m 559 48 l S\n`;
      s += `0.28 0.33 0.41 rg BT /F2 7.5 Tf 36 35 Td (${escapePdfText(`${hospital} | Page ${pages.length + 1}`)}) Tj ET\n`;
      pages.push(s);
      drawHeader(true);
    }
    y -= 10;
    s += `0.91 0.95 0.99 rg 300 ${y - sumHeight + 10} 259 ${sumHeight} re f\n`;
    s += `0.08 0.40 0.75 RG 0.8 w 300 ${y - sumHeight + 10} 259 ${sumHeight} re s\n`;
    for (const line of payload.summaryLines) {
      s += line.highlight ? `0.08 0.40 0.75 rg\n` : `0.09 0.19 0.33 rg\n`;
      s += `BT /F1 ${line.highlight ? 10 : 8.5} Tf 312 ${y - 4} Td (${escapePdfText(line.label)}) Tj ET\n`;
      s += `BT /F1 ${line.highlight ? 10 : 8.5} Tf 455 ${y - 4} Td (${escapePdfText(line.value)}) Tj ET\n`;
      y -= 16;
    }
    y -= 12;
  }

  if (payload.notes) {
    const noteLines = wrapPdfText(`Note: ${payload.notes}`, 90);
    s += `0.28 0.33 0.41 rg\n`;
    for (const line of noteLines) {
      if (y < 68) break;
      s += `BT /F2 8 Tf 36 ${y} Td (${escapePdfText(line)}) Tj ET\n`;
      y -= 12;
    }
  }

  // Footer
  s += `0.89 0.91 0.94 RG 0.5 w 36 48 m 559 48 l S\n`;
  s += `0.28 0.33 0.41 rg BT /F2 7.5 Tf 36 35 Td (${escapePdfText(
    `Official ${hospital} Document | Generated: ${generatedAt} | Page ${pages.length + 1}`
  )}) Tj ET\n`;
  pages.push(s);

  return buildMultiPagePdfBytes(pages);
}

function buildReceiptHtml(payload: PatientReceiptPdfPayload): string {
  const hospital = escapeHtml(payload.hospitalName || 'UYIRINAI MULTISPECIALITY HOSPITAL');
  const branchLine = escapeHtml([payload.branchName, payload.branchLocation].filter(Boolean).join(' · '));
  const docTitle = escapeHtml(payload.documentTitle || 'Official Patient Payment Receipt');
  const rowsHtml = (payload.items.length > 0 ? payload.items : [{ description: 'Hospital Services', detail: '-', amount: '-' }])
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF'};">
        <td>${escapeHtml(item.description)}</td>
        <td>${escapeHtml(item.detail || '-')}</td>
        <td style="text-align:right;font-weight:700;">${escapeHtml(item.amount || '-')}</td>
      </tr>`
    )
    .join('');

  const summaryHtml = (payload.summaryLines || [])
    .map(
      (line) => `
      <div class="sum-row ${line.highlight ? 'sum-highlight' : ''}">
        <span>${escapeHtml(line.label)}</span>
        <span>${escapeHtml(line.value)}</span>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(payload.filename)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #183153; margin: 0; padding: 16px; background: #fff; font-size: 12px; }
    .banner { background: #1565C0; border-bottom: 4px solid #00897B; color: #fff; padding: 16px 18px; border-radius: 10px; margin-bottom: 14px; }
    .hosp { font-size: 16px; font-weight: 800; letter-spacing: 0.4px; margin: 0; }
    .branch { font-size: 11px; color: #E8F1FC; margin-top: 4px; }
    .title-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1565C0; padding-bottom: 8px; margin-bottom: 12px; }
    .title { font-size: 14px; font-weight: 800; color: #183153; text-transform: uppercase; }
    .ref { font-size: 11px; font-weight: 700; color: #00897B; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 11px; color: #475569; }
    .meta strong { color: #183153; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #E8F1FC; color: #183153; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; border: 1px solid #E2E8F0; }
    td { padding: 8px 10px; border: 1px solid #E2E8F0; font-size: 11px; vertical-align: top; }
    .summary { margin-left: auto; max-width: 260px; background: #F8FAFC; border: 1px solid #BFDBFE; border-radius: 8px; padding: 10px 12px; }
    .sum-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; font-weight: 600; color: #475569; }
    .sum-highlight { border-top: 1px solid #BFDBFE; margin-top: 4px; padding-top: 6px; font-size: 13px; font-weight: 800; color: #1565C0; }
    .notes { margin-top: 12px; font-size: 10.5px; color: #475569; }
    .footer { margin-top: 18px; border-top: 1px solid #E2E8F0; padding-top: 8px; font-size: 9.5px; color: #64748B; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="banner">
    <h1 class="hosp">${hospital}</h1>
    ${branchLine ? `<div class="branch">${branchLine}</div>` : ''}
    ${payload.branchPhone ? `<div class="branch">Helpline: ${escapeHtml(payload.branchPhone)}</div>` : ''}
  </div>
  <div class="title-row">
    <div class="title">${docTitle}</div>
    <div class="ref">Ref: ${escapeHtml(payload.receiptId)}</div>
  </div>
  <div class="meta">
    <div><strong>Patient:</strong> ${escapeHtml(payload.patientName || 'Patient')}</div>
    <div><strong>UHID:</strong> ${escapeHtml(payload.patientUhid || '-')}</div>
    <div><strong>Date:</strong> ${escapeHtml(payload.date || new Date().toISOString().slice(0, 10))}</div>
    <div><strong>Status:</strong> ${escapeHtml(payload.status || 'PAID')}</div>
    ${payload.patientPhone ? `<div><strong>Phone:</strong> ${escapeHtml(payload.patientPhone)}</div>` : ''}
    ${payload.patientEmail ? `<div><strong>Email:</strong> ${escapeHtml(payload.patientEmail)}</div>` : ''}
    ${payload.department ? `<div><strong>Department:</strong> ${escapeHtml(payload.department)}</div>` : ''}
    ${payload.paymentMethod ? `<div><strong>Payment Method:</strong> ${escapeHtml(payload.paymentMethod)}</div>` : ''}
  </div>
  <table>
    <thead><tr><th>Description</th><th>Details</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  ${summaryHtml ? `<div class="summary">${summaryHtml}</div>` : ''}
  ${payload.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(payload.notes)}</div>` : ''}
  <div class="footer">
    <span>Official ${hospital} Document</span>
    <span>Generated ${escapeHtml(new Date().toLocaleString())}</span>
  </div>
</body>
</html>`;
}

/**
 * Generates and directly downloads a mobile-friendly PDF receipt without opening a new browser tab.
 */
export async function downloadPatientReceiptPdf(payload: PatientReceiptPdfPayload): Promise<void> {
  const safeBase = payload.filename.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Patient_Receipt';
  const safeFilename = safeBase.endsWith('.pdf') ? safeBase : `${safeBase}.pdf`;

  if (Platform.OS === 'web') {
    const pdfBytes = generateReceiptPdfBytes(payload);
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    if (!triggerWebBlobDownload(blob, safeFilename)) {
      throw new Error('Could not start PDF download in this browser.');
    }
    return;
  }

  if (!files.cacheDirectory) {
    throw new Error('Device storage directory is unavailable.');
  }
  const directory = `${files.cacheDirectory}receipts-${Date.now()}/`;
  const targetPath = `${directory}${safeFilename}`;
  let generatedUri: string | undefined;
  await files.makeDirectoryAsync(directory, { intermediates: true });
  try {
    const result = await print.printToFileAsync({ html: buildReceiptHtml(payload) });
    generatedUri = result.uri;
    await files.moveAsync({ from: generatedUri, to: targetPath });
    if (await sharing.isAvailableAsync()) {
      await sharing.shareAsync(targetPath, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: safeFilename,
      });
    } else {
      throw new Error('PDF sharing/saving is unavailable on this device.');
    }
  } finally {
    await files.deleteAsync(directory, { idempotent: true });
    if (generatedUri) await files.deleteAsync(generatedUri, { idempotent: true });
  }
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

  // Horizontal divider (Medical Blue #1565C0)
  streamContent += `0.08 0.40 0.75 RG 1.5 w 40 725 m 572 725 l S\n`;

  // Report Title & Meta
  streamContent += `BT /F1 12 Tf 40 705 Td (${escapePdfText(title.toUpperCase())}) Tj ET\n`;
  streamContent += `BT /F2 9 Tf 40 690 Td (${escapePdfText(`Generated: ${now} | ${subtitle}`)}) Tj ET\n`;

  if (meta) {
    const metaStr = Object.entries(meta)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  |  ');
    streamContent += `BT /F2 8 Tf 40 675 Td (${escapePdfText(metaStr)}) Tj ET\n`;
  }

  // Table header background (Soft Medical Blue)
  streamContent += `0.91 0.95 0.99 rg 40 645 532 18 re f\n`;
  streamContent += `0.75 0.86 0.99 RG 0.5 w 40 645 532 18 re s\n`;

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

/**
 * Universal text/document file downloader
 */
export function downloadFile(options: { filename: string; content: string; mimeType?: string }): boolean {
  if (typeof document !== 'undefined') {
    const blob = new Blob([options.content], { type: options.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename;
    link.target = '_self';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }
  return false;
}


type CsvCell = string | number | boolean | null | undefined;

const credentialFields = /password|secret|token|credential|otp|invitationCode|resetCode/i;

function directoryFields(record: Record<string, unknown>, parent = ''): Record<string, CsvCell> {
  const fields: Record<string, CsvCell> = Object.create(null);
  for (const [key, value] of Object.entries(record)) {
    if (credentialFields.test(key)) continue;
    const path = parent ? `${parent} / ${key}` : key;
    if (Array.isArray(value)) {
      fields[path] = value.map((item) =>
        item && typeof item === 'object' ? JSON.stringify(directoryFields(item)) : String(item ?? '')
      ).join('\n');
    } else if (value && typeof value === 'object') {
      Object.assign(fields, directoryFields(value as Record<string, unknown>, path));
    } else {
      fields[path] = value as CsvCell;
    }
  }
  return fields;
}

export function directoryExportTable(records: Record<string, unknown>[]) {
  const fields = records.map((record) => directoryFields(record));
  const keys = [...new Set(fields.flatMap(Object.keys))];
  const headers = keys.map((field) => field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/(^|\/\s)([a-z])/g, (_, prefix: string, letter: string) => prefix + letter.toUpperCase()));
  return { headers, rows: fields.map((record) => keys.map((key) => record[key])) };
}

export function buildDirectoryPdfHtml(title: string, headers: string[], rows: CsvCell[][], printButton = false) {
  const entries = rows.map((row, index) => {
    const fields = row.map((value, column) => value === null || value === undefined || value === '' ? ''
      : `<tr><th scope="row">${escapeHtml(headers[column])}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    return `<h2>Record ${index + 1}</h2><table><tbody>${fields}</tbody></table>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { color: #183153; font: 11pt Arial, sans-serif; margin: 0; }
    h1 { color: #1565C0; font-size: 15pt; margin: 0 0 8px; }
    h2 { font-size: 11pt; margin: 16px 0 4px; break-after: avoid; color: #183153; }
    header { border-bottom: 2px solid #1565C0; padding-bottom: 10px; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    th, td { border: 1px solid #E2E8F0; font-size: 9pt; padding: 5px 7px;
      text-align: left; vertical-align: top; overflow-wrap: anywhere; white-space: pre-wrap; color: #475569; }
    th { width: 28%; background: #E8F1FC; color: #183153; }
    footer { margin-top: 16px; font-size: 8pt; color: #64748B; }
    @media screen { body { padding: 24px; margin: auto; max-width: 850px; } }
    @media print { button { display: none; } }
  </style></head><body>
  <header><h1>UYIRINAI MULTISPECIALITY HOSPITAL</h1><strong>${escapeHtml(title)}</strong>
  <div>${rows.length} records · ${escapeHtml(new Date().toLocaleDateString())}</div>
  ${printButton ? '<button type="button" onclick="window.print()">Print / Save as PDF</button>' : ''}</header>
  ${entries}<footer>Confidential · Uyirinai Hospital Management System</footer></body></html>`;
}

export async function exportDirectoryFile(
  format: 'csv' | 'pdf', filename: string, title: string, headers: string[], rows: CsvCell[][], preview?: Window
) {
  const csv = () => buildCsvContent(headers, rows.map((row) => row.map((value) =>
    typeof value === 'string' && /^(?:\s*[=+@-]|[\t\r\n])/.test(value) ? "'" + value : value
  )));
  if (Platform.OS === 'web') {
    if (format === 'csv') {
      if (!downloadCsvFile(filename, csv())) throw new Error('Could not download the CSV.');
    } else if (preview) {
      preview.document.open();
      preview.document.write(buildDirectoryPdfHtml(title, headers, rows, true));
      preview.document.close();
      preview.focus();
    } else {
      if (!downloadPdfFile(filename, title, '', headers, rows)) {
        throw new Error('Could not download the PDF.');
      }
    }
    return;
  }

  if (!files.cacheDirectory || !await sharing.isAvailableAsync()) {
    throw new Error('File sharing is unavailable on this device.');
  }
  const directory = files.cacheDirectory + `directory-export-${Date.now()}/`;
  const path = directory + filename + '.' + format;
  let generatedUri: string | undefined;
  await files.makeDirectoryAsync(directory);
  try {
    if (format === 'csv') {
      await files.writeAsStringAsync(path, '\uFEFF' + csv());
    } else {
      const result = await print.printToFileAsync({ html: buildDirectoryPdfHtml(title, headers, rows) });
      generatedUri = result.uri;
      await files.moveAsync({ from: generatedUri, to: path });
    }
    await sharing.shareAsync(path, { mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv' });
  } finally {
    await files.deleteAsync(directory, { idempotent: true });
    if (generatedUri) await files.deleteAsync(generatedUri, { idempotent: true });
  }
}

import jsPDF from 'jspdf';
import { Transaction, MerchantProfile, ReportConfig, ReportSummary, ReportTimeframe, UPI_APPS_CONFIG } from '../types/soundbox';
import { Share } from '@capacitor/share';

/**
 * Clean & mask sender names for privacy when user toggles "Hide sender names"
 */
export function formatCustomerName(name: string, includeSenderNames: boolean): string {
  if (!name || name.trim() === '') {
    return 'UPI Customer';
  }
  if (includeSenderNames) {
    return name;
  }
  // Privacy mode: mask or standardize
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const single = parts[0];
    if (single.length <= 2) return `${single[0]}***`;
    return `${single[0]}***${single[single.length - 1]}`;
  }
  return parts.map(p => (p.length > 1 ? `${p[0]}***` : p)).join(' ');
}

/**
 * Filter transactions based on date timeframe and configuration
 */
export function filterTransactionsForReport(
  transactions: Transaction[],
  config: ReportConfig
): { filtered: Transaction[]; summary: ReportSummary } {
  const now = Date.now();
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  let minTs = 0;
  let maxTs = Number.MAX_SAFE_INTEGER;
  let periodLabel = 'Custom Period';
  let startDateStr = '';
  let endDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  switch (config.timeframe) {
    case 'daily': {
      if (config.startDate) {
        const d = new Date(config.startDate);
        minTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
        maxTs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        periodLabel = `Daily (${new Date(minTs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
        startDateStr = new Date(minTs).toLocaleDateString('en-IN');
        endDateStr = startDateStr;
      } else {
        minTs = startOfToday;
        periodLabel = `Daily (Today, ${today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
        startDateStr = today.toLocaleDateString('en-IN');
        endDateStr = startDateStr;
      }
      break;
    }
    case 'weekly': {
      minTs = now - 7 * ONE_DAY;
      periodLabel = 'Weekly (Past 7 Days)';
      startDateStr = new Date(minTs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      endDateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      break;
    }
    case 'monthly': {
      minTs = now - 30 * ONE_DAY;
      periodLabel = 'Monthly (Past 30 Days)';
      startDateStr = new Date(minTs).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      endDateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      break;
    }
    case 'yearly': {
      // Current year from Jan 1st or past 365 days
      const startOfYear = new Date(today.getFullYear(), 0, 1).getTime();
      minTs = startOfYear;
      periodLabel = `Yearly (${today.getFullYear()})`;
      startDateStr = `01 Jan ${today.getFullYear()}`;
      endDateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      break;
    }
    case 'custom': {
      if (config.startDate) {
        const sd = new Date(config.startDate);
        minTs = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0, 0).getTime();
        startDateStr = sd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (config.endDate) {
        const ed = new Date(config.endDate);
        maxTs = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59, 999).getTime();
        endDateStr = ed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      periodLabel = `Custom Date Range (${startDateStr || 'All Past'} to ${endDateStr})`;
      break;
    }
  }

  // Filter transactions
  const filtered = transactions
    .filter(tx => {
      if (tx.timestamp < minTs || tx.timestamp > maxTs) return false;
      if (config.selectedApp && config.selectedApp !== 'all') {
        if (tx.upiApp !== config.selectedApp) return false;
      }
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // Compute metrics
  const totalAmount = filtered.reduce((acc, tx) => acc + tx.amount, 0);
  const totalCount = filtered.length;
  const averageAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

  // Notification-derived vs bank verified
  let notificationDerivedTotal = 0;
  let notificationDerivedCount = 0;
  let verifiedBankTotal = 0;
  let verifiedBankCount = 0;

  const appStats: Record<string, { total: number; count: number; percentage: number }> = {};

  filtered.forEach(tx => {
    // Treat notification / soundbox intercepted payments as notification-derived
    const isNotification = tx.isNotificationDerived !== false || tx.source === 'notification' || !tx.source;
    if (isNotification) {
      notificationDerivedTotal += tx.amount;
      notificationDerivedCount += 1;
    } else {
      verifiedBankTotal += tx.amount;
      verifiedBankCount += 1;
    }

    if (!appStats[tx.upiApp]) {
      appStats[tx.upiApp] = { total: 0, count: 0, percentage: 0 };
    }
    appStats[tx.upiApp].total += tx.amount;
    appStats[tx.upiApp].count += 1;
  });

  // Calculate percentages
  Object.keys(appStats).forEach(app => {
    appStats[app].percentage = totalAmount > 0 ? Math.round((appStats[app].total / totalAmount) * 100) : 0;
  });

  const summary: ReportSummary = {
    periodLabel,
    startDateStr,
    endDateStr,
    totalAmount,
    totalCount,
    averageAmount,
    appBreakdown: appStats,
    notificationDerivedTotal,
    notificationDerivedCount,
    verifiedBankTotal,
    verifiedBankCount,
    transactions: filtered,
    generatedAt: now,
  };

  return { filtered, summary };
}

/**
 * Generate formatted WhatsApp / SMS text summary
 */
export function generateQuickTextSummary(
  summary: ReportSummary,
  merchant: MerchantProfile,
  includeSenderNames: boolean
): string {
  const generatedTimeStr = new Date(summary.generatedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const appLines = Object.entries(summary.appBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([appId, data]) => {
      const cfg = (UPI_APPS_CONFIG as Record<string, any>)[appId];
      const name = cfg ? cfg.name : appId.toUpperCase();
      return `• ${name}: ₹${data.total.toLocaleString('en-IN')} (${data.count} bills - ${data.percentage}%)`;
    })
    .join('\n');

  // Sample recent transactions (up to 5)
  const recentPreview = summary.transactions.slice(0, 5).map((tx, idx) => {
    const sender = formatCustomerName(tx.customerName, includeSenderNames);
    const time = new Date(tx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${idx + 1}. ₹${tx.amount.toLocaleString('en-IN')} - ${sender} (${tx.upiApp.toUpperCase()}) @ ${time}`;
  }).join('\n');

  const senderNotice = includeSenderNames
    ? '👤 Sender names: Included'
    : '🔒 Sender names: Hidden for customer privacy';

  return `📊 *UPI COLLECTION REPORT - ${merchant.businessName.toUpperCase()}*
🏪 Store: ${merchant.businessName} (${merchant.upiId})
📅 Period: ${summary.periodLabel}
⏱️ Generated: ${generatedTimeStr}
────────────────────────────
💰 *TOTAL COLLECTED: ₹${summary.totalAmount.toLocaleString('en-IN')}*
🧾 *Total Payments:* ${summary.totalCount} transactions
📈 *Average Bill Value:* ₹${summary.averageAmount.toLocaleString('en-IN')}
${senderNotice}

📱 *APP-WISE BREAKDOWN:*
${appLines || '• No transactions recorded in this period'}

⚠️ *VERIFICATION STATUS NOTICE:*
• Notification-Derived: ₹${summary.notificationDerivedTotal.toLocaleString('en-IN')} (${summary.notificationDerivedCount} payments) [UNVERIFIED]
• Bank Settled: ₹${summary.verifiedBankTotal.toLocaleString('en-IN')} (${summary.verifiedBankCount} payments)
*Note:* Totals are derived from device UPI notifications (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay) and are unverified. Please cross-verify with official bank account statements before accounting / tax filing.

${recentPreview ? `📝 *RECENT TRANSACTIONS PREVIEW (5 of ${summary.totalCount}):*\n${recentPreview}\n` : ''}
────────────────────────────
Generated by Soundbox - UPI Mobile Alerts for Android
mysoundbox.in`;
}

/**
 * Generate comprehensive CSV export
 */
export function generateCSVReport(
  summary: ReportSummary,
  merchant: MerchantProfile,
  includeSenderNames: boolean
): string {
  const generatedTimeStr = new Date(summary.generatedAt).toLocaleString('en-IN');
  const lines: string[] = [];

  // Header metadata block
  lines.push(`"BUSINESS NAME","${merchant.businessName.replace(/"/g, '""')}"`);
  lines.push(`"MERCHANT UPI ID","${merchant.upiId.replace(/"/g, '""')}"`);
  lines.push(`"PHONE","${merchant.phone.replace(/"/g, '""')}"`);
  lines.push(`"CITY / CATEGORY","${merchant.city} - ${merchant.category}"`);
  lines.push(`"REPORT PERIOD","${summary.periodLabel}"`);
  lines.push(`"GENERATED AT","${generatedTimeStr}"`);
  lines.push(`"SENDER PRIVACY","${includeSenderNames ? 'Included' : 'Hidden for privacy'}"`);
  lines.push(`"IMPORTANT NOTICE","Totals derived from UPI notification alerts are unverified. Reconcile with bank passbook."`);
  lines.push('');

  // Summary Metrics block
  lines.push(`"SUMMARY METRICS"`);
  lines.push(`"Total Collections (INR)",${summary.totalAmount}`);
  lines.push(`"Total Transactions Count",${summary.totalCount}`);
  lines.push(`"Average Payment Size (INR)",${summary.averageAmount}`);
  lines.push(`"Notification-Derived (Unverified INR)",${summary.notificationDerivedTotal}`);
  lines.push(`"Notification-Derived Count",${summary.notificationDerivedCount}`);
  lines.push(`"Direct Bank Settled (INR)",${summary.verifiedBankTotal}`);
  lines.push('');

  // Detailed Transaction columns
  lines.push(
    `"Sl No","Date","Time","Amount (INR)","Customer / Sender","UPI Application","UTR / Reference No","Status","Verification Source","Notes"`
  );

  summary.transactions.forEach((tx, idx) => {
    const txDate = new Date(tx.timestamp);
    const dateStr = txDate.toLocaleDateString('en-IN');
    const timeStr = txDate.toLocaleTimeString('en-IN');
    const customer = formatCustomerName(tx.customerName, includeSenderNames).replace(/"/g, '""');
    const appName = UPI_APPS_CONFIG[tx.upiApp]?.name || tx.upiApp.toUpperCase();
    const isNotification = tx.isNotificationDerived !== false || tx.source === 'notification' || !tx.source;
    const verificationType = isNotification ? 'Notification-Derived (Unverified)' : 'Bank Settled (Verified)';
    const notes = (tx.note || 'UPI payment confirmation').replace(/"/g, '""');

    lines.push(
      `${idx + 1},"${dateStr}","${timeStr}",${tx.amount},"${customer}","${appName}","${tx.utrNumber}","${tx.status}","${verificationType}","${notes}"`
    );
  });

  lines.push('');
  lines.push(`"DISCLAIMER","This collection statement is automatically compiled by Soundbox from smartphone notifications. Figures labeled as Notification-Derived are unverified and subject to bank settlement."`);

  return lines.join('\r\n');
}

/**
 * Generate official PDF Report Document using jsPDF
 */
export function generatePDFReport(
  summary: ReportSummary,
  merchant: MerchantProfile,
  includeSenderNames: boolean
): { doc: jsPDF; blob: Blob; file: File; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper to add footer with page number
  const addFooter = (pageNum: number, totalPagesPlaceholder: boolean = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('Soundbox - UPI Mobile Alerts • Official Collection Statement', margin, pageHeight - 7);
    const pageText = `Page ${pageNum}`;
    doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 7);
  };

  // 1. TOP BRANDED ACCENT BAR
  doc.setFillColor(109, 40, 217); // Purple 700
  doc.rect(margin, y, contentWidth, 22, 'F');

  // Header Title in Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('UPI COLLECTION STATEMENT & REPORT', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 200, 255);
  doc.text(`Generated by Soundbox • ${summary.periodLabel}`, margin + 6, y + 16);

  // Status Stamp inside top bar
  doc.setFillColor(239, 68, 68); // Red / warning badge
  doc.roundedRect(pageWidth - margin - 46, y + 5, 40, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('UNVERIFIED REPORT', pageWidth - margin - 44, y + 10);
  doc.setFontSize(6.5);
  doc.text('Notification Derived', pageWidth - margin - 43, y + 14);

  y += 26;

  // 2. MERCHANT & REPORT METADATA BOX
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  // Left column: Store Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(merchant.businessName, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Owner: ${merchant.ownerName}  |  Phone: ${merchant.phone}`, margin + 4, y + 12);
  doc.text(`UPI VPA: ${merchant.upiId}  |  ${merchant.category}`, margin + 4, y + 17);
  doc.text(`Location: ${merchant.city}`, margin + 4, y + 22);

  // Right column: Generation details
  const genDateStr = new Date(summary.generatedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Report Details:', pageWidth - margin - 65, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${summary.periodLabel}`, pageWidth - margin - 65, y + 11);
  doc.text(`Generated: ${genDateStr}`, pageWidth - margin - 65, y + 16);
  doc.text(
    `Privacy: ${includeSenderNames ? 'Names Visible' : 'Names Hidden (Masked)'}`,
    pageWidth - margin - 65,
    y + 21
  );

  y += 30;

  // 3. PROMINENT UNVERIFIED NOTIFICATION NOTICE BANNER
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // Amber 800
  doc.text('IMPORTANT: NOTIFICATION-DERIVED TOTALS ARE UNVERIFIED', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // Amber 900
  const noticeText =
    'The collection totals below are compiled from smartphone push alerts (GPay, PhonePe, Paytm, BHIM, Amazon Pay). These records are unverified and subject to final settlement. Always cross-verify with your official bank passbook/statement before accounting or tax submissions.';
  doc.text(doc.splitTextToSize(noticeText, contentWidth - 8), margin + 4, y + 10);

  y += 20;

  // 4. SUMMARY KPI METRIC TILES
  const tileWidth = (contentWidth - 6) / 3;
  const tileHeight = 18;

  // Tile 1: Total Collections
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, y, tileWidth, tileHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('TOTAL COLLECTIONS', margin + 4, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // Emerald 600
  doc.text(`INR ${summary.totalAmount.toLocaleString('en-IN')}`, margin + 4, y + 13);

  // Tile 2: Transaction Count
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin + tileWidth + 3, y, tileWidth, tileHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('PAYMENTS COLLECTED', margin + tileWidth + 7, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(`${summary.totalCount} bills`, margin + tileWidth + 7, y + 13);

  // Tile 3: Average Bill & Notification Source
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin + (tileWidth + 3) * 2, y, tileWidth, tileHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('AVG TICKET / VERIFICATION', margin + (tileWidth + 3) * 2 + 4, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`INR ${summary.averageAmount.toLocaleString('en-IN')}`, margin + (tileWidth + 3) * 2 + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text('[100% Notification Alert]', margin + (tileWidth + 3) * 2 + 4, y + 16);

  y += tileHeight + 6;

  // 5. APP BREAKDOWN ROW
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('UPI Application Share:', margin, y + 1);
  y += 4;

  const appKeys = Object.keys(summary.appBreakdown);
  if (appKeys.length > 0) {
    const appTileWidth = contentWidth / Math.min(appKeys.length, 5);
    appKeys.slice(0, 5).forEach((appId, index) => {
      const info = summary.appBreakdown[appId];
      const cfg = (UPI_APPS_CONFIG as Record<string, any>)[appId];
      const name = cfg ? cfg.name : appId.toUpperCase();
      const ax = margin + index * appTileWidth;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(ax, y, appTileWidth - 2, 11, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(name, ax + 2.5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`INR ${info.total.toLocaleString('en-IN')} (${info.count})`, ax + 2.5, y + 8.5);
    });
    y += 15;
  }

  // 6. TRANSACTION LEDGER TABLE HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Transaction Ledger (${summary.transactions.length} Records):`, margin, y);
  y += 4;

  const drawTableHeader = (currY: number) => {
    doc.setFillColor(71, 85, 105); // Slate 600
    doc.rect(margin, currY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    doc.text('#', margin + 2, currY + 4.5);
    doc.text('Date & Time', margin + 8, currY + 4.5);
    doc.text('Customer / Payer', margin + 42, currY + 4.5);
    doc.text('App', margin + 86, currY + 4.5);
    doc.text('UTR Reference', margin + 108, currY + 4.5);
    doc.text('Source Status', margin + 138, currY + 4.5);
    doc.text('Amount (INR)', pageWidth - margin - 22, currY + 4.5);
  };

  drawTableHeader(y);
  y += 7;

  let pageNum = 1;
  addFooter(pageNum);

  // Render Table Rows
  summary.transactions.forEach((tx, idx) => {
    // Check if new page is needed
    if (y > pageHeight - 20) {
      doc.addPage();
      pageNum++;
      y = margin;
      addFooter(pageNum);
      drawTableHeader(y);
      y += 7;
    }

    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const txDate = new Date(tx.timestamp);
    const dateFormatted = `${txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    const customer = formatCustomerName(tx.customerName, includeSenderNames);
    const appName = UPI_APPS_CONFIG[tx.upiApp]?.name || tx.upiApp.toUpperCase();
    const isNotification = tx.isNotificationDerived !== false || tx.source === 'notification' || !tx.source;
    const sourceLabel = isNotification ? 'Unverified Alert' : 'Bank Settled';

    doc.text(`${idx + 1}`, margin + 2, y + 4.2);
    doc.text(dateFormatted, margin + 8, y + 4.2);
    doc.text(customer.slice(0, 22), margin + 42, y + 4.2);
    doc.text(appName.slice(0, 12), margin + 86, y + 4.2);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(tx.utrNumber.slice(0, 16), margin + 108, y + 4.2);

    doc.setFont('helvetica', isNotification ? 'bold' : 'normal');
    doc.setFontSize(6.5);
    if (isNotification) {
      doc.setTextColor(217, 119, 6); // Amber
    } else {
      doc.setTextColor(16, 185, 129); // Green
    }
    doc.text(sourceLabel, margin + 138, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    const amtStr = `+ ${tx.amount.toLocaleString('en-IN')}`;
    doc.text(amtStr, pageWidth - margin - 22, y + 4.2);

    y += 6;
  });

  // Table summary row
  if (y > pageHeight - 20) {
    doc.addPage();
    pageNum++;
    y = margin;
    addFooter(pageNum);
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL (${summary.totalCount} TRANSACTIONS):`, margin + 8, y + 4.8);
  doc.setTextColor(16, 185, 129);
  doc.text(`INR ${summary.totalAmount.toLocaleString('en-IN')}`, pageWidth - margin - 25, y + 4.8);

  const cleanDateStr = new Date().toISOString().split('T')[0];
  const filename = `Soundbox-${summary.periodLabel.split(' ')[0]}-Report-${cleanDateStr}.pdf`;

  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { doc, blob, file, filename };
}

/**
 * Native Android & Web Share Sheet Handler
 * Invokes Android's native share sheet (WhatsApp, Gmail, Google Drive, Bluetooth, etc.)
 */
export async function shareReportViaNativeSheet(options: {
  title: string;
  text: string;
  file?: File;
  url?: string;
  dialogTitle?: string;
}): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'fallback'; message?: string }> {
  const { title, text, file, url, dialogTitle = 'Share UPI Collection Report' } = options;

  // 1. First attempt: Web Share API with attached File (Native Android Share Sheet)
  if (typeof navigator !== 'undefined' && navigator.share) {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return { success: true, method: 'native', message: 'Shared report via Android system share sheet' };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, method: 'native', message: 'Share dismissed' };
        }
        console.warn('File share failed, falling back to text share:', err);
      }
    }

    // 2. Second attempt: Web Share API with text & URL
    try {
      await navigator.share({
        title,
        text,
        url: url || window.location.href,
      });
      return { success: true, method: 'native', message: 'Shared text via Android system share sheet' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'native', message: 'Share dismissed' };
      }
      console.warn('navigator.share failed, trying Capacitor Share:', err);
    }
  }

  // 3. Third attempt: @capacitor/share plugin for Android native app environment
  try {
    const canCapacitorShare = await Share.canShare();
    if (canCapacitorShare.value) {
      await Share.share({
        title,
        text,
        url: url || window.location.href,
        dialogTitle,
      });
      return { success: true, method: 'native', message: 'Shared via Capacitor share sheet' };
    }
  } catch (e) {
    console.warn('Capacitor share not available:', e);
  }

  // 4. Fallback: Copy quick text summary to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      method: 'clipboard',
      message: 'Report summary copied to clipboard! You can paste into WhatsApp or Gmail.',
    };
  } catch (copyErr) {
    console.warn('Clipboard copy failed:', copyErr);
  }

  return { success: false, method: 'fallback', message: 'Could not open share sheet' };
}

/**
 * Direct WhatsApp Share Helper
 */
export function openWhatsAppShare(text: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/**
 * Direct Gmail / Email Share Helper
 */
export function openGmailShare(subject: string, body: string): void {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}

/**
 * File Download Helper
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

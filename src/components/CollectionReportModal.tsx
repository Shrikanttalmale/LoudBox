import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  FileText,
  FileSpreadsheet,
  Copy,
  Check,
  Calendar,
  Info,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  Eye,
  EyeOff,
  Clock,
  Building2,
  ListFilter,
  Layers,
} from 'lucide-react';
import {
  Transaction,
  MerchantProfile,
  ReportConfig,
  ReportTimeframe,
  UPI_APPS_CONFIG,
  UpiAppId,
} from '../types/soundbox';
import {
  filterTransactionsForReport,
  generateQuickTextSummary,
  generateCSVReport,
  generatePDFReport,
  shareReportViaNativeSheet,
  openWhatsAppShare,
  openGmailShare,
  triggerFileDownload,
  formatCustomerName,
} from '../utils/reportEngine';
import { AppLanguage, t } from '../utils/i18n';

interface CollectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  merchant: MerchantProfile;
  appLanguage?: AppLanguage;
  initialTimeframe?: ReportTimeframe;
}

export const CollectionReportModal: React.FC<CollectionReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  merchant,
  appLanguage = 'mr',
  initialTimeframe = 'weekly',
}) => {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(initialTimeframe);
  const [includeSenderNames, setIncludeSenderNames] = useState<boolean>(true);
  const [selectedApp, setSelectedApp] = useState<UpiAppId | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'transactions' | 'breakdown'>('transactions');

  // Custom date range state
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState<string>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEndDate);

  // Single day picker for daily
  const [singleDayDate, setSingleDayDate] = useState<string>(defaultEndDate);
  const [isSpecificDailyDate, setIsSpecificDailyDate] = useState<boolean>(false);

  // Feedback states
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Build report config
  const reportConfig: ReportConfig = useMemo(() => {
    return {
      timeframe,
      startDate: timeframe === 'daily' && isSpecificDailyDate ? singleDayDate : timeframe === 'custom' ? customStartDate : undefined,
      endDate: timeframe === 'daily' && isSpecificDailyDate ? singleDayDate : timeframe === 'custom' ? customEndDate : undefined,
      includeSenderNames,
      selectedApp,
    };
  }, [timeframe, isSpecificDailyDate, singleDayDate, customStartDate, customEndDate, includeSenderNames, selectedApp]);

  // Compute filtered summary
  const { summary } = useMemo(() => {
    return filterTransactionsForReport(transactions, reportConfig);
  }, [transactions, reportConfig]);

  if (!isOpen) return null;

  const showToast = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  const handleNativeShare = async () => {
    setIsExportingPdf(true);
    try {
      const { file } = generatePDFReport(summary, merchant, includeSenderNames);
      const textSummary = generateQuickTextSummary(summary, merchant, includeSenderNames);

      const result = await shareReportViaNativeSheet({
        title: `${merchant.businessName} - ${summary.periodLabel}`,
        text: textSummary,
        file,
        dialogTitle: 'Share Statement',
      });

      if (result.method === 'clipboard') {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        showToast('Text copied to clipboard');
      } else if (result.success) {
        showToast('Statement shared');
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('Sharing cancelled');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    const textSummary = generateQuickTextSummary(summary, merchant, includeSenderNames);
    openWhatsAppShare(textSummary);
    showToast('Opening WhatsApp');
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      const { blob, filename } = generatePDFReport(summary, merchant, includeSenderNames);
      triggerFileDownload(blob, filename);
      showToast('PDF downloaded');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Error generating PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCSVReport(summary, merchant, includeSenderNames);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const cleanDateStr = new Date().toISOString().split('T')[0];
    const filename = `Statement-${summary.periodLabel.split(' ')[0]}-${cleanDateStr}.csv`;
    triggerFileDownload(blob, filename);
    showToast('CSV downloaded');
  };

  const handleCopyText = async () => {
    const textSummary = generateQuickTextSummary(summary, merchant, includeSenderNames);
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopySuccess(true);
      showToast('Summary copied');
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      showToast('Failed to copy');
    }
  };

  const timeTabs: { id: ReportTimeframe; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-base text-white tracking-tight">
              Collection Statement
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span>{merchant.businessName}</span>
              <span aria-hidden="true">·</span>
              <span>{summary.periodLabel}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FEEDBACK TOAST */}
        {actionFeedback && (
          <div className="bg-slate-800 text-emerald-400 border-b border-slate-700/80 px-4 py-2 text-xs font-medium flex items-center justify-center gap-1.5 animate-in slide-in-from-top duration-150">
            <Check className="w-3.5 h-3.5" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          
          {/* PERIOD SELECTOR */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-0.5">
              <span>Report Period</span>
              {timeframe === 'daily' && (
                <button
                  onClick={() => setIsSpecificDailyDate(!isSpecificDailyDate)}
                  className="text-indigo-400 hover:text-indigo-300 transition text-[11px] cursor-pointer"
                >
                  {isSpecificDailyDate ? 'Reset to Today' : 'Change date'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
              {timeTabs.map((tab) => {
                const isActive = timeframe === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setTimeframe(tab.id);
                      if (tab.id !== 'daily') setIsSpecificDailyDate(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition cursor-pointer font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Daily date picker if toggled */}
            {timeframe === 'daily' && isSpecificDailyDate && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs mt-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Select Date
                </span>
                <input
                  type="date"
                  value={singleDayDate}
                  onChange={(e) => setSingleDayDate(e.target.value)}
                  max={defaultEndDate}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Custom date range picker */}
            {timeframe === 'custom' && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2 mt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Start Date</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate || defaultEndDate}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">End Date</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      max={defaultEndDate}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Presets:</span>
                  <button
                    onClick={() => {
                      const now = Date.now();
                      setCustomStartDate(new Date(now - 7 * 86400000).toISOString().split('T')[0]);
                      setCustomEndDate(defaultEndDate);
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    7 Days
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => {
                      const now = Date.now();
                      setCustomStartDate(new Date(now - 30 * 86400000).toISOString().split('T')[0]);
                      setCustomEndDate(defaultEndDate);
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    30 Days
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => {
                      const d = new Date();
                      setCustomStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
                      setCustomEndDate(defaultEndDate);
                    }}
                    className="hover:text-white transition cursor-pointer"
                  >
                    This Month
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MAIN SUMMARY STAT CARD */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Total Collections</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white mt-0.5 tracking-tight">
                  ₹{summary.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Volume</span>
                <div className="text-sm font-semibold text-slate-200 mt-0.5 font-mono tabular-nums">
                  {summary.totalCount} {summary.totalCount === 1 ? 'payment' : 'payments'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                Average ticket:
                <strong className="text-slate-200 font-mono font-medium">
                  ₹{summary.averageAmount.toLocaleString('en-IN')}
                </strong>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {summary.transactions.length > 0 ? 'Device alert totals' : 'No records'}
              </span>
            </div>

            {/* Proportion Bar for UPI Apps */}
            {summary.totalAmount > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  {Object.entries(summary.appBreakdown).map(([appId, data]) => {
                    if (data.percentage <= 0) return null;
                    const color =
                      appId === 'gpay'
                        ? 'bg-blue-500'
                        : appId === 'phonepe'
                        ? 'bg-purple-500'
                        : appId === 'paytm'
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500';
                    return (
                      <div
                        key={appId}
                        style={{ width: `${data.percentage}%` }}
                        className={`${color} h-full transition-all`}
                        title={`${appId}: ${data.percentage}%`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                  {Object.entries(summary.appBreakdown).map(([appId, data]) => {
                    if (data.count === 0) return null;
                    const cfg = (UPI_APPS_CONFIG as Record<string, any>)[appId];
                    const dotColor =
                      appId === 'gpay'
                        ? 'bg-blue-400'
                        : appId === 'phonepe'
                        ? 'bg-purple-400'
                        : appId === 'paytm'
                        ? 'bg-cyan-400'
                        : 'bg-emerald-400';
                    return (
                      <span key={appId} className="flex items-center gap-1.5 font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span>{cfg?.name || appId}</span>
                        <span className="text-slate-500">{data.percentage}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SENDER NAMES PRIVACY TOGGLE */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              {includeSenderNames ? (
                <Eye className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-200 block truncate">
                  Customer Names in Statement
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {includeSenderNames ? 'Names visible in export' : 'Masked for privacy (e.g. R*** S***)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={includeSenderNames}
              onClick={() => setIncludeSenderNames(!includeSenderNames)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeSenderNames ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  includeSenderNames ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SUB-TABS: TRANSACTIONS VS BREAKDOWN */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`pb-2 border-b-2 transition cursor-pointer ${
                    activeTab === 'transactions'
                      ? 'border-indigo-500 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Transactions ({summary.transactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('breakdown')}
                  className={`pb-2 border-b-2 transition cursor-pointer ${
                    activeTab === 'breakdown'
                      ? 'border-indigo-500 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Breakdown & Verification
                </button>
              </div>
            </div>

            {/* TAB CONTENT: TRANSACTIONS LIST */}
            {activeTab === 'transactions' && (
              <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl bg-slate-950/60 border border-slate-800 p-2">
                {summary.transactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No transactions recorded for this period.
                  </div>
                ) : (
                  summary.transactions.map((tx, idx) => {
                    const customerDisplay = formatCustomerName(tx.customerName, includeSenderNames);
                    return (
                      <div
                        key={tx.id}
                        className="py-2 px-2.5 rounded-lg hover:bg-slate-900/60 flex items-center justify-between text-xs transition border-b border-slate-800/40 last:border-b-0"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white truncate max-w-[140px] sm:max-w-[180px]">
                              {customerDisplay}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono uppercase">
                              {tx.upiApp}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 font-mono">
                            <span>
                              {new Date(tx.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>UTR: {tx.utrNumber.slice(-6)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-semibold font-mono tabular-nums text-emerald-400 block text-xs sm:text-sm">
                            + ₹{tx.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: BREAKDOWN & NOTICE */}
            {activeTab === 'breakdown' && (
              <div className="flex flex-col gap-3 rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs">
                {/* Apps list */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Distribution by UPI App
                  </span>
                  {Object.entries(summary.appBreakdown).map(([appId, data]) => {
                    const cfg = (UPI_APPS_CONFIG as Record<string, any>)[appId];
                    return (
                      <div
                        key={appId}
                        className="flex items-center justify-between py-1 text-xs border-b border-slate-800/40 last:border-b-0"
                      >
                        <span className="text-slate-300 font-medium">{cfg?.name || appId}</span>
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-white font-semibold">
                            ₹{data.total.toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-500 text-[11px] ml-2">
                            ({data.count} bills · {data.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quiet, respectful disclosure */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-300 font-medium block mb-0.5">
                      Notification-Derived Statement Notice
                    </span>
                    These totals are compiled from device notification alerts. Please reconcile with your official bank passbook for accounting or tax purposes.
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1">
                      <span>Device alerts: ₹{summary.notificationDerivedTotal.toLocaleString('en-IN')}</span>
                      <span aria-hidden="true">·</span>
                      <span>Bank settled: ₹{summary.verifiedBankTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER: SIMPLIFIED ACTIONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2.5 shrink-0">
          {/* PRIMARY SHARE CTA */}
          <button
            onClick={handleNativeShare}
            disabled={isExportingPdf}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>{isExportingPdf ? 'Preparing statement...' : 'Share Statement'}</span>
          </button>

          {/* SECONDARY ROW: UNIFIED ACTION GROUP */}
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="py-2 px-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Download PDF statement"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>PDF</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="py-2 px-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Download CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Share summary to WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2 px-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Copy text summary to clipboard"
            >
              {copySuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copySuccess ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

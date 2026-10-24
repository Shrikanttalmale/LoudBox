import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  ArrowUpDown, 
  Download, 
  Share2, 
  Volume2, 
  TrendingUp, 
  ChevronRight,
  Filter,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldAlert,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { Transaction, MerchantProfile, UPI_APPS_CONFIG, ReportTimeframe } from '../types/soundbox';
import { AudioSettings, announcePaymentAlert, unlockAudioContext } from '../utils/audioEngine';
import { AppLanguage, t } from '../utils/i18n';
import { CollectionReportModal } from './CollectionReportModal';
import { formatCustomerName } from '../utils/reportEngine';

const DailyRevenueChart = React.lazy(() =>
  import('./DailyRevenueChart').then((m) => ({ default: m.DailyRevenueChart }))
);

interface CollectionsScreenProps {
  merchant: MerchantProfile;
  transactions: Transaction[];
  audioSettings: AudioSettings;
  setIsSpeaking: (speaking: boolean) => void;
  appLanguage?: AppLanguage;
}

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({
  merchant,
  transactions,
  audioSettings,
  setIsSpeaking,
  appLanguage = 'mr',
}) => {
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom'>('Daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'amount_high' | 'amount_low'>('newest');

  // Custom date range state
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState<string>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEndDate);

  // Privacy toggle for masking customer names on screen
  const [hideSenderNames, setHideSenderNames] = useState<boolean>(false);

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportModalTimeframe, setReportModalTimeframe] = useState<ReportTimeframe>('daily');

  // Show/hide unverified notification explanation
  const [showUnverifiedNotice, setShowUnverifiedNotice] = useState<boolean>(false);

  // Filter & sort transactions by timeframe and search/sort criteria
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const todayDate = new Date();
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    const startOfYear = new Date(todayDate.getFullYear(), 0, 1).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    return transactions
      .filter((tx) => {
        // Timeframe filter
        if (activeTab === 'Daily') {
          if (tx.timestamp < todayStart) return false;
        } else if (activeTab === 'Weekly') {
          if (tx.timestamp < now - 7 * ONE_DAY) return false;
        } else if (activeTab === 'Monthly') {
          if (tx.timestamp < now - 30 * ONE_DAY) return false;
        } else if (activeTab === 'Yearly') {
          if (tx.timestamp < startOfYear) return false;
        } else if (activeTab === 'Custom') {
          if (customStartDate) {
            const sd = new Date(customStartDate);
            const minTs = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate(), 0, 0, 0, 0).getTime();
            if (tx.timestamp < minTs) return false;
          }
          if (customEndDate) {
            const ed = new Date(customEndDate);
            const maxTs = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate(), 23, 59, 59, 999).getTime();
            if (tx.timestamp > maxTs) return false;
          }
        }

        // Text search filter
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          tx.customerName.toLowerCase().includes(q) ||
          tx.utrNumber.toLowerCase().includes(q) ||
          tx.upiApp.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'amount_high') return b.amount - a.amount;
        if (sortBy === 'amount_low') return a.amount - b.amount;
        return b.timestamp - a.timestamp;
      });
  }, [transactions, activeTab, customStartDate, customEndDate, searchQuery, sortBy]);

  // Map activeTab to chart timeframe
  const chartTimeframe = useMemo(() => {
    if (activeTab === 'Monthly') return '30D';
    if (activeTab === 'Yearly' || activeTab === 'Custom') return 'till_date';
    return '7D';
  }, [activeTab]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredTransactions]);

  // Calculate notification-derived totals vs bank verified
  const { notificationTotal, notificationCount, bankVerifiedTotal, bankVerifiedCount } = useMemo(() => {
    let nTot = 0;
    let nCount = 0;
    let bTot = 0;
    let bCount = 0;
    filteredTransactions.forEach(tx => {
      const isNotif = tx.isNotificationDerived !== false || tx.source === 'notification' || !tx.source;
      if (isNotif) {
        nTot += tx.amount;
        nCount += 1;
      } else {
        bTot += tx.amount;
        bCount += 1;
      }
    });
    return {
      notificationTotal: nTot,
      notificationCount: nCount,
      bankVerifiedTotal: bTot,
      bankVerifiedCount: bCount,
    };
  }, [filteredTransactions]);

  // Breakdown by UPI app for the current filtered timeframe
  const appBreakdown = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    filteredTransactions.forEach((tx) => {
      if (!stats[tx.upiApp]) {
        stats[tx.upiApp] = { total: 0, count: 0 };
      }
      stats[tx.upiApp].total += tx.amount;
      stats[tx.upiApp].count += 1;
    });
    return stats;
  }, [filteredTransactions]);

  const handleReplay = (tx: Transaction) => {
    unlockAudioContext();
    announcePaymentAlert(tx.amount, tx.upiApp, audioSettings, tx.customerName, setIsSpeaking);
  };

  const openReportWithCurrentTab = () => {
    let tf: ReportTimeframe = 'daily';
    if (activeTab === 'Weekly') tf = 'weekly';
    else if (activeTab === 'Monthly') tf = 'monthly';
    else if (activeTab === 'Yearly') tf = 'yearly';
    else if (activeTab === 'Custom') tf = 'custom';
    setReportModalTimeframe(tf);
    setIsReportModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      {/* Top Title & Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-white tracking-tight">{merchant.businessName}</h2>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t(appLanguage, 'online_live_sync')}</span>
          </div>
        </div>

        <div>
          <button
            onClick={openReportWithCurrentTab}
            title="Open Collection Statement & Export"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statement</span>
          </button>
        </div>
      </div>

      {/* Tabs: Daily / Weekly / Monthly / Yearly / Custom */}
      <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
        {[
          { id: 'Daily', label: t(appLanguage, 'filter_daily') },
          { id: 'Weekly', label: t(appLanguage, 'filter_weekly') },
          { id: 'Monthly', label: t(appLanguage, 'filter_monthly') },
          { id: 'Yearly', label: 'Yearly' },
          { id: 'Custom', label: t(appLanguage, 'filter_till_date') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center text-[11px] sm:text-xs ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inline Date Range Picker for Custom Tab */}
      {activeTab === 'Custom' && (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Custom Date Range Filter
            </span>
            <span className="text-[10px] text-slate-400">
              {filteredTransactions.length} records found
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={customEndDate || defaultEndDate}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={defaultEndDate}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Collection Amount Banner with CLEAR UNVERIFIED NOTIFICATION LABEL */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-purple-300">
            {activeTab === 'Daily'
              ? t(appLanguage, 'collection_today')
              : activeTab === 'Weekly'
              ? t(appLanguage, 'collection_7d')
              : activeTab === 'Monthly'
              ? t(appLanguage, 'collection_30d')
              : activeTab === 'Yearly'
              ? 'Yearly Collections'
              : 'Custom Period Collections'}
          </span>
          <span className="text-[11px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-700/40">
            {activeTab === 'Daily'
              ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : `${filteredTransactions.length} ${t(appLanguage, 'bills_count')}`}
          </span>
        </div>

        {/* Amount & Status Badge */}
        <div className="flex items-baseline justify-between flex-wrap gap-2 my-1">
          <span className="text-4xl font-black font-mono tracking-tight text-white">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>

          {/* CLEAR UNVERIFIED NOTIFICATION BADGE */}
          <div className="flex items-center gap-1.5">
            <span 
              onClick={() => setShowUnverifiedNotice(!showUnverifiedNotice)}
              className="text-xs text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition"
              title="Click to learn about unverified notification-derived totals"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Unverified (Notification-derived)</span>
              <Info className="w-3 h-3 text-amber-400/80" />
            </span>
          </div>
        </div>

        {/* Collapsible Info Note on Unverified Totals */}
        {showUnverifiedNotice && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/30 text-[11px] text-amber-200 leading-relaxed animate-in fade-in">
            <strong>⚠️ Why are totals labeled Unverified?</strong>
            <p className="mt-0.5 text-slate-300">
              Soundbox detects payment alerts from device notifications (GPay, PhonePe, Paytm, BHIM, Amazon Pay).
              While accurate for immediate store voice chimes, these totals have not been cross-verified with bank gateway settlement.
              Always reconcile with your official bank statement before filing taxes or financial accounts.
            </p>
          </div>
        )}

        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span>{filteredTransactions.length} {t(appLanguage, 'payments_collected')}</span>
          <span>{t(appLanguage, 'avg_label')}: ₹{filteredTransactions.length ? Math.round(totalAmount / filteredTransactions.length) : 0} / {t(appLanguage, 'bills_count')}</span>
        </div>

        {/* DIRECT ACTION: EXPORT & SHARE BUTTON INSIDE BANNER */}
        <button
          onClick={openReportWithCurrentTab}
          className="w-full mt-3 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-purple-300" />
          <span>Generate Statement & Share (PDF, CSV, Android Share Sheet)</span>
          <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>

      {/* App Breakdown Badges */}
      <div className="grid grid-cols-4 gap-2">
        {(['gpay', 'phonepe', 'paytm', 'bhim'] as const).map((appId) => {
          const cfg = UPI_APPS_CONFIG[appId];
          const data = appBreakdown[appId] || { total: 0, count: 0 };
          return (
            <div
              key={appId}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-center text-center"
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white mb-1 ${
                appId === 'gpay' ? 'bg-blue-600' :
                appId === 'phonepe' ? 'bg-purple-600' :
                appId === 'paytm' ? 'bg-cyan-600' : 'bg-emerald-600'
              }`}>
                {cfg.badge}
              </div>
              <span className="text-[11px] font-bold font-mono text-slate-200">
                ₹{data.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-slate-500">{data.count} {t(appLanguage, 'bills_count')}</span>
            </div>
          );
        })}
      </div>

      {/* Revenue & Volume Summary Chart (Recharts) */}
      <React.Suspense fallback={
        <div className="h-40 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-xs text-slate-500">
          {t(appLanguage, 'loading_chart')}
        </div>
      }>
        <DailyRevenueChart 
          transactions={transactions} 
          initialTimeframe={chartTimeframe}
          appLanguage={appLanguage}
          onTimeframeChange={(tf) => {
            if (tf === '7D') setActiveTab('Weekly');
            else if (tf === '30D') setActiveTab('Monthly');
            else if (tf === 'till_date') setActiveTab('Custom');
          }}
        />
      </React.Suspense>

      {/* Search, Sort and Privacy Toggle Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(appLanguage, 'search_tx_placeholder')}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Sender Name Privacy Toggle */}
        <button
          onClick={() => setHideSenderNames(!hideSenderNames)}
          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
            hideSenderNames
              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
          title={hideSenderNames ? "Sender names are hidden (Click to show)" : "Hide sender names for privacy"}
        >
          {hideSenderNames ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort transactions"
          className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="newest">{t(appLanguage, 'sort_newest')}</option>
          <option value="amount_high">{t(appLanguage, 'sort_highest')}</option>
          <option value="amount_low">{t(appLanguage, 'sort_lowest')}</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>{t(appLanguage, 'tab_collections')} ({filteredTransactions.length})</span>
          <span className="text-[10px] text-amber-400 font-medium">⚠️ Notification-Derived (Unverified)</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            {t(appLanguage, 'no_transactions_found')}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const appConfig = UPI_APPS_CONFIG[tx.upiApp] || UPI_APPS_CONFIG.paytm;
            const customerDisplayName = formatCustomerName(tx.customerName, !hideSenderNames);
            const initials = customerDisplayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const isNotification = tx.isNotificationDerived !== false || tx.source === 'notification' || !tx.source;

            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/30 rounded-2xl p-3 flex items-center justify-between transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {initials || 'UPI'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate max-w-[140px] sm:max-w-[200px]">
                        {customerDisplayName}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">• {tx.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">UTR: {tx.utrNumber}</span>
                      <span className="text-[10px] text-purple-400 font-medium">{t(appLanguage, 'via_app')} {appConfig.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        isNotification
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isNotification ? 'Unverified Alert' : 'Bank Settled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm text-emerald-400 block leading-tight">
                      + ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-500 flex items-center justify-end gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {t(appLanguage, 'paid_status')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleReplay(tx)}
                    title="Play voice confirmation alert"
                    className="w-8 h-8 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collection Report & Sharing Modal */}
      <CollectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        transactions={transactions}
        merchant={merchant}
        appLanguage={appLanguage}
        initialTimeframe={reportModalTimeframe}
      />
    </div>
  );
};

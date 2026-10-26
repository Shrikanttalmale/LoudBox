import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Volume2, 
  FileText,
  Eye,
  EyeOff,
  Filter,
  X,
  Share2,
  ChevronDown,
  ChevronUp,
  BarChart2
} from 'lucide-react';
import { 
  Transaction, 
  MerchantProfile, 
  UPI_APPS_CONFIG, 
  UpiAppId 
} from '../types/loudbox';
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
  initialProvider?: UpiAppId | 'all';
}

interface ProviderFilterItem {
  id: UpiAppId | 'all';
  name: string;
  badge: string;
  bg: string;
}

const PROVIDERS: ProviderFilterItem[] = [
  { id: 'all', name: 'All Apps', badge: 'All', bg: 'bg-indigo-600' },
  { id: 'gpay', name: 'Google Pay', badge: 'G', bg: 'bg-blue-600' },
  { id: 'phonepe', name: 'PhonePe', badge: 'Ph', bg: 'bg-purple-600' },
  { id: 'paytm', name: 'Paytm', badge: 'P', bg: 'bg-cyan-600' },
  { id: 'bhim', name: 'BHIM UPI', badge: 'B', bg: 'bg-emerald-600' },
  { id: 'amazonpay', name: 'Amazon Pay', badge: 'A', bg: 'bg-amber-600' },
  { id: 'cred', name: 'Cred UPI', badge: 'Cr', bg: 'bg-zinc-700' },
  { id: 'mobikwik', name: 'MobiKwik', badge: 'M', bg: 'bg-sky-600' },
];

export const CollectionsScreen: React.FC<CollectionsScreenProps> = ({
  merchant,
  transactions,
  audioSettings,
  setIsSpeaking,
  appLanguage = 'mr',
  initialProvider = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'All'>('Daily');
  const [selectedProvider, setSelectedProvider] = useState<UpiAppId | 'all'>(initialProvider);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'amount_high' | 'amount_low' | 'provider'>('newest');
  const [hideSenderNames, setHideSenderNames] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);

  // Timeframe transactions
  const timeframeTransactions = useMemo(() => {
    const now = Date.now();
    const todayDate = new Date();
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    return transactions.filter((tx) => {
      if (activeTab === 'Daily') {
        if (tx.timestamp < todayStart) return false;
      } else if (activeTab === 'Weekly') {
        if (tx.timestamp < now - 7 * ONE_DAY) return false;
      } else if (activeTab === 'Monthly') {
        if (tx.timestamp < now - 30 * ONE_DAY) return false;
      }
      return true;
    });
  }, [transactions, activeTab]);

  // Provider totals & counts in active timeframe
  const providerStats = useMemo<Record<string, { total: number; count: number }>>(() => {
    const stats: Record<string, { total: number; count: number }> = {
      all: { total: 0, count: 0 },
      gpay: { total: 0, count: 0 },
      phonepe: { total: 0, count: 0 },
      paytm: { total: 0, count: 0 },
      bhim: { total: 0, count: 0 },
      amazonpay: { total: 0, count: 0 },
      cred: { total: 0, count: 0 },
      mobikwik: { total: 0, count: 0 },
    };

    timeframeTransactions.forEach((tx) => {
      const app = tx.upiApp || 'paytm';
      if (!stats[app]) {
        stats[app] = { total: 0, count: 0 };
      }
      stats[app].total += tx.amount;
      stats[app].count += 1;
      stats.all.total += tx.amount;
      stats.all.count += 1;
    });

    return stats;
  }, [timeframeTransactions]);

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    return timeframeTransactions
      .filter((tx) => {
        if (selectedProvider !== 'all' && tx.upiApp !== selectedProvider) {
          return false;
        }

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
        if (sortBy === 'provider') return a.upiApp.localeCompare(b.upiApp);
        return b.timestamp - a.timestamp;
      });
  }, [timeframeTransactions, selectedProvider, searchQuery, sortBy]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredTransactions]);

  const avgTicket = useMemo(() => {
    return filteredTransactions.length ? Math.round(totalAmount / filteredTransactions.length) : 0;
  }, [totalAmount, filteredTransactions.length]);

  const chartTimeframe = useMemo(() => {
    if (activeTab === 'Monthly') return '30D';
    if (activeTab === 'All') return 'till_date';
    return '7D';
  }, [activeTab]);

  const handleReplay = (tx: Transaction) => {
    unlockAudioContext();
    announcePaymentAlert(tx.amount, tx.upiApp, audioSettings, tx.customerName, setIsSpeaking);
  };

  const openReport = (provider?: UpiAppId | 'all') => {
    if (provider) {
      setSelectedProvider(provider);
    }
    setIsReportModalOpen(true);
  };

  const activeProvider = selectedProvider !== 'all'
    ? PROVIDERS.find((p) => p.id === selectedProvider)
    : null;

  const getAppBadgeColor = (appId: string) => {
    switch (appId) {
      case 'gpay': return 'bg-blue-600';
      case 'phonepe': return 'bg-purple-600';
      case 'paytm': return 'bg-cyan-600';
      case 'bhim': return 'bg-emerald-600';
      case 'amazonpay': return 'bg-amber-600';
      case 'cred': return 'bg-zinc-700';
      case 'mobikwik': return 'bg-sky-600';
      default: return 'bg-indigo-600';
    }
  };

  const timeframeLabels: Record<string, string> = {
    Daily: t(appLanguage, 'filter_daily'),
    Weekly: t(appLanguage, 'filter_weekly'),
    Monthly: t(appLanguage, 'filter_monthly'),
    All: t(appLanguage, 'filter_till_date'),
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-100 max-w-lg mx-auto w-full">
      {/* 1. CLEAN HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base text-white tracking-tight">{t(appLanguage, 'tab_collections')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{merchant.businessName}</p>
        </div>

        <button
          onClick={() => openReport(selectedProvider)}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:shadow-purple-500/20"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t(appLanguage, 'statement_btn')}</span>
        </button>
      </div>

      {/* 2. SEGMENTED TIMEFRAME SELECTOR */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        {(['Daily', 'Weekly', 'Monthly', 'All'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-center ${
              activeTab === tab
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {timeframeLabels[tab]}
          </button>
        ))}
      </div>

      {/* 3. SIMPLIFIED HERO SUMMARY CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {activeProvider
                ? `${activeProvider.name}`
                : activeTab === 'Daily'
                ? t(appLanguage, 'collection_today')
                : `${timeframeLabels[activeTab]} Total`}
            </span>
            {activeProvider && (
              <button
                onClick={() => setSelectedProvider('all')}
                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/30 transition cursor-pointer"
                title="Clear provider filter"
              >
                <span>Filtered</span>
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {activeProvider && (
            <button
              onClick={() => openReport(selectedProvider)}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>Share statement</span>
            </button>
          )}
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
          ₹{totalAmount.toLocaleString('en-IN')}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <span>{filteredTransactions.length} payments</span>
          <span>Avg ₹{avgTicket} / payment</span>
        </div>
      </div>

      {/* 4. UNIFIED PAYMENT PROVIDER FILTER (Single, intuitive strip) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
          <span className="flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3 text-purple-400" />
            <span>Filter by App</span>
          </span>
          {selectedProvider !== 'all' ? (
            <button
              onClick={() => setSelectedProvider('all')}
              className="text-purple-400 hover:text-purple-300 text-[11px] font-medium cursor-pointer"
            >
              Reset to all
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Tap to filter payments</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {PROVIDERS.map((p) => {
            const isSelected = selectedProvider === p.id;
            const stats = providerStats[p.id] || { total: 0, count: 0 };
            const hasData = stats.count > 0;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(isSelected && p.id !== 'all' ? 'all' : p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-400 font-medium shadow-sm ring-1 ring-purple-400/40'
                    : hasData
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                    : 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-60 hover:opacity-100'
                }`}
              >
                <span className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${p.bg}`}>
                  {p.badge}
                </span>
                <span className="whitespace-nowrap font-medium">{p.name}</span>
                <span className={`font-mono text-[11px] tabular-nums ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                  ₹{stats.total.toLocaleString('en-IN')}
                </span>
                {stats.count > 0 && (
                  <span className={`text-[10px] px-1 rounded font-mono ${
                    isSelected ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {stats.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. OPTIONAL COMPACT TREND TOGGLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <button
          onClick={() => setShowChart(!showChart)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-300 hover:text-white transition cursor-pointer"
        >
          <div className="flex items-center gap-2 font-medium">
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Revenue Trend & Analytics</span>
            {selectedProvider !== 'all' && activeProvider && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-normal">
                {activeProvider.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <span>{showChart ? 'Hide' : 'View'}</span>
            {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showChart && (
          <div className="p-3 border-t border-slate-800">
            <React.Suspense fallback={
              <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                {t(appLanguage, 'loading_chart')}
              </div>
            }>
              <DailyRevenueChart 
                transactions={transactions} 
                initialTimeframe={chartTimeframe}
                appLanguage={appLanguage}
                selectedApp={selectedProvider}
                onTimeframeChange={(tf) => {
                  if (tf === '7D') setActiveTab('Weekly');
                  else if (tf === '30D') setActiveTab('Monthly');
                  else if (tf === 'till_date') setActiveTab('All');
                }}
              />
            </React.Suspense>
          </div>
        )}
      </div>

      {/* 6. SEARCH & SORT TOOLBAR */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeProvider
                ? `Search ${activeProvider.name} payments...`
                : t(appLanguage, 'search_tx_placeholder')
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          onClick={() => setHideSenderNames(!hideSenderNames)}
          className={`p-2 rounded-xl border text-xs font-medium flex items-center transition cursor-pointer ${
            hideSenderNames
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title={hideSenderNames ? "Showing initialed names" : "Hide customer names for privacy"}
          aria-label="Toggle privacy"
        >
          {hideSenderNames ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort transactions"
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="newest">{t(appLanguage, 'sort_newest')}</option>
          <option value="amount_high">{t(appLanguage, 'sort_highest')}</option>
          <option value="amount_low">{t(appLanguage, 'sort_lowest')}</option>
          <option value="provider">By App (A-Z)</option>
        </select>
      </div>

      {/* 7. TRANSACTIONS LIST */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
          <span>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Transaction' : 'Transactions'}
            {activeProvider && <span className="text-purple-300 ml-1">({activeProvider.name})</span>}
          </span>
          {activeProvider && (
            <button
              onClick={() => setSelectedProvider('all')}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
            >
              Show all apps
            </button>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <p>
              {activeProvider
                ? `No ${activeProvider.name} payments recorded for ${activeTab.toLowerCase()}.`
                : t(appLanguage, 'no_transactions_found')}
            </p>
            {activeProvider && (
              <button
                onClick={() => setSelectedProvider('all')}
                className="mt-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition cursor-pointer"
              >
                View All Providers
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const appConfig = UPI_APPS_CONFIG[tx.upiApp] || UPI_APPS_CONFIG.paytm;
            const customerDisplayName = formatCustomerName(tx.customerName, !hideSenderNames);
            const appBg = getAppBadgeColor(tx.upiApp);

            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedProvider(tx.upiApp)}
                    title={`Filter by ${appConfig.name}`}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 ${appBg} hover:opacity-90 transition cursor-pointer`}
                  >
                    {appConfig.badge}
                  </button>

                  <div className="min-w-0">
                    <p className="font-medium text-xs text-white truncate max-w-[150px] sm:max-w-[220px]">
                      {customerDisplayName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.time}</span>
                      <span>·</span>
                      <button
                        onClick={() => setSelectedProvider(tx.upiApp)}
                        className="hover:text-purple-400 transition cursor-pointer"
                        title={`Filter payments from ${appConfig.name}`}
                      >
                        {appConfig.name}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold font-mono text-sm text-emerald-400 tabular-nums">
                    +₹{tx.amount.toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => handleReplay(tx)}
                    title="Play voice confirmation alert"
                    aria-label="Play voice confirmation alert"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 8. STATEMENT MODAL (Seamless with provider filter) */}
      <CollectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        transactions={transactions}
        merchant={merchant}
        appLanguage={appLanguage}
        initialTimeframe={activeTab === 'Weekly' ? 'weekly' : activeTab === 'Monthly' ? 'monthly' : 'daily'}
        initialSelectedApp={selectedProvider}
      />
    </div>
  );
};

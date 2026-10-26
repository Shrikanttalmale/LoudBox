import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { 
  BarChart3, 
  CalendarDays, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  ShieldCheck,
  Radio,
  Clock,
  Layers
} from 'lucide-react';
import { Transaction, UpiAppId, UPI_APPS_CONFIG } from '../types/loudbox';
import { AppLanguage, t } from '../utils/i18n';

export type ChartTimeframe = '7D' | '30D' | 'till_date';

interface DailyRevenueChartProps {
  transactions: Transaction[];
  initialTimeframe?: ChartTimeframe;
  onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  appLanguage?: AppLanguage;
  selectedApp?: UpiAppId | 'all';
}

interface PeriodDataPoint {
  dateKey: string;
  displayDay: string;
  fullDate: string;
  revenue: number;
  count: number;
  isToday?: boolean;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

function getStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getEndOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

export const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({
  transactions,
  initialTimeframe = '7D',
  onTimeframeChange,
  appLanguage = 'mr',
  selectedApp = 'all',
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(initialTimeframe);
  const [chartMode, setChartMode] = useState<'combined' | 'revenue' | 'count'>('combined');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showDataSourceInfo, setShowDataSourceInfo] = useState<boolean>(false);

  // Synchronize if prop changes
  useEffect(() => {
    if (initialTimeframe) {
      setTimeframe(initialTimeframe);
    }
  }, [initialTimeframe]);

  const handleTimeframeSelect = (tf: ChartTimeframe) => {
    setTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  const effectiveTransactions = useMemo(() => {
    if (!selectedApp || selectedApp === 'all') return transactions;
    return transactions.filter((t) => t.upiApp === selectedApp);
  }, [transactions, selectedApp]);

  // Compute dynamic chart data based on active timeframe and real transactions
  const data = useMemo<PeriodDataPoint[]>(() => {
    const now = new Date();
    const todayStart = getStartOfDay(now);

    if (timeframe === '7D') {
      // Last 7 calendar days including today
      const points: PeriodDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * ONE_DAY);
        const start = getStartOfDay(d);
        const end = getEndOfDay(d);

        const bucketTx = effectiveTransactions.filter((t) => t.timestamp >= start && t.timestamp <= end);
        const revenue = bucketTx.reduce((sum, t) => sum + t.amount, 0);
        const count = bucketTx.length;

        const isToday = i === 0;
        const dayName = isToday ? t(appLanguage, 'filter_daily') : d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dayNum = d.getDate();

        points.push({
          dateKey: `${d.getFullYear()}-${d.getMonth() + 1}-${dayNum}`,
          displayDay: isToday ? t(appLanguage, 'filter_daily') : `${dayName} ${dayNum}`,
          fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          revenue,
          count,
          isToday,
        });
      }
      return points;
    }

    if (timeframe === '30D') {
      // Last 30 calendar days
      const points: PeriodDataPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * ONE_DAY);
        const start = getStartOfDay(d);
        const end = getEndOfDay(d);

        const bucketTx = effectiveTransactions.filter((t) => t.timestamp >= start && t.timestamp <= end);
        const revenue = bucketTx.reduce((sum, t) => sum + t.amount, 0);
        const count = bucketTx.length;

        const isToday = i === 0;
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString('en-IN', { month: 'short' });

        // Ticks: show label every 5 days or on today/day-29
        const showLabel = isToday || i % 5 === 0 || i === 29;

        points.push({
          dateKey: `${d.getFullYear()}-${d.getMonth() + 1}-${dayNum}`,
          displayDay: isToday ? t(appLanguage, 'filter_daily') : showLabel ? `${dayNum} ${monthShort}` : `${dayNum}`,
          fullDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          revenue,
          count,
          isToday,
        });
      }
      return points;
    }

    // timeframe === 'till_date' (All-time collections grouped by 7-day intervals leading to today)
    if (effectiveTransactions.length === 0) {
      return [];
    }

    const timestamps = effectiveTransactions.map((t) => t.timestamp);
    const minTs = Math.min(...timestamps);
    const spanDays = Math.max(14, Math.ceil((now.getTime() - minTs) / ONE_DAY));
    const intervalDays = Math.max(5, Math.ceil(spanDays / 7)); // 7-8 balanced interval buckets

    const points: PeriodDataPoint[] = [];
    const numBuckets = Math.ceil(spanDays / intervalDays);

    for (let b = numBuckets - 1; b >= 0; b--) {
      const bEnd = new Date(now.getTime() - b * intervalDays * ONE_DAY);
      const bStart = new Date(now.getTime() - (b + 1) * intervalDays * ONE_DAY + 1);

      const bucketTx = effectiveTransactions.filter(
        (t) => t.timestamp >= bStart.getTime() && t.timestamp <= bEnd.getTime()
      );
      const revenue = bucketTx.reduce((sum, t) => sum + t.amount, 0);
      const count = bucketTx.length;

      const isLatest = b === 0;
      const startStr = bStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const endStr = bEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      points.push({
        dateKey: `bucket-${b}`,
        displayDay: isLatest ? t(appLanguage, 'filter_till_date') : `${startStr}`,
        fullDate: `${startStr} - ${endStr}`,
        revenue,
        count,
        isToday: isLatest,
      });
    }

    return points;
  }, [transactions, timeframe, appLanguage]);

  // Aggregate stats based on current timeframe
  const totalRevenue = useMemo(() => data.reduce((acc, d) => acc + d.revenue, 0), [data]);
  const totalCount = useMemo(() => data.reduce((acc, d) => acc + d.count, 0), [data]);
  
  const dailyAverage = useMemo(() => {
    if (data.length === 0) return 0;
    if (timeframe === '7D') return Math.round(totalRevenue / 7);
    if (timeframe === '30D') return Math.round(totalRevenue / 30);
    return Math.round(totalRevenue / data.length);
  }, [totalRevenue, data.length, timeframe]);

  const avgTicketSize = useMemo(() => {
    return totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  }, [totalRevenue, totalCount]);

  const bestPeriod = useMemo(() => {
    if (data.length === 0) return { displayDay: 'N/A', revenue: 0, count: 0 };
    return data.reduce((best, curr) => (curr.revenue > best.revenue ? curr : best), data[0]);
  }, [data]);

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const curr = payload[0]?.payload as PeriodDataPoint;
      return (
        <div className="bg-slate-900/95 border border-purple-500/40 backdrop-blur-md rounded-2xl p-3 shadow-2xl text-xs z-50 min-w-[160px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white">{curr.displayDay}</span>
            <span className="text-[10px] text-purple-300 font-mono">{curr.fullDate}</span>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                {t(appLanguage, 'total_sales')}:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ₹{curr.revenue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {t(appLanguage, 'chart_volume')}:
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {curr.count} {t(appLanguage, 'bills_count')}
              </span>
            </div>

            {curr.count > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                <span>{t(appLanguage, 'avg_per_bill')}:</span>
                <span className="font-mono text-purple-200">
                  ₹{Math.round(curr.revenue / curr.count).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const timeframeLabels: Record<ChartTimeframe, { title: string; subtitle: string; totalLabel: string; volLabel: string }> = {
    '7D': {
      title: t(appLanguage, 'chart_7d_title'),
      subtitle: t(appLanguage, 'chart_7d_sub'),
      totalLabel: t(appLanguage, 'metric_7d_total'),
      volLabel: t(appLanguage, 'metric_7d_volume'),
    },
    '30D': {
      title: t(appLanguage, 'chart_30d_title'),
      subtitle: t(appLanguage, 'chart_30d_sub'),
      totalLabel: t(appLanguage, 'metric_monthly_total'),
      volLabel: t(appLanguage, 'metric_30d_volume'),
    },
    'till_date': {
      title: t(appLanguage, 'chart_till_date_title'),
      subtitle: t(appLanguage, 'chart_till_date_sub'),
      totalLabel: t(appLanguage, 'metric_till_date_total'),
      volLabel: t(appLanguage, 'metric_lifetime_volume'),
    },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col gap-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-xs text-white">
                {timeframeLabels[timeframe].title}
              </h3>
              {selectedApp && selectedApp !== 'all' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {UPI_APPS_CONFIG[selectedApp]?.name || selectedApp}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {selectedApp && selectedApp !== 'all'
                ? `${UPI_APPS_CONFIG[selectedApp]?.name || selectedApp} ${t(appLanguage, 'filter_by_provider') || 'Collections Trend'}`
                : timeframeLabels[timeframe].subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          title={isExpanded ? 'Collapse chart' : 'Expand chart'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Timeframe Selector Bar: 7 Days / 30 Days (Monthly) / Till Date */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px] font-medium">
        <button
          onClick={() => handleTimeframeSelect('7D')}
          className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            timeframe === '7D'
              ? 'bg-purple-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-3 h-3" />
          <span>{t(appLanguage, 'btn_7days')}</span>
        </button>

        <button
          onClick={() => handleTimeframeSelect('30D')}
          className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            timeframe === '30D'
              ? 'bg-purple-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{t(appLanguage, 'btn_monthly')}</span>
        </button>

        <button
          onClick={() => handleTimeframeSelect('till_date')}
          className={`py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            timeframe === 'till_date'
              ? 'bg-purple-600 text-white shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{t(appLanguage, 'btn_till_date')}</span>
        </button>
      </div>

      {/* Expandable Data Source & Transparency Drawer */}
      {showDataSourceInfo && (
        <div className="bg-slate-950/90 border border-purple-500/40 rounded-2xl p-3 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-purple-300 font-semibold border-b border-slate-800 pb-1.5">
            <Database className="w-4 h-4 text-purple-400" />
            <span>{t(appLanguage, 'where_is_data_reading')}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-300">
            <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                1
              </span>
              <div>
                <strong className="text-white block font-medium">Device Local Ledger Storage:</strong>
                Transactions are saved directly on the mobile handset in encrypted browser/app storage (`loudbox_transactions`).
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                2
              </span>
              <div>
                <strong className="text-white block font-medium">Real-Time UPI Notification Interceptor:</strong>
                The Android background listener (`LoudboxNotificationListenerService.java`) intercepts incoming alerts from GPay, PhonePe, Paytm, BHIM, and bank SMSs instantly and appends them to this ledger.
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                3
              </span>
              <div>
                <strong className="text-white block font-medium">Counter Simulator & Live Payments:</strong>
                All simulated test alerts and counter transactions update the chart, calculations, and collections list in real time with 0 server latency.
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> 100% On-Device Privacy (No external cloud leakage)
            </span>
            <button
              onClick={() => setShowDataSourceInfo(false)}
              className="text-purple-300 hover:underline cursor-pointer"
            >
              {t(appLanguage, 'clear_btn')}
            </button>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 py-0.5">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">
                {timeframeLabels[timeframe].totalLabel}
              </span>
              <span className="text-sm font-black font-mono text-purple-300">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">
                {timeframeLabels[timeframe].volLabel}
              </span>
              <span className="text-sm font-black font-mono text-cyan-400">
                {totalCount} {t(appLanguage, 'bills_count')}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium">
                {timeframe === 'till_date' ? t(appLanguage, 'metric_avg_ticket') : t(appLanguage, 'metric_daily_avg')}
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                ₹{(timeframe === 'till_date' ? avgTicketSize : dailyAverage).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setChartMode('combined')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  chartMode === 'combined'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(appLanguage, 'chart_combined')}
              </button>
              <button
                onClick={() => setChartMode('revenue')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  chartMode === 'revenue'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(appLanguage, 'chart_revenue')}
              </button>
              <button
                onClick={() => setChartMode('count')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  chartMode === 'count'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t(appLanguage, 'chart_bills')}
              </button>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{t(appLanguage, 'peak_day')}: {bestPeriod.displayDay}</span>
            </div>
          </div>

          {/* Recharts Composed Chart */}
          <div className="w-full h-52 mt-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6b21a8" stopOpacity={0.4} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />

                <XAxis
                  dataKey="displayDay"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval={timeframe === '30D' ? 4 : 0}
                />

                {(chartMode === 'combined' || chartMode === 'revenue') && (
                  <YAxis
                    yAxisId="left"
                    stroke="#a855f7"
                    fontSize={10}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    tickLine={false}
                    axisLine={false}
                  />
                )}

                {(chartMode === 'combined' || chartMode === 'count') && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#22d3ee"
                    fontSize={10}
                    tickFormatter={(val) => `${val}`}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                  />
                )}

                <Tooltip content={<CustomTooltip />} />

                {/* Revenue Representation */}
                {(chartMode === 'combined' || chartMode === 'revenue') && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#c084fc"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                    dot={{ fill: '#c084fc', stroke: '#581c87', strokeWidth: 2, r: 2.5 }}
                    activeDot={{ r: 5, fill: '#ffffff', stroke: '#a855f7', strokeWidth: 2 }}
                    name="Revenue"
                  />
                )}

                {/* Transaction Count Bars or Line */}
                {chartMode === 'combined' && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: '#22d3ee', r: 2 }}
                    activeDot={{ r: 4, fill: '#ffffff', stroke: '#06b6d4', strokeWidth: 2 }}
                    name="Bills"
                  />
                )}

                {chartMode === 'count' && (
                  <Bar
                    yAxisId="right"
                    dataKey="count"
                    fill="url(#barGrad)"
                    radius={[6, 6, 0, 0]}
                    name="Bills"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend and Data Source Note */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 px-1">
            <div className="flex items-center gap-3">
              {(chartMode === 'combined' || chartMode === 'revenue') && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                  {t(appLanguage, 'chart_revenue')}
                </span>
              )}
              {(chartMode === 'combined' || chartMode === 'count') && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
                  {t(appLanguage, 'chart_bills')}
                </span>
              )}
            </div>
            
            <button
              onClick={() => setShowDataSourceInfo(true)}
              className="flex items-center gap-1 text-slate-400 hover:text-purple-300 transition cursor-pointer"
            >
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span>{t(appLanguage, 'live_ledger')}: {transactions.length} {t(appLanguage, 'records_count')}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

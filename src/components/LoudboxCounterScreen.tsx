import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Store, 
  Smartphone, 
  ArrowRight,
  Radio,
  Bell,
  BellOff,
  ExternalLink,
  X
} from 'lucide-react';
import { Transaction, MerchantProfile, UPI_APPS_CONFIG } from '../types/loudbox';
import { 
  AudioSettings, 
  announcePaymentAlert, 
  SUPPORTED_LANGUAGES, 
  unlockAudioContext, 
  playLoudboxChime 
} from '../utils/audioEngine';
import { AppLanguage, t } from '../utils/i18n';
import { checkNotificationPermission, openNotificationSettings } from '../utils/nativeBridge';

export interface LoudboxCounterScreenProps {
  merchant: MerchantProfile;
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'time'>) => void;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  onOpenCollections: () => void;
  onOpenQRStand: () => void;
  activeAnnouncementText?: string | null;
  onAnnouncementText?: (text: string | null) => void;
  onClearTransactions?: () => void;
  onResetDefaultTransactions?: () => void;
  appLanguage?: AppLanguage;
}

export const LoudboxCounterScreen: React.FC<LoudboxCounterScreenProps> = ({
  merchant,
  transactions,
  onAddTransaction,
  audioSettings,
  isSpeaking,
  setIsSpeaking,
  onOpenCollections,
  onOpenQRStand,
  activeAnnouncementText,
  onAnnouncementText,
  appLanguage = 'mr',
}) => {
  const handleReplay = async (tx: Transaction) => {
    unlockAudioContext();
    await announcePaymentAlert(
      tx.amount,
      tx.upiApp,
      audioSettings,
      tx.customerName,
      setIsSpeaking,
      onAnnouncementText
    );
  };

  const handleTestAudio = async () => {
    unlockAudioContext();
    await announcePaymentAlert(
      100,
      'paytm',
      audioSettings,
      'Rahul Sharma',
      setIsSpeaking,
      onAnnouncementText
    );
  };

  const handleSimulateQuickPayment = async (amount: number, app: 'gpay' | 'phonepe' | 'paytm' = 'paytm') => {
    unlockAudioContext();
    const names = ['Rahul Sharma', 'Pooja Patil', 'Amit Kadam', 'Suresh Jadhav', 'Neha Deshmukh'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    onAddTransaction({
      amount,
      customerName: randomName,
      upiApp: app,
      utrNumber: `412${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'SUCCESS',
      vpa: `${randomName.toLowerCase().replace(' ', '')}@okaxis`,
      note: 'Simulation Test Payment',
    });
    await announcePaymentAlert(
      amount,
      app,
      audioSettings,
      randomName,
      setIsSpeaking,
      onAnnouncementText
    );
  };

  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const todayTransactions = transactions.filter(tx => tx.timestamp >= todayStart);
  const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const [isNotifGranted, setIsNotifGranted] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      const granted = await checkNotificationPermission();
      if (mounted) setIsNotifGranted(granted);
    };
    verify();

    const handleFocus = () => verify();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === audioSettings.selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col gap-5 p-5 text-slate-100">
      {/* Merchant Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white">{merchant.businessName}</h2>
            <p className="text-xs text-slate-400 font-mono">{merchant.upiId}</p>
          </div>
        </div>

        <button
          onClick={onOpenQRStand}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          <span>{t(appLanguage, 'show_qr')}</span>
        </button>
      </div>

      {/* Optional Soft Warning Banner if Notification Access is not yet enabled */}
      {!isNotifGranted && !isBannerDismissed && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <BellOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-200 truncate">Auto-alerts are paused</p>
              <p className="text-[11px] text-amber-300/80 truncate">Enable notification access for automatic UPI announcements</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={async () => {
                await openNotificationSettings();
                const granted = await checkNotificationPermission();
                if (granted) {
                  setIsNotifGranted(true);
                  playLoudboxChime();
                }
              }}
              className="px-2.5 py-1 bg-amber-500 text-amber-950 font-bold rounded-lg text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              Enable
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 text-amber-400 hover:text-amber-200 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live Spoken Announcement Overlay */}
      {activeAnnouncementText && (
        <div className="bg-purple-900/80 border border-purple-500/50 rounded-2xl p-3.5 flex items-center gap-3 animate-in fade-in duration-150">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-purple-300 font-medium block uppercase tracking-wider">
              {t(appLanguage, 'announcing_now')}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-white truncate">
              {activeAnnouncementText}
            </p>
          </div>
        </div>
      )}

      {/* Today's Collection Hero Card */}
      <div 
        onClick={onOpenCollections}
        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-sm cursor-pointer transition flex flex-col gap-3 group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{t(appLanguage, 'todays_collection')}</span>
          <span className="text-purple-400 flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition">
            <span>{t(appLanguage, 'view_all')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-white tabular-nums">
            ₹{todayTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400">
            {todayTransactions.length} {t(appLanguage, 'payments')}
          </span>
        </div>
      </div>

      {/* Soundbox Voice Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center text-center gap-4">
        {/* Subtle Animated Audio Waveform */}
        <div className="relative flex items-center justify-center my-1">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSpeaking 
              ? 'bg-purple-600/30 text-purple-300 ring-8 ring-purple-500/20 scale-105' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Volume2 className={`w-10 h-10 ${isSpeaking ? 'animate-pulse text-purple-300' : 'text-slate-400'}`} />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-white">
            {isSpeaking ? t(appLanguage, 'announcing_now') : t(appLanguage, 'active_listening')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeLangConfig.nativeName} ({activeLangConfig.name}) voice
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <button
            onClick={handleTestAudio}
            className="w-full justify-center px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>{t(appLanguage, 'test_sound')} (₹100)</span>
          </button>

          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => handleSimulateQuickPayment(100, 'gpay')}
              className="flex-1 py-1.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700/60"
              title="Simulate ₹100 Google Pay alert"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>₹100 GPay</span>
            </button>
            <button
              onClick={() => handleSimulateQuickPayment(250, 'phonepe')}
              className="flex-1 py-1.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700/60"
              title="Simulate ₹250 PhonePe alert"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>₹250 PhPe</span>
            </button>
            <button
              onClick={() => handleSimulateQuickPayment(500, 'paytm')}
              className="flex-1 py-1.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700/60"
              title="Simulate ₹500 Paytm alert"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              <span>₹500 Paytm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Alerts List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-medium">{t(appLanguage, 'recent_alerts')}</span>
          <button
            onClick={onOpenCollections}
            className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            {t(appLanguage, 'view_all')} ({transactions.length})
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {transactions.slice(0, 4).map((tx) => {
            const appConfig = UPI_APPS_CONFIG[tx.upiApp] || UPI_APPS_CONFIG.paytm;
            return (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 ${
                    tx.upiApp === 'gpay' ? 'bg-blue-600' :
                    tx.upiApp === 'phonepe' ? 'bg-purple-600' :
                    tx.upiApp === 'paytm' ? 'bg-cyan-600' :
                    tx.upiApp === 'bhim' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {appConfig.badge}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-white truncate">{tx.customerName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tx.time} · {appConfig.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold font-mono text-sm text-emerald-400 tabular-nums">
                    +₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleReplay(tx)}
                    title="Replay Voice Alert"
                    aria-label="Replay Voice Alert"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Volume2, 
  Store, 
  CheckCircle2, 
  Smartphone, 
  Radio, 
  ArrowUpRight,
  BellRing
} from 'lucide-react';
import { Transaction, MerchantProfile, UPI_APPS_CONFIG, INITIAL_TRANSACTIONS } from '../types/soundbox';
import { 
  AudioSettings, 
  announcePaymentAlert, 
  SUPPORTED_LANGUAGES, 
  unlockAudioContext, 
  playSoundboxChime 
} from '../utils/audioEngine';
import { AppLanguage, t } from '../utils/i18n';

interface SoundboxCounterScreenProps {
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

export const SoundboxCounterScreen: React.FC<SoundboxCounterScreenProps> = ({
  merchant,
  transactions,
  onAddTransaction,
  audioSettings,
  setAudioSettings,
  isSpeaking,
  setIsSpeaking,
  onOpenCollections,
  onOpenQRStand,
  activeAnnouncementText,
  onAnnouncementText,
  onClearTransactions,
  onResetDefaultTransactions,
  appLanguage = 'mr',
}) => {
  const [audioDiagnosticsOk, setAudioDiagnosticsOk] = useState<boolean | null>(null);

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

  const handleRunAudioDiagnostic = async () => {
    unlockAudioContext();
    setAudioDiagnosticsOk(null);
    await playSoundboxChime(audioSettings.chimeStyle, audioSettings.volume);
    await announcePaymentAlert(
      100,
      'gpay',
      audioSettings,
      'Test User',
      setIsSpeaking,
      onAnnouncementText
    );
    setAudioDiagnosticsOk(true);
  };

  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const todayTransactions = transactions.filter(tx => tx.timestamp >= todayStart);
  const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      {/* Merchant Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            <Store className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm tracking-tight text-white">{merchant.businessName}</h2>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{merchant.upiId}</p>
          </div>
        </div>

        <button
          onClick={onOpenQRStand}
          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t(appLanguage, 'show_qr')}</span>
        </button>
      </div>

      {/* LIVE SPOKEN SUBTITLE / CLOSED CAPTION BANNER */}
      {activeAnnouncementText && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border-2 border-purple-400 rounded-2xl p-3 shadow-2xl shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Volume2 className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block">
                🔊 {t(appLanguage, 'announcing_now')}:
              </span>
              <p className="text-xs sm:text-sm font-black text-white font-mono break-words leading-tight">
                {activeAnnouncementText}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <div className="w-1 h-4 rounded-full animate-soundwave-1 bg-purple-400"></div>
            <div className="w-1 h-6 rounded-full animate-soundwave-3 bg-cyan-400"></div>
            <div className="w-1 h-5 rounded-full animate-soundwave-2 bg-purple-300"></div>
          </div>
        </div>
      )}

      {/* Main Soundbox Virtual Speaker Graphic & Live State */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-radial from-purple-600/20 via-transparent to-transparent pointer-events-none"></div>

        {/* Live Status Pill */}
        <div className="w-full flex items-center justify-between mb-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{t(appLanguage, 'active_listening')}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/70 px-2.5 py-1 rounded-full border border-purple-800/50 font-medium shadow-sm">
            <span>🔊 {SUPPORTED_LANGUAGES.find(l => l.code === audioSettings.selectedLanguage)?.nativeName}</span>
            <span className="text-purple-400/50">•</span>
            <span className="text-cyan-300 text-[11px] font-mono">👤 {audioSettings.announceSenderName !== false ? 'Payer: ON' : 'Payer: OFF'}</span>
          </div>

        </div>

        {/* Animated Speaker Visualizer */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Pulsing ring layers when speaking */}
          {isSpeaking && (
            <>
              <div className="absolute w-44 h-44 rounded-full border border-purple-500/40 animate-ring-pulse pointer-events-none"></div>
              <div className="absolute w-56 h-56 rounded-full border border-purple-400/20 animate-ring-pulse [animation-delay:0.3s] pointer-events-none"></div>
            </>
          )}

          {/* Speaker cone chassis */}
          <div 
            className={`w-36 h-36 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-4 ${
              isSpeaking ? 'border-purple-500 animate-speaker-pulse' : 'border-zinc-700'
            } flex items-center justify-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_10px_25px_rgba(0,0,0,0.6)] transition-all duration-300 relative`}
          >
            {/* Outer driver ring */}
            <div className="w-28 h-28 rounded-full border border-zinc-700/80 bg-zinc-900/90 flex items-center justify-center shadow-inner">
              {/* Inner diaphragm & logo */}
              <div className="w-18 h-18 rounded-full bg-gradient-to-br from-purple-900 via-purple-950 to-black border-2 border-purple-500/50 flex flex-col items-center justify-center shadow-lg">
                <Volume2 className={`w-8 h-8 ${isSpeaking ? 'text-purple-300 animate-bounce' : 'text-purple-400'}`} />
                <span className="text-[9px] font-mono font-bold text-purple-300/80 uppercase tracking-widest mt-0.5">
                  VOICE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Equalizer bars during speech */}
        <div className="h-7 flex items-center gap-1.5 my-1 z-10">
          {isSpeaking ? (
            <>
              <div className="w-1.5 bg-purple-400 rounded-full animate-soundwave-1"></div>
              <div className="w-1.5 bg-purple-300 rounded-full animate-soundwave-2"></div>
              <div className="w-1.5 bg-purple-500 rounded-full animate-soundwave-3"></div>
              <div className="w-1.5 bg-pink-400 rounded-full animate-soundwave-4"></div>
              <div className="w-1.5 bg-purple-400 rounded-full animate-soundwave-5"></div>
              <div className="w-1.5 bg-purple-300 rounded-full animate-soundwave-2"></div>
              <div className="w-1.5 bg-purple-500 rounded-full animate-soundwave-1"></div>
            </>
          ) : (
            <p className="text-xs text-slate-400 font-medium">{t(appLanguage, 'ready_for_next')}</p>
          )}
        </div>

        {/* Audio Diagnostics & Test Button */}
        <div className="w-full flex items-center justify-center gap-2 mt-2 z-10">
          <button
            onClick={handleRunAudioDiagnostic}
            className="text-[11px] px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            title="Click to test device audio and unblock browser sound permissions"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>{t(appLanguage, 'test_sound')}</span>
            {audioDiagnosticsOk && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

        {/* Today's Collection Snapshot Widget */}
        <div 
          onClick={onOpenCollections}
          className="w-full mt-3 bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition group"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t(appLanguage, 'todays_collection')}</span>
              <span className="text-[9px] bg-amber-500/15 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                {t(appLanguage, 'unverified_alert_tag')}
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              ₹{todayTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 group-hover:text-purple-300 transition font-medium">
              {todayTransactions.length} {t(appLanguage, 'payments')}
            </span>
            <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-purple-600/30 flex items-center justify-center text-slate-300 group-hover:text-purple-300 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed with One-Tap Replay */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {t(appLanguage, 'recent_alerts')}
          </h3>
          <button
            onClick={onOpenCollections}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
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
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-2.5 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                    tx.upiApp === 'gpay' ? 'bg-blue-600' :
                    tx.upiApp === 'phonepe' ? 'bg-purple-600' :
                    tx.upiApp === 'paytm' ? 'bg-cyan-600' :
                    tx.upiApp === 'bhim' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {appConfig.badge}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white">{tx.customerName}</span>
                      <span className="text-[10px] text-slate-500">• {tx.time}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">UTR: {tx.utrNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-bold font-mono text-sm text-emerald-400 block leading-tight">
                      + ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500">{appConfig.name}</span>
                  </div>

                  <button
                    onClick={() => handleReplay(tx)}
                    title="Replay Voice Alert"
                    className="w-8 h-8 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
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

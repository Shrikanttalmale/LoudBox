import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Store, 
  CheckCircle2, 
  Sparkles, 
  Smartphone,
  ShieldCheck,
  RefreshCw,
  QrCode as QrIcon
} from 'lucide-react';
import { MerchantProfile, Transaction } from '../types/soundbox';
import { AudioSettings, announcePaymentAlert, unlockAudioContext } from '../utils/audioEngine';
import { AppLanguage, t } from '../utils/i18n';
import confetti from 'canvas-confetti';

interface QRStandScreenProps {
  merchant: MerchantProfile;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'time'>) => void;
  audioSettings: AudioSettings;
  setIsSpeaking: (speaking: boolean) => void;
  appLanguage?: AppLanguage;
}

export const QRStandScreen: React.FC<QRStandScreenProps> = ({
  merchant,
  onAddTransaction,
  audioSettings,
  setIsSpeaking,
  appLanguage = 'mr',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);

  const effectiveUpiId = merchant.upiId?.trim() || 'merchant@upi';

  // Build standard UPI intent URL
  const upiIntentUrl = customAmount && parseFloat(customAmount) > 0
    ? `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(merchant.businessName)}&am=${customAmount}&cu=INR`
    : `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(merchant.businessName)}&cu=INR`;

  useEffect(() => {
    QRCode.toDataURL(upiIntentUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate UPI QR code:', err));
  }, [upiIntentUrl]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(merchant.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateCustomerPayment = async () => {
    unlockAudioContext();
    setIsSimulatingScan(true);
    const amount = parseFloat(customAmount) || 350;

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#7c3aed', '#10b981', '#3b82f6'],
    });

    onAddTransaction({
      amount,
      customerName: 'Counter Customer',
      upiApp: 'phonepe',
      utrNumber: `412${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'SUCCESS',
      vpa: 'customer@okaxis',
      note: 'Payment via Counter QR Stand',
    });

    await announcePaymentAlert(amount, 'phonepe', audioSettings, 'Counter Customer', setIsSpeaking);
    setIsSimulatingScan(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      {/* Counter Stand Frame */}
      <div className="bg-gradient-to-b from-purple-900/60 via-slate-900 to-slate-950 border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Stand Header Kicker */}
        <div className="w-full flex items-center justify-between mb-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1">
            <QrIcon className="w-3.5 h-3.5" />
            {t(appLanguage, 'qr_stand_title')}
          </span>

          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t(appLanguage, 'verified_merchant')}
          </span>
        </div>

        {/* Shop Branding */}
        <div className="mb-3">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight">{merchant.businessName}</h2>
            <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/20" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{merchant.category} • {merchant.city}</p>
        </div>

        {/* The Real Scannable UPI QR Box */}
        <div className="relative bg-white p-3 rounded-2xl shadow-xl border-4 border-purple-500/30 my-1 group">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="UPI Payment QR Code" 
              className="w-52 h-52 object-contain rounded-xl"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
              {t(appLanguage, 'generating_qr')}
            </div>
          )}

          {/* Center Soundbox Rupee Stamp */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-purple-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-sm">
              ₹
            </div>
          </div>
        </div>

        {/* UPI ID Badge with Copy */}
        <div className="mt-3 flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="text-slate-300">{merchant.upiId}</span>
          <button
            onClick={handleCopyUPI}
            className="text-purple-400 hover:text-purple-300 transition cursor-pointer flex items-center gap-1"
            title={t(appLanguage, 'copy_upi')}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-sans font-bold">{t(appLanguage, 'copied')}</span>
              </>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Accepted Payment Apps Banner */}
        <div className="mt-4 w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-2.5">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">
            {t(appLanguage, 'accepted_upi_apps')}
          </p>
          <div className="flex items-center justify-center gap-3 text-xs font-bold">
            <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">GPay</span>
            <span className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30">PhonePe</span>
            <span className="px-2 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">Paytm</span>
            <span className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">BHIM</span>
            <span className="px-2 py-1 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30">Amazon</span>
          </div>
        </div>
      </div>

      {/* Counter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
          {t(appLanguage, 'set_amount_optional')}
        </h3>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={t(appLanguage, 'any_amount_placeholder')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 font-mono placeholder:font-sans placeholder:text-slate-500"
            />
          </div>
          {customAmount && (
            <button
              onClick={() => setCustomAmount('')}
              className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              {t(appLanguage, 'clear_btn')}
            </button>
          )}
        </div>

        {/* Test Scan Button */}
        <button
          onClick={handleSimulateCustomerPayment}
          disabled={isSimulatingScan}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t(appLanguage, 'simulate_scan')}</span>
        </button>
      </div>
    </div>
  );
};

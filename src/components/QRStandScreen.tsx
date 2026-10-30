import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Copy, 
  Check, 
  Sparkles,
  QrCode as QrIcon,
  ArrowLeft
} from 'lucide-react';
import { MerchantProfile, Transaction } from '../types/loudbox';
import { AudioSettings, announcePaymentAlert, unlockAudioContext } from '../utils/audioEngine';
import { AppLanguage, t } from '../utils/i18n';

interface QRStandScreenProps {
  merchant: MerchantProfile;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'time'>) => void;
  audioSettings: AudioSettings;
  setIsSpeaking: (speaking: boolean) => void;
  appLanguage?: AppLanguage;
  onBack?: () => void;
}

export const QRStandScreen: React.FC<QRStandScreenProps> = ({
  merchant,
  onAddTransaction,
  audioSettings,
  setIsSpeaking,
  appLanguage = 'mr',
  onBack,
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
      width: 260,
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

  const handleSimulatePayment = async () => {
    unlockAudioContext();
    setIsSimulatingScan(true);
    const amount = parseFloat(customAmount) || 350;

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
    <div className="flex flex-col gap-5 p-5 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Back to Loudbox"
            aria-label="Back to Loudbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="font-semibold text-base text-white tracking-tight">{t(appLanguage, 'tab_qrstand')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Display on your counter for customer scans</p>
        </div>
      </div>

      {/* Clean Physical-Style QR Counter Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
        {/* Merchant Info */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">{merchant.businessName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{merchant.category} · {merchant.city}</p>
        </div>

        {/* Crisp QR Code Container */}
        <div className="bg-white p-3 rounded-2xl shadow-sm my-2">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="UPI Payment QR Code" 
              className="w-48 h-48 object-contain rounded-xl"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
              {t(appLanguage, 'generating_qr')}
            </div>
          )}
        </div>

        {/* UPI ID with Copy Action */}
        <div className="mt-4 flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
          <span className="text-slate-200">{merchant.upiId}</span>
          <button
            onClick={handleCopyUPI}
            className="text-purple-400 hover:text-purple-300 transition cursor-pointer p-0.5"
            title="Copy UPI ID"
            aria-label="Copy UPI ID"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Accepted Payment Apps Subtext */}
        <p className="text-[11px] text-slate-400 mt-4">
          Accepts Google Pay, PhonePe, Paytm, BHIM & all UPI apps
        </p>
      </div>

      {/* Simulator & Amount Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
        <label className="text-xs font-medium text-slate-300">
          {t(appLanguage, 'set_amount_optional')}
        </label>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₹</span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={t(appLanguage, 'any_amount_placeholder')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          onClick={handleSimulatePayment}
          disabled={isSimulatingScan}
          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>{t(appLanguage, 'simulate_scan')}</span>
        </button>
      </div>
    </div>
  );
};

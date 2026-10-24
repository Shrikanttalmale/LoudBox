import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  Languages, 
  Store, 
  Bell, 
  ShieldCheck, 
  Check, 
  Play, 
  ArrowRight, 
  Sparkles,
  Smartphone,
  BatteryCharging,
  Zap,
  Globe,
  Search,
  CheckCircle2
} from 'lucide-react';
import { MerchantProfile } from '../types/soundbox';
import { 
  AudioSettings, 
  SUPPORTED_LANGUAGES, 
  LanguageCode, 
  LanguageOption,
  announcePaymentAlert, 
  playSoundboxChime, 
  unlockAudioContext 
} from '../utils/audioEngine';
import { 
  AppLanguage, 
  SUPPORTED_APP_LANGUAGES, 
  t 
} from '../utils/i18n';

interface OnboardingSetupProps {
  merchant: MerchantProfile;
  setMerchant: React.Dispatch<React.SetStateAction<MerchantProfile>>;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  onCompleteSetup: () => void;
  setIsSpeaking: (speaking: boolean) => void;
}

export const OnboardingSetup: React.FC<OnboardingSetupProps> = ({
  merchant,
  setMerchant,
  audioSettings,
  setAudioSettings,
  appLanguage,
  setAppLanguage,
  onCompleteSetup,
  setIsSpeaking,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Steps:
  // 0: Welcome
  // 1: Select Language (App UI + Voice Alert)
  // 2: Shop Details
  // 3: Permissions
  // 4: Sound Test & Complete

  const [shopName, setShopName] = useState(merchant.businessName);
  const [upiId, setUpiId] = useState(merchant.upiId);

  // Language setup configuration
  const [langSearch, setLangSearch] = useState('');
  const [previewingCode, setPreviewingCode] = useState<string | null>(null);

  // Permission simulation flags
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [batteryGranted, setBatteryGranted] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_LANGUAGES.filter((lang) => {
      const matchesName = lang.name.toLowerCase().includes(q);
      const matchesNative = lang.nativeName.toLowerCase().includes(q);
      const matchesRegion = lang.region?.toLowerCase().includes(q) || false;
      const matchesCode = lang.code.toLowerCase().includes(q);
      return matchesName || matchesNative || matchesRegion || matchesCode;
    });
  }, [langSearch]);

  const handleTestLanguage = async (e: React.MouseEvent, code: LanguageCode) => {
    e.stopPropagation();
    unlockAudioContext();
    setPreviewingCode(code);
    const updated = { ...audioSettings, selectedLanguage: code };
    setAudioSettings(updated);
    setAppLanguage(code as AppLanguage);
    await announcePaymentAlert(500, 'paytm', updated, 'Customer', (speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) setPreviewingCode(null);
    });
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    unlockAudioContext();
    setAppLanguage(code as AppLanguage);
    setAudioSettings((prev) => ({ ...prev, selectedLanguage: code }));
  };

  const handleFinishOnboarding = () => {
    unlockAudioContext();
    setMerchant((prev) => ({
      ...prev,
      businessName: shopName || prev.businessName,
      upiId: upiId || prev.upiId,
    }));

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#10b981', '#3b82f6'],
    });

    onCompleteSetup();
  };

  const currentAppLangOption = SUPPORTED_APP_LANGUAGES.find((l) => l.code === appLanguage) || SUPPORTED_APP_LANGUAGES[0];
  const currentVoiceLangOption = SUPPORTED_LANGUAGES.find((l) => l.code === audioSettings.selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="w-full h-full min-h-[720px] bg-slate-950 p-4 sm:p-5 flex flex-col justify-between text-white font-sans select-none overflow-y-auto">
      {/* Progress Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center font-black text-xs text-white">
            ₹
          </div>
          <span className="font-extrabold text-xs tracking-tight text-white">
            {t(appLanguage, 'app_title')} Setup
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((stepIdx) => (
            <div
              key={stepIdx}
              className={`h-1.5 rounded-full transition-all ${
                currentStep === stepIdx
                  ? 'w-6 bg-purple-500'
                  : currentStep > stepIdx
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 0: Welcome Screen */}
      {currentStep === 0 && (
        <div className="my-auto flex flex-col items-center text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-purple-400/50 shadow-2xl flex items-center justify-center mb-6">
            <Volume2 className="w-10 h-10 text-white animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Welcome to Soundbox
          </h2>
          <p className="text-sm text-slate-300 max-w-xs leading-relaxed mb-6">
            Turn your Android phone into an instant voice payment soundbox for your shop counter.
          </p>

          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>No hardware to buy • ₹0 monthly rental</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>Supports GPay, PhonePe, Paytm & BHIM UPI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>Voice alerts in all 15 Indian regional languages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>Full App UI in your preferred regional language</span>
            </div>
          </div>

          <button
            onClick={() => {
              unlockAudioContext();
              setCurrentStep(1);
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <span>Start 1-Minute Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Simplified & Clean Language Selection */}
      {currentStep === 1 && (
        <div className="my-auto flex flex-col gap-3 py-1 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              Step 1 of 4 • भाषा निवडा
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Select Your Language
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your language for app display &amp; spoken alerts
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search language (मराठी, हिंदी, English, বাংলা...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            {langSearch && (
              <button
                onClick={() => setLangSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean 2-Column Language Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredLanguages.map((lang) => {
              const isSelected = appLanguage === lang.code && audioSettings.selectedLanguage === lang.code;
              const isSpeakingThis = previewingCode === lang.code;

              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/50 shadow-lg shadow-purple-600/20'
                      : 'bg-slate-900/90 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="font-black text-sm text-white tracking-tight block">
                      {lang.nativeName}
                    </span>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {lang.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/50">
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {lang.name}
                    </span>
                    <button
                      onClick={(e) => handleTestLanguage(e, lang.code)}
                      title={`Listen to ${lang.name} sample`}
                      className={`h-6 px-2 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer border ${
                        isSpeakingThis
                          ? 'bg-purple-500 text-white border-purple-400 animate-pulse'
                          : 'bg-slate-850 hover:bg-purple-600/30 text-purple-300 border-slate-700/60'
                      }`}
                    >
                      <Play className="w-2 h-2 fill-current" />
                      <span>{isSpeakingThis ? '...' : 'Play'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-1 flex flex-col gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
            >
              <span>Continue with {currentAppLangOption.nativeName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              You can change language anytime from Settings
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Store Profile */}
      {currentStep === 2 && (
        <div className="my-auto flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              Step 2 of 4 • {t(appLanguage, 'shop_profile')}
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Your Store Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Displayed on your Counter QR Stand and Daily Collections</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3.5">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {t(appLanguage, 'shop_name')}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma General Store"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 font-semibold">
                  {t(appLanguage, 'merchant_upi_id')} (VPA)
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                  Optional
                </span>
              </div>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. sharmastore@okaxis (or leave blank)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
              />

              {/* Explanatory callout */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-slate-300 space-y-1">
                <p className="font-semibold text-purple-300 flex items-center gap-1">
                  <span>💡 Not required for voice alerts!</span>
                </p>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  Soundbox announces payments from your <strong className="text-white">existing printed QR stands</strong> (PhonePe, Paytm, Google Pay, etc.) by reading notifications. You only need a UPI ID if you want this phone screen to double as a digital QR display stand.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setShopName('Prasad Kirana Store');
                  setUpiId('prasadstore@okaxis');
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                Kirana Preset
              </button>
              <button
                onClick={() => {
                  setShopName('Metro Pharmacy');
                  setUpiId('metropharma@ybl');
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                Pharmacy Preset
              </button>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="w-full mt-2 py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
          >
            <span>Continue to Permissions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: Permissions Setup (Realistic Android Prompts) */}
      {currentStep === 3 && (
        <div className="my-auto flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              Step 3 of 4 • {t(appLanguage, 'notification_listener')}
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Android Permissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Required to hear payments automatically when customers pay</p>
          </div>

          {/* Prominent Disclosure (Google Play Policy Compliant) */}
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 flex flex-col gap-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prominent Privacy Disclosure</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Soundbox requests <strong className="text-white">Notification Access</strong> exclusively to detect incoming transaction confirmations from UPI apps (Google Pay, PhonePe, Paytm, BHIM).
            </p>
            <div className="flex items-center gap-2 text-[10px] text-emerald-300/90 font-medium pt-0.5">
              <span>🔒 100% On-Device</span>
              <span>•</span>
              <span>No SMS read</span>
              <span>•</span>
              <span>No personal data uploaded</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Permission 1: Notification Access */}
            <div className={`p-4 rounded-3xl border transition ${
              notificationGranted ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notificationGranted ? 'bg-emerald-500 text-white' : 'bg-purple-600/20 text-purple-400'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Notification Access</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Listens for Google Pay, PhonePe, Paytm payment alerts.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setNotificationGranted(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    notificationGranted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {notificationGranted ? 'Allowed ✓' : 'Allow Access'}
                </button>
              </div>
            </div>

            {/* Permission 2: Battery Optimization Exemption */}
            <div className={`p-4 rounded-3xl border transition ${
              batteryGranted ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    batteryGranted ? 'bg-emerald-500 text-white' : 'bg-amber-600/20 text-amber-400'
                  }`}>
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Unrestricted Background Run</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Prevents phone from putting Soundbox to sleep while on the counter.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setBatteryGranted(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    batteryGranted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {batteryGranted ? 'Enabled ✓' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setNotificationGranted(true);
              setBatteryGranted(true);
              setCurrentStep(4);
            }}
            className="w-full mt-2 py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
          >
            <span>Continue to Sound Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: Activation Chime & Ready */}
      {currentStep === 4 && (
        <div className="my-auto flex flex-col items-center text-center py-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-emerald-300/40 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center mb-6">
            <ShieldCheck className="w-12 h-12 text-white animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Loudbox Ready!
          </h2>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-4">
            Your shop <span className="font-bold text-white">"{shopName}"</span> is set to announce payments in{' '}
            <span className="font-bold text-purple-400">
              {currentVoiceLangOption.nativeName} ({currentVoiceLangOption.name})
            </span>{' '}
            and display app in{' '}
            <span className="font-bold text-emerald-400">
              {currentAppLangOption.nativeName}
            </span>.
          </p>

          {/* Standard Soundbox Voice Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-6 max-w-xs w-full text-left flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-lg shrink-0 shadow-sm">
                <Volume2 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block truncate">
                  Standard Soundbox Voice
                </span>
                <span className="text-[10px] text-purple-300 font-semibold block truncate">
                  {currentVoiceLangOption.nativeName} ({currentVoiceLangOption.name})
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                unlockAudioContext();
                announcePaymentAlert(500, 'paytm', audioSettings, 'Customer', setIsSpeaking);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Test</span>
            </button>
          </div>

          <button
            onClick={handleFinishOnboarding}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-2xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Soundbox Counter &amp; QR Stand</span>
          </button>
        </div>
      )}
    </div>
  );
};

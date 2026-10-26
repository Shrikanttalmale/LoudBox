import React, { useState, useMemo } from 'react';
import { 
  Volume2, 
  Check, 
  Play, 
  ArrowRight, 
  Bell, 
  BatteryCharging, 
  Search,
  Sparkles
} from 'lucide-react';
import { MerchantProfile } from '../types/loudbox';
import { 
  AudioSettings, 
  SUPPORTED_LANGUAGES, 
  LanguageCode, 
  announcePaymentAlert, 
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
  const [shopName, setShopName] = useState(merchant.businessName);
  const [upiId, setUpiId] = useState(merchant.upiId);
  const [langSearch, setLangSearch] = useState('');
  const [previewingCode, setPreviewingCode] = useState<string | null>(null);

  const [notificationGranted, setNotificationGranted] = useState(false);
  const [batteryGranted, setBatteryGranted] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
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
    onCompleteSetup();
  };

  const currentVoiceOption = SUPPORTED_LANGUAGES.find((l) => l.code === audioSettings.selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="w-full h-full min-h-[720px] bg-slate-950 p-6 flex flex-col justify-between text-white font-sans select-none overflow-y-auto">
      {/* Minimal Progress Indicator */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <span className="font-semibold text-xs text-white">Loudbox Setup</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((stepIdx) => (
            <div
              key={stepIdx}
              className={`h-1.5 rounded-full transition-all ${
                currentStep === stepIdx
                  ? 'w-6 bg-purple-500'
                  : currentStep > stepIdx
                  ? 'w-2 bg-purple-400/40'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 0: Welcome Screen */}
      {currentStep === 0 && (
        <div className="my-auto flex flex-col items-center text-center py-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-6 shadow-md">
            <Volume2 className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Welcome to Loudbox
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
            Turn your Android phone into a voice payment speaker for your shop counter.
          </p>

          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Free on-device loudbox • No hardware needed</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Supports Google Pay, PhonePe, Paytm & BHIM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Voice alerts in 15 Indian regional languages</span>
            </div>
          </div>

          <button
            onClick={() => {
              unlockAudioContext();
              setCurrentStep(1);
            }}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Language Selection */}
      {currentStep === 1 && (
        <div className="my-auto flex flex-col gap-4 py-2 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Language</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose your regional language for voice announcements</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Clean 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredLanguages.map((lang) => {
              const isSelected = audioSettings.selectedLanguage === lang.code;
              const isSpeakingThis = previewingCode === lang.code;

              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="font-semibold text-xs text-white">{lang.nativeName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 truncate">{lang.name}</span>
                    <button
                      onClick={(e) => handleTestLanguage(e, lang.code)}
                      className={`h-5 px-1.5 rounded text-[10px] flex items-center gap-0.5 transition cursor-pointer ${
                        isSpeakingThis ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-300'
                      }`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{isSpeakingThis ? '...' : 'Play'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentStep(2)}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Store Details */}
      {currentStep === 2 && (
        <div className="my-auto flex flex-col gap-4 py-2 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Store Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Displayed on your counter stand and collections</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Store / Business Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma General Store"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Merchant UPI ID (Optional)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. storename@okaxis"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: Permissions */}
      {currentStep === 3 && (
        <div className="my-auto flex flex-col gap-4 py-2 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Permissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Required to announce payments automatically</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-xs text-white">Notification Access</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Detects payment alerts from UPI apps</p>
                </div>
              </div>

              <button
                onClick={() => setNotificationGranted(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                  notificationGranted ? 'bg-emerald-600/20 text-emerald-400' : 'bg-purple-600 text-white'
                }`}
              >
                {notificationGranted ? 'Allowed ✓' : 'Allow'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-xs text-white">Background Running</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Keeps Loudbox awake during store hours</p>
                </div>
              </div>

              <button
                onClick={() => setBatteryGranted(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                  batteryGranted ? 'bg-emerald-600/20 text-emerald-400' : 'bg-purple-600 text-white'
                }`}
              >
                {batteryGranted ? 'Enabled ✓' : 'Enable'}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setNotificationGranted(true);
              setBatteryGranted(true);
              setCurrentStep(4);
            }}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: Ready */}
      {currentStep === 4 && (
        <div className="my-auto flex flex-col items-center text-center py-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-6">
            <Check className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
            Loudbox is Ready!
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
            Payments to <span className="font-medium text-white">"{shopName}"</span> will be announced in{' '}
            <span className="text-purple-400 font-medium">
              {currentVoiceOption.nativeName} ({currentVoiceOption.name})
            </span>.
          </p>

          <button
            onClick={handleFinishOnboarding}
            className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Loudbox Counter</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Volume2, 
  Languages, 
  Bell, 
  Bluetooth, 
  BatteryCharging, 
  Store, 
  Play, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Info, 
  Radio, 
  Search, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Globe, 
  ChevronRight,
  ArrowLeft,
  Palette,
  Sun,
  Moon,
  Zap,
  FileText,
  Smartphone,
  UserCheck,
  AlertTriangle,
  Ban,
  RefreshCw,
  User
} from 'lucide-react';
import { 
  parseUpiNotification, 
  SAMPLE_NOTIFICATION_TEST_CASES, 
  ParsedUpiNotification, 
  resetDeduplicationCache 
} from '../utils/upiNotificationParser';
import { MerchantProfile } from '../types/soundbox';
import { 
  AudioSettings, 
  SUPPORTED_LANGUAGES, 
  LanguageCode, 
  LanguageOption, 
  announcePaymentAlert, 
  playSoundboxChime, 
  playLanguageSample, 
  buildSpokenText, 
  buildPhoneticSpokenText, 
  resolveBestVoiceForAlert 
} from '../utils/audioEngine';
import { 
  AppLanguage, 
  SUPPORTED_APP_LANGUAGES, 
  t 
} from '../utils/i18n';
import { 
  AppThemeId, 
  APP_THEMES, 
  getThemeConfig 
} from '../utils/themeEngine';

export type SubmenuId = 
  | 'app_language' 
  | 'voice_alert' 
  | 'audio_chime' 
  | 'theme_display'
  | 'notifications' 
  | 'counter_awake' 
  | 'bluetooth' 
  | 'profile'
  | 'privacy_policy'
  | 'oem_guide';

interface SettingsScreenProps {
  merchant: MerchantProfile;
  setMerchant: React.Dispatch<React.SetStateAction<MerchantProfile>>;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  setIsSpeaking: (speaking: boolean) => void;
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  appTheme?: AppThemeId;
  setAppTheme?: (theme: AppThemeId) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  merchant,
  setMerchant,
  audioSettings,
  setAudioSettings,
  setIsSpeaking,
  appLanguage,
  setAppLanguage,
  appTheme = 'midnight',
  setAppTheme,
}) => {
  // Navigation: null shows first-level Submenu Hub; a SubmenuId shows that specific submenu
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuId | null>(null);

  const currentThemeConfig = getThemeConfig(appTheme);

  const [notificationToggles, setNotificationToggles] = useState({
    gpay: true,
    phonepe: true,
    paytm: true,
    bhim: true,
    amazonpay: true,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(merchant.businessName);
  const [editUpi, setEditUpi] = useState(merchant.upiId);

  // Language feature states
  const [langSearch, setLangSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'popular' | 'regional' | 'south' | 'dialects'>('all');
  const [previewingLang, setPreviewingLang] = useState<LanguageCode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pronunciation testing states
  const [pronunciationTestAmount, setPronunciationTestAmount] = useState<number>(500);
  const [pronunciationApp, setPronunciationApp] = useState<'paytm' | 'phonepe' | 'gpay' | 'bhim'>('paytm');

  // Notification Parser & Sender Name Testing States
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>('gpay_with_name');
  const [testNotifTitle, setTestNotifTitle] = useState<string>('Rahul Sharma');
  const [testNotifBody, setTestNotifBody] = useState<string>('Paid you ₹500.00 via Google Pay');
  const [parsedResult, setParsedResult] = useState<ParsedUpiNotification>(() =>
    parseUpiNotification('Rahul Sharma', 'Paid you ₹500.00 via Google Pay', undefined, { checkDuplicates: false })
  );
  const [testDuplicateStatus, setTestDuplicateStatus] = useState<string | null>(null);


  // App UI display language states
  const [appLangSearch, setAppLangSearch] = useState('');
  const [appLangCategory, setAppLangCategory] = useState<'all' | 'popular' | 'regional' | 'south' | 'dialects'>('all');

  const currentAppLangObj = useMemo(() => {
    return SUPPORTED_APP_LANGUAGES.find((l) => l.code === appLanguage) || SUPPORTED_APP_LANGUAGES[0];
  }, [appLanguage]);

  const filteredAppLanguages = useMemo(() => {
    return SUPPORTED_APP_LANGUAGES.filter((l) => {
      if (appLangSearch.trim()) {
        const q = appLangSearch.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesNative = l.nativeName.toLowerCase().includes(q);
        const matchesRegion = l.region.toLowerCase().includes(q);
        const matchesCode = l.code.toLowerCase().includes(q);
        if (!matchesName && !matchesNative && !matchesRegion && !matchesCode) return false;
      }
      if (appLangCategory === 'popular') {
        return ['hi', 'en', 'hinglish'].includes(l.code);
      }
      if (appLangCategory === 'regional') {
        return ['mr', 'gu', 'pa', 'bn', 'or', 'as'].includes(l.code);
      }
      if (appLangCategory === 'south') {
        return ['ta', 'te', 'kn', 'ml'].includes(l.code);
      }
      if (appLangCategory === 'dialects') {
        return ['bho', 'raj'].includes(l.code);
      }
      return true;
    });
  }, [appLangSearch, appLangCategory]);

  // Active language config
  const activeLanguageConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === audioSettings.selectedLanguage) || SUPPORTED_LANGUAGES[0];
  }, [audioSettings.selectedLanguage]);

  // Language category classification
  const categorizedLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((lang) => {
      if (langSearch.trim()) {
        const query = langSearch.toLowerCase();
        const matchesName = lang.name.toLowerCase().includes(query);
        const matchesNative = lang.nativeName.toLowerCase().includes(query);
        const matchesRegion = lang.region?.toLowerCase().includes(query) || false;
        const matchesCode = lang.code.toLowerCase().includes(query);
        if (!matchesName && !matchesNative && !matchesRegion && !matchesCode) return false;
      }

      if (categoryFilter === 'popular') {
        return ['hi', 'en', 'hinglish'].includes(lang.code);
      }
      if (categoryFilter === 'regional') {
        return ['mr', 'gu', 'pa', 'bn', 'or', 'as'].includes(lang.code);
      }
      if (categoryFilter === 'south') {
        return ['ta', 'te', 'kn', 'ml'].includes(lang.code);
      }
      if (categoryFilter === 'dialects') {
        return ['bho', 'raj'].includes(lang.code);
      }
      return true;
    });
  }, [langSearch, categoryFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectLanguage = async (lang: LanguageOption, autoPlay = true) => {
    setAudioSettings((prev) => ({ ...prev, selectedLanguage: lang.code }));
    showToast(`Voice alert set to ${lang.nativeName} (${lang.name})`);

    if (autoPlay) {
      setPreviewingLang(lang.code);
      await playLanguageSample(lang.code, audioSettings, (speaking) => {
        setIsSpeaking(speaking);
        if (!speaking) setPreviewingLang(null);
      }, 500, 'paytm');
    }
  };

  const handlePreviewSpecific = async (e: React.MouseEvent, langCode: LanguageCode) => {
    e.stopPropagation();
    setPreviewingLang(langCode);
    await playLanguageSample(langCode, audioSettings, (speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) setPreviewingLang(null);
    }, 500, 'paytm');
  };

  const handleTestAlert = () => {
    announcePaymentAlert(500, 'paytm', audioSettings, 'Test Customer', setIsSpeaking);
  };

  const handleTestChime = () => {
    playSoundboxChime(audioSettings.chimeStyle, audioSettings.volume);
  };

  const handleSaveProfile = () => {
    setMerchant((prev) => ({
      ...prev,
      businessName: editName || prev.businessName,
      upiId: editUpi || prev.upiId,
    }));
    setIsEditingProfile(false);
    showToast('Store profile updated successfully');
  };

  // Back button label
  const backLabel = t(appLanguage, 'back_to_settings');

  return (
    <div className="flex flex-col gap-4 p-4 text-white relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="sticky top-2 z-50 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-purple-400/40 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-purple-200 hover:text-white cursor-pointer ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          LEVEL 1: SUBMENU HUB / OVERVIEW LIST (When no submenu is selected)
         ========================================================================= */}
      {activeSubmenu === null && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Screen Title */}
          <div>
            <h2 className="font-bold text-lg text-white tracking-tight">{t(appLanguage, 'settings_title')}</h2>
            <p className="text-xs text-slate-400">{t(appLanguage, 'settings_subtitle')}</p>
          </div>

          {/* Quick Status Snapshot Card */}
          <div className="bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-purple-600/30 shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white truncate">{merchant.businessName}</h3>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">{merchant.upiId}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-purple-300 flex-wrap">
                  <span className="bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-700/40 font-semibold">
                    📱 {currentAppLangObj.nativeName}
                  </span>
                  <span className="bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-700/40 font-semibold">
                    🔊 {activeLanguageConfig.nativeName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: LANGUAGE & AUDIO */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {t(appLanguage, 'section_lang_sound')}
            </span>

            {/* 1. App Display Language Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('app_language')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'app_language_title')}</span>
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      15 Lang
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {currentAppLangObj.nativeName} ({currentAppLangObj.name}) • {currentAppLangObj.region}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition shrink-0" />
            </button>

            {/* 2. Voice Alert Language & Pronunciation Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('voice_alert')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'voice_alert_title')}</span>
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      {activeLanguageConfig.code.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {activeLanguageConfig.nativeName} ({activeLanguageConfig.name}) • "{buildSpokenText(500, 'paytm', activeLanguageConfig.code)}"
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition shrink-0" />
            </button>

            {/* 3. Chimes, Volume & Voice Mode Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('audio_chime')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'chime_volume_title')}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                      {Math.round(audioSettings.volume * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {audioSettings.chimeStyle.toUpperCase()} Chime • {audioSettings.voiceMode || 'auto'} voice mode
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition shrink-0" />
            </button>

            {/* 3b. App Theme & Counter Display Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('theme_display')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:bg-pink-600 group-hover:text-white transition">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">App Theme & Display</span>
                    <span className="text-[9px] bg-pink-950 text-pink-300 border border-pink-700/40 px-1.5 py-0.2 rounded font-semibold uppercase flex items-center gap-1">
                      <span>{currentThemeConfig.badge}</span>
                      <span>{currentThemeConfig.name.split(' ')[0]}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Light Mode, OLED Battery Saver & 6 themes • 0 KB extra size
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 transition shrink-0" />
            </button>
          </div>

          {/* SECTION 2: DEVICE & ALERTS */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {t(appLanguage, 'section_device_alerts')}
            </span>

            {/* 4. Notification Listener Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('notifications')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'notification_listener')}</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      {t(appLanguage, 'status_active_badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {Object.values(notificationToggles).filter(Boolean).length}/5 UPI apps enabled (GPay, PhonePe, Paytm...)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition shrink-0" />
            </button>

            {/* 5. Counter Mode & Screen Wake Lock Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('counter_awake')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'counter_stand_awake_title')}</span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      {t(appLanguage, 'status_standby_badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Keep screen on & active during business hours
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0" />
            </button>

            {/* 6. Bluetooth Speaker Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('bluetooth')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-white">{t(appLanguage, 'bluetooth_speaker_title')}</span>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Broadcast loud payments to counter Bluetooth speakers
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition shrink-0" />
            </button>
          </div>

          {/* SECTION 3: STORE & BUSINESS */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {t(appLanguage, 'section_store_profile')}
            </span>

            {/* 7. Store Profile Submenu Button */}
            <button
              onClick={() => setActiveSubmenu('profile')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{t(appLanguage, 'shop_profile')}</span>
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      {t(appLanguage, 'status_store_badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {merchant.businessName} • {merchant.upiId}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition shrink-0" />
            </button>
          </div>

          {/* SECTION 4: PRODUCTION & COMPLIANCE */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Google Play & Phone Optimization
            </span>

            {/* 8. OEM Background & Battery Guide */}
            <button
              onClick={() => setActiveSubmenu('oem_guide')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Keep Running in Background</span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      Xiaomi / Samsung / Vivo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Prevent aggressive Android battery killers from silencing payments
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0" />
            </button>

            {/* 9. Privacy Policy & Google Play Compliance Submenu */}
            <button
              onClick={() => setActiveSubmenu('privacy_policy')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition text-left cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Privacy Policy & Data Safety</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      Google Play Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Zero server uploads • 100% on-device processing • No SMS read
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          LEVEL 2: SUBMENU DETAILS (Rendered when a specific submenu is active)
         ========================================================================= */}
      {activeSubmenu !== null && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-3 duration-200">
          {/* Submenu Top Navigation Bar with Back Button */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <button
              onClick={() => setActiveSubmenu(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
              <span>{backLabel}</span>
            </button>

            <span className="text-[11px] font-bold text-slate-400">
              {activeSubmenu === 'app_language' && t(appLanguage, 'app_language_title')}
              {activeSubmenu === 'voice_alert' && t(appLanguage, 'voice_alert_title')}
              {activeSubmenu === 'audio_chime' && t(appLanguage, 'chime_volume_title')}
              {activeSubmenu === 'notifications' && t(appLanguage, 'notification_listener')}
              {activeSubmenu === 'counter_awake' && t(appLanguage, 'counter_stand_awake_title')}
              {activeSubmenu === 'bluetooth' && t(appLanguage, 'bluetooth_speaker_title')}
              {activeSubmenu === 'profile' && t(appLanguage, 'shop_profile')}
              {activeSubmenu === 'oem_guide' && 'OEM Background & Battery Guide'}
              {activeSubmenu === 'privacy_policy' && 'Privacy Policy & Data Safety'}
            </span>
          </div>

          {/* SUBMENU 1: APP DISPLAY LANGUAGE */}
          {activeSubmenu === 'app_language' && (
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {t(appLanguage, 'app_language_title')}
                    </h3>
                    <p className="text-[10px] text-slate-400">{t(appLanguage, 'app_language_subtitle')}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-700/50 font-bold font-mono">
                  15 Languages
                </span>
              </div>

              {/* Current Active App Language Card */}
              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    {currentAppLangObj.badge}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-white tracking-tight">
                        {currentAppLangObj.nativeName}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {t(appLanguage, 'active_language')}
                      </span>
                    </div>
                    <span className="text-xs text-indigo-200/80 block mt-0.5 font-medium">
                      {currentAppLangObj.name} • {currentAppLangObj.region}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informative distinction callout */}
              <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-slate-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-white font-semibold block">
                    {t(appLanguage, 'app_language_title')}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {t(appLanguage, 'app_language_subtitle')}
                  </span>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={appLangSearch}
                  onChange={(e) => setAppLangSearch(e.target.value)}
                  placeholder={t(appLanguage, 'search_app_lang')}
                  className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {appLangSearch && (
                  <button
                    onClick={() => setAppLangSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Regional Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold">
                {[
                  { id: 'all', label: t(appLanguage, 'cat_all_languages') },
                  { id: 'popular', label: t(appLanguage, 'cat_popular') },
                  { id: 'south', label: t(appLanguage, 'cat_south_india') },
                  { id: 'regional', label: t(appLanguage, 'cat_regional_east') },
                  { id: 'dialects', label: t(appLanguage, 'cat_dialects') },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAppLangCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                      appLangCategory === cat.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Full 15 Languages List */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredAppLanguages.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                    {t(appLanguage, 'no_lang_found')} "{appLangSearch}".
                  </div>
                ) : (
                  filteredAppLanguages.map((l) => {
                    const isSelected = appLanguage === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => {
                          setAppLanguage(l.code);
                          showToast(`App language set to ${l.nativeName} (${l.name})!`);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/60'
                            : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                            isSelected
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow'
                              : 'bg-slate-800 text-indigo-300 border border-slate-700/60'
                          }`}>
                            {l.badge}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white tracking-tight">{l.nativeName}</span>
                              <span className="text-xs text-slate-400 font-medium">({l.name})</span>
                              {isSelected && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  {t(appLanguage, 'active_language')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {l.region}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SUBMENU 2: VOICE ALERT REGIONAL LANGUAGE & PRONUNCIATION */}
          {activeSubmenu === 'voice_alert' && (
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl p-4 shadow-xl flex flex-col gap-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {t(appLanguage, 'voice_alert_title')}
                    </h3>
                    <p className="text-[10px] text-slate-400">{t(appLanguage, 'voice_alert_subtitle')}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-700/50 font-bold font-mono">
                  15 Languages
                </span>
              </div>

              {/* Current Active Language Spotlight Card */}
              <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {t(appLanguage, 'active_voice_alert')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-md border border-purple-700/40">
                      {activeLanguageConfig.code.toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                      {t(appLanguage, 'authentic_phonetics')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-extrabold text-white tracking-tight truncate">
                      {activeLanguageConfig.nativeName}
                    </span>
                    <span className="text-xs text-purple-300 shrink-0">
                      ({activeLanguageConfig.name})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      announcePaymentAlert(pronunciationTestAmount, pronunciationApp, audioSettings, 'Test Customer', setIsSpeaking);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>{t(appLanguage, 'test_audio')}</span>
                  </button>
                </div>

                {/* Spoken Text Announcement Card */}
                <div className="bg-slate-950/70 border border-purple-500/25 rounded-xl p-2.5 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                    {t(appLanguage, 'native_phrase_title')} ({pronunciationApp.toUpperCase()} - ₹{pronunciationTestAmount}):
                  </span>
                  <p className="text-xs text-emerald-400 font-bold font-mono break-words leading-relaxed">
                    "{buildSpokenText(pronunciationTestAmount, pronunciationApp, activeLanguageConfig.code)}"
                  </p>
                  <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{t(appLanguage, 'phonetic_guide')}</span>
                    <span className="text-purple-300 font-mono italic">
                      "{buildPhoneticSpokenText(pronunciationTestAmount, pronunciationApp, activeLanguageConfig.code)}"
                    </span>
                  </div>
                </div>

                {/* Test Numbers */}
                <div className="pt-2 border-t border-purple-800/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                    <span>{t(appLanguage, 'test_number_pronunciation')}</span>
                    <span className="text-purple-400 font-mono">{t(appLanguage, 'tap_amount_to_listen')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono font-bold">
                    {[10, 25, 50, 100, 150, 500, 1000, 2000].map((amt) => {
                      const isActiveAmt = pronunciationTestAmount === amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => {
                            setPronunciationTestAmount(amt);
                            announcePaymentAlert(amt, pronunciationApp, audioSettings, 'Test Customer', setIsSpeaking);
                          }}
                          className={`px-2.5 py-1 rounded-xl transition cursor-pointer border whitespace-nowrap ${
                            isActiveAmt
                              ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                              : 'bg-slate-900/80 border-slate-700/80 text-purple-300 hover:border-purple-500 hover:text-white'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-semibold">
                {[
                  { id: 'all', label: t(appLanguage, 'cat_all_languages') },
                  { id: 'popular', label: t(appLanguage, 'cat_popular') },
                  { id: 'south', label: t(appLanguage, 'cat_south_india') },
                  { id: 'regional', label: t(appLanguage, 'cat_regional_east') },
                  { id: 'dialects', label: t(appLanguage, 'cat_dialects') },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                      categoryFilter === cat.id
                        ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder={t(appLanguage, 'search_lang_placeholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {langSearch && (
                  <button
                    onClick={() => setLangSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Languages Selection List */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                {categorizedLanguages.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                    {t(appLanguage, 'no_lang_found')} "{langSearch}".
                  </div>
                ) : (
                  categorizedLanguages.map((lang) => {
                    const isSelected = audioSettings.selectedLanguage === lang.code;
                    const isPlayingThis = previewingLang === lang.code;

                    return (
                      <div
                        key={lang.code}
                        onClick={() => handleSelectLanguage(lang, false)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500 text-white shadow-[0_0_18px_rgba(124,58,237,0.25)] ring-1 ring-purple-500/60'
                            : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
                            isSelected
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                              : 'bg-slate-800 text-purple-300 border border-slate-700/60'
                          }`}>
                            {lang.badge}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-white tracking-tight">{lang.nativeName}</span>
                              <span className="text-[11px] text-slate-400 font-medium">({lang.name})</span>
                              {isSelected && (
                                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  {t(appLanguage, 'status_active')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-purple-300/80 mt-0.5 truncate font-mono">
                              "{buildSpokenText(500, 'paytm', lang.code)}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => handlePreviewSpecific(e, lang.code)}
                            title={`Listen to sample in ${lang.name}`}
                            className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                              isPlayingThis
                                ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                                : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isPlayingThis ? t(appLanguage, 'playing_btn') : t(appLanguage, 'listen_btn')}</span>
                          </button>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                              : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SUBMENU 3: SOUNDBOX CHIMES & VOLUME */}
          {activeSubmenu === 'audio_chime' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  {t(appLanguage, 'chime_volume_title')}
                </h3>
              </div>

              {/* Chime selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-semibold">{t(appLanguage, 'chime_style')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'paytm', label: t(appLanguage, 'chime_paytm') },
                    { id: 'phonepe', label: t(appLanguage, 'chime_phonepe') },
                    { id: 'gpay', label: t(appLanguage, 'chime_gpay') },
                    { id: 'classic', label: t(appLanguage, 'chime_classic') },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setAudioSettings((prev) => ({ ...prev, chimeStyle: style.id as any }));
                        playSoundboxChime(style.id as any, audioSettings.volume);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between cursor-pointer ${
                        audioSettings.chimeStyle === style.id
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{style.label}</span>
                      {audioSettings.chimeStyle === style.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTestChime}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 self-start mt-1 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-purple-400" />
                  <span>{t(appLanguage, 'play_chime_sample')}</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{t(appLanguage, 'announcement_volume')}</span>
                  <span className="font-mono font-bold text-purple-400">
                    {Math.round(audioSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={audioSettings.volume}
                  onChange={(e) =>
                    setAudioSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))
                  }
                  aria-label={t(appLanguage, 'announcement_volume')}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Voice Mode Selector */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-semibold">{t(appLanguage, 'voice_mode')}</span>
                  <span className="text-purple-400 font-mono text-[11px] uppercase">
                    {audioSettings.voiceMode || 'auto'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'auto', label: t(appLanguage, 'voice_mode_auto') },
                    { id: 'native', label: t(appLanguage, 'voice_mode_native') },
                    { id: 'phonetic', label: t(appLanguage, 'voice_mode_phonetic') },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        setAudioSettings((prev) => ({ ...prev, voiceMode: mode.id as any }))
                      }
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-center transition cursor-pointer ${
                        (audioSettings.voiceMode || 'auto') === mode.id
                          ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Auto automatically adapts pronunciation to your device's installed voices (Marathi, Hindi Devanagari, or Indian English).
                </p>
              </div>

              {/* Announce Sender Name Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="space-y-0.5 max-w-[75%]">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                    <span>Announce Sender / Payer Name</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Speaks customer's name with amount (e.g. "Received ₹500 from Rahul Sharma"). If turned off or name is unknown, announces amount only.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setAudioSettings((prev) => ({
                      ...prev,
                      announceSenderName: !(prev.announceSenderName ?? true),
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    audioSettings.announceSenderName !== false ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      audioSettings.announceSenderName !== false ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Regional Accuracy Note */}

              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5 text-[10px] text-slate-300 flex flex-col gap-1">
                <span className="font-bold text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Regional Grammar & Number Engine:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Marathi, Hindi, Gujarati, Punjabi, Bengali, Tamil, Telugu, and Kannada use dedicated number-to-words converters (e.g. ₹50 → पन्नास, ₹100 → शंभर, ₹500 → पाचशे) and proper grammar particles ('...वर ...रुपये मिळाले') so zero raw digits confuse the speech engine.
                </p>
              </div>

              {/* Test Alert Button */}
              <button
                onClick={handleTestAlert}
                className="w-full py-2.5 px-3 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-purple-300" />
                <span>Test Current Soundbox Voice Alert</span>
              </button>
            </div>
          )}

          {/* SUBMENU 4: NOTIFICATION LISTENER PERMISSIONS & PARSER */}
          {activeSubmenu === 'notifications' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {t(appLanguage, 'notification_listener')}
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  {t(appLanguage, 'permission_granted')}
                </span>
              </div>

              {/* PRIMARY FEATURE: Payer / Sender Name Announcement Setting */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs block">Announce Sender / Payer Name</span>
                      <span className="text-[10px] text-purple-300 font-medium">
                        {audioSettings.announceSenderName !== false
                          ? '✓ ON: Speaks Payer Name + Amount'
                          : '✕ OFF: Speaks Amount Only'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setAudioSettings((prev) => ({
                        ...prev,
                        announceSenderName: !(prev.announceSenderName ?? true),
                      }))
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      audioSettings.announceSenderName !== false ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        audioSettings.announceSenderName !== false ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  Loudbox parses incoming payment notifications from Google Pay, PhonePe, Paytm, BHIM, etc., and speaks both the customer's name and amount aloud (e.g. <em>"गूगल पे पर राहुल शर्मा से ₹५०० प्राप्त हुए"</em>). If switched OFF or if the sender's name is not in the notification, it announces only the amount.
                </p>
              </div>

              {/* Fraud, False Alert & Duplicate Protection Shield */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>False Alert & Fraud Shield (Automatic)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400/80 font-mono">100% On-Device</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Blocks Failed Alerts</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Blocks Pending Collects</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Blocks Outgoing Debits</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Blocks Refunds & OTPs</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Outgoing debits (when you spend money), failed payments, unapproved collect requests, and duplicate alerts within 45s are automatically rejected.
                </p>
              </div>

              {/* Supported UPI Apps Toggles */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300 block">Monitored UPI Apps</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'gpay', label: 'Google Pay Alerts' },
                    { id: 'phonepe', label: 'PhonePe UPI Alerts' },
                    { id: 'paytm', label: 'Paytm Payments Alerts' },
                    { id: 'bhim', label: 'BHIM UPI Alerts' },
                    { id: 'amazonpay', label: 'Amazon Pay Alerts' },
                  ].map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                    >
                      <span className="font-medium text-slate-300 text-[11px]">{app.label}</span>
                      <button
                        onClick={() =>
                          setNotificationToggles((prev) => ({
                            ...prev,
                            [app.id]: !prev[app.id as keyof typeof prev],
                          }))
                        }
                        className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                          notificationToggles[app.id as keyof typeof notificationToggles]
                            ? 'bg-purple-600'
                            : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                            notificationToggles[app.id as keyof typeof notificationToggles]
                              ? 'left-[17px]'
                              : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* INTERACTIVE NOTIFICATION PARSER & EXTRACTOR SIMULATOR */}
              <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Notification Parser & Safety Tester</span>
                  </div>
                  <button
                    onClick={() => {
                      resetDeduplicationCache();
                      setTestDuplicateStatus('Debounce cache cleared: ready for testing');
                      setTimeout(() => setTestDuplicateStatus(null), 3000);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    title="Clear 45-second debounce memory"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset Cache</span>
                  </button>
                </div>

                {/* Scenario Picker */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Choose Notification Test Case:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SAMPLE_NOTIFICATION_TEST_CASES.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => {
                          setSelectedTestCaseId(tc.id);
                          setTestNotifTitle(tc.title);
                          setTestNotifBody(tc.body);
                          const res = parseUpiNotification(tc.title, tc.body, undefined, { checkDuplicates: false });
                          setParsedResult(res);
                        }}
                        className={`text-left p-2 rounded-xl border text-[11px] transition cursor-pointer flex flex-col justify-between ${
                          selectedTestCaseId === tc.id
                            ? 'bg-purple-950/70 border-purple-400 text-white shadow-sm ring-1 ring-purple-500/50'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold truncate text-[11px]">{tc.name}</span>
                        <span className="text-[9px] text-slate-400 line-clamp-1">{tc.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-400 font-mono">Notification Title:</label>
                    <input
                      type="text"
                      value={testNotifTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTestNotifTitle(val);
                        setParsedResult(parseUpiNotification(val, testNotifBody, undefined, { checkDuplicates: false }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-slate-400 font-mono">Notification Message Body:</label>
                    <textarea
                      rows={2}
                      value={testNotifBody}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTestNotifBody(val);
                        setParsedResult(parseUpiNotification(testNotifTitle, val, undefined, { checkDuplicates: false }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>

                {/* Live Analysis Card */}
                {parsedResult && (
                  <div className={`p-3 rounded-xl border space-y-2 ${
                    parsedResult.isValidPayment
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                        parsedResult.isValidPayment
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {parsedResult.isValidPayment ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{t(appLanguage, 'valid_incoming_payment')}</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Blocked: {parsedResult.rejectionReason}</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400">
                        App: <strong className="text-white">{parsedResult.appName}</strong>
                      </span>
                    </div>

                    {parsedResult.isValidPayment ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t(appLanguage, 'extracted_amount')}</span>
                            <span className="font-bold font-mono text-emerald-400 text-sm">
                              ₹{parsedResult.amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t(appLanguage, 'extracted_sender')}</span>
                            <span className="font-bold text-white text-xs">
                              {parsedResult.senderName ? (
                                <span className="text-purple-300 flex items-center gap-1">
                                  <User className="w-3 h-3 text-purple-400" />
                                  {parsedResult.senderName}
                                </span>
                              ) : (
                                <span className="text-amber-300 italic text-[10px]">None (Announcing amount only)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Spoken Voice Preview */}
                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                            🔊 Spoken Announcement ({audioSettings.announceSenderName !== false && parsedResult.senderName ? 'Name + Amount' : 'Amount Only'}):
                          </span>
                          <p className="text-xs text-purple-200 font-mono mt-0.5 font-bold leading-relaxed">
                            "{buildSpokenText(
                              parsedResult.amount || 0,
                              parsedResult.upiApp,
                              audioSettings.selectedLanguage,
                              audioSettings.announceSenderName !== false ? parsedResult.senderName : undefined
                            )}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-200 bg-slate-900/60 p-2.5 rounded-lg border border-rose-900/40">
                        <span className="font-bold text-rose-400 block text-xs">{t(appLanguage, 'false_alert_protection')}</span>
                        <p className="text-slate-300 text-[10px] mt-0.5 leading-relaxed">
                          {parsedResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {parsedResult.isValidPayment ? (
                        <button
                          onClick={async () => {
                            if (parsedResult.amount) {
                              await announcePaymentAlert(
                                parsedResult.amount,
                                parsedResult.upiApp,
                                audioSettings,
                                parsedResult.senderName,
                                setIsSpeaking
                              );
                            }
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{t(appLanguage, 'announce_tts_btn')}</span>
                        </button>
                      ) : (
                        <div className="flex-1 py-1.5 text-center text-[10px] text-slate-400 italic">
                          Voice alert suppressed (Safety filter active)
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const res = parseUpiNotification(testNotifTitle, testNotifBody, undefined, { checkDuplicates: true });
                          if (!res.isValidPayment && res.rejectionReason === 'DUPLICATE_NOTIFICATION') {
                            setTestDuplicateStatus('✓ Duplicate Blocked: Successfully caught repeat alert within 45s!');
                          } else {
                            setTestDuplicateStatus('First alert cached in memory. Click again within 45s to test duplicate blocking!');
                          }
                          setTimeout(() => setTestDuplicateStatus(null), 4000);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white font-semibold text-xs transition cursor-pointer"
                        title="Simulate receiving the same notification twice within 45s"
                      >
                        Test Duplicate Filter
                      </button>
                    </div>

                    {testDuplicateStatus && (
                      <p className="text-[10px] text-amber-300 font-mono text-center animate-pulse pt-0.5">
                        {testDuplicateStatus}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* SUBMENU 5: COUNTER MODE & SCREEN WAKE LOCK */}
          {activeSubmenu === 'counter_awake' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {t(appLanguage, 'counter_stand_awake_title')}
                  </h3>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  {t(appLanguage, 'store_mode')}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                {t(appLanguage, 'counter_stand_awake_desc')}
              </p>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-white block">{t(appLanguage, 'prevent_screen_sleep')}</span>
                  <span className="text-[10px] text-slate-400">Keeps display always active on your shop counter</span>
                </div>

                <button
                  onClick={async () => {
                    if ('wakeLock' in navigator) {
                      try {
                        await (navigator as any).wakeLock.request('screen');
                        showToast('Counter Mode: Screen will remain awake for alerts');
                      } catch (e) {
                        showToast('Wake Lock activated for this session');
                      }
                    } else {
                      showToast('Keep display timeout set to "Never" or plugged into charger');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
                >
                  {t(appLanguage, 'enable_wake_lock')}
                </button>
              </div>

              {/* Merchant Friendly Tip */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Shop Counter Tip</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  Keep your phone connected to a charger on your cash counter stand. When screen awake is enabled, payment notifications announce out loud without entering phone sleep mode.
                </p>
              </div>
            </div>
          )}

          {/* SUBMENU 6: BLUETOOTH SPEAKER OUTPUT */}
          {activeSubmenu === 'bluetooth' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  {t(appLanguage, 'bluetooth_speaker_title')}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {t(appLanguage, 'bluetooth_speaker_desc')}
              </p>
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                  <div>
                    <p className="font-semibold">{t(appLanguage, 'bluetooth_output')}</p>
                    <p className="text-[10px] text-blue-400/80">{t(appLanguage, 'bluetooth_broadcasting')}</p>
                  </div>
                </div>
                <button
                  onClick={handleTestChime}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer active:scale-95 transition"
                >
                  {t(appLanguage, 'test_btn')}
                </button>
              </div>
            </div>
          )}

          {/* SUBMENU 7: MERCHANT STORE PROFILE */}
          {activeSubmenu === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {t(appLanguage, 'shop_profile')}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (isEditingProfile) handleSaveProfile();
                    else setIsEditingProfile(true);
                  }}
                  className="text-xs px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer transition active:scale-95"
                >
                  {isEditingProfile ? t(appLanguage, 'save_btn') : t(appLanguage, 'edit_btn')}
                </button>
              </div>

              {isEditingProfile ? (
                <div className="flex flex-col gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      {t(appLanguage, 'shop_name')}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      {t(appLanguage, 'merchant_upi_id')}
                    </label>
                    <input
                      type="text"
                      value={editUpi}
                      onChange={(e) => setEditUpi(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 text-xs pt-1">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">{t(appLanguage, 'business_name_label')}</span>
                    <span className="font-semibold text-white">{merchant.businessName}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">{t(appLanguage, 'merchant_upi_label')}</span>
                    <span className="font-mono text-purple-300">{merchant.upiId}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">{t(appLanguage, 'category_label')}</span>
                    <span className="text-slate-200">{merchant.category}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBMENU: APP THEME & DISPLAY APPEARANCE */}
          {activeSubmenu === 'theme_display' && (
            <div className="flex flex-col gap-4">
              {/* Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-600/30">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">App Theme & Display</h3>
                    <p className="text-[11px] text-slate-400">Light, Dark, OLED Battery Saver & 6 Colors</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                  0 KB Extra Size
                </span>
              </div>


              {/* LIVE SIMULATED COUNTER PREVIEW CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Live Counter Preview ({currentThemeConfig.name})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time simulation</span>
                </div>

                {/* Simulated Screen Box */}
                <div 
                  className={`p-3.5 rounded-2xl border transition-all duration-300 ${currentThemeConfig.classes.bgRoot} ${currentThemeConfig.classes.border}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${currentThemeConfig.classes.accentBg} flex items-center justify-center text-white text-xs font-bold`}>
                        ₹
                      </div>
                      <span className={`text-xs font-bold ${currentThemeConfig.classes.textPrimary}`}>
                        {merchant.businessName}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentThemeConfig.classes.pillBg} font-mono`}>
                      Online
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl ${currentThemeConfig.classes.bgCard} border ${currentThemeConfig.classes.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${currentThemeConfig.classes.accentBg} flex items-center justify-center text-white shrink-0`}>
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] uppercase font-bold block ${currentThemeConfig.classes.accentText}`}>
                          Payment Received
                        </span>
                        <div className={`text-xs font-black truncate ${currentThemeConfig.classes.textPrimary}`}>
                          ₹500 from Neha Sharma
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${currentThemeConfig.classes.accentText}`}>
                      Paytm
                    </span>
                  </div>
                </div>
              </div>

              {/* THEMES SELECTION GRID */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Choose Your Theme ({APP_THEMES.length} Options)
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {APP_THEMES.map((theme) => {
                    const isSelected = appTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          if (setAppTheme) {
                            setAppTheme(theme.id);
                            showToast(`Applied ${theme.name} theme`);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-2xl shrink-0 mt-0.5">{theme.badge}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-sm text-white">{theme.name}</h4>
                                <span className="text-[10px] text-purple-300 font-medium">({theme.nativeName})</span>
                                {theme.batterySaver && (
                                  <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800 font-bold flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" /> 40% Battery Saver
                                  </span>
                                )}
                                {!theme.isDark && (
                                  <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800 font-bold flex items-center gap-0.5">
                                    <Sun className="w-2.5 h-2.5" /> Sunlight Glare-Free
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {theme.description}
                              </p>
                              <div className="text-[10px] text-purple-400 mt-1 font-medium">
                                💡 {theme.batteryBenefit}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-slate-800">
                              {theme.previewColors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="w-3 h-3 rounded-full border border-black/60 shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={`Palette color ${idx + 1}`}
                                />
                              ))}
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-xl font-bold transition ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}>
                              {isSelected ? 'Active' : 'Apply'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUBMENU 8: OEM BACKGROUND PROTECTION & BATTERY GUIDE */}
          {activeSubmenu === 'oem_guide' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Keep Active 24/7</h3>
                    <p className="text-[11px] text-slate-400">Prevent Android OEM battery killers from stopping alerts</p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Important
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Many Android phone makers (Xiaomi, Samsung, Vivo, Oppo) kill background apps to save battery. Follow your brand instructions below so Soundbox announces payments even when your screen is locked.
              </div>

              {/* Brand Accordion Guide */}
              <div className="flex flex-col gap-3 text-xs">
                {/* Xiaomi / Redmi / POCO */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Xiaomi / Redmi / POCO (MIUI / HyperOS)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Step 1 & 2</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                    <li>Open <strong>Settings → Apps → Manage Apps → Soundbox</strong>.</li>
                    <li>Enable <strong>"Autostart"</strong> (turn ON).</li>
                    <li>Tap <strong>Battery Saver</strong> and select <strong>"No restrictions"</strong>.</li>
                    <li>In Recent Apps switcher, press and hold Soundbox and tap the <strong>Lock icon 🔒</strong>.</li>
                  </ol>
                </div>

                {/* Samsung */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Samsung Galaxy (One UI)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Settings</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                    <li>Go to <strong>Settings → Battery → Background usage limits</strong>.</li>
                    <li>Tap <strong>"Never sleeping apps"</strong> → Tap <strong>+</strong> and add <strong>Soundbox</strong>.</li>
                    <li>Under App Info → Battery, choose <strong>"Unrestricted"</strong>.</li>
                  </ol>
                </div>

                {/* Realme / Oppo / OnePlus */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Realme / Oppo / OnePlus (ColorOS)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Battery</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                    <li>Long press Soundbox app icon → Tap <strong>App Info</strong>.</li>
                    <li>Go to <strong>Battery usage</strong> → Enable <strong>"Allow background activity"</strong> and <strong>"Allow auto-launch"</strong>.</li>
                  </ol>
                </div>

                {/* Vivo / iQOO */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Vivo / iQOO (Funtouch OS)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Power</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                    <li>Open <strong>Settings → Battery → High background power consumption</strong>.</li>
                    <li>Toggle ON <strong>Soundbox</strong> to prevent sleep mode.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* SUBMENU 9: PRIVACY POLICY & GOOGLE PLAY DATA SAFETY */}
          {activeSubmenu === 'privacy_policy' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Privacy Policy & Data Safety</h3>
                    <p className="text-[11px] text-slate-400">Google Play Developer Policy Compliant</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  100% Private
                </span>
              </div>

              {/* Key Commitments Box */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-emerald-400 font-bold text-[11px]">✓ On-Device Only</span>
                  <span className="text-[10px] text-slate-400">All alerts parsed locally in memory. Zero cloud transmission.</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-emerald-400 font-bold text-[11px]">✓ No SMS or OTP Access</span>
                  <span className="text-[10px] text-slate-400">We never request SMS or banking OTP permissions.</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-emerald-400 font-bold text-[11px]">✓ No Personal Chat Reading</span>
                  <span className="text-[10px] text-slate-400">Ignores WhatsApp, messages, emails, and calls.</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-emerald-400 font-bold text-[11px]">✓ No Ads or Trackers</span>
                  <span className="text-[10px] text-slate-400">Zero third-party tracking SDKs or marketing analytics.</span>
                </div>
              </div>

              {/* Policy Body */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5 text-[11px] text-slate-300 leading-relaxed max-h-72 overflow-y-auto">
                <h4 className="font-bold text-white text-xs">1. What Information We Access</h4>
                <p>
                  Soundbox requests Android's <code>BIND_NOTIFICATION_LISTENER_SERVICE</code> permission solely to detect incoming payment confirmations sent by official UPI applications (such as Google Pay for Business, PhonePe Business, Paytm for Business, and BHIM UPI).
                </p>

                <h4 className="font-bold text-white text-xs">2. How Notification Data Is Handled</h4>
                <p>
                  When a notification arrives from a supported payment application, the app checks the notification text for transaction confirmation phrases (e.g., "Received ₹500"). It uses local device regular expressions to extract the received amount and trigger an immediate voice announcement via Android Text-to-Speech (TTS). Once spoken, the notification data is discarded from device memory.
                </p>

                <h4 className="font-bold text-white text-xs">3. What We Never Collect or Store</h4>
                <p>
                  Soundbox does not collect, record, or store any sensitive banking credentials, PINs, OTP codes, card numbers, or customer contact numbers. We do not have servers collecting payment histories.
                </p>

                <h4 className="font-bold text-white text-xs">4. Third-Party Sharing</h4>
                <p>
                  Soundbox does not sell, trade, or share user or transaction data with any third parties or advertisers.
                </p>

                <h4 className="font-bold text-white text-xs">5. Contact & Questions</h4>
                <p>
                  For privacy queries or compliance questions regarding this application, merchants can contact the developer at <code>kantshri1989@gmail.com</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

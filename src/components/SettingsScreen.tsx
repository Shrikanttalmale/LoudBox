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
  Globe, 
  ChevronRight,
  ArrowLeft,
  Palette,
  FileText,
  Smartphone,
  Search,
  X
} from 'lucide-react';
import { MerchantProfile } from '../types/loudbox';
import { 
  AudioSettings, 
  SUPPORTED_LANGUAGES, 
  LanguageCode, 
  LanguageOption, 
  announcePaymentAlert, 
  playLoudboxChime, 
  playLanguageSample, 
  buildSpokenText, 
  unlockAudioContext 
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
  | 'voice_alert' 
  | 'audio_chime' 
  | 'app_language' 
  | 'theme_display'
  | 'notifications' 
  | 'counter_awake' 
  | 'bluetooth' 
  | 'profile'
  | 'oem_guide'
  | 'privacy_policy';

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
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuId | null>(null);
  const [langSearch, setLangSearch] = useState('');
  const [previewingLang, setPreviewingLang] = useState<LanguageCode | null>(null);

  // Store Profile editing
  const [storeName, setStoreName] = useState(merchant.businessName);
  const [storeUpi, setStoreUpi] = useState(merchant.upiId);

  // Notification apps toggles
  const [notificationToggles, setNotificationToggles] = useState({
    gpay: true,
    phonepe: true,
    paytm: true,
    bhim: true,
    amazonpay: true,
  });

  const currentThemeConfig = getThemeConfig(appTheme);
  const activeVoiceConfig = SUPPORTED_LANGUAGES.find((l) => l.code === audioSettings.selectedLanguage) || SUPPORTED_LANGUAGES[0];
  const activeAppLangConfig = SUPPORTED_APP_LANGUAGES.find((l) => l.code === appLanguage) || SUPPORTED_APP_LANGUAGES[0];

  const filteredVoiceLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [langSearch]);

  const filteredAppLanguages = useMemo(() => {
    if (!langSearch.trim()) return SUPPORTED_APP_LANGUAGES;
    const q = langSearch.toLowerCase();
    return SUPPORTED_APP_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.nativeName.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [langSearch]);

  const handleSelectVoiceLanguage = async (code: LanguageCode) => {
    unlockAudioContext();
    setAudioSettings((prev) => ({ ...prev, selectedLanguage: code }));
    setPreviewingLang(code);
    await playLanguageSample(code, audioSettings, (speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) setPreviewingLang(null);
    }, 500, 'paytm');
  };

  const handleSaveProfile = () => {
    setMerchant((prev) => ({
      ...prev,
      businessName: storeName || prev.businessName,
      upiId: storeUpi || prev.upiId,
    }));
    setActiveSubmenu(null);
  };

  const handleTestAlert = () => {
    unlockAudioContext();
    announcePaymentAlert(500, 'paytm', audioSettings, 'Rahul Sharma', setIsSpeaking);
  };

  const handleTestChime = () => {
    unlockAudioContext();
    playLoudboxChime(audioSettings.chimeStyle, audioSettings.volume);
  };

  return (
    <div className="flex flex-col gap-5 p-5 text-slate-100">
      {/* LEVEL 1: Main Settings Hub */}
      {activeSubmenu === null && (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h2 className="font-semibold text-base text-white tracking-tight">{t(appLanguage, 'settings_title')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t(appLanguage, 'settings_subtitle')}</p>
          </div>

          {/* Section 1: Sound & Voice */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-400 px-1 uppercase tracking-wider">
              {t(appLanguage, 'section_lang_sound')}
            </span>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              {/* Voice Alert Language */}
              <button
                onClick={() => {
                  setLangSearch('');
                  setActiveSubmenu('voice_alert');
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'voice_alert_title')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {activeVoiceConfig.nativeName} ({activeVoiceConfig.name})
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Chime & Volume */}
              <button
                onClick={() => setActiveSubmenu('audio_chime')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'chime_volume_title')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {Math.round(audioSettings.volume * 100)}% Volume · {audioSettings.chimeStyle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* App Display Language */}
              <button
                onClick={() => {
                  setLangSearch('');
                  setActiveSubmenu('app_language');
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'app_language_title')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {activeAppLangConfig.nativeName} ({activeAppLangConfig.name})
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 2: Display & Appearance */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-400 px-1 uppercase tracking-wider">
              Display & Appearance
            </span>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              {/* Theme */}
              {setAppTheme && (
                <button
                  onClick={() => setActiveSubmenu('theme_display')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-xs text-white">Theme & Display</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {currentThemeConfig.name}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}

              {/* Counter Stand Screen Awake */}
              <button
                onClick={() => setActiveSubmenu('counter_awake')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <BatteryCharging className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'counter_stand_awake_title')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Keep screen active during store hours
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Bluetooth Speaker */}
              <button
                onClick={() => setActiveSubmenu('bluetooth')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'bluetooth_speaker_title')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      External Bluetooth speaker pairing
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 3: UPI Notifications & System */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-400 px-1 uppercase tracking-wider">
              {t(appLanguage, 'section_device_alerts')}
            </span>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              <button
                onClick={() => setActiveSubmenu('notifications')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'notification_listener')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      GPay, PhonePe, Paytm, BHIM alerts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <button
                onClick={() => setActiveSubmenu('oem_guide')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">Background Optimization</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Battery settings for uninterrupted alerts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 4: Store Profile */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-slate-400 px-1 uppercase tracking-wider">
              {t(appLanguage, 'section_store_profile')}
            </span>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
              <button
                onClick={() => setActiveSubmenu('profile')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">{t(appLanguage, 'shop_profile')}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {merchant.businessName} · {merchant.upiId}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <button
                onClick={() => setActiveSubmenu('privacy_policy')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs text-white">Privacy & Data Security</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      100% on-device processing
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 2: Submenus */}
      {activeSubmenu !== null && (
        <div className="flex flex-col gap-4">
          {/* Back Navigation Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubmenu(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              aria-label="Back to settings"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-sm text-white">
              {activeSubmenu === 'voice_alert' && t(appLanguage, 'voice_alert_title')}
              {activeSubmenu === 'audio_chime' && t(appLanguage, 'chime_volume_title')}
              {activeSubmenu === 'app_language' && t(appLanguage, 'app_language_title')}
              {activeSubmenu === 'theme_display' && 'Theme & Appearance'}
              {activeSubmenu === 'notifications' && t(appLanguage, 'notification_listener')}
              {activeSubmenu === 'counter_awake' && t(appLanguage, 'counter_stand_awake_title')}
              {activeSubmenu === 'bluetooth' && t(appLanguage, 'bluetooth_speaker_title')}
              {activeSubmenu === 'profile' && t(appLanguage, 'shop_profile')}
              {activeSubmenu === 'oem_guide' && 'Background Guide'}
              {activeSubmenu === 'privacy_policy' && 'Privacy Policy'}
            </h2>
          </div>

          {/* Submenu 1: Voice Alert Language */}
          {activeSubmenu === 'voice_alert' && (
            <div className="flex flex-col gap-3">
              {/* Active Voice Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Selected Voice</span>
                  <div className="font-semibold text-sm text-white mt-0.5">
                    {activeVoiceConfig.nativeName} ({activeVoiceConfig.name})
                  </div>
                  <p className="text-xs text-emerald-400 mt-1 font-mono">
                    "{buildSpokenText(500, 'paytm', activeVoiceConfig.code)}"
                  </p>
                </div>
                <button
                  onClick={handleTestAlert}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Test</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Language List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {filteredVoiceLanguages.map((lang) => {
                  const isSelected = audioSettings.selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectVoiceLanguage(lang.code)}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
                    >
                      <div>
                        <div className="font-medium text-xs text-white">{lang.nativeName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lang.name} · {lang.region}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submenu 2: Chime & Volume */}
          {activeSubmenu === 'audio_chime' && (
            <div className="flex flex-col gap-4">
              {/* Volume Slider */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{t(appLanguage, 'volume_title')}</span>
                  <span className="font-mono text-purple-400 font-semibold">{Math.round(audioSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.volume}
                  onChange={(e) => setAudioSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="w-full accent-purple-600"
                />
              </div>

              {/* Chime Sound Style */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{t(appLanguage, 'chime_style_title')}</span>
                  <button
                    onClick={handleTestChime}
                    className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                  >
                    Test Chime
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['paytm', 'phonepe', 'gpay', 'classic', 'bell'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setAudioSettings((prev) => ({ ...prev, chimeStyle: style }));
                        playLoudboxChime(style, audioSettings.volume);
                      }}
                      className={`py-2 px-3 rounded-xl border text-left capitalize transition cursor-pointer ${
                        audioSettings.chimeStyle === style
                          ? 'bg-purple-600/20 border-purple-500 text-white font-medium'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Name Toggle */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-xs text-white">Announce Sender Name</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Speak "from Rahul Sharma" with payment</p>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings.announceSenderName !== false}
                  onChange={(e) => setAudioSettings((prev) => ({ ...prev, announceSenderName: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Submenu 3: App Language */}
          {activeSubmenu === 'app_language' && (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {filteredAppLanguages.map((l) => {
                  const isSelected = appLanguage === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setAppLanguage(l.code);
                        setActiveSubmenu(null);
                      }}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 transition cursor-pointer text-left"
                    >
                      <div>
                        <div className="font-medium text-xs text-white">{l.nativeName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{l.name} · {l.region}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submenu 4: Theme */}
          {activeSubmenu === 'theme_display' && setAppTheme && (
            <div className="grid grid-cols-1 gap-2">
              {APP_THEMES.map((th) => {
                const isSelected = appTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      setAppTheme(th.id);
                      setActiveSubmenu(null);
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{th.badge}</span>
                      <div>
                        <div className="font-medium text-xs text-white">{th.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{th.nativeName}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Submenu 5: Notifications */}
          {activeSubmenu === 'notifications' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-400">
                Enable or disable payment detection for individual UPI applications.
              </p>

              <div className="divide-y divide-slate-800">
                {[
                  { id: 'gpay', name: 'Google Pay' },
                  { id: 'phonepe', name: 'PhonePe' },
                  { id: 'paytm', name: 'Paytm' },
                  { id: 'bhim', name: 'BHIM UPI' },
                  { id: 'amazonpay', name: 'Amazon Pay' },
                ].map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <span className="font-medium text-xs text-white">{app.name}</span>
                    <input
                      type="checkbox"
                      checked={(notificationToggles as any)[app.id]}
                      onChange={(e) =>
                        setNotificationToggles((prev) => ({ ...prev, [app.id]: e.target.checked }))
                      }
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submenu 6: Screen Always Awake */}
          {activeSubmenu === 'counter_awake' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-white">Keep Screen Active</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When Loudbox is active on your shop counter, the screen remains on to display the QR stand and live payment confirmations. Plug in your charger for uninterrupted operation.
              </p>
            </div>
          )}

          {/* Submenu 7: Bluetooth */}
          {activeSubmenu === 'bluetooth' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-white">Bluetooth Counter Speaker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your Android phone to any Bluetooth speaker or soundbar from Android Bluetooth Settings. Loudbox automatically routes payment voice alerts through the connected speaker at full volume.
              </p>
            </div>
          )}

          {/* Submenu 8: Store Profile */}
          {activeSubmenu === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Store / Business Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={storeUpi}
                  onChange={(e) => setStoreUpi(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Submenu 9: OEM Background Guide */}
          {activeSubmenu === 'oem_guide' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
              <h3 className="font-semibold text-sm text-white">Preventing Battery Killers</h3>
              <p>
                Certain Android phones (Xiaomi/MIUI, Vivo/Funtouch, Samsung/OneUI) put background apps to sleep.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Go to Android Settings &gt; Apps &gt; Loudbox.</li>
                <li>Set Battery usage to <strong>Unrestricted</strong>.</li>
                <li>Enable Autostart if available on your device.</li>
              </ul>
            </div>
          )}

          {/* Submenu 10: Privacy Policy */}
          {activeSubmenu === 'privacy_policy' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
              <h3 className="font-semibold text-sm text-white">100% On-Device Privacy</h3>
              <p>
                Loudbox does not require an account, internet login, or bank credentials. All payment notification parsing and audio speech synthesis occur directly on your Android phone hardware.
              </p>
              <p className="text-slate-400">
                No bank transaction details, customer names, or amounts are sent to external servers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

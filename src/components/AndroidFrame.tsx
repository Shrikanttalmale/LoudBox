import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Volume2, 
  Smartphone, 
  ExternalLink,
  ChevronDown,
  Check,
  Palette,
  Radio,
  FileText,
  QrCode,
  Settings,
  Globe
} from 'lucide-react';

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

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: 'loudbox' | 'soundbox' | 'collections' | 'qrstand' | 'settings';
  setActiveTab: (tab: 'loudbox' | 'soundbox' | 'collections' | 'qrstand' | 'settings') => void;
  isSpeaking: boolean;
  businessName: string;
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  appTheme?: AppThemeId;
  setAppTheme?: (theme: AppThemeId) => void;
  onOpenLandingPage?: () => void;
  onExitToHomeScreen?: () => void;
  onRestartSetup?: () => void;
  isAtHomeScreen?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  setActiveTab,
  isSpeaking,
  businessName,
  appLanguage,
  setAppLanguage,
  appTheme = 'midnight',
  setAppTheme,
  onOpenLandingPage,
  onExitToHomeScreen,
  onRestartSetup,
  isAtHomeScreen = false,
}) => {
  const [timeStr, setTimeStr] = useState('09:41');
  const [isFramedView, setIsFramedView] = useState(true);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const currentThemeConfig = getThemeConfig(appTheme);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-2 sm:py-6 px-2 sm:px-4 selection:bg-purple-600 selection:text-white font-sans">
      {/* Clean Top Navigation Bar for Web Preview */}
      <header className="w-full max-w-4xl flex items-center justify-between px-4 py-2.5 mb-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs sm:text-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
            ₹
          </div>
          <span className="font-semibold text-white tracking-tight">Loudbox</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Change App Language"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>{SUPPORTED_APP_LANGUAGES.find((l) => l.code === appLanguage)?.nativeName || 'मराठी'}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-56 max-h-72 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Select Language
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {SUPPORTED_APP_LANGUAGES.map((l) => {
                      const isSelected = appLanguage === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            setAppLanguage(l.code);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-purple-600/20 text-purple-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-medium">{l.nativeName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          {setAppTheme && (
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                title="Change Theme"
              >
                <span>{currentThemeConfig.badge}</span>
                <span className="hidden sm:inline">{currentThemeConfig.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showThemeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                      Theme
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {APP_THEMES.map((th) => {
                        const isSelected = appTheme === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => {
                              setAppTheme(th.id);
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-purple-600/20 text-purple-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{th.badge}</span>
                              <span>{th.name}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Web Portal Link */}
          {onOpenLandingPage && (
            <button
              onClick={onOpenLandingPage}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
              title="View Loudbox Web Portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Website</span>
            </button>
          )}

          {/* Device Frame Toggle */}
          <button
            onClick={() => setIsFramedView(!isFramedView)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
            title={isFramedView ? "Switch to Expanded View" : "Switch to Phone Frame"}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{isFramedView ? "Full Width" : "Phone Frame"}</span>
          </button>
        </div>
      </header>

      {/* Phone Container */}
      <div 
        data-theme={appTheme}
        className={`w-full transition-all duration-300 ${
          isFramedView 
            ? 'max-w-[410px] rounded-[44px] border-[8px] border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' 
            : 'max-w-2xl rounded-3xl border border-slate-800 shadow-xl'
        } ${currentThemeConfig.classes.bgRoot} flex flex-col overflow-hidden relative`}
        style={{ minHeight: isFramedView ? '820px' : 'auto' }}
      >
        {/* Android Punch Hole Camera (only in framed mode) */}
        {isFramedView && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black border border-slate-800 z-50 pointer-events-none" />
        )}

        {/* Minimal Android Status Bar */}
        <div className={`w-full ${!currentThemeConfig.isDark ? 'bg-slate-100 text-slate-600' : 'bg-slate-950/80 text-slate-400'} px-6 pt-3 pb-2 flex items-center justify-between text-xs font-medium z-40 select-none border-b border-transparent`}>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${!currentThemeConfig.isDark ? 'text-slate-900' : 'text-slate-200'}`}>{timeStr}</span>
            {isSpeaking && (
              <span className="flex items-center gap-1 text-purple-400">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Dynamic App Content Body */}
        <div className={`flex-1 overflow-y-auto ${currentThemeConfig.classes.bgRoot} flex flex-col ${!isAtHomeScreen ? 'pb-20' : ''}`}>
          {children}
        </div>

        {/* Clean, Modern Bottom Tab Bar */}
        {!isAtHomeScreen && (
          <div className={`absolute bottom-0 left-0 right-0 ${currentThemeConfig.classes.navBg} backdrop-blur-md pt-2 pb-5 px-4 z-40 border-t ${currentThemeConfig.classes.border}`}>
            <nav className="flex items-center justify-around">
              <button
                onClick={() => setActiveTab('loudbox')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                  activeTab === 'loudbox' || activeTab === 'soundbox'
                    ? `${currentThemeConfig.classes.accentText} font-semibold`
                    : `${currentThemeConfig.classes.textSecondary} opacity-70 hover:opacity-100`
                }`}
              >
                <Radio className="w-5 h-5" />
                <span className="text-[11px]">{t(appLanguage, 'tab_loudbox')}</span>
              </button>

              <button
                onClick={() => setActiveTab('collections')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                  activeTab === 'collections'
                    ? `${currentThemeConfig.classes.accentText} font-semibold`
                    : `${currentThemeConfig.classes.textSecondary} opacity-70 hover:opacity-100`
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[11px]">{t(appLanguage, 'tab_collections')}</span>
              </button>

              <button
                onClick={() => setActiveTab('qrstand')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                  activeTab === 'qrstand'
                    ? `${currentThemeConfig.classes.accentText} font-semibold`
                    : `${currentThemeConfig.classes.textSecondary} opacity-70 hover:opacity-100`
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-[11px]">{t(appLanguage, 'tab_qrstand')}</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                  activeTab === 'settings'
                    ? `${currentThemeConfig.classes.accentText} font-semibold`
                    : `${currentThemeConfig.classes.textSecondary} opacity-70 hover:opacity-100`
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[11px]">{t(appLanguage, 'tab_settings')}</span>
              </button>
            </nav>

            {/* Gesture Navigation Indicator */}
            <div className="w-28 h-1 bg-slate-500/30 rounded-full mx-auto mt-2" />
          </div>
        )}
      </div>
    </div>
  );
};

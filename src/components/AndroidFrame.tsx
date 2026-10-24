import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Volume2, 
  Bluetooth, 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  VolumeX, 
  Radio,
  ExternalLink,
  Laptop,
  Home,
  ChevronLeft,
  Square,
  Circle,
  RefreshCw,
  Globe,
  ChevronDown,
  Check,
  Palette,
  Sun,
  Moon,
  Zap
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
  activeTab: 'soundbox' | 'collections' | 'qrstand' | 'settings';
  setActiveTab: (tab: 'soundbox' | 'collections' | 'qrstand' | 'settings') => void;
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
  const [bluetoothConnected, setBluetoothConnected] = useState(true);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start py-2 sm:py-6 px-1 sm:px-4 selection:bg-purple-600 selection:text-white font-sans">
      {/* Top Bar for Switcher between Phone Mode & Full Screen / Landing */}
      <div className="w-full max-w-4xl flex items-center justify-between px-3 py-2 mb-3 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-lg text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center font-black text-white text-xs">
            ₹
          </div>
          <span className="font-bold text-white tracking-tight">Soundbox</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium text-[11px] border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Android v4.8
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick App UI Language Switcher with Dropdown for 15 Languages */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
                <div className="absolute right-0 top-full mt-1.5 w-64 max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>App Language (15 Languages)</span>
                    <span className="text-slate-400">भाषा निवडा</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
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
                              ? 'bg-purple-600/30 text-white border border-purple-500/50 font-bold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {l.badge}
                            </span>
                            <div>
                              <div className="font-bold">{l.nativeName}</div>
                              <div className="text-[10px] text-slate-400">{l.name} • {l.region}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Theme Switcher with Dropdown for 6 Themes */}
          {setAppTheme && (
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Change Theme & Appearance"
              >
                <span>{currentThemeConfig.badge}</span>
                <span className="hidden md:inline">{currentThemeConfig.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showThemeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider border-b border-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3 text-purple-400" />
                        Themes (6 Options)
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">0 KB Extra</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {APP_THEMES.map((th) => {
                        const isSelected = appTheme === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => {
                              setAppTheme(th.id);
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-purple-600/30 text-white border border-purple-500/50 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base shrink-0">{th.badge}</span>
                              <div className="min-w-0">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{th.name}</span>
                                  {th.batterySaver && (
                                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800 font-semibold">
                                      ⚡ OLED
                                    </span>
                                  )}
                                  {!th.isDark && (
                                    <span className="text-[9px] bg-amber-950 text-amber-300 px-1 rounded border border-amber-800 font-semibold">
                                      ☀️ Sun
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">{th.nativeName}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <div className="flex items-center gap-0.5">
                                {th.previewColors.map((c, idx) => (
                                  <span key={idx} className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c }} />
                                ))}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fresh Setup from Icon Button */}
          {onRestartSetup && (
            <button
              onClick={onRestartSetup}
              className="px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
              title="Restart Fresh Setup Flow from Icon"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Fresh Setup</span>
            </button>
          )}

          {/* Return to Android Home Screen Button */}
          {onExitToHomeScreen && !isAtHomeScreen && (
            <button
              onClick={onExitToHomeScreen}
              className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
              title="Exit to Mobile Home Screen"
            >
              <Home className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Phone Launcher</span>
            </button>
          )}

          {onOpenLandingPage && (
            <button
              onClick={onOpenLandingPage}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
              title="View mysoundbox.in Web Portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Website</span>
            </button>
          )}

          <button
            onClick={() => setIsFramedView(!isFramedView)}
            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1.5 font-medium text-xs transition cursor-pointer"
            title={isFramedView ? "Switch to Fullscreen Responsive" : "Switch to Android Phone Shell"}
          >
            {isFramedView ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Phone Frame</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container - Framed or Full Width */}
      <div 
        data-theme={appTheme}
        className={`w-full transition-all duration-300 ${
          isFramedView 
            ? 'max-w-[430px] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-slate-700/60' 
            : 'max-w-2xl rounded-3xl border border-slate-700/60 shadow-2xl'
        } ${currentThemeConfig.classes.bgRoot} flex flex-col overflow-hidden relative`}
        style={{ minHeight: isFramedView ? '844px' : 'auto' }}
      >
        {/* Android Punch Hole Camera (only in framed mode) */}
        {isFramedView && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 border-slate-900 z-50 pointer-events-none flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80"></div>
          </div>
        )}

        {/* Android Status Bar */}
        <div className={`w-full ${!currentThemeConfig.isDark ? 'bg-slate-200/90 text-slate-700 border-slate-300/80' : 'bg-slate-950/90 text-slate-300 border-slate-800/40'} px-6 pt-3 pb-2 flex items-center justify-between text-xs font-medium z-40 select-none border-b transition-colors`}>
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${!currentThemeConfig.isDark ? 'text-slate-950' : 'text-white'} tracking-wide`}>{timeStr}</span>
            {isSpeaking && (
              <span className={`flex items-center gap-0.5 ${currentThemeConfig.classes.accentText}`}>
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              </span>
            )}
            {!isAtHomeScreen && (
              <span className={`px-1.5 py-0.2 rounded ${currentThemeConfig.classes.pillBg} text-[10px] font-mono font-bold`}>
                ₹ SB
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBluetoothConnected(!bluetoothConnected)}
              className="flex items-center gap-0.5 hover:opacity-80 transition cursor-pointer"
              title={bluetoothConnected ? "Bluetooth Speaker Connected (Click to toggle)" : "Phone Speaker Only"}
            >
              <Bluetooth className={`w-3.5 h-3.5 ${bluetoothConnected ? 'text-blue-500' : 'text-slate-400'}`} />
              {bluetoothConnected && <span className="w-1 h-1 rounded-full bg-blue-500"></span>}
            </button>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5 font-sans text-[11px]">
              <span>5G</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px]">98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            </div>
          </div>
        </div>

        {/* Dynamic App Content Body */}
        <div className={`flex-1 overflow-y-auto ${currentThemeConfig.classes.bgRoot} flex flex-col ${!isAtHomeScreen ? 'pb-24' : ''}`}>
          {children}
        </div>

        {/* In-App Tab Navigation (shown only when inside the Soundbox app) */}
        {!isAtHomeScreen && (
          <div className={`absolute bottom-8 left-0 right-0 ${currentThemeConfig.classes.navBg} backdrop-blur-lg px-3 py-1.5 z-40 flex items-center justify-around border-t ${currentThemeConfig.classes.border}`}>
            <button
              onClick={() => setActiveTab('soundbox')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'soundbox'
                  ? `${currentThemeConfig.classes.accentText} font-semibold`
                  : `${currentThemeConfig.classes.textSecondary} hover:opacity-100`
              }`}
            >
              <div className={`p-1 rounded-xl ${activeTab === 'soundbox' ? `${currentThemeConfig.classes.accentBg}/20 ring-1 ${currentThemeConfig.classes.accentBorder}` : ''}`}>
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-[10px]">{t(appLanguage, 'tab_soundbox')}</span>
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'collections'
                  ? `${currentThemeConfig.classes.accentText} font-semibold`
                  : `${currentThemeConfig.classes.textSecondary} hover:opacity-100`
              }`}
            >
              <div className={`p-1 rounded-xl ${activeTab === 'collections' ? `${currentThemeConfig.classes.accentBg}/20 ring-1 ${currentThemeConfig.classes.accentBorder}` : ''}`}>
                <span className="font-bold text-xs block leading-none">₹</span>
              </div>
              <span className="text-[10px]">{t(appLanguage, 'tab_collections')}</span>
            </button>

            <button
              onClick={() => setActiveTab('qrstand')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'qrstand'
                  ? `${currentThemeConfig.classes.accentText} font-semibold`
                  : `${currentThemeConfig.classes.textSecondary} hover:opacity-100`
              }`}
            >
              <div className={`p-1 rounded-xl ${activeTab === 'qrstand' ? `${currentThemeConfig.classes.accentBg}/20 ring-1 ${currentThemeConfig.classes.accentBorder}` : ''}`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[10px]">{t(appLanguage, 'tab_qrstand')}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition cursor-pointer ${
                activeTab === 'settings'
                  ? `${currentThemeConfig.classes.accentText} font-semibold`
                  : `${currentThemeConfig.classes.textSecondary} hover:opacity-100`
              }`}
            >
              <div className={`p-1 rounded-xl ${activeTab === 'settings' ? `${currentThemeConfig.classes.accentBg}/20 ring-1 ${currentThemeConfig.classes.accentBorder}` : ''}`}>
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="text-[10px]">{t(appLanguage, 'tab_settings')}</span>
            </button>
          </div>
        )}

        {/* Android System 3-Button Navigation Bar (Back, Home, Recents) */}
        <div className={`absolute bottom-0 left-0 right-0 h-8 ${!currentThemeConfig.isDark ? 'bg-slate-200 border-t border-slate-300 text-slate-600' : 'bg-slate-950 border-t border-slate-900/60 text-slate-400'} flex items-center justify-around z-50 px-8`}>
          {/* Back Button */}
          <button
            onClick={() => {
              if (!isAtHomeScreen && onExitToHomeScreen) {
                onExitToHomeScreen();
              }
            }}
            className="p-1 hover:opacity-100 transition cursor-pointer"
            title="Back / Exit"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Android Home Circle (returns to mobile home launcher) */}
          <button
            onClick={() => {
              if (onExitToHomeScreen) {
                onExitToHomeScreen();
              }
            }}
            className="p-1 hover:text-white transition cursor-pointer group"
            title="Android Home Button (Exit to Launcher)"
          >
            <Circle className="w-3.5 h-3.5 group-hover:fill-slate-300 transition" />
          </button>

          {/* Recents Square */}
          <button
            onClick={() => {
              if (onExitToHomeScreen) {
                onExitToHomeScreen();
              }
            }}
            className="p-1 hover:text-white transition cursor-pointer"
            title="Recents"
          >
            <Square className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

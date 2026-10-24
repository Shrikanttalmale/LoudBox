import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { AndroidHomeScreen } from './components/AndroidHomeScreen';
import { AndroidSplashScreen } from './components/AndroidSplashScreen';
import { OnboardingSetup } from './components/OnboardingSetup';
import { SoundboxCounterScreen } from './components/SoundboxCounterScreen';
import { CollectionsScreen } from './components/CollectionsScreen';
import { QRStandScreen } from './components/QRStandScreen';
import { SettingsScreen } from './components/SettingsScreen';

// Lazy load LandingPage so it is not bundled in the initial app payload
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);
import { 
  DEFAULT_MERCHANT, 
  INITIAL_TRANSACTIONS, 
  MerchantProfile, 
  Transaction 
} from './types/soundbox';
import { 
  AudioSettings, 
  DEFAULT_AUDIO_SETTINGS,
  unlockAudioContext 
} from './utils/audioEngine';
import { AppLanguage, SUPPORTED_APP_LANGUAGES } from './utils/i18n';
import { AppThemeId, DEFAULT_THEME_ID } from './utils/themeEngine';
import { Download, Smartphone, X, Volume2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'android-app' | 'website'>('android-app');
  
  // App Lifecycle Stages: 'home-screen' -> 'splash' -> 'onboarding' -> 'active-app'
  const [appStage, setAppStage] = useState<'home-screen' | 'splash' | 'onboarding' | 'active-app'>('home-screen');
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mysoundbox_onboarded') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'soundbox' | 'collections' | 'qrstand' | 'settings'>('soundbox');
  
  // Persistent State with localStorage
  const [merchant, setMerchant] = useState<MerchantProfile>(() => {
    try {
      const saved = localStorage.getItem('mysoundbox_merchant');
      return saved ? JSON.parse(saved) : DEFAULT_MERCHANT;
    } catch {
      return DEFAULT_MERCHANT;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('mysoundbox_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('mysoundbox_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_AUDIO_SETTINGS, ...parsed, voicePersonaId: undefined };
      }
      return DEFAULT_AUDIO_SETTINGS;
    } catch {
      return DEFAULT_AUDIO_SETTINGS;
    }
  });

  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('mysoundbox_app_lang');
      if (saved && SUPPORTED_APP_LANGUAGES.some((l) => l.code === saved)) {
        return saved as AppLanguage;
      }
      return 'mr'; // Default to Marathi for local merchant experience
    } catch {
      return 'mr';
    }
  });

  const [appTheme, setAppTheme] = useState<AppThemeId>(() => {
    try {
      const saved = localStorage.getItem('mysoundbox_app_theme') as AppThemeId;
      if (saved && ['midnight', 'light_daylight', 'amoled_black', 'emerald_cash', 'royal_blue', 'sunset_gold'].includes(saved)) {
        return saved;
      }
      return DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeAnnouncementText, setActiveAnnouncementText] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_app_lang', appLanguage);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [appLanguage]);

  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_app_theme', appTheme);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [appTheme]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_merchant', JSON.stringify(merchant));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [merchant]);

  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_audio_settings', JSON.stringify(audioSettings));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [audioSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('mysoundbox_onboarded', hasCompletedOnboarding ? 'true' : 'false');
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [hasCompletedOnboarding]);

  // Capture PWA beforeinstallprompt event on Android devices
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install Soundbox on your Android phone:\nTap the browser menu (⋮) and tap "Add to Home screen" or "Install App"');
    }
  };

  // Launch Soundbox from the home screen icon
  const handleLaunchFromIcon = () => {
    unlockAudioContext();
    setAppStage('splash');
  };

  // When splash screen finishes
  const handleFinishSplash = () => {
    if (!hasCompletedOnboarding) {
      setAppStage('onboarding');
    } else {
      setAppStage('active-app');
    }
  };

  // When onboarding wizard completes
  const handleCompleteSetup = () => {
    setHasCompletedOnboarding(true);
    setAppStage('active-app');
  };

  // Exit back to Android phone home launcher
  const handleExitToHomeScreen = () => {
    setAppStage('home-screen');
  };

  // Restart fresh setup flow from scratch
  const handleRestartFreshSetup = () => {
    setHasCompletedOnboarding(false);
    setAppStage('home-screen');
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'timestamp' | 'time'>) => {
    const fullTx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      time: 'Just now',
    };
    setTransactions((prev) => [fullTx, ...prev]);
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  const handleResetDefaultTransactions = () => {
    setTransactions(INITIAL_TRANSACTIONS);
  };

  return (
    <div 
      onClick={() => unlockAudioContext()}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white"
    >
      {/* Optional Android PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 text-xs flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-200" />
            <span className="font-semibold">Install Soundbox Android App on your home screen</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-purple-900 rounded-lg font-bold hover:bg-purple-50 transition cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 hover:text-purple-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {currentView === 'website' ? (
        <Suspense fallback={
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-purple-400 font-bold text-sm">
            Loading Soundbox Portal...
          </div>
        }>
          <LandingPage
            onOpenAndroidApp={() => {
              setCurrentView('android-app');
              setAppStage('active-app');
            }}
            audioSettings={audioSettings}
            setAudioSettings={setAudioSettings}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        </Suspense>
      ) : (
        <AndroidFrame
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSpeaking={isSpeaking}
          businessName={merchant.businessName}
          appLanguage={appLanguage}
          setAppLanguage={setAppLanguage}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          onOpenLandingPage={() => setCurrentView('website')}
          onExitToHomeScreen={handleExitToHomeScreen}
          onRestartSetup={handleRestartFreshSetup}
          isAtHomeScreen={appStage === 'home-screen' || appStage === 'splash' || appStage === 'onboarding'}
        >
          {/* Stage 1: Android Mobile Home Screen with App Icon */}
          {appStage === 'home-screen' && (
            <AndroidHomeScreen
              onOpenSoundbox={handleLaunchFromIcon}
              isFirstLaunch={!hasCompletedOnboarding}
            />
          )}

          {/* Stage 2: Native Android Launch Splash Screen */}
          {appStage === 'splash' && (
            <AndroidSplashScreen onFinishSplash={handleFinishSplash} />
          )}

          {/* Stage 3: Fresh Onboarding Setup Wizard */}
          {appStage === 'onboarding' && (
            <OnboardingSetup
              merchant={merchant}
              setMerchant={setMerchant}
              audioSettings={audioSettings}
              setAudioSettings={setAudioSettings}
              appLanguage={appLanguage}
              setAppLanguage={setAppLanguage}
              onCompleteSetup={handleCompleteSetup}
              setIsSpeaking={setIsSpeaking}
            />
          )}

          {/* Stage 4: Active Soundbox App Dashboard */}
          {appStage === 'active-app' && (
            <>
              {activeTab === 'soundbox' && (
                <SoundboxCounterScreen
                  merchant={merchant}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  audioSettings={audioSettings}
                  setAudioSettings={setAudioSettings}
                  isSpeaking={isSpeaking}
                  setIsSpeaking={setIsSpeaking}
                  appLanguage={appLanguage}
                  onOpenCollections={() => setActiveTab('collections')}
                  onOpenQRStand={() => setActiveTab('qrstand')}
                  activeAnnouncementText={activeAnnouncementText}
                  onAnnouncementText={setActiveAnnouncementText}
                  onClearTransactions={handleClearTransactions}
                  onResetDefaultTransactions={handleResetDefaultTransactions}
                />
              )}

              {activeTab === 'collections' && (
                <CollectionsScreen
                  merchant={merchant}
                  transactions={transactions}
                  audioSettings={audioSettings}
                  setIsSpeaking={setIsSpeaking}
                  appLanguage={appLanguage}
                />
              )}

              {activeTab === 'qrstand' && (
                <QRStandScreen
                  merchant={merchant}
                  onAddTransaction={handleAddTransaction}
                  audioSettings={audioSettings}
                  setIsSpeaking={setIsSpeaking}
                  appLanguage={appLanguage}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  merchant={merchant}
                  setMerchant={setMerchant}
                  audioSettings={audioSettings}
                  setAudioSettings={setAudioSettings}
                  setIsSpeaking={setIsSpeaking}
                  appLanguage={appLanguage}
                  setAppLanguage={setAppLanguage}
                  appTheme={appTheme}
                  setAppTheme={setAppTheme}
                />
              )}
            </>
          )}
        </AndroidFrame>
      )}
    </div>
  );
}

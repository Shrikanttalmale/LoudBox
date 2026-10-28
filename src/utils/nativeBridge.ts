// Native Android & Capacitor Bridge for Loudbox Permissions and Hardware Features

export interface PermissionStatus {
  isNotificationGranted: boolean;
  isBatteryOptimized: boolean;
}

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  if ((window as any).LoudboxAndroid) return true;
  return false;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  return Boolean(isStandalone || isNativePlatform());
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (isNativePlatform() || isStandaloneApp()) return true;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isSmallScreen || isMobileUA;
}

/**
 * Check if the Android NotificationListenerService permission has been granted
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Direct WebView JavaScript Interface
  if ((window as any).LoudboxAndroid?.isNotificationListenerEnabled) {
    try {
      return Boolean((window as any).LoudboxAndroid.isNotificationListenerEnabled());
    } catch (e) {
      console.warn('Error reading notification listener via LoudboxAndroid:', e);
    }
  }

  // Capacitor Native Plugin
  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.LoudboxPermissions?.checkNotificationPermission) {
    try {
      const res = await capPlugins.LoudboxPermissions.checkNotificationPermission();
      return Boolean(res?.isGranted);
    } catch (e) {
      console.warn('Error checking permission via Capacitor plugin:', e);
    }
  }

  // Fallback to local persistence for web/preview testing
  try {
    return localStorage.getItem('loudbox_notif_permission') === 'true';
  } catch {
    return false;
  }
}

/**
 * Open the Android "Device & app notifications" settings screen so the merchant can grant access to Loudbox
 */
export async function openNotificationSettings(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Direct WebView JavaScript Interface
  if ((window as any).LoudboxAndroid?.openNotificationSettings) {
    try {
      (window as any).LoudboxAndroid.openNotificationSettings();
      return true;
    } catch (e) {
      console.warn('Error opening settings via LoudboxAndroid:', e);
    }
  }

  // Capacitor Native Plugin
  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.LoudboxPermissions?.openNotificationSettings) {
    try {
      await capPlugins.LoudboxPermissions.openNotificationSettings();
      return true;
    } catch (e) {
      console.warn('Error opening settings via Capacitor:', e);
    }
  }

  // Fallback: save granted state in web testing
  try {
    localStorage.setItem('loudbox_notif_permission', 'true');
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Open Android Battery Optimization settings to prevent Loudbox from being killed during store hours
 */
export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Direct WebView JavaScript Interface
  if ((window as any).LoudboxAndroid?.openBatteryOptimizationSettings) {
    try {
      (window as any).LoudboxAndroid.openBatteryOptimizationSettings();
      return true;
    } catch (e) {
      console.warn('Error opening battery settings via LoudboxAndroid:', e);
    }
  }

  // Capacitor Native Plugin
  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.LoudboxPermissions?.openBatterySettings) {
    try {
      await capPlugins.LoudboxPermissions.openBatterySettings();
      return true;
    } catch (e) {
      console.warn('Error opening battery settings via Capacitor:', e);
    }
  }

  // Fallback
  try {
    localStorage.setItem('loudbox_battery_permission', 'true');
  } catch {
    // Ignore
  }
  return false;
}

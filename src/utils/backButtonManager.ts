/**
 * Centralized Mobile Back Button Manager for Loudbox
 * Handles Android Hardware/Gesture Back Button and Browser History PopState.
 * Supports hierarchical back navigation:
 * 1. Closes open modals/drawers
 * 2. Closes open submenus (e.g. Settings -> Voice Alert)
 * 3. Navigates back from secondary tabs (Statement/Collections, QR Stand, Settings) -> Loudbox Counter
 * 4. Navigates back from Website -> App
 * 5. Double-press "Press back again to exit" on root screen
 */

import { App as CapacitorApp } from '@capacitor/app';

export type BackHandler = () => boolean; // return true if handled, false to delegate to next handler

const handlers: BackHandler[] = [];
let lastBackPressTime = 0;
let exitToastCallback: ((show: boolean) => void) | null = null;
let toastTimeout: any = null;

export function registerExitToastCallback(cb: (show: boolean) => void) {
  exitToastCallback = cb;
}

export function pushBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.lastIndexOf(handler);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}

export function triggerBackAction(): boolean {
  // Walk through handlers from top (most recent) to bottom
  for (let i = handlers.length - 1; i >= 0; i--) {
    try {
      const handled = handlers[i]();
      if (handled) {
        return true;
      }
    } catch (e) {
      console.warn('Error in back handler:', e);
    }
  }
  return false;
}

let isInitialized = false;

export function initializeBackButtonListener(): () => void {
  if (isInitialized || typeof window === 'undefined') {
    return () => {};
  }
  isInitialized = true;

  // 1. Listen to Capacitor Native Android Back Button
  let capacitorListenerSub: any = null;
  try {
    CapacitorApp.addListener('backButton', () => {
      const handled = triggerBackAction();
      if (!handled) {
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPressTime = now;
          if (exitToastCallback) {
            exitToastCallback(true);
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
              exitToastCallback?.(false);
            }, 2000);
          }
        }
      }
    }).then((sub) => {
      capacitorListenerSub = sub;
    }).catch((err) => {
      console.warn('Could not attach Capacitor backButton listener:', err);
    });
  } catch (err) {
    console.warn('Capacitor App listener error:', err);
  }

  // 2. Listen to Browser Popstate for Web & PWA standalone mode
  try {
    // Seed initial history entry so back button can be intercepted
    window.history.pushState({ loudbox: 'root' }, '');

    const handlePopState = () => {
      const handled = triggerBackAction();
      if (handled) {
        // Re-push state so user can press back again on the next view
        window.history.pushState({ loudbox: 'step' }, '');
      } else {
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
          // Allow normal browser exit/back
        } else {
          lastBackPressTime = now;
          // Keep user in app on first press and show toast
          window.history.pushState({ loudbox: 'root' }, '');
          if (exitToastCallback) {
            exitToastCallback(true);
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
              exitToastCallback?.(false);
            }, 2000);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (capacitorListenerSub && typeof capacitorListenerSub.remove === 'function') {
        capacitorListenerSub.remove();
      }
      isInitialized = false;
    };
  } catch (e) {
    console.warn('Error setting up popstate listener:', e);
    return () => {};
  }
}

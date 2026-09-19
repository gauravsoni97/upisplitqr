type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const INSTALLED_KEY = 'upi_pwa_installed';
const LAST_SHOWN_KEY = 'upi_install_toast_last_shown';
const LEGACY_DISMISS_KEY = 'upi_install_toast_dismissed';

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<(event: InstallPromptEvent | null) => void>();

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore private-mode / storage failures
  }
};

export function markAppInstalled() {
  writeStorage(INSTALLED_KEY, '1');
}

export function markInstallToastShownToday() {
  writeStorage(LAST_SHOWN_KEY, todayKey());
}

export function shouldShowInstallToast() {
  if (isStandaloneApp() || readStorage(INSTALLED_KEY) === '1') return false;
  if (!isMobileDevice()) return false;
  if (readStorage(LAST_SHOWN_KEY) === todayKey()) return false;

  // One-time migration: yesterday's permanent dismiss should not pop again today.
  if (readStorage(LEGACY_DISMISS_KEY)) {
    markInstallToastShownToday();
    try {
      localStorage.removeItem(LEGACY_DISMISS_KEY);
    } catch {
      // Ignore
    }
    return false;
  }

  return true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    listeners.forEach((fn) => fn(deferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markAppInstalled();
    listeners.forEach((fn) => fn(null));
  });
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export function onInstallPromptChange(fn: (event: InstallPromptEvent | null) => void) {
  listeners.add(fn);
  if (deferredPrompt) fn(deferredPrompt);
  return () => {
    listeners.delete(fn);
  };
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia('(max-width: 768px)').matches;
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Ignore SW registration failures in unsupported browsers
    });
  });
}

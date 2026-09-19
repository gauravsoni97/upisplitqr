import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import {
  getInstallPrompt,
  markAppInstalled,
  markInstallToastShownToday,
  onInstallPromptChange,
  shouldShowInstallToast,
} from '../pwa';

const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const InstallToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(Boolean(getInstallPrompt()));
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!shouldShowInstallToast()) return;

    const timer = window.setTimeout(() => {
      markInstallToastShownToday();
      setVisible(true);
    }, 1600);
    const unsubscribe = onInstallPromptChange((event) => setCanPrompt(Boolean(event)));

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  const closeToast = () => {
    markInstallToastShownToday();
    setVisible(false);
    setShowHelp(false);
  };

  const handleInstall = async () => {
    const prompt = getInstallPrompt();
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        markAppInstalled();
        setVisible(false);
        return;
      }
      closeToast();
      return;
    }

    setShowHelp(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-slate-900/10 p-3.5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900">Install the app</p>
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Add UPI Splitter to your phone for faster access, like a real app.
            </p>
            {showHelp && (
              <p className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-2 leading-relaxed">
                {isIos() ? (
                  <>
                    Tap <Share className="inline w-3.5 h-3.5 -mt-0.5" /> Share, then <span className="font-bold">Add to Home Screen</span>.
                  </>
                ) : (
                  <>Open the browser menu and tap <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home Screen</span>.</>
                )}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="min-h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                {canPrompt ? 'Install app' : 'How to install'}
              </button>
              <button
                type="button"
                onClick={closeToast}
                className="min-h-9 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={closeToast}
            aria-label="Dismiss"
            className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

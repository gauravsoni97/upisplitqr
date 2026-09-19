import React from 'react';
import { Info, Plus, QrCode } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasActivePayment?: boolean;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasActivePayment, onOpenInfo }) => {
  return (
    <header className="w-full sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-emerald-100">
      <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-[18px] leading-none tracking-tight text-slate-900">
              UPI Splitter
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-medium truncate">
              Send or receive with split QRs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenInfo}
            aria-label="How to use"
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 cursor-pointer"
          >
            <Info className="w-5 h-5" />
          </button>
          {hasActivePayment && onReset && (
            <button
              id="reset-payment-btn"
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

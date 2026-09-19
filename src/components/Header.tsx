import React from 'react';
import { QrCode, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasActivePayment?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasActivePayment }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 leading-tight">
              UPI Split QR
            </h1>
            <span className="text-[10px] text-slate-500 font-medium">
              Auto-split at ₹1,999
            </span>
          </div>
        </div>

        {hasActivePayment && onReset && (
          <button
            id="reset-payment-btn"
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Image as ImageIcon
} from 'lucide-react';
import { SplitQRItem } from '../types';
import { formatINR } from '../utils/upi';

interface QRDisplayProps {
  items: SplitQRItem[];
  upiId: string;
  totalAmount: number;
  onTogglePaid: (id: string) => void;
  onReset: () => void;
  isSharedView?: boolean;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  items,
  totalAmount,
  onTogglePaid,
  onReset,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showBoth, setShowBoth] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeItem = items[activeIndex] || items[0];
  const paidCount = items.filter((i) => i.status === 'paid').length;
  const collectedAmount = items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const allPaid = paidCount === items.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const handleMarkAndNext = (item: SplitQRItem) => {
    onTogglePaid(item.id);
    if (activeIndex < items.length - 1) {
      setTimeout(() => {
        setActiveIndex(activeIndex + 1);
      }, 300);
    }
  };

  const handleCopyUpiLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast('UPI link copied!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy link');
    }
  };

  // Download individual QR image
  const handleDownload = (item: SplitQRItem) => {
    const link = document.createElement('a');
    link.href = item.qrDataUrl;
    link.download = `QR_${item.index}_of_${item.totalChunks}_₹${item.amount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saved QR ${item.index} (₹${item.amount}) to device!`);
  };

  // Direct share or save QR image
  const handleShareQrImage = async (item: SplitQRItem) => {
    try {
      const response = await fetch(item.qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Payment_QR_${item.index}_₹${item.amount}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `UPI Payment QR - ₹${item.amount}`,
          text: `Pay ₹${item.amount} via UPI (QR ${item.index} of ${item.totalChunks})`,
        });
        showToast('QR Image shared successfully!');
        return;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
    }
    // Fallback: download the file
    handleDownload(item);
  };

  // Download all QRs sequentially into gallery
  const handleDownloadAllQrs = async () => {
    showToast(`Downloading all ${items.length} QR images...`);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const link = document.createElement('a');
      link.href = item.qrDataUrl;
      link.download = `QR_${item.index}_of_${item.totalChunks}_₹${item.amount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    showToast(`Downloaded all ${items.length} QR images!`);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-top-3 flex items-center gap-2 border border-slate-700 backdrop-blur-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Status Bar: Total & Toggle */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between shadow-2xs">
        <div>
          <div className="text-[11px] text-slate-500 font-medium">
            Total to receive
          </div>
          <div className="text-base font-extrabold text-slate-900">
            {formatINR(totalAmount)}
            <span className="text-xs font-semibold text-emerald-600 ml-2">
              ({paidCount}/{items.length} Paid)
            </span>
          </div>
        </div>

        {items.length > 1 && (
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setShowBoth(false)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                !showBoth ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              1-by-1
            </button>
            <button
              type="button"
              onClick={() => setShowBoth(true)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                showBoth ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Show Both
            </button>
          </div>
        )}
      </div>

      {/* Quick Download All QRs Button for Multi-chunk Payments */}
      {items.length > 1 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium text-[11px]">
            Split into {items.length} QR codes (Max ₹1,999 each)
          </span>
          <button
            type="button"
            onClick={handleDownloadAllQrs}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Save All {items.length} QRs</span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${(collectedAmount / totalAmount) * 100}%` }}
        />
      </div>

      {/* When All Paid - Compact Celebration Banner */}
      {allPaid && (
        <div className="bg-emerald-600 text-white rounded-xl p-3 text-center flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-left">
            <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
            <div>
              <div className="font-bold text-sm leading-tight">All Payments Received!</div>
              <div className="text-[11px] text-emerald-100">Total {formatINR(totalAmount)} collected</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-lg shadow-xs hover:bg-emerald-50 cursor-pointer"
          >
            New Payment
          </button>
        </div>
      )}

      {/* VIEW MODE 1: 1-by-1 Sequential (Clean, Zero Scroll) */}
      {!showBoth && activeItem && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 text-center overflow-hidden">
          {/* Step Navigation */}
          {items.length > 1 && (
            <>
              {items.length <= 4 ? (
                /* 2 to 4 items: simple full-width tabs */
                <div className="flex items-center gap-1.5 justify-center w-full">
                  {items.map((item, idx) => {
                    const isPaid = item.status === 'paid';
                    const isActive = idx === activeIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                            : isPaid
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{isPaid ? '✓ ' : ''}QR {idx + 1}</span>
                        <span className="block text-[10px] font-normal opacity-80">{formatINR(item.amount)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* More than 4 items: Stepper + Scrollable chips */
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                      disabled={activeIndex === 0}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      ← Prev
                    </button>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>QR {activeIndex + 1} of {items.length}</span>
                      <span className="text-emerald-700 font-extrabold">({formatINR(activeItem.amount)})</span>
                      {activeItem.status === 'paid' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Paid ✓
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.min(items.length - 1, activeIndex + 1))}
                      disabled={activeIndex === items.length - 1}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      Next →
                    </button>
                  </div>

                  {/* Horizontal Scrollable Number Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                    {items.map((item, idx) => {
                      const isPaid = item.status === 'paid';
                      const isActive = idx === activeIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveIndex(idx)}
                          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                              : isPaid
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isPaid ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                          <span>#{idx + 1}</span>
                          <span className="opacity-80 font-normal text-[10px]">
                            {item.amount >= 1000 ? `₹${Math.round(item.amount / 1000)}k` : `₹${item.amount}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Amount Badge */}
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Scan & Pay Exact Amount
            </div>
            <div className="text-3xl font-black text-slate-900">
              {formatINR(activeItem.amount)}
            </div>
          </div>

          {/* QR Container */}
          <div className="flex justify-center">
            <div className="relative p-2.5 bg-white border-2 border-slate-200 rounded-2xl shadow-xs">
              <img
                src={activeItem.qrDataUrl}
                alt={`UPI QR Part ${activeItem.index}`}
                className={`w-48 h-48 sm:w-56 sm:h-56 object-contain transition-opacity duration-200 ${
                  activeItem.status === 'paid' ? 'opacity-20 blur-[1px]' : ''
                }`}
              />

              {activeItem.status === 'paid' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-md mb-1 animate-in zoom-in-50">
                    <Check className="w-7 h-7 text-white stroke-[3]" />
                  </div>
                  <span className="text-sm font-black text-emerald-800">
                    Paid {formatINR(activeItem.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Big Action Button: Mark as Paid / Next QR */}
          <div className="pt-1">
            {activeItem.status === 'pending' ? (
              <button
                type="button"
                onClick={() => handleMarkAndNext(activeItem)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {activeIndex < items.length - 1
                    ? `Payment Received (${formatINR(activeItem.amount)}) → Show Next QR`
                    : `Payment Received (${formatINR(activeItem.amount)}) ✓`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {activeIndex < items.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveIndex(activeIndex + 1)}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Next: QR {activeIndex + 2} ({formatINR(items[activeIndex + 1].amount)}) →
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onTogglePaid(activeItem.id)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Mark Unpaid
                </button>
              </div>
            )}
          </div>

          {/* Bottom Utility Actions: Share Image, Save QR, Pay via App, Copy UPI */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleShareQrImage(activeItem)}
              className="py-2 px-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-900 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors shadow-2xs"
              title="Share QR Image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Share Image</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload(activeItem)}
              className="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors shadow-2xs"
              title="Save QR to Gallery / Photos"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Save QR</span>
            </button>

            <a
              href={activeItem.upiUrl}
              className="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-0.5 transition-colors shadow-2xs text-center"
              title="Pay directly via GPay, PhonePe, Paytm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Pay App</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopyUpiLink(activeItem.upiUrl, activeItem.id)}
              className="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors shadow-2xs"
              title="Copy UPI deep link"
            >
              {copiedId === activeItem.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Both QRs simultaneously (Clean Compact Cards) */}
      {showBoth && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-3 border text-center space-y-2 ${
                item.status === 'paid' ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  QR {item.index} of {item.totalChunks}
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatINR(item.amount)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status === 'paid' ? 'Paid ✓' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 py-1">
                <div className="relative p-1.5 bg-white border border-slate-200 rounded-lg">
                  <img
                    src={item.qrDataUrl}
                    alt={`QR ${item.index}`}
                    className={`w-32 h-32 object-contain ${
                      item.status === 'paid' ? 'opacity-30' : ''
                    }`}
                  />
                  {item.status === 'paid' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-left flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onTogglePaid(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold w-full transition-colors cursor-pointer ${
                      item.status === 'paid'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {item.status === 'paid' ? 'Mark Pending' : 'Mark as Paid ✓'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareQrImage(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 w-full flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-emerald-600" />
                    <span>Share Image</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Save</span>
                    </button>

                    <a
                      href={item.upiUrl}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex-1 flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>Pay</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

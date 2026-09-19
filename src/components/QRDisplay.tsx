import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { PaymentMode, SplitQRItem } from '../types';
import { formatINR } from '../utils/upi';

interface QRDisplayProps {
  items: SplitQRItem[];
  upiId: string;
  totalAmount: number;
  onTogglePaid: (id: string) => void;
  onReset: () => void;
  isSharedView?: boolean;
  mode?: PaymentMode;
  note?: string;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  items,
  upiId,
  totalAmount,
  onTogglePaid,
  onReset,
  isSharedView,
  mode = 'receive',
  note,
}) => {
  const isSend = mode === 'send';
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showBoth, setShowBoth] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeItem = items[activeIndex] || items[0];
  const paidCount = items.filter((i) => i.status === 'paid').length;
  const collectedAmount = items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const remainingAmount = Math.max(totalAmount - collectedAmount, 0);
  const allPaid = paidCount === items.length;
  const progress = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

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
      showToast('UPI link copied');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Could not copy link');
    }
  };

  const handleDownload = (item: SplitQRItem) => {
    const link = document.createElement('a');
    link.href = item.qrDataUrl;
    link.download = `QR_${item.index}_of_${item.totalChunks}_₹${item.amount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saved QR ${item.index} (${formatINR(item.amount)})`);
  };

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
        showToast('QR image shared');
        return;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
    }
    handleDownload(item);
  };

  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?upi=${encodeURIComponent(upiId)}&amount=${totalAmount}`;
    const text = isSend
      ? `Paying ${formatINR(totalAmount)} to ${upiId}${note ? ` (${note})` : ''} via UPI Splitter.`
      : `Please pay ${formatINR(totalAmount)} to ${upiId}${note ? ` for ${note}` : ''}. Open this link to get the split QRs:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

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
    showToast(`Downloaded all ${items.length} QR images`);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3 relative animate-fade-up">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 border border-slate-700 backdrop-blur-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-lg shadow-slate-200/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              {isSharedView ? 'Shared payment' : isSend ? 'Sending' : 'Collecting'}
            </p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(totalAmount)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 font-medium truncate max-w-[210px]">
              {isSend ? 'Paying' : 'To'} {upiId}
            </p>
            {note && note !== 'Payment' && note !== 'UPI payment' && (
              <p className="mt-0.5 text-xs text-emerald-700 font-semibold truncate max-w-[210px]">
                {note}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500 font-semibold">{isSend ? 'Left to pay' : 'Left to collect'}</p>
            <p className={`text-lg font-extrabold ${allPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatINR(remainingAmount)}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700">
              {paidCount}/{items.length} paid
            </p>
          </div>
        </div>

        {isSend && (
          <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 font-medium">
            Open each QR in GPay, PhonePe, or Paytm to send that part.
          </p>
        )}

        <div className="mt-3">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-3 flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowBoth(false)}
              className={`flex-1 min-h-8 rounded-xl transition-all cursor-pointer ${
                !showBoth ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              One QR
            </button>
            <button
              type="button"
              onClick={() => setShowBoth(true)}
              className={`flex-1 min-h-8 rounded-xl transition-all cursor-pointer ${
                showBoth ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              All QRs
            </button>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            Split into {items.length} QRs · max ₹1,999 each
          </span>
          <button
            type="button"
            onClick={handleDownloadAllQrs}
            className="min-h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save all</span>
          </button>
        </div>
      )}

      {allPaid && (
        <div className="bg-emerald-600 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 text-left">
            <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
            <div>
              <div className="font-bold text-sm leading-tight">{isSend ? 'All payments sent' : 'All payments received'}</div>
              <div className="text-[11px] text-emerald-100">Total {formatINR(totalAmount)} {isSend ? 'paid' : 'collected'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 cursor-pointer"
          >
            New payment
          </button>
        </div>
      )}

      {!showBoth && activeItem && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-lg shadow-slate-200/70 space-y-3.5 text-center">
          {items.length > 1 && (
            <>
              {items.length <= 4 ? (
                <div className="flex items-center gap-1.5 justify-center w-full">
                  {items.map((item, idx) => {
                    const isPaid = item.status === 'paid';
                    const isActive = idx === activeIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        className={`flex-1 min-h-12 py-1.5 px-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer truncate ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : isPaid
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{isPaid ? '✓ ' : ''}QR {idx + 1}</span>
                        <span className="block text-[10px] font-semibold opacity-80">{formatINR(item.amount)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                      disabled={activeIndex === 0}
                      className="min-h-8 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-100 inline-flex items-center gap-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>QR {activeIndex + 1} of {items.length}</span>
                      {activeItem.status === 'paid' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                          Paid
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.min(items.length - 1, activeIndex + 1))}
                      disabled={activeIndex === items.length - 1}
                      className="min-h-8 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-100 inline-flex items-center gap-0.5"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto chip-scroll max-w-full">
                    {items.map((item, idx) => {
                      const isPaid = item.status === 'paid';
                      const isActive = idx === activeIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveIndex(idx)}
                          className={`shrink-0 min-h-8 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : isPaid
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isPaid && !isActive ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                          <span>#{idx + 1}</span>
                          <span className="opacity-80 font-medium text-[10px]">
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

          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Scan & pay this amount
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatINR(activeItem.amount)}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <img
                src={activeItem.qrDataUrl}
                alt={`UPI QR Part ${activeItem.index}`}
                className={`w-48 h-48 sm:w-56 sm:h-56 object-contain transition-opacity duration-200 ${
                  activeItem.status === 'paid' ? 'opacity-20 blur-[1px]' : ''
                }`}
              />

              {activeItem.status === 'paid' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-3xl">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-md mb-1">
                    <Check className="w-7 h-7 text-white stroke-[3]" />
                  </div>
                  <span className="text-sm font-black text-emerald-800">
                    Paid {formatINR(activeItem.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1">
            {activeItem.status === 'pending' ? (
              <button
                type="button"
                onClick={() => handleMarkAndNext(activeItem)}
                className="w-full min-h-12 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {activeIndex < items.length - 1
                    ? `Mark paid · show next QR`
                    : `Mark paid · ${formatINR(activeItem.amount)}`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {activeIndex < items.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveIndex(activeIndex + 1)}
                    className="flex-1 min-h-11 py-2.5 px-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl cursor-pointer"
                  >
                    Next: QR {activeIndex + 2} ({formatINR(items[activeIndex + 1].amount)})
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onTogglePaid(activeItem.id)}
                  className="min-h-11 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-2xl cursor-pointer"
                >
                  Undo
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full min-h-11 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {isSend ? 'Share on WhatsApp' : 'Ask on WhatsApp'}
          </button>

          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleShareQrImage(activeItem)}
              className="min-h-14 py-2 px-1 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-900 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload(activeItem)}
              className="min-h-14 py-2 px-1 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Save</span>
            </button>

            <a
              href={activeItem.upiUrl}
              className="min-h-14 py-2 px-1 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Pay app</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopyUpiLink(activeItem.upiUrl, activeItem.id)}
              className="min-h-14 py-2 px-1 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              {copiedId === activeItem.id ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {showBoth && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-3.5 border text-center space-y-2 ${
                item.status === 'paid' ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'
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
                  {item.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 py-1">
                <div className="relative p-1.5 bg-white border border-slate-200 rounded-xl">
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold w-full cursor-pointer ${
                      item.status === 'paid'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {item.status === 'paid' ? 'Mark pending' : 'Mark as paid'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareQrImage(item)}
                    className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 w-full flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-emerald-600" />
                    <span>Share image</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex-1 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Save</span>
                    </button>

                    <a
                      href={item.upiUrl}
                      className="px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex-1 flex items-center justify-center gap-1"
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

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface HowToModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: 'Enter your UPI ID',
    text: 'Type the receiver UPI ID, like name@oksbi. Tap handles such as @okaxis, @oksbi, or @paytm to complete it.',
  },
  {
    title: 'Enter the total amount',
    text: 'Add the full amount you want to collect. Example: ₹2,500. The app shows how many QRs will be created.',
  },
  {
    title: 'Generate the QRs',
    text: 'Tap Generate. Anything above ₹1,999 is split automatically. Example: ₹2,500 becomes ₹1,999 + ₹501.',
  },
  {
    title: 'Scan and pay',
    text: 'The payer scans each QR and pays that exact amount. They can also share, save, or open a UPI app.',
  },
  {
    title: 'Mark as paid',
    text: 'After each part is paid, tap Mark paid. The progress bar shows collected and remaining amount.',
  },
];

export const HowToModal: React.FC<HowToModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-pointer"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-3xl border border-slate-200 shadow-2xl"
      >
        <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <h2 id="howto-title" className="text-lg font-extrabold text-slate-900 tracking-tight pr-2">
              How to use UPI Splitter
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            This tool splits a large UPI payment into smaller QR codes. Each QR is max ₹1,999 so people can pay from GPay, PhonePe, or Paytm.
          </p>
        </div>

        <ol className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-3 space-y-2.5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="shrink-0 px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-100 bg-white">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-bold text-emerald-900">Tip</p>
            <p className="mt-0.5 text-xs text-emerald-800 leading-relaxed">
              UPI cannot send more than ₹1,00,000. Use NEFT/RTGS for larger transfers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full min-h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
};

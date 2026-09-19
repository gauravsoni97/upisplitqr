import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Zap, AlertTriangle, Building2, AtSign, IndianRupee, LoaderCircle } from 'lucide-react';
import { calculateSplits, formatINR, getSplitSummary, MAX_UPI_AMOUNT } from '../utils/upi';
import { PaymentFormValues } from '../types';

interface PaymentFormProps {
  onGenerate: (values: PaymentFormValues) => void;
  isLoading?: boolean;
}

const COMMON_HANDLES = ['@okaxis', '@oksbi', '@paytm', '@ybl'];
const QUICK_AMOUNTS = [1999, 2500, 3000, 5000];
const LAST_UPI_KEY = 'last_upi_id';

const getSavedUpiId = () => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LAST_UPI_KEY)?.trim() || '';
  } catch {
    return '';
  }
};

export const PaymentForm: React.FC<PaymentFormProps> = ({ onGenerate, isLoading }) => {
  const [upiId, setUpiId] = useState<string>(getSavedUpiId);
  const [amountInput, setAmountInput] = useState<string>('2500');
  const [error, setError] = useState<string>('');

  const numericAmount = parseFloat(amountInput) || 0;
  const currentHandle = upiId.includes('@') ? `@${upiId.split('@')[1]}` : '';
  
  const summary = useMemo(() => getSplitSummary(numericAmount, 1999), [numericAmount]);

  const splits = useMemo(() => {
    if (numericAmount <= 0) return [];
    return calculateSplits(numericAmount, 1999);
  }, [numericAmount]);

  useEffect(() => {
    const cleanUpi = upiId.trim();
    if (!cleanUpi) return;
    try {
      localStorage.setItem(LAST_UPI_KEY, cleanUpi);
    } catch {
      // Ignore private-mode / storage failures
    }
  }, [upiId]);

  const handleAppendHandle = (handle: string) => {
    const username = upiId.includes('@') ? upiId.substring(0, upiId.indexOf('@')) : upiId.trim();
    if (!username) {
      setError('Type your UPI name first, then tap a handle');
      document.getElementById('upi-id-input')?.focus();
      return;
    }
    setError('');
    setUpiId(username + handle);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setError('Enter your UPI ID');
      return;
    }

    if (!cleanUpi.includes('@')) {
      setError('UPI ID must include @ (e.g. name@oksbi)');
      return;
    }

    if (numericAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    if (numericAmount > MAX_UPI_AMOUNT) {
      setError(`Amount exceeds the NPCI UPI limit of ${formatINR(MAX_UPI_AMOUNT)}. Enter a lower amount.`);
      return;
    }

    onGenerate({
      upiId: cleanUpi,
      payeeName: '',
      totalAmount: numericAmount,
      maxCap: 1999,
      customNote: 'Payment',
    });
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-up">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-lg shadow-slate-200/80 space-y-5">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            Split UPI payments above ₹1,999
          </h2>
          <p className="mt-1 text-sm font-medium text-emerald-700">
            One amount. Multiple QRs. Paid in minutes.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="upi-id-input" className="text-sm font-bold text-slate-800">
              Your UPI ID
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Where money is received</span>
          </div>

          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="upi-id-input"
              type="text"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={upiId}
              onChange={(e) => {
                setError('');
                setUpiId(e.target.value.toLowerCase().trim());
              }}
              placeholder="gauravsoni8414@oksbi"
              className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none text-slate-900 font-semibold text-sm placeholder:text-slate-400 placeholder:font-medium"
              required
            />
          </div>

          <div className="flex items-center gap-2 mt-2 overflow-x-auto chip-scroll">
            {COMMON_HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                onClick={() => handleAppendHandle(handle)}
                className={`text-xs min-h-9 px-3 rounded-full font-semibold cursor-pointer shrink-0 border transition-colors ${
                  currentHandle === handle
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {handle}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="amount-input" className="text-sm font-bold text-slate-800">
              Total amount
            </label>
            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              Max ₹1,999 / QR
            </span>
          </div>

          <div className="relative flex items-center">
            <IndianRupee className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              id="amount-input"
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              value={amountInput}
              onChange={(e) => {
                setError('');
                setAmountInput(e.target.value);
              }}
              placeholder="2500"
              className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none text-slate-950 font-extrabold text-2xl"
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInput(amt.toString())}
                className={`h-10 text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                  numericAmount === amt
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {summary.exceedsLimit && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm leading-tight text-amber-950">
                  Exceeds UPI limit ({formatINR(MAX_UPI_AMOUNT)})
                </span>
                <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
                  NPCI allows UPI transfers up to {formatINR(MAX_UPI_AMOUNT)}.{' '}
                  {formatINR(numericAmount)} would need {summary.totalCount.toLocaleString()} QRs, which banks do not allow.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAmountInput(MAX_UPI_AMOUNT.toString())}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Use max ₹1,00,000
              </button>
              <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                <Building2 className="w-3 h-3" />
                Use NEFT/RTGS for larger transfers
              </span>
            </div>
          </div>
        )}

        {!summary.exceedsLimit && numericAmount > 0 && (
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs overflow-hidden">
            {splits.length === 1 ? (
              <div className="text-slate-600 flex items-center justify-between">
                <span className="font-medium">One QR is enough</span>
                <strong className="text-slate-900 font-bold">{formatINR(splits[0])}</strong>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-split into {splits.length} QRs
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Total {formatINR(numericAmount)}</span>
                </div>

                {splits.length <= 4 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {splits.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center font-bold text-slate-800 text-xs"
                      >
                        <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">QR {idx + 1}</span>
                        {formatINR(chunk)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <span className="text-[10px] text-slate-400 block">Full limit</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {summary.fullCount} × ₹1,999
                        </span>
                      </div>
                      {summary.remainder > 0 && (
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center px-3">
                          <span className="text-[10px] text-slate-400 block">Last QR</span>
                          <span className="font-bold text-emerald-700 text-xs">
                            1 × {formatINR(summary.remainder)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto chip-scroll max-w-full">
                      {splits.slice(0, 10).map((chunk, idx) => (
                        <div
                          key={idx}
                          className="shrink-0 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-100 text-center text-[11px] font-semibold text-slate-700 whitespace-nowrap"
                        >
                          <span className="text-slate-400 mr-1 text-[10px]">#{idx + 1}</span>
                          {formatINR(chunk)}
                        </div>
                      ))}
                      {splits.length > 10 && (
                        <div className="shrink-0 bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap">
                          +{splits.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        <button
          id="generate-qr-btn"
          type="submit"
          disabled={isLoading || numericAmount <= 0 || summary.exceedsLimit}
          className="w-full h-12 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              <span>Generating QRs...</span>
            </>
          ) : (
            <>
              <span>
                {summary.exceedsLimit
                  ? `Amount exceeds UPI limit (max ${formatINR(MAX_UPI_AMOUNT)})`
                  : splits.length > 1
                  ? `Generate ${splits.length} QRs · ${formatINR(numericAmount)}`
                  : `Generate QR · ${formatINR(numericAmount)}`}
              </span>
              {!summary.exceedsLimit && <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
